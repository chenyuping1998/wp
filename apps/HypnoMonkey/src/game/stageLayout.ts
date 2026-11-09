import { BOARD_SIZES } from './constants';
import { barShapes, propsAnchor, type BarDisc, type BarRect } from '../components/ui/mummyBarGeometry';
import { CAST_OUTLINE, type CastOutline } from './castOutline';
import { propsRight, propsTop } from './propsRow';

/**
 * Board and cast placement under the game's own bet bar (v3 console,
 * ui/MummyBar.svelte). Hypno, 2026-11-09.
 *
 * The pre-bar board was scaled for the shared full-width strip, which left a
 * wide band of empty ground between the frame and the console (Stone: 「空位
 * 有點多」). This sizes the board to the room the console actually leaves and
 * moves the cast so it still stands clear of the board and of the controls.
 *
 * Landscape (desktop, landscape phone, tablet): the frame, wordmark included,
 * is centred between the screen top and the highest bar piece (or the props'
 * row on its left) under it, and grows (×grow on the pre-bar scale) up to that
 * band, G_MAX, and what both casts can follow. Each cast keeps its farthest
 * reach (the Hypnotist's gaze finger, the assistant's hands) on the frame
 * column and never over the reels, and its resting body IDLE_GAP clear of the
 * frame: it moves right and, where Spin / Auto Spin / Turbo, the console or
 * the screen edge stop it, shrinks toward its own bottom-right corner, down to
 * K_MIN. Its feet keep their pre-bar place against the frame's foot where the
 * controls allow. MG and FG share one board size: free spins never resize it.
 *
 * Portrait: the cast stands above the board, cut at the hips by its top beam,
 * so the top beam stays where it was and the board grows down and wide, to
 * the screen's sides or the props / controls under it. The cast does not move.
 *
 * Units: "base board units" are board coordinates of the pre-bar layout
 * (stateGame boardLayoutBase), the ones castOutline.ts is measured in; the
 * solver works in screen px and returns game units (the MainContainer box).
 */

type Box = { width: number; height: number; scale: number };
export type BoardPlacement = { x: number; y: number; scale: number };
export type CastKey = 'mg' | 'fg';
/** Game units: scale by k about the outline's (right, anchorY) corner, then shift. */
export type CastFit = { k: number; dx: number; dy: number };
export type Stage = BoardPlacement & { grow: number; base: BoardPlacement; cast: Record<CastKey, CastFit> };
export type StageInput = {
	canvas: { width: number; height: number };
	main: Box;
	standard: Box;
	portrait: boolean;
	base: BoardPlacement;
};

const BW = BOARD_SIZES.width;
const BH = BOARD_SIZES.height;
const PX = BW / 2;
const PY = BH / 2;
/** boardFrameScene.ts: beams and columns are 32 thick, outside the board */
const BEAM = 32;
const FRAME_BOTTOM = BH + BEAM;
/** boardFrameScene.ts: the wordmark, centred 47 above the board, .46 (portrait .38) of its width at 8:3 */
export const frameTop = (portrait: boolean) => -47 - (BW * (portrait ? 0.38 : 0.46) * 0.375) / 2;

/** the pre-bar cast figure height (Medusa.svelte), board units */
export const FIGURE_HEIGHT = BH * 0.98;
/** portrait: the cast is cut at the hips just above the board's top beam */
export const CLIP_Y = -34;
const PORTRAIT_SCALE = 0.5;
/** joints.json hip.y - glasses.y, rig units */
const HIP_BELOW_EYES: Record<CastKey, number> = { mg: 491, fg: 533 };
/** rig height the figure height is measured against */
const RIG_HEIGHT: Record<CastKey, number> = { mg: 1376, fg: 1430 };

const G_MAX = 1.45;
const K_MIN = 0.88;
/** standard-box units: cast ink to a control; frame to the screen top / the bar / the props */
const CLEAR = 12;
const MARGIN = 16;
/** base board units between the resting cast and the frame */
const IDLE_GAP = 4;
const STILL: CastFit = { k: 1, dx: 0, dy: 0 };

export const stageAtBase = (base: BoardPlacement): Stage => ({ ...base, grow: 1, base, cast: { mg: STILL, fg: STILL } });

export function stageLayout(input: StageInput): Stage {
	return input.portrait ? portraitStage(input) : landscapeStage(input);
}

/** screen-px helpers shared by both orientations */
function screen(input: StageInput) {
	const { canvas, main, standard, base } = input;
	const ms = main.scale;
	const unit = base.scale * ms; // px per base board unit
	const cx = canvas.width / 2 + (base.x - main.width / 2) * ms;
	const cy = canvas.height / 2 + (base.y - main.height / 2) * ms;
	const bar = barShapes(canvas, standard);
	const props = propsAnchor(canvas, standard);
	return {
		ms,
		ss: standard.scale,
		unit,
		cx,
		cy,
		rects: [bar.buy, bar.panel] as BarRect[],
		discs: bar.discs as BarDisc[],
		props,
		/** the props keep their pre-bar size (Background.svelte), so their row does too */
		propsTop: propsTop(props.ground, FIGURE_HEIGHT * unit),
		bx: (q: number) => cx + (q - PX) * unit,
		by: (q: number) => cy + (q - PY) * unit,
	};
}

function landscapeStage(input: StageInput): Stage {
	const { canvas, base } = input;
	const f = screen(input);
	const margin = MARGIN * f.ss;
	const top = margin;
	const fTop = frameTop(false);
	const frameHeight = (FRAME_BOTTOM - fTop) * f.unit;
	const half = (g: number) => (PX + BEAM) * f.unit * g;
	// the props' row stands left of the board: the frame passes it either
	// beside it or above it
	const props: BarRect = { x0: f.props.left, y0: f.propsTop, x1: propsRight(f.props.left, FIGURE_HEIGHT * f.unit), y1: f.props.ground };
	/** how low the frame's foot may go at growth g: above every bar piece and prop under it */
	const floorAt = (g: number) => {
		const x0 = f.cx - half(g) - margin;
		const x1 = f.cx + half(g) + margin;
		let y = canvas.height;
		for (const r of [...f.rects, props]) if (r.x1 > x0 && r.x0 < x1) y = Math.min(y, r.y0);
		for (const d of f.discs) if (d.x + d.r > x0 && d.x - d.r < x1) y = Math.min(y, d.y - d.r);
		return y - margin;
	};
	const fitsBand = (g: number) => frameHeight * g <= floorAt(g) - top;
	/** board pivot (px) with the frame centred in its band */
	const pivotY = (g: number) => (top + floorAt(g)) / 2 + (PY - (fTop + FRAME_BOTTOM) / 2) * f.unit * g;

	let gHi = G_MAX;
	if (!fitsBand(1)) return stageAtBase(base);
	if (!fitsBand(gHi)) {
		let lo = 1;
		let hi = gHi;
		for (let i = 0; i < 14; i++) {
			const mid = (lo + hi) / 2;
			if (fitsBand(mid)) lo = mid;
			else hi = mid;
		}
		gHi = lo;
	}

	const clear = CLEAR * f.ss;
	const clears = (o: CastOutline, ax: number, ay: number, k: number, dx: number, dy: number) => {
		for (let i = 0; i < o.pts.length; i += 2) {
			const x = ax + k * (f.bx(o.pts[i]) - ax) + dx;
			const y = ay + k * (f.by(o.pts[i + 1]) - ay) + dy;
			for (const d of f.discs) if (Math.hypot(x - d.x, y - d.y) - d.r < clear) return false;
			for (const r of f.rects) if (Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1)) < clear) return false;
		}
		return true;
	};
	const fitCast = (o: CastOutline, g: number): CastFit | null => {
		const ax = f.bx(o.right);
		const ay = f.by(o.anchorY);
		const edge = f.cx + PX * f.unit * g; // the reels' right edge
		const outer = f.cx + half(g); // the frame's right edge
		// on screen — or, where the pre-bar layout already cut it (a near-square
		// window), cut no further
		const rightmost = Math.max(canvas.width - margin, ax);
		// the feet keep their pre-bar place against the frame's foot
		const foot = pivotY(g) + (FRAME_BOTTOM - PY) * f.unit * g + (o.bottom - FRAME_BOTTOM) * f.unit;
		for (let k = 1; k >= K_MIN - 1e-6; k -= 0.01) {
			const dx = Math.max(
				edge - (ax + k * (f.bx(o.reach) - ax)),
				outer + IDLE_GAP * f.unit - (ax + k * (f.bx(o.idle) - ax)),
			);
			if (ax + dx > rightmost) continue;
			const head = ay + k * (f.by(o.top) - ay); // top of the ink before dy
			const ok = (dy: number) => head + dy >= 0 && clears(o, ax, ay, k, dx, dy);
			let dy = Math.max(foot - (ay + k * (f.by(o.bottom) - ay)), -head);
			if (dy > 0 && !ok(dy)) {
				// lower only as far as the controls allow
				let lo = 0;
				let hi = dy;
				for (let i = 0; i < 10; i++) {
					const mid = (lo + hi) / 2;
					if (ok(mid)) lo = mid;
					else hi = mid;
				}
				dy = lo;
			}
			if (ok(dy)) return { k, dx: dx / f.ms, dy: dy / f.ms };
		}
		return null;
	};
	const fits = (g: number) => {
		const mg = fitCast(CAST_OUTLINE.mg, g);
		const fg = mg && fitCast(CAST_OUTLINE.fg, g);
		return mg && fg ? { mg, fg } : null;
	};

	// the largest board both casts can stand beside, never smaller than pre-bar
	let g = gHi;
	let cast = fits(gHi);
	if (!cast) {
		let lo = 1;
		let hi = gHi;
		cast = fits(lo);
		if (!cast) return stageAtBase(base);
		for (let i = 0; i < 12; i++) {
			const mid = (lo + hi) / 2;
			const fit = fits(mid);
			if (fit) {
				lo = mid;
				cast = fit;
			} else hi = mid;
		}
		g = lo;
	}
	return { x: base.x, y: base.y + (pivotY(g) - f.cy) / f.ms, scale: base.scale * g, grow: g, base, cast };
}

function portraitStage(input: StageInput): Stage {
	const { canvas, base } = input;
	const f = screen(input);
	const margin = MARGIN * f.ss;
	const topBeam = f.by(-BEAM);
	const wide = (canvas.width - 2 * margin) / ((BW + 2 * BEAM) * f.unit);
	// everything under the board: the props' row and the bar's pieces (the
	// frame spans the width, so all of them)
	const under = Math.min(f.propsTop, ...f.rects.map((r) => r.y0), ...f.discs.map((d) => d.y - d.r)) - margin;
	const tall = (under - topBeam) / ((FRAME_BOTTOM + BEAM) * f.unit);
	const g = Math.max(1, Math.min(G_MAX, wide, tall));
	const pivot = topBeam + (PY + BEAM) * f.unit * g;
	return { x: base.x, y: base.y + (pivot - f.cy) / f.ms, scale: base.scale * g, grow: g, base, cast: { mg: STILL, fg: STILL } };
}

/**
 * Where a cast stands, in board units of the stage's board: eyes (where the
 * rig's glasses go), root scale and, for portrait, the clip line under it.
 */
export function castPlacement(stage: Stage, who: CastKey, portrait: boolean) {
	const fit = stage.cast[who];
	const o = CAST_OUTLINE[who];
	const { base } = stage;
	const game = (q: { x: number; y: number }) => ({ x: base.x + (q.x - PX) * base.scale, y: base.y + (q.y - PY) * base.scale });
	const a = game({ x: o.right, y: o.anchorY });
	const board = (q: { x: number; y: number }) => {
		const p = game(q);
		const x = a.x + fit.k * (p.x - a.x) + fit.dx;
		const y = a.y + fit.k * (p.y - a.y) + fit.dy;
		return { x: PX + (x - stage.x) / stage.scale, y: PY + (y - stage.y) / stage.scale };
	};
	const eyes = portrait
		? { x: BW - (who === 'fg' ? 230 : 96), y: CLIP_Y - HIP_BELOW_EYES[who] * PORTRAIT_SCALE }
		: { x: BW + 175, y: BH * 0.28 };
	const scale = (portrait ? PORTRAIT_SCALE : FIGURE_HEIGHT / RIG_HEIGHT[who]) * fit.k * (base.scale / stage.scale);
	return { eyes: board(eyes), scale, clipY: board({ x: 0, y: CLIP_Y }).y };
}

/** A point given in base board units, in board units of the stage's board. */
export const fromBase = (stage: Stage, q: { x: number; y: number }) => ({
	x: PX + (stage.base.x + (q.x - PX) * stage.base.scale - stage.x) / stage.scale,
	y: PY + (stage.base.y + (q.y - PY) * stage.base.scale - stage.y) / stage.scale,
});

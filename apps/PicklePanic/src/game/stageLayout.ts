import { BOARD_SIZES, SYMBOL_SIZE } from './constants';
import { barShapes, type BarDisc, type BarRect } from '../components/ui/mummyBarGeometry';
import { CAST_ART, CAST_THROW_REACH } from './castRig';

/**
 * Board and cast placement under the game's own bet bar (bar v3, the
 * connected console of ui/MummyBar.svelte). Pickle Panic, 2026-11-10.
 *
 * Before it the board was centred above the shared full-width strip
 * (uiTheme.barHeight 140) at BOARD_SHRINK 0.89, the Buy Bonus sign hung on its
 * left and the cast stood on its right. The v3 console stands on the SCREEN's
 * bottom and is taller at its right end, where the Spin disc rises over it, so
 * the room it leaves differs on every screen: on 16:9 a little less than the
 * strip left, on 16:10, 4:3 and phones more. This sizes the board to it.
 *
 * Landscape (desktop, landscape phone, tablet): the frame's drawn housing is
 * centred between the screen top and the highest bar piece under it, and
 * grows (×grow on the pre-bar scale, G_MIN..G_MAX) as far as all of these
 * allow:
 *   - the cast keeps at least K_MIN of its pre-bar height — it is sized by the
 *     room right of the frame (Mascot's rule) and never grows past it — and
 *     its feet stand above the bar pieces under it;
 *   - the free-spin counter keeps COUNTER_MIN of its size left of the frame;
 *   - the logo keeps LOGO_MIN of its size beside or above the frame.
 * The board may slide left, the side the Buy Bonus sign held before it became
 * a tile in the bar, by as little as gives the cast its size back. Base game
 * and free spins share one board: both casts must fit, so the feature never
 * resizes it.
 *
 * Portrait: the cast stands waist-up behind the housing's top beam and is
 * sized by that beam's height. The board grows wide and down where the screen
 * allows (tablets held upright); on a phone, whose width it already fills, it
 * comes down toward the controls row and the cast grows into the room above
 * it, up to the screen's width (Mascot's cap). What is left after that is split
 * between above the cast and under the board.
 *
 * Units: the solver compares with the bar in screen px; boards and casts come
 * back in main-layout units (the MainContainer box), as Mascot and every board
 * component already use them.
 */

type Size = { width: number; height: number };
type Box = Size & { scale: number };
export type LayoutType = 'desktop' | 'landscape' | 'tablet' | 'portrait';
export type GameType = 'basegame' | 'freegame';
export type BoardPlacement = { x: number; y: number; scale: number };
/** Mascot.svelte's placement, main-layout units: where his feet stand, his scale, and the strip he performs in. */
export type CastSpot = { x: number; y: number; scale: number; inner: number; minX: number; maxX: number };
export type Stage = { board: BoardPlacement; grow: number; cast: Record<GameType, CastSpot | null> };
export type StageInput = { canvas: Size; main: Box; standard: Box; layoutType: LayoutType };

/** the pre-bar board scale (stateGame's old BOARD_SHRINK) */
export const BASE_SCALE = 0.89;
/** BoardFrame draws its housing sprite at the board × this */
export const FRAME_SCALE = 1.33751306;
/** the housing's drawn ink (frame.png alpha), board units about the board's centre */
export const FRAME_INK = { left: -457, right: 458, top: -351, bottom: 354 };
/** the shared strip's height the pre-bar board was centred above (standard units) */
const PRE_BAR_HEIGHT = 140;

const G_MAX = 1.45;
/** 16:9 has a little less room than the strip left: the board may give up this much */
const G_MIN = 0.96;
const K_MIN = 0.88;
const COUNTER_MIN = 0.75;
const LOGO_MIN = 0.6;
/** sliding the board off centre must buy at least this much growth */
const SLIDE_GAIN = 1.03;
/** standard-box units: frame to the screen top / the bar; cast to a bar piece */
const MARGIN = 16;
const CLEAR = 12;
/** portrait: MARGINs between the board and the controls row */
const PORTRAIT_GAP = 3;

const BW = BOARD_SIZES.width;
const BH = BOARD_SIZES.height;
/** FreeSpinCounter.svelte's ticket, left of the frame: width with its edge, gap to the frame, outer margin */
export const COUNTER = { width: SYMBOL_SIZE * 2 + 6, gap: SYMBOL_SIZE * 0.2, margin: SYMBOL_SIZE * 0.15 };
/** Game.svelte's logo, screen px at scale 1; its letters end at `ink` of its box's height */
export const LOGO = { width: 220, height: 220 * 0.375, inset: 20, gap: 6, ink: 0.7, hidden: 0.4 };
/** GameNameClock, screen px: 24px Bungee at x 20 on one 32px line — the frame's corner stays off it */
const CLOCK = { right: 104, bottom: 34 };
/** Mascot: under this much room right of the frame there is no cast (tablets) */
const MIN_GAP = 260;
/** Mascot portrait: the share of the figure hidden under the top beam */
const BURY = 0.42;

/** The board as the shared strip placed it. */
export function boardAtBase(main: Size, standard: Size): BoardPlacement {
	return {
		x: main.width * 0.5,
		y: main.height * (0.5 - (PRE_BAR_HEIGHT / standard.height) * 0.5),
		scale: BASE_SCALE,
	};
}

type SpotOptions = { ground?: number; maxHeight?: number; cap?: number; top?: number };

/**
 * Mascot.svelte's placement rules for a board, main units. Landscape: he
 * stands right of the housing, sized to the room there (his widest motion,
 * the throw, must fit between the housing and the edge — he steps back for it,
 * his far side may leave the screen by half his half-width), feet on the
 * housing's ground line unless `ground` is higher. Portrait: waist-up behind
 * the top beam.
 */
export function castSpot(main: Size, layoutType: LayoutType, board: BoardPlacement, who: GameType, opts: SpotOptions = {}): CastSpot | null {
	const ART = CAST_ART[who];
	const halfW = (BW * board.scale * FRAME_SCALE) / 2;
	const halfH = (BH * board.scale * FRAME_SCALE) / 2;
	if (layoutType === 'portrait') {
		// his head stands at `top` (under the logo) and he is cut at the beam
		const frameTop = board.y - halfH;
		const height = Math.min(main.width, Math.max(160, (frameTop - (opts.top ?? 0)) / (1 - BURY)));
		return { x: main.width * 0.76, inner: -Infinity, y: frameTop + height * BURY, scale: height / ART.height, minX: -ART.width * 0.65, maxX: ART.width * 0.65 };
	}
	const gapLeft = board.x + halfW;
	const gapWidth = main.width - gapLeft;
	if (gapWidth < MIN_GAP) return null;
	const FAR = ART.width / 2;
	const inner = gapLeft + 16;
	const outer = main.width - 10;
	const y = Math.min(board.y + halfH, opts.ground ?? Infinity);
	const height = Math.min(
		opts.maxHeight ?? Infinity,
		(gapWidth * 0.86 * ART.height) / ART.width,
		((outer - inner) * ART.height) / (CAST_THROW_REACH[who] + FAR * 0.5),
		opts.cap ?? Infinity,
	);
	const k = height / ART.height;
	const x = Math.min(outer - FAR * k, gapLeft + gapWidth / 2);
	return { x, inner, y, scale: k, minX: (inner - x) / k, maxX: (outer - x) / k };
}

export function stageLayout(input: StageInput): Stage {
	return input.layoutType === 'portrait' ? portraitStage(input) : landscapeStage(input) ?? fallbackStage(input);
}

/** screen-px helpers */
function frameOf(input: StageInput) {
	const { canvas, main, standard } = input;
	const ms = main.scale;
	const ox = canvas.width / 2 - (main.width * ms) / 2;
	const oy = canvas.height / 2 - (main.height * ms) / 2;
	const bar = barShapes(canvas, standard);
	const rects: BarRect[] = [bar.buy, bar.panel];
	const discs: BarDisc[] = bar.discs;
	return {
		ms,
		px: (x: number) => ox + x * ms,
		py: (y: number) => oy + y * ms,
		mx: (p: number) => (p - ox) / ms,
		my: (p: number) => (p - oy) / ms,
		margin: MARGIN * standard.scale,
		clear: CLEAR * standard.scale,
		rects,
		discs,
		/** px: the top of the highest bar piece reaching into x0..x1 */
		under: (x0: number, x1: number) => {
			let y = canvas.height;
			for (const r of rects) if (r.x1 > x0 && r.x0 < x1) y = Math.min(y, r.y0);
			for (const d of discs) if (d.x + d.r > x0 && d.x - d.r < x1) y = Math.min(y, d.y - d.r);
			return y;
		},
	};
}

const logoScale = (canvasWidth: number, spriteRight: number, spriteTop: number) =>
	Math.min(1, Math.max((canvasWidth - LOGO.inset - spriteRight - LOGO.gap) / LOGO.width, (spriteTop - LOGO.gap) / LOGO.height));

function landscapeStage(input: StageInput): Stage | null {
	const { canvas, main, standard, layoutType } = input;
	const f = frameOf(input);
	const base = boardAtBase(main, standard);
	// the pre-bar casts, by Mascot's pre-bar rule: the strip took the bottom
	// 2 * base.y of the box, he stood 6 above it at most and was 94% of the rest
	const preBar: SpotOptions = { ground: base.y * 2 - 6, maxHeight: base.y * 2 * 0.94 };
	const was = {
		basegame: castSpot(main, layoutType, base, 'basegame', preBar),
		freegame: castSpot(main, layoutType, base, 'freegame', preBar),
	};
	const wasHeight = (who: GameType) => (was[who]?.scale ?? 0) * CAST_ART[who].height;

	const unit = BASE_SCALE * f.ms; // px per board unit at grow 1
	const cx0 = f.px(base.x);
	const top = f.margin;
	const inkTall = FRAME_INK.bottom - FRAME_INK.top;
	// the counter keeps COUNTER_MIN of its size, or what the strip already gave it
	const counterLeft = f.mx(0) + COUNTER.gap + COUNTER.margin;
	const baseInkLeft = base.x + FRAME_INK.left * BASE_SCALE;
	const counterMin = Math.min(COUNTER_MIN, (baseInkLeft - counterLeft) / COUNTER.width);
	const leftLimit = f.px(counterLeft + COUNTER.width * counterMin);
	const baseSprite = (BW / 2) * FRAME_SCALE * unit;
	const logoMin = Math.min(LOGO_MIN, logoScale(canvas.width, cx0 + baseSprite, f.py(base.y) - (BH / 2) * FRAME_SCALE * unit));

	/** a cast beside a board: his feet above the bar pieces from his near boot to
	 *  the box's right edge, his head under the logo where the two meet */
	const fit = (board: BoardPlacement, who: GameType) => {
		if (!was[who]) return null;
		const ART = CAST_ART[who];
		const cap = wasHeight(who);
		const halfH = (BH * board.scale * FRAME_SCALE) / 2;
		// the logo this board leaves room for (Game.svelte), screen px
		const sprite = { right: f.px(board.x + (BW / 2) * FRAME_SCALE * board.scale), top: f.py(board.y - halfH) };
		const ls = logoScale(canvas.width, sprite.right, sprite.top);
		const logo = ls < LOGO.hidden ? null : { x0: canvas.width - LOGO.inset - LOGO.width * ls, bottom: (1 + LOGO.height * LOGO.ink) * ls + LOGO.gap };
		let spot = castSpot(main, layoutType, board, who, { cap });
		for (let i = 0; i < 3 && spot; i++) {
			const boot = spot.x - (ART.width / 2) * spot.scale;
			const ground = f.my(f.under(f.px(boot) - f.clear, f.px(main.width - 10) + f.clear) - f.clear);
			const feet = Math.min(board.y + halfH, ground);
			let maxHeight = (feet - f.my(0)) * 0.94;
			// his head (the middle 60% of his width) under the logo's letters
			if (logo && f.px(spot.x + ART.width * 0.3 * spot.scale) > logo.x0) maxHeight = Math.min(maxHeight, feet - f.my(logo.bottom));
			spot = castSpot(main, layoutType, board, who, { cap, ground, maxHeight });
		}
		return spot;
	};

	const at = (g: number, shift: number) => {
		const cx = cx0 + shift;
		const left = cx + FRAME_INK.left * unit * g;
		const right = cx + FRAME_INK.right * unit * g;
		if (left < leftLimit - 0.5) return null;
		const floor = f.under(left - f.margin, right + f.margin) - f.margin;
		// a frame reaching the top-left corner keeps under the clock
		const ceiling = left < CLOCK.right ? Math.max(top, CLOCK.bottom) : top;
		if (inkTall * unit * g > floor - ceiling) return null;
		const cy = (ceiling + floor) / 2 - ((FRAME_INK.top + FRAME_INK.bottom) / 2) * unit * g;
		const sprite = { right: cx + baseSprite * g, top: cy - (BH / 2) * FRAME_SCALE * unit * g };
		if (logoScale(canvas.width, sprite.right, sprite.top) < logoMin - 1e-6) return null;
		const board = { x: f.mx(cx), y: f.my(cy), scale: BASE_SCALE * g };
		const cast = { basegame: fit(board, 'basegame'), freegame: fit(board, 'freegame') };
		for (const who of ['basegame', 'freegame'] as const) {
			if (!was[who]) continue;
			const now = cast[who];
			if (!now || now.scale < K_MIN * was[who]!.scale - 1e-9) return null;
		}
		return { board, grow: g, cast, height: (cast.basegame?.scale ?? 0) + (cast.freegame?.scale ?? 0) };
	};
	/** the best placement at growth g: the least slide left that gives the casts the most height */
	const best = (g: number, slide: boolean) => {
		let pick: ReturnType<typeof at> = null;
		for (let shift = 0; cx0 + shift + FRAME_INK.left * unit * g >= leftLimit - 0.5; shift -= 2) {
			const p = at(g, shift);
			if (p && (!pick || p.height > pick.height + 1e-6)) pick = p;
			if (!slide) break;
		}
		return pick;
	};
	/** the largest board, by bisection on its growth */
	const largest = (slide: boolean) => {
		let pick = best(G_MAX, slide);
		if (pick) return pick;
		let lo = G_MIN;
		let hi = G_MAX;
		pick = best(lo, slide);
		if (!pick) return null;
		for (let i = 0; i < 14; i++) {
			const mid = (lo + hi) / 2;
			const p = best(mid, slide);
			if (p) {
				lo = mid;
				pick = p;
			} else hi = mid;
		}
		return pick;
	};
	// Centred unless sliding left buys a clearly larger board, or as large a
	// board with the cast clearly larger: a percent or two of board is not worth
	// one off the middle of the screen (21:9 would slide 80px to step its corner
	// off the Spin disc for 1%).
	const centred = largest(false);
	const slid = largest(true);
	const slide =
		!!slid &&
		(!centred || slid.grow >= centred.grow * SLIDE_GAIN || (slid.grow >= centred.grow && slid.height >= centred.height * SLIDE_GAIN));
	const pick = slide ? slid : centred;
	if (!pick) return null;
	return { board: pick.board, grow: pick.grow, cast: pick.cast };
}

/**
 * Nothing above fits (a screen unlike any measured): the board, no larger than
 * before, centred in whatever room the bar leaves, so it never sits on a
 * control; the casts by Mascot's rule beside it, hidden where there is none.
 */
function fallbackStage(input: StageInput): Stage {
	const { main, standard, layoutType } = input;
	const f = frameOf(input);
	const base = boardAtBase(main, standard);
	const unit = BASE_SCALE * f.ms;
	const cx = f.px(base.x);
	const floor = f.under(cx + FRAME_INK.left * unit - f.margin, cx + FRAME_INK.right * unit + f.margin) - f.margin;
	const g = Math.max(0.5, Math.min(1, (floor - f.margin) / ((FRAME_INK.bottom - FRAME_INK.top) * unit)));
	const cy = (f.margin + floor) / 2 - ((FRAME_INK.top + FRAME_INK.bottom) / 2) * unit * g;
	const board = { x: base.x, y: f.my(cy), scale: BASE_SCALE * g };
	const halfH = (BH * board.scale * FRAME_SCALE) / 2;
	const spot = (who: GameType) => {
		const s = castSpot(main, layoutType, board, who);
		if (!s) return null;
		const ground = f.my(f.under(f.px(s.x - (CAST_ART[who].width / 2) * s.scale) - f.clear, f.px(main.width - 10) + f.clear) - f.clear);
		const feet = Math.min(board.y + halfH, ground);
		return castSpot(main, layoutType, board, who, { ground, maxHeight: (feet - f.my(0)) * 0.94 });
	};
	return { board, grow: g, cast: { basegame: spot('basegame'), freegame: spot('freegame') } };
}

function portraitStage(input: StageInput): Stage {
	const { canvas, main, standard, layoutType } = input;
	const f = frameOf(input);
	const base = boardAtBase(main, standard);
	const unit = BASE_SCALE * f.ms;
	const halfSprite = (BH / 2) * FRAME_SCALE; // board units
	const inkTop = f.py(base.y) + FRAME_INK.top * unit;
	const inkTall = (FRAME_INK.bottom - FRAME_INK.top) * unit;
	// the frame spans the width: every control under it counts
	const floor = Math.min(...f.rects.map((r) => r.y0), ...f.discs.map((d) => d.y - d.r)) - f.margin * PORTRAIT_GAP;
	const wide = (canvas.width - 2 * f.margin) / ((FRAME_INK.right - FRAME_INK.left) * unit);
	const tall = (floor - inkTop) / inkTall;
	const g = Math.max(1, Math.min(G_MAX, wide, tall));
	// room left under the grown board, px
	const slack = Math.max(0, floor - (inkTop + inkTall * g));
	// his head keeps under the logo's letters where the two share a column
	// (Game.svelte puts the logo in the top-right corner, above the board, at
	// full size): he stands at 0.76 of the box, his head the middle 60% of his
	// width, at most as wide as at his tallest (the box's width)
	const headHalf = Math.max(CAST_ART.basegame.width, CAST_ART.freegame.width) * 0.3 * (main.width / CAST_ART.basegame.height) * f.ms;
	const underLogo = f.px(main.width * 0.76) + headHalf > canvas.width - LOGO.inset - LOGO.width;
	const headTop = underLogo ? Math.max(0, f.my(1 + LOGO.height * LOGO.ink + LOGO.gap)) : 0;
	// how far the beam may come down before the cast reaches the screen's width
	// (Mascot caps him there); up to that, all of it, past it half
	const spriteTop = f.my(inkTop) - (halfSprite + FRAME_INK.top) * BASE_SCALE * g;
	const toCap = Math.max(0, (headTop + main.width * (1 - BURY) - spriteTop) * f.ms);
	const down = slack <= toCap ? slack : toCap + (slack - toCap) / 2;
	// the board grows about its top beam
	const inkTopNow = inkTop + down;
	const cy = inkTopNow - FRAME_INK.top * unit * g;
	const board = { x: base.x, y: f.my(cy), scale: BASE_SCALE * g };
	return {
		board,
		grow: g,
		cast: {
			basegame: castSpot(main, layoutType, board, 'basegame', { top: headTop }),
			freegame: castSpot(main, layoutType, board, 'freegame', { top: headTop }),
		},
	};
}

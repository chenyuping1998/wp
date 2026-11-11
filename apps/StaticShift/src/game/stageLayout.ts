import { BOARD_FRAME_REACH, BOARD_SIZES, SYMBOL_SIZE } from './constants';
import { barShapes, type BarDisc, type BarRect } from '../components/ui/mummyBarGeometry';

/**
 * Where the board stands under the game's own bet bar (bar v3, the connected
 * console of components/ui/MummyBar.svelte). Static Shift, 2026-11-10.
 *
 * Before it the board was centred above the shared full-width strip at a fixed
 * 0.89 inside the letterboxed game box, and the cast took what was left beside
 * it — on 16:10 and 4:3 both came out small. The console stands on the
 * SCREEN's bottom and is only as tall as its pieces, so this sizes the board
 * to the screen instead:
 *
 * Landscape: the frame (its drawn edge: VU columns, nameplate, fader row)
 * fills the height between the screen top and the highest bar piece under it,
 * as long as the side strips keep their room — the cast's on the right
 * (CAST_STRIP of the box's width: Stone 2026-11-10 「人物太小隻」, the cast is
 * sized by that strip) and the free-spin ticket's on the left. Where the two
 * cannot both have it centred, the board slides left, the side the Buy Bonus
 * plate held before it became a tile in the bar. A screen too narrow for a
 * side cast at any sensible board size gets the largest board that fits and
 * the cast waist-up behind it (Mascot.svelte).
 *
 * Portrait: the frame spans the width; it sits above the controls row and
 * leaves the room over it to the cast, who stands waist-up behind its top.
 *
 * The solver works in screen px against the bar's own shapes and answers in
 * main-layout units, which every board component uses.
 */

type Size = { width: number; height: number };
type Box = Size & { scale: number };
export type StageInput = { canvas: Size; main: Box; standard: Box; layoutType: string };
export type BoardPlacement = { x: number; y: number; scale: number };

/** the frame's drawn edge about the board's centre, board units */
export const FRAME = {
	left: BOARD_SIZES.width / 2 + BOARD_FRAME_REACH.left,
	right: BOARD_SIZES.width / 2 + BOARD_FRAME_REACH.right,
	top: BOARD_SIZES.height / 2 + BOARD_FRAME_REACH.top,
	bottom: BOARD_SIZES.height / 2 + BOARD_FRAME_REACH.bottom,
};
const FRAME_W = FRAME.left + FRAME.right;
const FRAME_H = FRAME.top + FRAME.bottom;

/** board scale: never past this, and a side cast is given up under SIDE_MIN */
const S_MAX = 1.25;
const SIDE_MIN = 0.8;
/** the cast's strip right of the frame, as a share of the game box's width */
const CAST_STRIP = 0.24;
/** FreeSpinCounter's ticket left of the frame: gap + margin + 60% of its width (main units) */
const COUNTER_STRIP = SYMBOL_SIZE * 0.35 + (SYMBOL_SIZE * 2 + 6) * 0.6;
/** standard-box units: frame to the screen top / to the bar */
const MARGIN = 16;
/** GameNameClock, screen px: a frame reaching under it keeps below its line */
const CLOCK = { right: 250, bottom: 36 };
/** portrait: the cast shows at most this share of the frame's height above it */
export const PORTRAIT_CAST_SHARE = 0.8;

/** Screen-px view of the bar and the two boxes. */
export function stageFrame(input: StageInput) {
	const { canvas, main, standard } = input;
	const ms = main.scale;
	const ox = canvas.width / 2 - (main.width * ms) / 2;
	const oy = canvas.height / 2 - (main.height * ms) / 2;
	const bar = barShapes(canvas, standard);
	const rects: BarRect[] = [bar.buy, bar.panel];
	const discs: BarDisc[] = bar.discs;
	return {
		ms,
		mx: (p: number) => (p - ox) / ms,
		my: (p: number) => (p - oy) / ms,
		margin: MARGIN * standard.scale,
		/** px: the top of the highest bar piece reaching into x0..x1 */
		under: (x0: number, x1: number) => {
			let y = canvas.height;
			for (const r of rects) if (r.x1 > x0 && r.x0 < x1) y = Math.min(y, r.y0);
			for (const d of discs) if (d.x + d.r > x0 && d.x - d.r < x1) y = Math.min(y, d.y - d.r);
			return y;
		},
		/** px: the top of the highest bar piece anywhere */
		barTop: Math.min(...rects.map((r) => r.y0), ...discs.map((d) => d.y - d.r)),
	};
}

export function boardPlacement(input: StageInput): BoardPlacement {
	const { canvas, main, layoutType } = input;
	const f = stageFrame(input);
	const W = canvas.width;

	if (layoutType === 'portrait') {
		const floor = f.barTop - f.margin * 2;
		const top = CLOCK.bottom;
		const s = Math.min(S_MAX, (W - 12) / (FRAME_W * f.ms), (floor - top - 110) / (FRAME_H * f.ms));
		const u = s * f.ms;
		// what the cast does not use over the frame is split above him and under the board
		const slack = Math.max(0, floor - top - FRAME_H * u * (1 + PORTRAIT_CAST_SHARE));
		const bottom = floor - slack / 2;
		return { x: main.width / 2, y: f.my(bottom - FRAME.bottom * u), scale: s };
	}

	const castStrip = CAST_STRIP * main.width * f.ms;
	const counterStrip = COUNTER_STRIP * f.ms;
	/** the frame at scale s: centred, slid left when only that gives the cast its strip; null if it cannot stand */
	const at = (s: number, side: boolean) => {
		const u = s * f.ms;
		let cx = W / 2;
		if (side) {
			if (FRAME_W * u + castStrip + counterStrip > W) return null;
			cx = Math.min(cx, W - castStrip - FRAME.right * u);
		} else if (FRAME_W * u > W - 2 * f.margin) return null;
		const left = cx - FRAME.left * u;
		const right = cx + FRAME.right * u;
		const floor = f.under(left - f.margin, right + f.margin) - f.margin;
		const top = left < CLOCK.right ? Math.max(f.margin, CLOCK.bottom) : f.margin;
		if (FRAME_H * u > floor - top) return null;
		const cy = (top + floor) / 2 + ((FRAME.top - FRAME.bottom) / 2) * u;
		return { x: f.mx(cx), y: f.my(cy), scale: s };
	};
	const largest = (side: boolean) => {
		let lo = 0.4;
		let hi = S_MAX;
		let pick = at(hi, side);
		if (pick) return pick;
		pick = at(lo, side);
		if (!pick) return null;
		for (let i = 0; i < 16; i++) {
			const mid = (lo + hi) / 2;
			const p = at(mid, side);
			if (p) {
				lo = mid;
				pick = p;
			} else hi = mid;
		}
		return pick;
	};
	const withSide = largest(true);
	if (withSide && withSide.scale >= SIDE_MIN) return withSide;
	return largest(false) ?? { x: main.width / 2, y: main.height * 0.42, scale: 0.6 };
}

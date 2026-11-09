/**
 * Bet bar v3 (MummyBar.svelte) geometry, shared with the board layout
 * (game/stageLayout.ts) and the background props, so both stand clear of the
 * very shapes the bar draws. Hypno (2026-11-09): moved here unchanged from the
 * bar, plus where the group stands (barGroup) and its pieces in screen px.
 */

// ── geometry (group units; the group's floor is the box floor) ─────────────
//
// WIDE is the reference measured. PORTRAIT is not a scaled copy of it: scaled
// to a phone's width the small round buttons came out ~17 CSS px across, far
// under a comfortable touch target, so on a tall box the console keeps the
// bottom row (menu, balance, bet, stepper) and the round controls get a row
// of their own above it, at sizes a thumb can hit.
const Y = (y1080: number) => y1080 - 1080; // design y (1080 box) -> group y
export const WIDE = {
	W: 1528,
	BUY: { x: 0, y: Y(882), w: 174, h: 172, r: 22 },
	PANEL: { x: 200, y: Y(898), w: 1328, h: 142, r: 16 },
	MID: Y(969),
	MENU_X: 264,
	BAL_X: 324,
	BETBOX: { x: 934, y: Y(914), w: 164, h: 110, r: 8 },
	CHEV_X: 1152,
	SPIN: { x: 1314, y: Y(969), r: 96 },
	AUTO: { x: 1462, y: Y(926) },
	TURBO: { x: 1462, y: Y(1008) },
	SMALL_R: 34,
	AUTOPANEL: { x: 1040, y: Y(594) },
	MENU_X0: 200,
};
export const PORTRAIT = {
	W: 1040,
	BUY: { x: 30, y: -386, w: 156, h: 154, r: 20 },
	PANEL: { x: 0, y: -156, w: 1040, h: 132, r: 16 },
	MID: -90,
	MENU_X: 62,
	BAL_X: 120,
	BETBOX: { x: 636, y: -146, w: 164, h: 110, r: 8 },
	CHEV_X: 860,
	SPIN: { x: 520, y: -309, r: 122 },
	AUTO: { x: 800, y: -309 },
	TURBO: { x: 952, y: -309 },
	SMALL_R: 50,
	AUTOPANEL: { x: 276, y: -760 },
	MENU_X0: 0,
};

type Box = { width: number; height: number; scale: number };
type Size = { width: number; height: number };

/**
 * Where the bar's group stands in the standard box: centred, scaled down only
 * if the box is too narrow for it. Hypno: its floor is the SCREEN's bottom —
 * the box's floor plus the spare under a letterboxed box (16:10, phones) —
 * where the template used the box's floor and left a band of empty ground
 * under the console on any screen taller than the box.
 */
export function barGroup(canvas: Size, box: Box) {
	const portrait = box.height > box.width;
	const G = portrait ? PORTRAIT : WIDE;
	const s = Math.min(1, (box.width - 32) / G.W);
	const spareY = Math.max(0, (canvas.height / box.scale - box.height) / 2);
	return { portrait, G, s, gx: box.width / 2 - (G.W / 2) * s, gy: box.height + spareY - (portrait ? 16 : 0) };
}

export type BarRect = { x0: number; y0: number; x1: number; y1: number };
export type BarDisc = { x: number; y: number; r: number };

/** The bar's pieces in screen px: buy tile, console, and Spin / Auto Spin / Turbo. */
export function barShapes(canvas: Size, box: Box) {
	const { G, s, gx, gy } = barGroup(canvas, box);
	const px = (x: number) => canvas.width / 2 + (gx + x * s - box.width / 2) * box.scale;
	const py = (y: number) => canvas.height / 2 + (gy + y * s - box.height / 2) * box.scale;
	const rect = (r: { x: number; y: number; w: number; h: number }): BarRect => ({ x0: px(r.x), y0: py(r.y), x1: px(r.x + r.w), y1: py(r.y + r.h) });
	const disc = (x: number, y: number, r: number): BarDisc => ({ x: px(x), y: py(y), r: r * s * box.scale });
	return {
		buy: rect(G.BUY),
		panel: rect(G.PANEL),
		discs: [disc(G.SPIN.x, G.SPIN.y, G.SPIN.r), disc(G.AUTO.x, G.AUTO.y, G.SMALL_R), disc(G.TURBO.x, G.TURBO.y, G.SMALL_R)],
	};
}

/**
 * Where the background's props' row (spiral sign, balloons) stands, screen px:
 * from near the screen's left edge, on the ground just above the buy tile — in
 * landscape that is above the bar's left end, in portrait above the tile in
 * the row of round controls. Starting at the screen edge rather than at the
 * tile keeps the row out from under the board's lower-left corner on 4:3 and
 * squarer screens, where it held the board up off the console. From the
 * geometry, so the props do not move when the tile hides for free spins.
 */
export function propsAnchor(canvas: Size, box: Box) {
	const tile = barShapes(canvas, box).buy;
	return { left: 20 * box.scale, ground: tile.y0 - 10 * box.scale };
}

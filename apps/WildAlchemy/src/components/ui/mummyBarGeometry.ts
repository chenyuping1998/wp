/**
 * Bet bar v3 (MummyBar.svelte) geometry for Wild Alchemy — the template's
 * tables (Mummy Mayhem → Hypno Monkey → Dragon Tide, 2026-11-09/11) plus a fit
 * this game needs and the siblings did not: the board keeps its size here
 * (uiTheme.barHeight still sizes it, game/stateGame.svelte.ts boardLayout), and
 * at 16:9 its housing reaches down to 87.5% of the screen, so the bar is fitted
 * into what the board and the side figure leave free instead of the board being
 * shrunk to make room for the bar.
 */

// ── geometry (group units; the group's floor is the screen floor) ──────────
//
// WIDE is the reference measured (1920x1080 box), with one change: the console
// stands 32 off the floor, not 40 — at 16:9 every unit of height under the
// housing is bar size. 8 is all it can give: the Spin roundel overhangs the
// console's foot by 25, so at 32 its edge is 7 above the screen's floor (at 24
// it touched it). Everything else keeps the template's proportions.
//
// PORTRAIT is not a scaled copy of WIDE: scaled to a phone's width the small
// round buttons came out ~17 CSS px across, so on a tall box the console keeps
// the bottom row (menu, balance, bet, stepper) and the round controls get a row
// of their own above it, at sizes a thumb can hit.
const FLOOR_LIFT = 8; // WIDE: the template's 40-unit floor gap, minus this
const Y = (y1080: number) => y1080 - 1080 + FLOOR_LIFT; // design y (1080 box) -> group y
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
export type BarGeometry = typeof WIDE;

type Box = { width: number; height: number; scale: number };
type Size = { width: number; height: number };

/**
 * What the bar must stay clear of, in canvas px (game/cornerLogo.housingRect and
 * Cast.svelte's side band). Any bar piece that stands in a zone's x-range must
 * keep its top below that zone's floor.
 */
export type BarKeepOut = { x0: number; x1: number; floor: number };

/** Never fitted below this, whatever the screen: past it the controls stop being usable. */
const S_MIN = 0.5;

/**
 * How far (group units) the warm hover halo reaches past the buy tile and the
 * Spin roundel (MummyBar drawHaloRect / drawHaloDisc). Counted in the fit, so a
 * hovered control does not glow onto the housing either.
 */
export const HALO = 10;

/** The bar's pieces as group-unit boxes: buy tile, console, and the three round controls. */
const pieces = (G: BarGeometry) => [
	{ x0: G.BUY.x - HALO, x1: G.BUY.x + G.BUY.w + HALO, top: G.BUY.y - HALO },
	{ x0: G.PANEL.x, x1: G.PANEL.x + G.PANEL.w, top: G.PANEL.y },
	{ x0: G.SPIN.x - G.SPIN.r - HALO, x1: G.SPIN.x + G.SPIN.r + HALO, top: G.SPIN.y - G.SPIN.r - HALO },
	{ x0: G.AUTO.x - G.SMALL_R, x1: G.AUTO.x + G.SMALL_R, top: G.AUTO.y - G.SMALL_R },
	{ x0: G.TURBO.x - G.SMALL_R, x1: G.TURBO.x + G.SMALL_R, top: G.TURBO.y - G.SMALL_R },
];

/**
 * Where the bar's group stands in the standard box: centred; its floor is the
 * SCREEN's bottom — the box's floor plus the spare under a letterboxed box
 * (16:10, phones) — not the box's (house rule D2 item 6: v3 floated in mid-air
 * on 16:10 and phones). Scaled down only as far as it must be: to fit the box's
 * width, and (Wild Alchemy) until no piece reaches into a keep-out zone — the
 * board's housing and the side figure's feet.
 */
export function barGroup(canvas: Size, box: Box, keepOut: BarKeepOut[] = []) {
	const portrait = box.height > box.width;
	const G: BarGeometry = portrait ? PORTRAIT : WIDE;
	const spareY = Math.max(0, (canvas.height / box.scale - box.height) / 2);
	const gy = box.height + spareY - (portrait ? 16 : 0);
	const place = (s: number) => {
		const gx = box.width / 2 - (G.W / 2) * s;
		const px = (x: number) => canvas.width / 2 + (gx + x * s - box.width / 2) * box.scale;
		const py = (y: number) => canvas.height / 2 + (gy + y * s - box.height / 2) * box.scale;
		return { gx, px, py };
	};
	const clear = (s: number) => {
		const { px, py } = place(s);
		return pieces(G).every((p) =>
			keepOut.every((z) => px(p.x1) <= z.x0 || px(p.x0) >= z.x1 || py(p.top) >= z.floor),
		);
	};
	let s = Math.min(1, (box.width - 32) / G.W);
	while (s > S_MIN && !clear(s)) s = Math.max(S_MIN, s - 0.005);
	return { portrait, G, s, gx: place(s).gx, gy };
}

export type BarRect = { x0: number; y0: number; x1: number; y1: number };
export type BarDisc = { x: number; y: number; r: number };

/** The bar's pieces in screen px: buy tile, console, and Spin / Auto Spin / Turbo. */
export function barShapes(canvas: Size, box: Box, keepOut: BarKeepOut[] = []) {
	const { G, s, gx, gy } = barGroup(canvas, box, keepOut);
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
 * The autoplay panel's round counts, in the order the panel lays them out
 * (MummyBar filters them against state-shared's AUTO_SPINS_TEXT_OPTION_MAP).
 * The rules page's controls guide reads its "from … up to …" range from here.
 */
export const AUTO_ROUNDS = ['∞', '10', '25', '50', '100', '250', '500', '1000'] as const;

import type { getContext } from './context';

/**
 * The top-right logo and the top-left clock + name are drawn in CANVAS pixels at a
 * fixed REM size, while the board and the cast scale with the window. In a small
 * popout that put the logo over the housing's top-right symbol and over the cast's
 * face, and pushed the name text into the housing's top edge (480x270, 2026-10-12
 * audit). Stake opened exactly this on Deadwood Express after approval
 * (2026-10-04): "The Title of the game is obscuring the symbols on the board in
 * Popup S." Deadwood's fix only kept clear of the board; here the cast stands in
 * the same corner, so its head is a second thing to stay above.
 *
 * Same file in CapoNostra, TurfWar and HardTime — change all three together.
 */

/** BoardFrame draws the frame art at this multiple of the board (all three games). */
const FRAME_SCALE = 1280 / 1110;
/** Cast.svelte: the frame's ink edge, and the side band below which no figure is drawn. */
const FRAME_INK = 0.938;
const MIN_SIDE_BAND = 0.15;
/** LayoutBottomBar / LayoutPortrait put the logo container 20px in from the right. */
const SCREEN_INSET = 20;
const GAP = 6;
/** Below this the logo is too small to read; drop it rather than shrink further. */
const MIN_SCALE = 0.4;
/** UiGameName: REM*1.5 type on a REM*2 line. */
const NAME_LINE = 32;

type Context = ReturnType<typeof getContext>;

export type CornerLogo = {
	/** full-size sprite box, canvas px */
	width: number;
	height: number;
	/** the snippet's own x shift at full size (Hard Time nudges its centred ink right) */
	offsetX: number;
	/** ink extent as fractions of the sprite box (measured off the PNG) */
	inkLeft: number;
	inkBottom: number;
};

/** The housing (frame art) in canvas px. */
export const housingRect = (context: Context) => {
	const main = context.stateLayoutDerived.mainLayout();
	const board = context.stateGameDerived.boardLayout();
	const halfW = (board.width * board.scale * FRAME_SCALE) / 2;
	const halfH = (board.height * board.scale * FRAME_SCALE) / 2;
	const toX = (x: number) => main.x + (x - main.width * main.anchor) * main.scale;
	const toY = (y: number) => main.y + (y - main.height * main.anchor) * main.scale;
	return {
		left: toX(board.x - halfW),
		right: toX(board.x + halfW),
		top: toY(board.y - halfH),
		bottom: toY(board.y + halfH),
	};
};

/**
 * The cast's top in the standard layout box, or null when Cast.svelte draws no
 * figure (no side band — portrait and near-square windows). Same test as Cast.svelte.
 */
export const castTopStd = (context: Context, topFraction: number) => {
	const layout = context.stateGameDerived.boardLayout();
	const box = context.stateLayoutDerived.mainLayout();
	const std = context.stateLayoutDerived.mainLayoutStandard();
	const toStandard = (x: number) => std.width * 0.5 + ((x - box.width * 0.5) * box.scale) / std.scale;
	const inkRight = toStandard(layout.x + layout.width * layout.scale * FRAME_SCALE * 0.5 * FRAME_INK);
	return (std.width - inkRight) / std.width >= MIN_SIDE_BAND ? std.height * topFraction : null;
};

/**
 * Fraction of full size the logo may be drawn at, 0 = don't draw it.
 *
 * It must clear the housing — either entirely beside it or entirely above it — and,
 * when the cast is standing in the side band, sit above the cast's head
 * (`castTopStd`, the figure's top in the standard layout box, or null when no figure
 * is drawn).
 */
export const cornerLogoScale = (context: Context, logo: CornerLogo, castTopStd: number | null) => {
	const canvas = context.stateLayoutDerived.canvasSizes();
	const std = context.stateLayoutDerived.mainLayoutStandard();
	const housing = housingRect(context);
	const anchorRight = canvas.width - SCREEN_INSET;
	// ink-left distance from the container origin and ink-bottom, both at full size
	const inkReach = logo.width * (1 - logo.inkLeft) - logo.offsetX;
	const inkDrop = logo.height * logo.inkBottom;
	const beside = (anchorRight - housing.right - GAP) / inkReach;
	const above = (housing.top - GAP) / inkDrop;
	let scale = Math.min(1, Math.max(beside, above));
	if (castTopStd !== null) {
		const castTop = std.y + (castTopStd - std.height * std.anchor) * std.scale;
		scale = Math.min(scale, (castTop - GAP) / inkDrop);
	}
	return scale < MIN_SCALE ? 0 : scale;
};

/**
 * Whether the top-left clock + name line would run into the housing. When it would,
 * the name is dropped (the clock is short enough to stay clear) — the corner logo or
 * the intro already carries the title.
 */
export const nameHitsHousing = (context: Context, nameRight: number) => {
	const housing = housingRect(context);
	return housing.top < NAME_LINE + GAP && housing.left < nameRight + GAP;
};

// ── portrait: the strip above the housing ─────────────────────────────────────
//
// Below the side-band threshold (phones held upright, near-square popouts) there
// is no room beside the board, so Cast.svelte drew no figure and the corner logo
// had nowhere to sit. What portrait does have is a strip above the housing —
// about a quarter of a phone screen, blurred background and nothing else
// (2026-10-12 audit, P1-F). The strip is split the way portrait slots usually
// split it: the logo on the left, the cast's upper body on the right, standing
// BEHIND the housing so the reels win every overlap (the figure views are added
// at stage depth 2, under the board — memory: cast never overlaps the board).

/** Smallest strip worth filling, canvas px; below it nothing is drawn there. */
const MIN_PORTRAIT_BAND = 110;
/** The logo art's canvas (all three games). */
const LOGO_ASPECT = 1200 / 520;

export type PortraitBand = { top: number; bottom: number; width: number };
/** The logo's ink as fractions of its 1200×520 canvas (measured off the PNG). */
export type LogoInk = { left: number; top: number; right: number; bottom: number };

/** The free strip above the housing in canvas px, or null when there is a side band
 *  (landscape: the cast stands beside the board) or the strip is too thin. */
export const portraitBand = (context: Context): PortraitBand | null => {
	if (castTopStd(context, 0) !== null) return null;
	const top = NAME_LINE + GAP;
	const bottom = housingRect(context).top - GAP;
	const width = context.stateLayoutDerived.canvasSizes().width;
	return bottom - top >= MIN_PORTRAIT_BAND ? { top, bottom, width } : null;
};

/** The logo sprite (anchor 0.5) in canvas px: its ink centred in the left half. */
export const portraitLogoBox = (band: PortraitBand, ink: LogoInk) => {
	const inkW = ink.right - ink.left;
	const inkH = ink.bottom - ink.top;
	const left = SCREEN_INSET;
	const right = band.width * 0.5;
	const height = band.bottom - band.top;
	const inkBoxW = Math.min(right - left, height * 0.6 * ((inkW * LOGO_ASPECT) / inkH));
	const width = inkBoxW / inkW;
	const spriteH = width / LOGO_ASPECT;
	return {
		x: (left + right) / 2 - ((ink.left + ink.right) / 2 - 0.5) * width,
		y: band.top + height * 0.48 - ((ink.top + ink.bottom) / 2 - 0.5) * spriteH,
		width,
		height: spriteH,
	};
};

/**
 * The cast's placement in the standard box (what Cast.svelte hands its figure
 * component): head just under the strip's top, the body running down behind the
 * housing so only `visible` of its ink shows. `innerEdge` keeps the swept ink in
 * the right half, clear of the logo.
 */
export const portraitCast = (context: Context, band: PortraitBand, visible = 0.5) => {
	const std = context.stateLayoutDerived.mainLayoutStandard();
	const toStdX = (x: number) => (x - std.x) / std.scale + std.width * std.anchor;
	const toStdY = (y: number) => (y - std.y) / std.scale + std.height * std.anchor;
	const inkTop = band.top + GAP;
	const inkHeight = (band.bottom + GAP - inkTop) / visible;
	return {
		x: toStdX(band.width * 0.75),
		topY: toStdY(inkTop),
		// the figure components draw the ink at height × 0.82 of the box
		height: inkHeight / (std.scale * 0.82),
		innerEdge: toStdX(band.width * 0.5),
		groundY: toStdY(band.bottom),
	};
};

/** The left half of the strip's centre, canvas px: the logo's slot, and the
 *  free-spin counter's while a feature is running (the logo stands down then). */
export const portraitLeftSlot = (band: PortraitBand) => ({
	x: (SCREEN_INSET + band.width * 0.5) / 2,
	y: band.top + (band.bottom - band.top) * 0.48,
	width: band.width * 0.5 - SCREEN_INSET,
	height: band.bottom - band.top,
});

/** Canvas px → the main game box (what `<MainContainer>` children are placed in). */
export const canvasToMain = (context: Context, x: number, y: number) => {
	const main = context.stateLayoutDerived.mainLayout();
	return {
		x: (x - main.x) / main.scale + main.width * main.anchor,
		y: (y - main.y) / main.scale + main.height * main.anchor,
	};
};

import type { getContext } from './context';
import { HUD_ART } from './assetsHud';
import { canvasToMain, castTopStd, housingRect, portraitBand, portraitLeftSlot } from './cornerLogo';

/**
 * Where the free-game HUD sits, in MainContainer units — one place, read by
 * LadderHud.svelte (flask, points plate, ladder) and FreeSpinCounter.svelte.
 *
 * Landscape (the cast stands in the right side band):
 *   left of the housing, one column: flask → "n/12" plate → FREE SPINS plate;
 *   right of the reel area, the ladder: x = reel right + LADDER_GAP, width
 *   LADDER_W. Cast.svelte keeps the figure right of `reel right + 24 + width`
 *   (its `ladderRight`) — LADDER_GAP / LADDER_W are the two numbers it needs.
 *
 * Portrait (no side band; the strip above the housing holds the logo on the
 * left and the cast on the right): the whole HUD packs into the left half of
 * that strip, where the logo stands down during the feature — flask + plate on
 * the left, ladder + FREE SPINS plate on the right of the block.
 */

type Context = ReturnType<typeof getContext>;

/** Gap between the reel area's right edge and the ladder (main units). */
export const LADDER_GAP = 24;
/** Ladder plaque width (main units). Was 106 for the grey rectangles. */
export const LADDER_W = 150;

const RUNG_H = (LADDER_W * HUD_ART.ladder.h) / HUD_ART.ladder.w;
const RUNG_PITCH = RUNG_H + 7;
const LADDER_H = RUNG_PITCH * 4 + RUNG_H;

/** BoardFrame draws the frame art at this multiple of the reel area, ink at 0.938 of it. */
const FRAME_INK_HALF = (1280 / 1110) * 0.938;

export type Box = { x: number; y: number; width: number; height: number };
export type HudLayout = {
	portrait: boolean;
	/** uniform scale the block was fitted with (1 = design size) */
	scale: number;
	flask: Box;
	points: Box;
	counter: Box;
	/** top-left of the ladder; rung i (0 = x2 … 4 = x12) is at y + (4 - i) * pitch */
	ladder: { x: number; y: number; width: number; rungHeight: number; pitch: number };
};

const FLASK_W = 120;
const FLASK_H = (FLASK_W * HUD_ART.flaskBody.h) / HUD_ART.flaskBody.w;
const PLATE_RATIO = HUD_ART.fsCounter.h / HUD_ART.fsCounter.w;

export const hudLayout = (context: Context): HudLayout => {
	const board = context.stateGameDerived.boardLayout();
	const reelHalfW = (board.width * board.scale) / 2;
	const reelHalfH = (board.height * board.scale) / 2;
	const band = portraitBand(context);

	if (band) {
		// design block, then fitted into the logo's slot
		const slot = portraitLeftSlot(band);
		const a = canvasToMain(context, slot.x - slot.width / 2, slot.y - slot.height / 2);
		const b = canvasToMain(context, slot.x + slot.width / 2, slot.y + slot.height / 2);
		const slotW = b.x - a.x;
		const slotH = b.y - a.y;
		const flaskW = 100;
		const flaskH = (flaskW * HUD_ART.flaskBody.h) / HUD_ART.flaskBody.w;
		const pointsW = 118;
		const colGap = 16;
		const blockW = pointsW + colGap + LADDER_W + 15;
		const counterW = LADDER_W + 30;
		const counterH = counterW * PLATE_RATIO;
		const blockH = Math.max(flaskH + 8 + pointsW * PLATE_RATIO, LADDER_H + 10 + counterH);
		const scale = Math.min(1.25, slotW / blockW, (slotH * 0.94) / blockH);
		const x0 = (a.x + b.x) / 2 - (blockW * scale) / 2;
		const y0 = (a.y + b.y) / 2 - (blockH * scale) / 2;
		const s = (v: number) => v * scale;
		return {
			portrait: true,
			scale,
			flask: { x: x0 + s((pointsW - flaskW) / 2), y: y0, width: s(flaskW), height: s(flaskH) },
			points: { x: x0, y: y0 + s(flaskH + 8), width: s(pointsW), height: s(pointsW * PLATE_RATIO) },
			ladder: { x: x0 + s(pointsW + colGap), y: y0, width: s(LADDER_W), rungHeight: s(RUNG_H), pitch: s(RUNG_PITCH) },
			counter: { x: x0 + s(pointsW + colGap - 15), y: y0 + s(LADDER_H + 10), width: s(counterW), height: s(counterH) },
		};
	}

	const strip = portraitCompactStrip(context);
	if (strip) {
		// Short portrait (320x568): the strip above the housing is too thin for
		// the logo + cast split, so no figure is drawn there and the old fallback
		// (the landscape column left of the housing) put the flask, points and
		// ladder off screen (QA 11-11 B4). The HUD takes the whole strip instead,
		// right of the clock, as one row: flask over points | ladder | FREE SPINS.
		const a = canvasToMain(context, strip.left, strip.top);
		const b = canvasToMain(context, strip.right, strip.bottom);
		const slotW = b.x - a.x;
		const slotH = b.y - a.y;
		const flaskW = 100;
		const flaskH = (flaskW * HUD_ART.flaskBody.h) / HUD_ART.flaskBody.w;
		const pointsW = 118;
		const gap = 16;
		const counterW = 180;
		const counterH = counterW * PLATE_RATIO;
		const blockW = pointsW + gap + LADDER_W + gap + counterW;
		const blockH = Math.max(flaskH + 8 + pointsW * PLATE_RATIO, LADDER_H, counterH);
		const scale = Math.min(1.25, slotW / blockW, (slotH * 0.96) / blockH);
		const s = (v: number) => v * scale;
		const x0 = (a.x + b.x) / 2 - s(blockW) / 2;
		const yMid = (a.y + b.y) / 2;
		const col1H = flaskH + 8 + pointsW * PLATE_RATIO;
		const y1 = yMid - s(col1H) / 2;
		return {
			portrait: true,
			scale,
			flask: { x: x0 + s((pointsW - flaskW) / 2), y: y1, width: s(flaskW), height: s(flaskH) },
			points: { x: x0, y: y1 + s(flaskH + 8), width: s(pointsW), height: s(pointsW * PLATE_RATIO) },
			ladder: { x: x0 + s(pointsW + gap), y: yMid - s(LADDER_H) / 2, width: s(LADDER_W), rungHeight: s(RUNG_H), pitch: s(RUNG_PITCH) },
			counter: { x: x0 + s(pointsW + gap + LADDER_W + gap), y: yMid - s(counterH) / 2, width: s(counterW), height: s(counterH) },
		};
	}

	// landscape: column left of the housing ink
	const reelTop = board.y - reelHalfH;
	const inkLeft = board.x - reelHalfW * FRAME_INK_HALF;
	const colW = 220;
	const colH = FLASK_H + 8 + 132 * PLATE_RATIO + 14 + colW * PLATE_RATIO;
	const available = inkLeft - 16;
	const scale = Math.max(0.55, Math.min(1, available / (colW + 8), (reelHalfH * 2) / colH));
	const s = (v: number) => v * scale;
	const colRight = inkLeft - s(14);
	const cx = colRight - s(colW) / 2;
	// centred on the board's height: at the reel top the flask ran into the
	// top-left clock / game-name line
	const top = Math.max(reelTop, board.y - s(colH) / 2);
	const pointsY = top + s(FLASK_H + 8);
	const counterY = pointsY + s(132 * PLATE_RATIO + 14);
	return {
		portrait: false,
		scale,
		flask: { x: cx - s(FLASK_W) / 2, y: top, width: s(FLASK_W), height: s(FLASK_H) },
		points: { x: cx - s(132) / 2, y: pointsY, width: s(132), height: s(132 * PLATE_RATIO) },
		counter: { x: cx - s(colW) / 2, y: counterY, width: s(colW), height: s(colW * PLATE_RATIO) },
		ladder: {
			x: board.x + reelHalfW + LADDER_GAP,
			y: board.y - LADDER_H / 2,
			width: LADDER_W,
			rungHeight: RUNG_H,
			pitch: RUNG_PITCH,
		},
	};
};

/** Clock ("13:42", REM-sized canvas text 20 px in) — kept clear on the left. */
const CLOCK_RESERVE = 100;

/**
 * Portrait with no logo/cast strip (cornerLogo.portraitBand null: the strip is
 * thinner than its minimum, e.g. 320x568) and no side band: the strip above the
 * housing in canvas px, right of the clock — where the free-game HUD goes. Null
 * in every other layout. Game.svelte drops the typed name while the feature
 * runs in this mode, so the HUD has the line the name was on.
 */
export const portraitCompactStrip = (context: Context) => {
	if (context.stateLayoutDerived.layoutType() !== 'portrait') return null;
	if (portraitBand(context) || castTopStd(context, 0) !== null) return null;
	const canvas = context.stateLayoutDerived.canvasSizes();
	const top = 6;
	const bottom = housingRect(context).top - 6;
	if (bottom - top < 48) return null;
	return { left: CLOCK_RESERVE, right: canvas.width - 6, top, bottom };
};

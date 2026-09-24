import { FillGradient } from 'pixi.js';

import { GAME_FONT, DISPLAY_FONT_WEIGHT } from './fonts';
import { CHROME_STOPS, GOLD_ACCENT, INK } from './palette';

// Win and free-spin amounts.
//
// Was a white→pink gradient in Cinzel. Now white→gold, because this palette
// reserves gold for money (see palette.ts): magenta is everywhere in this game —
// on the Wild, on the spin button, in the background lighting — so a magenta
// number said nothing. A gold one is the only gold on screen, and it appears
// exactly when the player has won.
//
// The dark stroke stays. The original note here is still true and worth keeping:
// a coloured drop-shadow glow behind these digits muddies them at readout size,
// and the gradient fill plus a hard stroke carry the treatment on their own.
export const neonNumberStyle = (fontSize: number) => {
	const fill = new FillGradient(0, 0, 0, 1);
	fill.addColorStop(0, 0xffffff);
	fill.addColorStop(0.45, 0xfff3cf);
	fill.addColorStop(0.78, GOLD_ACCENT);
	fill.addColorStop(1, 0xe09a1f);
	return {
		fontFamily: GAME_FONT,
		fontWeight: DISPLAY_FONT_WEIGHT,
		fontSize,
		fill,
		stroke: INK,
		strokeThickness: fontSize * 0.06,
		// Orbitron sets wider per glyph than Cinzel did, so the extra tracking the
		// serif needed now pushes long amounts out of the plate. Tightened.
		letterSpacing: 0,
	};
};

// Liquid chrome type, for titles and plaque headings — the same stop order every
// chrome surface in the game uses, so drawn metal and painted metal match. The
// dark band near the middle is the load-bearing stop; without it this reads as
// flat silver. See palette.ts.
export const chromeTextStyle = (fontSize: number) => {
	const fill = new FillGradient(0, 0, 0, 1);
	for (const [offset, color] of CHROME_STOPS) fill.addColorStop(offset, color);
	return {
		fontFamily: GAME_FONT,
		fontWeight: DISPLAY_FONT_WEIGHT,
		fontSize,
		fill,
		stroke: INK,
		strokeThickness: fontSize * 0.075,
		letterSpacing: 1,
	};
};

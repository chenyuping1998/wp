/**
 * Where to put a low symbol's letter so the GLYPH, not its text box, sits on
 * the label's centre (2026-10-18, user: the letters sat a little low in the
 * circle).
 *
 * A pixi Text with anchor 0.5 centres its whole line box: the font's ascent
 * plus descent. Bowlby One carries a tall ascent (accents) and a deep descent,
 * and capitals use neither, so the letters landed below the circle's centre.
 * This measures the glyph's real ink extent and returns the y offset that
 * moves its middle onto the anchor point.
 *
 *   y offset = box height / 2 − (ascent − (inkAscent − inkDescent) / 2)
 *
 * with box height and ascent from pixi's own font metrics (the same numbers
 * it lays the Text out with) and the ink from canvas measureText. Cached per
 * letter and size once the font has loaded; 0 before that.
 */
import { CanvasTextMetrics, TextStyle } from 'pixi.js';

import { GAME_FONT } from './fonts';

const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;

export const letterNudge = (letter: string, fontSize: number, fontFamily: string = GAME_FONT): number => {
	const key = `${letter}|${fontSize}|${fontFamily}`;
	const hit = cache.get(key);
	if (hit !== undefined) return hit;
	if (typeof document === 'undefined') return 0;
	const font = `400 ${fontSize}px ${fontFamily}`;
	// not loaded yet: the fallback face would be measured and then cached
	if (document.fonts && !document.fonts.check(font)) return 0;
	ctx ??= document.createElement('canvas').getContext('2d');
	if (!ctx) return 0;
	const style = new TextStyle({ fontFamily, fontWeight: '400', fontSize });
	const box = CanvasTextMetrics.measureText(letter, style);
	ctx.font = font;
	const ink = ctx.measureText(letter);
	const glyphMid = box.fontProperties.ascent - (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2;
	const nudge = box.height / 2 - glyphMid;
	cache.set(key, nudge);
	return nudge;
};

/** the canvas baseline that puts the glyph's ink middle at `centreY` */
export const inkBaseline = (ctx2d: CanvasRenderingContext2D, letter: string, centreY: number): number => {
	const ink = ctx2d.measureText(letter);
	return centreY + (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2;
};

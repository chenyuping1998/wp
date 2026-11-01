import { CanvasTextMetrics, TextStyle, type TextStyleOptions } from 'pixi.js';

/**
 * Font size that keeps a one-line title inside `maxWidth`, measured with the
 * real face and letter spacing. The FS intro/outro titles used a length
 * estimate (width × 1.5 / characters), which let "FREE SPINS" run past the
 * edges of the paper card (2026-10-29); wide-glyph locales were worse.
 */
export const fitFontSize = (text: string, style: TextStyleOptions, maxWidth: number) => {
	const size = Number(style.fontSize ?? 26);
	const width = CanvasTextMetrics.measureText(text, new TextStyle(style)).width;
	return width > maxWidth ? Math.floor((size * maxWidth) / width) : size;
};

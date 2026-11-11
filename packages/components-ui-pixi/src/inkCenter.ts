// Optical centring for a single line of pixi Text.
//
// anchor 0.5 centres the text BOX, whose height is the font's ascent + descent.
// That is right for capitals and digits in our display faces, but a glyph the
// face does not carry falls back to another font and sits wherever that font
// puts it: '∞' in Anton lands about 6% of the font size low, which on a round
// badge reads as off-centre (Pickle Panic, 2026-10-16).
//
// Returns how far the ink's centre sits below the box's centre, in px; add
// -inkOffsetY(...) to the Text's y. Box metrics are taken the way pixi v8's
// CanvasTextMetrics.measureFont takes them ('|ÉqÅ' + 'M'), so the two agree.

type InkStyle = {
	fontFamily?: string | string[];
	fontSize?: number;
	fontWeight?: string | number;
	fontStyle?: string;
};

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

export function inkOffsetY(text: string | number, style: InkStyle): number {
	const family = Array.isArray(style.fontFamily) ? style.fontFamily.join(', ') : (style.fontFamily ?? 'sans-serif');
	const size = style.fontSize ?? 26;
	const font = `${style.fontStyle ?? 'normal'} normal ${style.fontWeight ?? 'normal'} ${size}px ${family}`;
	const key = `${font}|${text}`;
	const hit = cache.get(key);
	if (hit !== undefined) return hit;
	if (typeof document === 'undefined') return 0;
	ctx ??= document.createElement('canvas').getContext('2d');
	if (!ctx) return 0;
	ctx.font = font;
	const box = ctx.measureText('|ÉqÅM');
	const ink = ctx.measureText(String(text));
	const offset =
		(box.actualBoundingBoxAscent - box.actualBoundingBoxDescent) / 2 -
		(ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2;
	// Only trust it once the face has loaded; a fallback measurement would be
	// cached for good otherwise.
	if (document.fonts?.status === 'loaded') cache.set(key, offset);
	return offset;
}

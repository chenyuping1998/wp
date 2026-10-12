import { FillGradient } from 'pixi.js';

// THE GOLD NUMBERS WERE WHITE.
//
// Every "gold" piece of type in this game — the win count-ups, the big-win
// plaque, the free-spins title and count, the WAYS badge, the coin values — was
// written as `fill: [top, middle, bottom]`, which is how pixi v7 spelled a
// vertical gradient. Pixi v8 does not read it that way. It reads a numeric array
// as a NORMALISED RGB colour, [r, g, b] in 0..1, so [0xfff3bd, 0xffd75e,
// 0xc9821a] is three channels each far above 1, clamped to 1 — pure white.
// Measured: `new Color([0xfff3bd, 0xffd75e, 0xc9821a]).toHex()` is '#ffffff'.
//
// So the numbers the whole presentation is built around rendered as white text
// in a brown outline. Nothing warned: the array is a valid colour, just not this
// one. (v8's own v7-compat shim converts `fillGradientStops`, `strokeThickness`
// and `dropShadow: true` — which is why the outlines and shadows DID survive —
// but not an array `fill`.)
//
// This builds the gradient the way v8 wants it, with the same geometry v8's
// compat shim uses for `fillGradientStops`: top to bottom over 1.7 x the font
// size, which is the height of a line of this face.
//
// CACHED, because it has to be. GoldText re-renders on every tick of a win
// count-up, and a FillGradient owns a texture; building a new one per frame would
// allocate a texture per frame for as long as a big win counts up.
const cache = new Map<string, FillGradient>();

export const verticalFill = (fill: number | readonly number[], fontSize: number) => {
	if (typeof fill === 'number') return fill;
	if (fill.length === 1) return fill[0];
	// rounded, so a font size that wobbles by a fraction of a pixel during a
	// layout pass does not mint a new texture each time
	const key = `${fill.join(',')}@${Math.round(fontSize)}`;
	let gradient = cache.get(key);
	if (!gradient) {
		gradient = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: Math.round(fontSize) * 1.7 },
		});
		fill.forEach((color, i) => gradient!.addColorStop(i / (fill.length - 1), color));
		cache.set(key, gradient);
	}
	return gradient;
};

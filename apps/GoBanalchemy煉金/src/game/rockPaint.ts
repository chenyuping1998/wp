import type { Graphics as PixiGraphics } from 'pixi.js';

// A PIECE OF THIS MINE'S ROOF, PAINTED THE WAY THE REST OF THE GAME IS PAINTED.
//
// Shared by the two things that drop rock: CaveRockfall (the cave-in on a
// feature trigger) and MineAir (the debris that keeps coming down through the
// feature, more of it on every rung of the ladder). One painting for both, so
// a trigger's rocks and the feature's rocks are recognisably the same stone.
//
// The rule is design/SYMBOL_PROMPTS.md's, the same one the smoke and the
// symbols follow: one warm mine-lamp key from the upper left, deep shadow to
// the lower right, and a lit rim separating the subject from its ground. Four
// passes — body, the facet turned away from the lamp, the lit plane, and the
// ink outline — then the rim on the edges that actually face the lamp.
//
// THE LIGHT DOES NOT TUMBLE WITH THE ROCK. The facets are offset in SCREEN
// space, and the rim is chosen from the edges facing up-left AT THAT MOMENT, so
// a rock rolling over keeps its lit side towards the lamp. Painting the
// highlight onto the rock and letting it spin is what makes falling debris look
// like cut-out stickers.
//
// Colours are the background's own rock: warm umber under an oil lamp, not a
// neutral grey. An earlier pass in the smoke's greyer stone, with evenly spaced
// corners, came out as flat grey hexagons that read as UI confetti against the
// painting.
export const ROCK_INK = 0x1a1208;
export const ROCK_BODY = 0x6e5439;
export const ROCK_SHADE = 0x3a2b1c;
export const ROCK_LIT = 0xb08b5c;
export const ROCK_RIM = 0xffcf80;
// what distance does to it: the far layer sits deeper in the gloom
export const ROCK_HAZE = 0x1c1812;

/** The outline: uneven angles and radii, then stretched, so no two rocks are
 *  the same shape and none of them is a regular polygon. */
export type RockShape = {
	angles: number[];
	radii: number[];
	stretch: number;
};

export const makeRockShape = (rand: () => number): RockShape => {
	const sides = 7 + Math.floor(rand() * 3);
	const steps = Array.from({ length: sides }, () => 0.6 + rand() * 0.8);
	const total = steps.reduce((a, b) => a + b, 0);
	let acc = 0;
	const angles = steps.map((step) => {
		const a = acc;
		acc += (step / total) * Math.PI * 2;
		return a;
	});
	return {
		angles,
		radii: Array.from({ length: sides }, () => 0.6 + rand() * 0.4),
		stretch: 0.62 + rand() * 0.3,
	};
};

export const mixColor = (a: number, b: number, k: number) => {
	let out = 0;
	for (const shift of [16, 8, 0]) {
		const ca = (a >> shift) & 0xff;
		const cb = (b >> shift) & 0xff;
		out |= Math.round(ca + (cb - ca) * k) << shift;
	}
	return out;
};

export const paintRock = (
	g: PixiGraphics,
	{
		shape,
		cx,
		cy,
		r,
		turn,
		haze = 0,
		alpha = 1,
	}: {
		shape: RockShape;
		cx: number;
		cy: number;
		/** radius in pixels */
		r: number;
		/** rotation in radians */
		turn: number;
		/** 0 = close and fully lit, 1 = lost in the dark */
		haze?: number;
		alpha?: number;
	},
) => {
	const cos = Math.cos(turn);
	const sin = Math.sin(turn);
	const n = shape.radii.length;
	// the outline at `k` of its size, moved by (ox, oy) in SCREEN space
	const outline = (k: number, ox = 0, oy = 0) =>
		shape.angles.flatMap((a, i) => {
			const lx = Math.cos(a) * shape.radii[i] * k;
			const ly = Math.sin(a) * shape.radii[i] * shape.stretch * k;
			return [cx + ox + (lx * cos - ly * sin) * r, cy + oy + (lx * sin + ly * cos) * r];
		});
	const flat = outline(1);

	g.poly(flat).fill({ color: mixColor(ROCK_BODY, ROCK_HAZE, haze), alpha });
	// the facet turned away from the lamp, down and right
	g.poly(outline(0.62, r * 0.16, r * 0.18)).fill({
		color: mixColor(ROCK_SHADE, ROCK_HAZE, haze),
		alpha: 0.8 * alpha,
	});
	// the lit plane, pushed towards it
	g.poly(outline(0.5, -r * 0.2, -r * 0.2)).fill({
		color: mixColor(ROCK_LIT, ROCK_HAZE, haze),
		alpha: 0.85 * alpha,
	});
	// ink last, so the facets never spill over the silhouette
	g.poly(flat).stroke({ width: Math.max(1.2, r * 0.17), color: ROCK_INK, join: 'round', alpha });

	// the rim, on the edges whose outward normal faces up-left. Below a couple of
	// pixels the stroke is wider than the rock and it just fogs the silhouette.
	if (r < 3) return;
	for (let i = 0; i < n; i++) {
		const ax = flat[i * 2];
		const ay = flat[i * 2 + 1];
		const bx = flat[((i + 1) % n) * 2];
		const by = flat[((i + 1) % n) * 2 + 1];
		const mx = (ax + bx) / 2 - cx;
		const my = (ay + by) / 2 - cy;
		const len = Math.hypot(mx, my) || 1;
		const facing = (-mx - my) / (len * Math.SQRT2);
		if (facing < 0.3) continue;
		g.moveTo(ax, ay)
			.lineTo(bx, by)
			.stroke({
				width: Math.max(1, r * 0.1),
				color: ROCK_RIM,
				alpha: (1 - haze * 0.6) * 0.85 * facing * alpha,
				cap: 'round',
			});
	}
};

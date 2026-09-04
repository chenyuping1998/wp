// Shared ink-and-cel drawing kit for Crusher Yard.
//
// Every art generator imports from here so the set speaks one visual language.
// The reference is the GTA V loading-screen illustration end of the range —
// bold contour, posterised colour, restrained halftone — rather than full
// Silver Age comic. Marvel-style Ben-Day dots are available and are used, but
// as an accent on FX and plaques; smothering every symbol in dots reads retro
// and cheap, which is the opposite of the brief.
//
// WHY THIS STYLE AND A PROCEDURAL PIPELINE FIT
//
// Photoreal art is where SVG generation loses: it needs continuous tone, real
// occlusion, subsurface scatter. Ink illustration is built out of exactly what
// vector drawing does natively — a contour of varying weight, flat colour areas,
// hard-edged shadow shapes, geometric bursts. The ceiling here is far higher
// than it was for the rendered-metal set.
//
// THE FOUR RULES THE WHOLE SET OBEYS
//
//  1. LINE WEIGHT VARIES. Outer contour heaviest, plane breaks medium, interior
//     detail lightest. One uniform stroke width is the clearest tell of clip art.
//  2. SHADOW IS A SHAPE, NOT A GRADIENT. Each object gets one hard-edged dark
//     region thrown from the upper left, and one hard-edged light region. Two
//     extra paths per object is the entire cost of looking illustrated.
//  3. BLACK IS A COLOUR. Deep areas go to real ink, not dark grey. The punch in
//     this style comes from black sitting next to saturated colour.
//  4. HALFTONE IS AN ACCENT. Use it where a painting would put a transition —
//     never as an all-over texture.

// ── palette ─────────────────────────────────────────────────────────────────
//
// Printed, limited, saturated. Each entry is a four-step ramp used as flat
// areas, never interpolated: `light` for the lit shape, `base` for the body,
// `shade` for the shadow shape, `deep` for the darkest accent short of ink.
export const INK = '#14151c';
export const INK_LINE = '#0d0e13';

// RANK IS CARRIED BY COLOUR TEMPERATURE, identity by hue within the family.
//
// Two separate jobs, and an earlier pass conflated them. Giving all ten symbols
// their own hue made them individually distinguishable but destroyed the thing
// a player actually needs first: which ones are worth more. Ten equal colours
// is ten equal-looking symbols.
//
// So the set splits before it separates:
//
//   HIGH  warm — crimson, gold, magenta, orange. Plus a warm rim line inside
//         the contour (see `rimmed`), which reads as "this one is worth
//         something" before any individual shape has been identified.
//   LOW   cool — steel blue, teal, porcelain, indigo. No rim.
//
// Then hue separates within each family, so no two symbols collide.
//
// The cool family deliberately stays clear of the two ramps the mechanics own:
// the pressure gauge runs green -> amber -> red as a SEQUENCE, and the tank is
// cyan. l2's teal sits far enough from both to never be misread as a reading.
export const HUE = {
	// ── high: warm ──
	crimson: { light: '#ff8a72', base: '#d92d33', shade: '#84151f', deep: '#470a10' },
	gold: { light: '#ffe07a', base: '#e8a91c', shade: '#96600a', deep: '#523205' },
	magenta: { light: '#ff9ee0', base: '#d63a9c', shade: '#821a5e', deep: '#480c33' },
	orange: { light: '#ffbd6b', base: '#f07a12', shade: '#96420a', deep: '#532105' },
	// ── low: cool, and a full step DARKER than the warm family ──
	//
	// Hue alone does not carry rank. A first pass split warm from cool and left
	// the values matched, which put a near-white porcelain toilet on a dark board
	// — the brightest, most eye-catching thing in the game, sitting in the lowest
	// pay tier. On a dark recess VALUE outranks hue for attention, so the cool
	// family is pulled down and desaturated until it recedes behind every warm
	// symbol. Lows are meant to be the texture the highs stand out against.
	steelblue: { light: '#8ea6bf', base: '#4e6b8c', shade: '#2c405c', deep: '#182333' },
	teal: { light: '#6fb3a8', base: '#1f7469', shade: '#0d4540', deep: '#062825' },
	porcelain: { light: '#b8c2cc', base: '#8794a1', shade: '#4e5a66', deep: '#2b333b' },
	indigo: { light: '#8b86c4', base: '#4a4494', shade: '#2a2360', deep: '#171236' },
	// ── specials: outside both families on purpose ──
	hazard: { light: '#ffe45c', base: '#f5c518', shade: '#9c7605', deep: '#524003' },
	cyan: { light: '#c2f4ff', base: '#3fc9f0', shade: '#146f9c', deep: '#0a3b5c' },
};

/** The warm inner rim that marks a high symbol. Drawn inside the ink contour. */
export const RIM = '#ffd98a';

// ── ink ─────────────────────────────────────────────────────────────────────
export const WEIGHT = { contour: 12, plane: 6.5, detail: 3.4 };

/**
 * Ink pass then colour pass.
 *
 * Stroking a filled shape directly puts the line ON the edge, so half its
 * weight eats into the colour and the silhouette shrinks as the line gets
 * heavier. Drawing a fat stroked copy underneath keeps the colour area at full
 * size and reads as a brush contour drawn around the outside — which is what a
 * real inked outline does.
 */
export const inked = (shape, fill, weight = WEIGHT.contour) =>
	`<g stroke="${INK_LINE}" stroke-width="${weight}" stroke-linejoin="round" stroke-linecap="round" fill="${INK_LINE}">${shape}</g>` +
	`<g fill="${fill}">${shape}</g>`;

/** An interior line: no fill, light weight, for plane breaks and detail. */
export const line = (shape, weight = WEIGHT.detail, color = INK_LINE, opacity = 1) =>
	`<g fill="none" stroke="${color}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">${shape}</g>`;

// ── halftone ────────────────────────────────────────────────────────────────
//
// Ben-Day dots on a 45-degree grid. Density is carried by DOT RADIUS against a
// fixed pitch, which is how a real screen works. Shrinking the pitch instead
// makes the tone finer rather than lighter, and at 98px a fine screen collapses
// into flat grey — so the pitch is deliberately coarse.
const PITCH = 12;
const DOT = { light: 1.9, mid: 3.1, heavy: 4.4, solid: 5.6 };

export const halftoneDefs = (p = 'ht') =>
	Object.entries(DOT)
		.map(
			([name, r]) =>
				`<pattern id="${p}${name}" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
				`<circle cx="${PITCH / 2}" cy="${PITCH / 2}" r="${r}" fill="currentColor"/></pattern>`,
		)
		.join('');

/** A halftone wash. `level` is light | mid | heavy | solid. */
export const halftone = (shape, color, level = 'mid', opacity = 1, p = 'ht') =>
	`<g color="${color}" fill="url(#${p}${level})" opacity="${opacity}">${shape}</g>`;

// ── print artefacts ─────────────────────────────────────────────────────────
export const printDefs = (p = 'pr') =>
	// Misregistration: the colour plate landing a hair off the black plate. Real
	// presses do this and the eye reads it as ink on paper rather than as pixels.
	`<filter id="${p}Misreg" x="-8%" y="-8%" width="116%" height="116%">` +
	`<feOffset dx="-2" dy="1.4" result="o"/>` +
	`<feColorMatrix in="o" type="matrix" values="1 0 0 0 0.10  0 0.74 0 0 0.02  0 0 0.80 0 0.03  0 0 0 0.26 0"/>` +
	`</filter>` +
	// Paper tooth. Low amplitude: enough to break the mathematical flatness of a
	// large fill without reading as noise.
	`<filter id="${p}Tooth" x="0" y="0" width="100%" height="100%">` +
	`<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="17"/>` +
	`<feColorMatrix type="matrix" values="0 0 0 0 0.13  0 0 0 0 0.12  0 0 0 0 0.10  0.09 0.09 0.09 0 0"/>` +
	`</filter>` +
	// Drop shadow that reads as a cut-out sitting on the page, not as a glow.
	`<filter id="${p}Drop" x="-30%" y="-30%" width="160%" height="160%">` +
	`<feDropShadow dx="4" dy="8" stdDeviation="0.8" flood-color="#05060a" flood-opacity="0.55"/>` +
	`</filter>`;

// ── geometry ────────────────────────────────────────────────────────────────

/** Regular polygon points, ready to follow an `M`. */
export const poly = (cx, cy, r, sides, rotate = -90) =>
	Array.from({ length: sides }, (_, i) => {
		const a = ((rotate + (360 / sides) * i) * Math.PI) / 180;
		return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
	}).join(' L');

const seeded = (seed) => {
	let s = seed * 9301 + 49297;
	return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

/**
 * A jagged impact starburst — the comic POW frame.
 *
 * Alternating long and short radii with per-point jitter. A mathematically
 * regular star reads as a badge; the irregularity is what makes it an impact.
 */
export const burst = (cx, cy, rOuter, rInner, spikes = 14, seed = 1) => {
	const rnd = seeded(seed);
	const pts = [];
	for (let i = 0; i < spikes * 2; i += 1) {
		const r = (i % 2 === 0 ? rOuter : rInner) * (0.86 + rnd() * 0.28);
		const a = ((360 / (spikes * 2)) * i - 90 + (rnd() - 0.5) * 9) * (Math.PI / 180);
		pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
	}
	return `M${pts.join(' L')} Z`;
};

/** Radial speed lines: tapered wedges pointing out from a centre. */
export const speedLines = (cx, cy, rFrom, rTo, count = 24, seed = 3) => {
	const rnd = seeded(seed);
	return Array.from({ length: count }, () => {
		const a = rnd() * Math.PI * 2;
		const w = (0.006 + rnd() * 0.016) * Math.PI;
		const f = rFrom * (0.8 + rnd() * 0.4);
		const t = rTo * (0.7 + rnd() * 0.5);
		const p = (r, ang) =>
			`${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`;
		return `M${p(f, a - w)} L${p(t, a)} L${p(f, a + w)} Z`;
	}).join(' ');
};

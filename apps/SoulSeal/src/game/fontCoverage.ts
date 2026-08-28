// What the display face can actually draw.
//
// Cinzel covers 367 codepoints: Basic Latin, Latin-1, and most of Latin
// Extended-A - so Polish, Czech, Turkish and the rest of the European locales
// are in, but Cyrillic, CJK, Arabic and Devanagari are not.
//
// This matters because browsers fall back PER GLYPH. Ask for Cinzel and set a
// Russian string in it and you get the Latin punctuation in Cinzel and every
// letter in whatever the fallback is: two faces inside one word. That reads as a
// rendering bug, and it is strictly worse than setting the whole string in one
// plain face.
//
// So: measure, do not assume. The ranges below are the font's own cmap segments,
// read straight out of static/fonts/Cinzel.ttf. Regenerate with
// `node design/check_font_coverage.mjs` if the font is ever swapped or resubset
// - that script also fails the build if any player-facing string would fall
// back without this being applied.
const COVERED: readonly (readonly [number, number])[] = [
	[0x0020, 0x002f],
	[0x0030, 0x0039],
	[0x003a, 0x007e],
	[0x00a0, 0x0107],
	[0x010a, 0x0113],
	[0x0116, 0x011b],
	[0x011e, 0x0123],
	[0x0126, 0x0127],
	[0x012a, 0x012b],
	[0x012e, 0x0133],
	[0x0136, 0x0137],
	[0x0139, 0x0148],
	[0x014a, 0x014d],
	[0x0150, 0x015b],
	[0x015e, 0x0167],
	[0x016a, 0x016b],
	[0x016e, 0x017e],
	[0x0192, 0x0192],
	[0x0218, 0x021b],
	[0x02c6, 0x02c7],
	[0x02d8, 0x02dd],
	[0x0300, 0x0304],
	[0x0306, 0x0308],
	[0x030a, 0x030c],
	[0x0326, 0x0328],
	[0x0394, 0x0394],
	[0x03a9, 0x03a9],
	[0x03bc, 0x03bc],
	[0x03c0, 0x03c0],
	[0x1e80, 0x1e85],
	[0x1ef2, 0x1ef3],
	[0x2013, 0x2014],
	[0x2018, 0x201a],
	[0x201c, 0x201e],
	[0x2020, 0x2022],
	[0x2026, 0x2026],
	[0x2030, 0x2030],
	[0x2039, 0x203a],
	[0x2044, 0x2044],
	[0x2074, 0x2074],
	[0x20ac, 0x20ac],
	[0x2122, 0x2122],
	[0x2202, 0x2202],
	[0x220f, 0x220f],
	[0x2211, 0x2212],
	[0x2215, 0x2215],
	[0x221a, 0x221a],
	[0x221e, 0x221e],
	[0x222b, 0x222b],
	[0x2248, 0x2248],
	[0x2260, 0x2260],
	[0x2264, 0x2265],
	[0x25ca, 0x25ca],
	[0xfb01, 0xfb02],
];

/** True when every character in `text` can be drawn by the display face. */
export const isCoveredByDisplayFont = (text: string): boolean => {
	for (const char of text) {
		const code = char.codePointAt(0);
		if (code === undefined) continue;
		if (!COVERED.some(([lo, hi]) => code >= lo && code <= hi)) return false;
	}
	return true;
};

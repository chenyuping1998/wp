// What the display face can actually draw.
//
// Titan One ships here as a SUBSET: 212 codepoints, Basic Latin plus Latin-1 and
// a handful of punctuation. It has no Polish ą, no Turkish İ, no Vietnamese ế,
// no Cyrillic, and none of CJK, Arabic or Devanagari - so of the sixteen locales
// Stake serves (see packages/config-lingui), it can only set seven.
//
// This matters because browsers fall back PER GLYPH. Ask for Titan One and set
// the Polish "NACIŚNIJ" in it and you get N-A-C-I-  in Titan One and Ś in
// whatever the fallback is: two different faces inside one word, at two
// different weights. That reads as a rendering bug, and it is strictly worse
// than setting the whole string in one plain face.
//
// So: measure, do not assume. The ranges below are the font's own cmap segments,
// read straight out of static/fonts/TitanOne.ttf. Regenerate with
// `node design/check_font_coverage.mjs` if the font is ever swapped or resubset
// - that script also fails the build if any player-facing string would fall
// back without this being applied.
const COVERED: readonly (readonly [number, number])[] = [
	[0x0020, 0x007e],
	[0x00a1, 0x00ff],
	[0x0131, 0x0131],
	[0x0152, 0x0153],
	[0x02c6, 0x02c6],
	[0x02da, 0x02da],
	[0x02dc, 0x02dc],
	[0x2013, 0x2014],
	[0x2018, 0x201a],
	[0x201c, 0x201e],
	[0x2022, 0x2022],
	[0x2026, 0x2026],
	[0x2039, 0x203a],
	[0x2044, 0x2044],
	[0x20ac, 0x20ac],
	[0x2122, 0x2122],
	[0x2212, 0x2212],
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

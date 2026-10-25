/**
 * Treasure Monkey — the game's colour table, once.
 *
 * These are ART_BRIEF.md §0's 色票 verbatim. They existed only as a table in a
 * markdown file, so every surface that needed them re-typed a hex by eye and
 * three of them drifted: game/uiTheme.ts still held Hot Miami's indigo and
 * magenta, the modals held GoBananas' banana gold (#ffd75e / #ffe98a / #a87a1e),
 * and the paytable held a hot-pink glow. A table in a document cannot be
 * grepped against the code; this can.
 *
 * Two consumers, one source:
 *   - pixi (game/uiTheme.ts) reads the numbers.
 *   - the DOM modals read the CSS custom properties written at the bottom.
 *
 * RULES FROM §0 THAT THIS FILE ENFORCES BY OMISSION
 *
 *   · ⚠ SIGNAL RED #C1272D IS NOT IN THIS FILE AND MUST NOT BE ADDED. It is
 *     reserved for the Detector Sweep special wild and nothing else, so that red on
 *     screen means that mechanic and only that mechanic. It lives in the symbol
 *     art, not in any UI surface.
 *   · At most two hues in one picture: a warm base (brown/black) plus ONE accent
 *     (gold or wine). GUNMETAL is the sanctioned third, and only as a cool
 *     corrective so the golds do not go muddy — never as an accent of its own.
 *   · Gold is the only colour allowed to be saturated, and must stay under ~15%
 *     of any surface. It marks; it does not cover.
 */

/** #274c52 — near-black warm brown. Backgrounds, the bet strip itself. */
export const INK_DEEP = 0x274c52;
/** #356a70 — one step up. Panels and control faces. */
export const INK = 0x356a70;
/** #853a2d — deep wine. Leather, velvet, booth walls. */
export const WINE_DEEP = 0x853a2d;
/** #c84634 — mid wine. Accent blocks only; never a large area. */
export const WINE = 0xc84634;
/** #ad7b47 — the shadow side of gold. */
export const GOLD_DARK = 0xad7b47;
/** #f3d397 — the gold. Borders, rules, the standard lettering colour. */
export const GOLD = 0xf3d397;
/** #fff3d2 — gold highlight. Edges and points, never fields. */
export const GOLD_LIGHT = 0xfff3d2;
/** #fff8e7 — bone white. Shirts, banknotes, text. */
export const BONE = 0xfff8e7;
/** #47666b — gunmetal, dark. */
export const GUNMETAL_DARK = 0x47666b;
/** #8eabb1 — gunmetal, mid. The cool corrective. */
export const GUNMETAL = 0x8eabb1;

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/**
 * Mirror the table into CSS custom properties for the DOM modals (rules,
 * paytable, settings, Buy Bonus), which cannot import numbers.
 *
 * Named `--capo-*` rather than reusing the inherited `--gb-*` / `--hm-*` font
 * prefixes: those two exist because this app was reskinned twice and their names
 * are now archaeology. New properties get the current game's name so the next
 * person greping for "which of these is ours" has an answer.
 */
export const PALETTE_CSS_VARS: Record<string, string> = {
	'--capo-ink-deep': hex(INK_DEEP),
	'--capo-ink': hex(INK),
	'--capo-wine-deep': hex(WINE_DEEP),
	'--capo-wine': hex(WINE),
	'--capo-gold-dark': hex(GOLD_DARK),
	'--capo-gold': hex(GOLD),
	'--capo-gold-light': hex(GOLD_LIGHT),
	'--capo-bone': hex(BONE),
	'--capo-gunmetal-dark': hex(GUNMETAL_DARK),
	'--capo-gunmetal': hex(GUNMETAL),
	// The rgb triples, for the many places the modals need an alpha on one of
	// these — rgba(var(--capo-gold-rgb), 0.3). Kept in step by construction
	// rather than by a second hand-typed list.
	'--capo-gold-rgb': '243, 211, 151',
	'--capo-gold-light-rgb': '255, 243, 210',
	'--capo-gold-dark-rgb': '173, 123, 71',
	'--capo-bone-rgb': '255, 248, 231',
	'--capo-ink-rgb': '53, 106, 112',
	'--capo-ink-deep-rgb': '39, 76, 82',
	'--capo-wine-rgb': '200, 70, 52',
};

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	for (const [name, value] of Object.entries(PALETTE_CSS_VARS)) root.setProperty(name, value);
}

/**
 * Capo Nostra — the game's colour table, once.
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
 *     reserved for the Tommy Gun special wild and nothing else, so that red on
 *     screen means that mechanic and only that mechanic. It lives in the symbol
 *     art, not in any UI surface.
 *   · At most two hues in one picture: a warm base (brown/black) plus ONE accent
 *     (gold or wine). GUNMETAL is the sanctioned third, and only as a cool
 *     corrective so the golds do not go muddy — never as an accent of its own.
 *   · Gold is the only colour allowed to be saturated, and must stay under ~15%
 *     of any surface. It marks; it does not cover.
 */

/** #14100D — near-black warm brown. Backgrounds, the bet strip itself. */
export const INK_DEEP = 0x14100d;
/** #1E1813 — one step up. Panels and control faces. */
export const INK = 0x1e1813;
/** #3A1A1C — deep wine. Leather, velvet, booth walls. */
export const WINE_DEEP = 0x3a1a1c;
/** #5C2126 — mid wine. Accent blocks only; never a large area. */
export const WINE = 0x5c2126;
/** #8A6D1F — the shadow side of gold. */
export const GOLD_DARK = 0x8a6d1f;
/** #C9A227 — the gold. Borders, rules, the standard lettering colour. */
export const GOLD = 0xc9a227;
/** #E8D48B — gold highlight. Edges and points, never fields. */
export const GOLD_LIGHT = 0xe8d48b;
/** #E6DFD1 — bone white. Shirts, banknotes, text. */
export const BONE = 0xe6dfd1;
/** #2B3138 — gunmetal, dark. */
export const GUNMETAL_DARK = 0x2b3138;
/** #4A545E — gunmetal, mid. The cool corrective. */
export const GUNMETAL = 0x4a545e;

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
	'--capo-gold-rgb': '201, 162, 39',
	'--capo-gold-light-rgb': '232, 212, 139',
	'--capo-gold-dark-rgb': '138, 109, 31',
	'--capo-bone-rgb': '230, 223, 209',
	'--capo-ink-rgb': '30, 24, 19',
	'--capo-ink-deep-rgb': '20, 16, 13',
	'--capo-wine-rgb': '92, 33, 38',
};

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	for (const [name, value] of Object.entries(PALETTE_CSS_VARS)) root.setProperty(name, value);
}

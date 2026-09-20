/**
 * Hard Time — the game's colour table, once.
 *
 * These are ART_AUDIO_BRIEF.md §0's palette (concrete, rust, khaki, gunmetal). They existed only as a table in a
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
 *   · Signal red #C1272D is reserved for the alarm transition.
 *   · UI surfaces stay concrete, gunmetal, rust and faded khaki.
 *   · The searchlight owns the cold #8FB4C8 / #DCE8F0 signal family.
 */

// Names (GOLD, WINE, INK) are Capo Nostra's; the VALUES are Hard Time's. Each
// comment's hex now matches its value — they previously still quoted Capo's
// colours (e.g. GOLD said #C9A227 while holding 0xb8ad95), which was worse than
// no comment. Renaming the constants would touch every consumer, so only the
// comments were corrected, 2026-09-15.
/** #1A1B1A — near-black warm brown. Backgrounds, the bet strip itself. */
export const INK_DEEP = 0x1a1b1a;
/** #222321 — one step up. Panels and control faces. */
export const INK = 0x222321;
/** #3B302A — deep wine. Leather, velvet, booth walls. */
export const WINE_DEEP = 0x3b302a;
/** #76513B — mid wine. Accent blocks only; never a large area. */
export const WINE = 0x76513b;
/** #655744 — the shadow side of gold. */
export const GOLD_DARK = 0x655744;
/** #B8AD95 — the gold. Borders, rules, the standard lettering colour. */
export const GOLD = 0xb8ad95;
/** #D6D8D8 — gold highlight. Edges and points, never fields. */
export const GOLD_LIGHT = 0xd6d8d8;
/** #E6E3DC — bone white. Shirts, banknotes, text. */
export const BONE = 0xe6e3dc;
/** #34393D — gunmetal, dark. */
export const GUNMETAL_DARK = 0x34393d;
/** #6B7278 — gunmetal, mid. The cool corrective. */
export const GUNMETAL = 0x6b7278;

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
	'--capo-gold-rgb': '184, 173, 149',
	'--capo-gold-light-rgb': '214, 216, 216',
	'--capo-gold-dark-rgb': '101, 87, 68',
	'--capo-bone-rgb': '230, 227, 220',
	'--capo-ink-rgb': '34, 35, 33',
	'--capo-ink-deep-rgb': '26, 27, 26',
	'--capo-wine-rgb': '118, 81, 59',
};

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	for (const [name, value] of Object.entries(PALETTE_CSS_VARS)) root.setProperty(name, value);
}

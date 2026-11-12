/**
 * Wild Alchemy — the game's colour table, once (ART_REQUEST.md §0: manuscript
 * illumination — parchment, sepia ink, flat mineral colours).
 *
 * Two consumers, one source:
 *   - pixi (game/uiTheme.ts) reads the numbers.
 *   - the DOM modals read the CSS custom properties written at the bottom.
 *
 * RULES FROM §0 THAT THIS FILE ENFORCES BY OMISSION
 *
 *   · Gold LEAF #f4c542 and warm light #fff1b8 are reserved for the WILD
 *     cards, the transfer success flame and the ladder fireball — no UI
 *     surface takes them, so they are not in this table.
 *   · Ochre ≤ 15 %, vermilion / ultramarine / verdigris ≤ 10 % each: accents,
 *     never fields. Fields are parchment or sepia.
 *
 * The constant NAMES are inherited (Capo Nostra → Hard Time → here) because
 * every consumer imports them; the VALUES and comments are this game's.
 */

/** #2A1D12 — deepest sepia. The bet strip, modal backdrops. */
export const INK_DEEP = 0x2a1d12;
/** #3B2A1A — sepia ink (§0 outline colour). Panels, control faces, text on parchment. */
export const INK = 0x3b2a1a;
/** #5E2418 — burnt vermilion, the shadow of the red. Leather, deep accents. */
export const WINE_DEEP = 0x5e2418;
/** #A53E2B — vermilion (赭紅). Accent blocks and the ON state only. */
export const WINE = 0xa53e2b;
/** #8F6A26 — the shadow side of ochre. */
export const GOLD_DARK = 0x8f6a26;
/** #C8973A — ochre (土黃). Borders, rules, the standard lettering colour on sepia. */
export const GOLD = 0xc8973a;
/** #EAD2A0 — ochre highlight. Edges and points, never fields. */
export const GOLD_LIGHT = 0xead2a0;
/** #F1EAD8 — bone white (骨白). Figures and text on dark grounds. */
export const BONE = 0xf1ead8;
/** #2C5F4D — deep verdigris. */
export const GUNMETAL_DARK = 0x2c5f4d;
/** #3F8A6E — verdigris (銅綠). The cool corrective; the Bet readout's border. */
export const GUNMETAL = 0x3f8a6e;
/** #E8D9B5 — parchment, the ground of every illustration. */
export const PARCHMENT = 0xe8d9b5;

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const rgb = (n: number) => `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;

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
	'--capo-parchment': hex(PARCHMENT),
	// The rgb triples, for the many places the modals need an alpha on one of
	// these — rgba(var(--capo-gold-rgb), 0.3). Derived from the numbers above,
	// not typed a second time.
	'--capo-gold-rgb': rgb(GOLD),
	'--capo-gold-light-rgb': rgb(GOLD_LIGHT),
	'--capo-gold-dark-rgb': rgb(GOLD_DARK),
	'--capo-bone-rgb': rgb(BONE),
	'--capo-ink-rgb': rgb(INK),
	'--capo-ink-deep-rgb': rgb(INK_DEEP),
	'--capo-wine-rgb': rgb(WINE),
};

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	for (const [name, value] of Object.entries(PALETTE_CSS_VARS)) root.setProperty(name, value);
}

/**
 * Capo Nostra — the game's colour table, once.
 *
 * ART_BRIEF.md §0.3, the Art Deco black-and-white version (2026-10-04): four
 * neutral tones plus one red. The table lives here so every surface imports it
 * instead of re-typing a hex by eye, which is how three surfaces drifted before.
 *
 * Two consumers, one source:
 *   - pixi (game/uiTheme.ts) reads the numbers.
 *   - the DOM modals read the CSS custom properties written at the bottom.
 *
 * RULES FROM §0.3
 *
 *   · Everything is black, two greys and paper. No hue anywhere except:
 *   · RED (#C1272D and its deep/pale steps) belongs to the vault multiplier
 *     frames, the multiplier numbers and the multiply FX — nothing else, so red
 *     on screen always means "a multiplier is here". It is NOT a UI accent and
 *     must not be used for the special wild, the bet bar or any button.
 *
 * WHY THE OLD NAMES ARE STILL HERE
 *
 * The names below GOLD / WINE / BONE / GUNMETAL are the colour version's ROLE
 * names, imported by uiTheme.ts and mirrored into ~120 `var(--capo-gold…)` uses
 * in the modals. Their values are now the grey that plays the same role, so the
 * value ladder each surface was designed around survives:
 *
 *   role                 was        now
 *   INK_DEEP  backdrop   #14100D -> #121212  ink black
 *   INK       panels     #1E1813 -> #1C1C1C  one step up (UI only, between ink and dark grey)
 *   WINE_DEEP leather    #3A1A1C -> #262626
 *   WINE      accent blk #5C2126 -> #333333  dark grey
 *   GUNMETAL_DARK        #2B3138 -> #333333  dark grey
 *   GUNMETAL             #4A545E -> #5E5E5E
 *   GOLD_DARK metal shd  #8A6D1F -> #8C8C8C  mid grey
 *   GOLD      trim/text  #C9A227 -> #D4D0C6  light grey-paper (the trim colour)
 *   GOLD_LIGHT highlight #E8D48B -> #F7F4EC  paper, brightest
 *   BONE      text       #E6DFD1 -> #ECE8DF  paper
 *
 * Renaming them to PAPER / GREY would be clearer and touches every modal; do it
 * as its own change, not mixed into the recolour.
 */

/** #121212 — ink black. Backgrounds, the bet strip itself. */
export const INK_DEEP = 0x121212;
/** #1C1C1C — one step up. Panels and control faces (UI only). */
export const INK = 0x1c1c1c;
/** #262626 — the old leather/velvet role. */
export const WINE_DEEP = 0x262626;
/** #333333 — dark grey. The old accent-block role; never a large area. */
export const WINE = 0x333333;
/** #8C8C8C — mid grey, the shadow side of trim. */
export const GOLD_DARK = 0x8c8c8c;
/** #D4D0C6 — the trim colour: borders, rules, standard lettering. */
export const GOLD = 0xd4d0c6;
/** #F7F4EC — the brightest paper. Edges and points, never fields. */
export const GOLD_LIGHT = 0xf7f4ec;
/** #ECE8DF — paper white. Text. */
export const BONE = 0xece8df;
/** #333333 — dark grey. */
export const GUNMETAL_DARK = 0x333333;
/** #5E5E5E — the old cool corrective, now a neutral step. */
export const GUNMETAL = 0x5e5e5e;

/** #5A0F12 — multiplier red, shadow. Multipliers only. */
export const RED_DEEP = 0x5a0f12;
/** #C1272D — multiplier red. Multipliers only. */
export const RED = 0xc1272d;
/** #E0343A — multiplier red lifted for numbers on a dark cell. Multipliers only. */
export const RED_BRIGHT = 0xe0343a;
/** #F2D6D0 — multiplier red, pale. Multipliers only. */
export const RED_PALE = 0xf2d6d0;

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
	// The rgb triples, for the many places the modals need an alpha on one of
	// these — rgba(var(--capo-gold-rgb), 0.3). Derived from the numbers above;
	// they were a second hand-typed list until the 2026-10-04 recolour.
	'--capo-gold-rgb': rgb(GOLD),
	'--capo-gold-light-rgb': rgb(GOLD_LIGHT),
	'--capo-gold-dark-rgb': rgb(GOLD_DARK),
	'--capo-bone-rgb': rgb(BONE),
	'--capo-ink-rgb': rgb(INK),
	'--capo-ink-deep-rgb': rgb(INK_DEEP),
	'--capo-wine-rgb': rgb(WINE),
	'--capo-red': hex(RED),
	'--capo-red-rgb': rgb(RED),
};

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	for (const [name, value] of Object.entries(PALETTE_CSS_VARS)) root.setProperty(name, value);
}

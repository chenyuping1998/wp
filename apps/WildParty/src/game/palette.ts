// Wild Party — "Neon Y2K Disco" palette.
//
// Every colour in this game comes from here. Before this file the game had no
// palette of its own: uiTheme.ts took the shared package's plum/gold defaults
// (which ARE declared as Wild Party's, so "the default" and "the brand" were the
// same thing), and the rest was hex literals scattered through components.
//
// The full rationale is in design/REDESIGN_NEON_Y2K.md. The short version:
// the two sibling games already own the warm halves of the spectrum — GoBananas
// jungle green/orange, Hot Miami pink/teal sunset — and old Wild Party's
// purple+gold is the most over-used combination in party-themed slots. So this
// palette is violet-black + magenta/lime/cyan, with LIQUID CHROME as the metal
// instead of gold.

// ---------------------------------------------------------------------------
// Grounds
// ---------------------------------------------------------------------------
export const INK = 0x0a0410; // canvas floor, outlines
export const NIGHT = 0x12061e; // background base, board floor
export const VIOLET_DEEP = 0x1e0b36; // panels, alternating cell tint
export const VIOLET_MID = 0x31145a; // raised UI surfaces

// ---------------------------------------------------------------------------
// The three neon accents.
//
// Discipline: one symbol gets ONE of these as its dominant hue, plus white
// highlight and the outline. No fourth colour. This is the whole reason Hot
// Miami's symbols stay separable on a full board and old Wild Party's did not.
// ---------------------------------------------------------------------------
export const MAGENTA = 0xff2d95; // Wild, L1 (A), primary CTA
export const LIME = 0xb6ff3d; // Scatter, L3 (Q), free-game state
export const CYAN = 0x22e4ff; // L2 (K), L4 (J), anticipation
export const VIOLET_NEON = 0xa96bff; // L4 (J) only — the fourth letter needs its own hue

// ---------------------------------------------------------------------------
// Liquid chrome.
//
// Chrome is not a colour, it is an ordered set of gradient stops, and every
// chrome surface in the game shares this one set so the whole game reads as the
// same metal. The stop at 0.55 is the important one: real metal reflects a
// bright sky above and a dark ground below, and that dark horizon band across
// the middle is what separates chrome from silver plastic. Drop it and the
// symbols go cheap immediately.
// ---------------------------------------------------------------------------
export const CHROME_STOPS: [number, number][] = [
	[0.0, 0xffffff],
	[0.18, 0xd8e6ff],
	[0.42, 0x7b8fc7],
	[0.55, 0x2a3355], // dark horizon band — do not remove
	[0.68, 0xc9b6ff], // reflected violet (environment)
	[0.86, 0xff9ad5], // reflected magenta (environment)
	[1.0, 0xffffff],
];

// Single-colour stand-ins for places that cannot take a gradient (a 1px border,
// a tint). Picked from the stops above rather than invented.
export const CHROME_LIGHT = 0xd8e6ff;
export const CHROME_MID = 0x7b8fc7;
export const CHROME_DARK = 0x2a3355;

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------
export const WHITE_HOT = 0xffffff;
export const OUTLINE = INK; // deliberately not pure black — carries a violet cast

// Gold is demoted to a RARE colour: it appears only on win amounts and win
// banners, nowhere in the chrome UI. That turns "gold on screen" into a
// learnable signal that the player just won something, instead of decoration.
export const GOLD_ACCENT = 0xffc94d;

// ---------------------------------------------------------------------------
// Each symbol's dominant hue, keyed by its static asset key.
//
// The win animation used to ring every symbol in the same gold, which threw away
// the one thing this palette works hardest to establish: that a symbol IS its
// colour. Lighting a winning Q in lime and a winning K in cyan makes the win
// read as coming from that symbol rather than from a generic effect layer.
//
// H1 is chrome, which has no hue — it takes the cool white from the chrome
// stops so its glow still reads as reflected light rather than a tint.
// ---------------------------------------------------------------------------
export const SYMBOL_NEON: Record<string, number> = {
	wpH1: CHROME_LIGHT,
	wpH2: MAGENTA,
	wpH3: MAGENTA,
	wpH4: CYAN,
	wpL1: MAGENTA,
	wpL2: CYAN,
	wpL3: LIME,
	wpL4: VIOLET_NEON,
	wpW: MAGENTA,
	wpS: LIME,
};

export const symbolNeon = (assetKey: string) => SYMBOL_NEON[assetKey] ?? WHITE_HOT;

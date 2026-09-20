// ── NAVY AND BRASS: the bet bar and the menus ────────────────────────────────
//
// The captain's coat. Navy cloth with brass buttons is the oldest colour pairing
// at sea — it is what a ship's bridge, an officer's uniform and this game's own
// mascot are made of — and it is already the two materials the rest of the game
// uses: the container steel the symbols are stencilled on, and the brass of the
// reel housing, the win plaques and the ship's-wheel Buy Bonus.
//
// This replaces Hacksaw's neutral grey with their one accent, #4ace4a. That green
// was the loudest colour on the strip and the only thing on screen that belonged
// to a different product: nothing in a dockside game is lime.
//
// ── THE RULE ─────────────────────────────────────────────────────────────────
//
//   NAVY AND STEEL ARE THE SHIP. BRASS IS WHAT YOU TOUCH AND WHAT YOU WIN.
//
// The casing, every panel, every idle round control and every structural line is
// navy or steel. Brass is spent on exactly four things: the spin button, a toggle
// that is ON, the Win readout, and the Buy Bonus wheel. So the warm colour on the
// bar always answers one of two questions — "what do I press" or "what did I get"
// — and a player learns that within a few spins without being told.
//
// Frostline states the same rule for its own palette (structural = cold, amounts
// = gold). Boat's version adds the controls to the warm side, because a brass
// button is a real object on a ship and an ice button is not.
//
// ── EVERY NUMBER HERE WAS MEASURED ───────────────────────────────────────────
//
// WCAG contrast ratios, computed, not eyeballed. The ones that decided anything:
//
//   spin disc vs the WHITE arrow on it           (the arrow colour is hard-coded
//                                                 in ButtonBetSpinIcon — this is
//                                                 the constraint that chose it)
//     #4ace4a  platform green     2.06
//     #d8a334  BRASS              2.28   the natural brass, and too pale
//     #b8811d                     3.39
//     #a8741a  SPIN_BRASS         4.06   <- twice the green it replaces, and still
//                                           reads as brass rather than bronze
//     #8a5c14                     5.80   reads as brown, not metal
//
//   spin disc vs the navy bar                    SPIN_BRASS  4.10
//     so the button stands out of the strip at least as clearly as the arrow
//     stands out of the button.
//
//   hairlines, which render at about 1px on this bar's scale and need contrast
//   to exist at all:
//     STEEL_EDGE on HULL   3.66   the casing and the round controls' rings
//     STEEL_DIM  on HULL   2.29   the quiet readouts — deliberately lower, see
//                                 the three-step order in uiTheme.ts
//     BRASS_EDGE on HULL   4.90   the Win readout's rim
//
//   text:
//     CREAM on PANEL     12.05   values. Cream and not white: pure white on navy
//                                is 15.3 and glares, and this is text a player
//                                reads hundreds of times a session. The eye
//                                settles on warm off-white; it is the same cream
//                                the low symbols are stencilled in.
//     STEEL_TEXT on PANEL 6.05   labels. Quiet on purpose — BALANCE / WIN / BET
//                                are read once and then recognised by position.
//     BRASS_TEXT on PANEL 7.28   the Win label.
//
// The CSS in components/ui/Modals.svelte uses these same values as hex literals
// — CSS cannot import this file. Change one here, change it there.

/** The strip itself. Night-water navy, a shade off black. */
export const HULL = 0x122029;
/** Readout plates and modal panels: one step up from the hull. */
export const PANEL = 0x172733;
/** Round controls at rest. Darker than the hull, so they sit IN it. */
export const DISC = 0x0b141b;

/** Casing hairline and the round controls' rings. Container steel. */
export const STEEL_EDGE = 0x5b7a8f;
/** Quieter steel for the readouts that should not compete. */
export const STEEL_DIM = 0x3e5a6e;
/** Readout labels. */
export const STEEL_TEXT = 0x8fa6b8;

/** The spin button, and an ON toggle. See the table above. */
export const SPIN_BRASS = 0xa8741a;
/** The spin button's rim: polished edge on a deep brass disc. */
export const BRASS_RIM = 0xe8b545;
/** The Win readout's rim. */
export const BRASS_EDGE = 0xb8811d;
/** The Win label, and the brightest brass accent on the bar. */
export const BRASS_TEXT = 0xe8b545;
/** Thin lit accents: badge rings, fallback borders. */
export const BRASS_BRIGHT = 0xffd46b;
/** The spin button when it cannot be pressed: the same metal, unlit. */
export const BRASS_UNLIT = 0x4a3b1a;

/** Every value the player reads. */
export const CREAM = 0xece4cf;
/** Contours and shadows under text. */
export const INK = 0x070d12;

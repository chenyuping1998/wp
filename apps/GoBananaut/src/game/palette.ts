// ── GUNMETAL AND ICE: the bet bar and the menus ──────────────────────────────
//
// The capsule's own materials. This game is set inside a low-gravity capsule
// whose housing is tarnished gunmetal, and the one thing in it that is ever
// SWITCHED ON is ice-cyan: the doubling wash on a stretched reel, the x2 plate,
// the lamp on the Buy Bonus wheel. Those are all "this is live", so the bar's
// live things take the same colour.
//
// This replaces Hacksaw's neutral grey with their one accent, #4ace4a. That
// green was the loudest colour on the strip and the only thing on screen that
// belonged to a different product: nothing aboard a capsule is lime.
//
// ── THE RULE ─────────────────────────────────────────────────────────────────
//
//   GUNMETAL IS THE CAPSULE. ICE IS WHAT IS LIVE — WHAT YOU PRESS AND WHAT YOU WIN.
//
// The casing, every panel, every idle round control and every structural line is
// gunmetal. Ice is spent on exactly four things: the spin button, a toggle that
// is ON, the Win readout, and the Buy Bonus wheel. So the cold bright colour on
// the bar always answers one of two questions — "what do I press" or "what did I
// get" — and a player learns that within a few spins without being told.
//
// NOT ORANGE, and not because it would not fit the bar. Hot orange is reserved
// for the Scatter and used by nothing else in the game (SYMBOL_PROMPTS.md: in
// this series a Scatter has been mistaken for a paying symbol three separate
// times). A spin button in the Scatter's colour is the fourth.
//
// ── EVERY NUMBER HERE WAS MEASURED ───────────────────────────────────────────
//
// WCAG contrast ratios, computed, not eyeballed. The ones that decided anything:
//
//   spin disc vs the WHITE arrow on it           (the arrow colour is hard-coded
//                                                 in ButtonBetSpinIcon — this is
//                                                 the constraint that chose it)
//     #4ace4a  platform green      2.06
//     #2a8faf                      3.72   too pale for the arrow
//     #1a7f9f  SPIN_ICE            4.58   <- more than twice the green it
//                                            replaces, and still reads as ice
//     #147089                      5.66   starts to read as teal
//     #0f6a83                      6.16   reads as a different colour altogether
//
//   spin disc vs the bar                         SPIN_ICE  3.75
//     so the button stands out of the strip about as clearly as the arrow stands
//     out of the button, without either being harsh.
//
//   hairlines, which render at about 1px on this bar's scale and need contrast
//   to exist at all:
//     STEEL_EDGE on HULL   3.78   the casing and the round controls' rings
//     STEEL_DIM  on HULL   2.33   the quiet readouts — deliberately lower, see
//                                 the three-step order in uiTheme.ts
//     ICE_EDGE   on HULL   6.98   the Win readout's rim
//
//   text:
//     CREAM      on PANEL 12.82   values. A cool off-white and not pure white:
//                                 white on this panel is 15.5 and glares, and
//                                 these are numbers a player reads hundreds of
//                                 times a session.
//     STEEL_TEXT on PANEL  6.30   labels. Quiet on purpose — BALANCE / WIN / BET
//                                 are read once and then recognised by position.
//     ICE_TEXT   on PANEL 10.87   the Win label.
//
//   the Buy Bonus caption:
//     INK on the wheel's stone   see design/generate_ui_plates.mjs — the disc is
//                                 the low symbols' own stone (#BEB8AB, sampled
//                                 off l1.png) and the caption is the dark ink
//                                 the letters on those tiles are carved in.
//
// The CSS in components/ui/Modals.svelte uses these same values as hex literals
// — CSS cannot import this file. Change one here, change it there.

/** The strip itself. Cold slate, a shade off black. */
export const HULL = 0x151c23;
/** Readout plates and modal panels: one step up from the hull. */
export const PANEL = 0x1c252e;
/** Round controls at rest. Darker than the hull, so they sit IN it. */
export const DISC = 0x0b1015;

/** Casing hairline and the round controls' rings. Brushed gunmetal. */
export const STEEL_EDGE = 0x62798a;
/** Quieter steel for the readouts that should not compete. */
export const STEEL_DIM = 0x44586a;
/** Readout labels. */
export const STEEL_TEXT = 0x93a8b7;

/** The spin button, and an ON toggle. See the table above. */
export const SPIN_ICE = 0x1a7f9f;
/**
 * The spin button's rim, and the ice everywhere it is lit. Deliberately the SAME
 * VALUE as the doubling wash in ReelGrow (DOUBLE_TINT) and the x2 plate: it is
 * one colour with one meaning, and two slightly different cyans on one screen
 * would say there were two.
 */
export const ICE_RIM = 0x8fe4ff;
/** The Win readout's rim. */
export const ICE_EDGE = 0x3fb2d4;
/** The Win label. */
export const ICE_TEXT = 0x8fe4ff;
/** Thin lit accents: badge rings, fallback borders. */
export const ICE_BRIGHT = 0xc4f1ff;
/** The spin button when it cannot be pressed: the same metal, unlit. */
export const ICE_UNLIT = 0x1f3f4c;

/** Every value the player reads. */
export const CREAM = 0xe6eaed;
/**
 * The low symbols' stone, sampled off l1.png (face median). The Buy Bonus wheel
 * is cut from this so the button and the reels are the same rock.
 */
export const STONE = 0xbeb8ab;
/** The Buy Bonus caption: dark engraved ink on that stone. */
export const STONE_INK = 0x141a1e;
/** Contours and shadows under text. */
export const INK = 0x05090c;

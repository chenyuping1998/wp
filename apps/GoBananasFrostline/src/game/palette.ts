/**
 * Go Bananas Frostline — the colour system, in one file.
 *
 * Go Bananas 100 had its palette scattered as bare hex literals across a dozen
 * components, which is why re-theming it means hunting. Everything this game
 * re-tints for the arctic front is named here instead, so the art pass that
 * follows changes values in one place and so the two rules below have somewhere
 * to be written down rather than being rediscovered.
 *
 * ── Rule 1: the board stays DARK ─────────────────────────────────────────────
 *
 * The obvious arctic move — white plates, white frame — is the one that breaks
 * the game. `design/GEN2_ART_SPEC.md` §2.1 hangs symbol recognition on five
 * saturated identity colours (h1 red, h2 green, h3 wood, h4 warm copper, scatter
 * gold) and §2.3 requires ≥30% average luminance separation between a symbol's
 * subject and its plate. Those colours only separate because they sit on a dark
 * ground. Move the ground to white and every one of them loses its contrast at
 * once.
 *
 * So: snow and sky belong to the BACKGROUND and the characters. The board goes
 * dark slate-blue — the same darkness Go Bananas 100 had in olive, moved round
 * the wheel and cooled off.
 *
 * ── Rule 2: gold is money, and only money ───────────────────────────────────
 *
 * Everything warm in the inherited palette split into two jobs it never
 * distinguished: the jungle theme (olive, amber, brass) and value (win amounts,
 * the scatter, multipliers). The theme half moves to ice. The value half stays
 * gold, on purpose — it is the one warm accent on a cold board, which makes
 * money the thing that catches the eye, and it keeps the scatter the single
 * gold object on the grid the way the art spec requires.
 *
 * A consequence worth stating: an FX colour is cold if it marks WHERE something
 * is happening (the tease column, the board ambience, a transition) and gold if
 * it marks WHAT WAS WON (win rings, the multiplier badge, prize coins).
 */

// ── the ground ──────────────────────────────────────────────────────────────
/** Board cell / plate ground. Was 0x1e290e, dark olive. */
export const ICE_PLATE = 0x1d2633;
/** One step darker, for panels that sit behind the plates. */
export const ICE_PLATE_DEEP = 0x141c27;
/** Darker still — the value plate's ground, which must not compete with art. */
export const ICE_PLATE_DEEPEST = 0x0d1420;

// ── the cold accents (theme, position, "something is happening here") ───────
/** Mid ice blue — borders, frames, the structural line of the UI. */
export const ICE_EDGE = 0x5fa8d8;
/** Bright ice — labels and the brighter of two nested strokes. */
export const ICE_BRIGHT = 0x8fd9ff;
/** Pale, nearly white-blue — the innermost highlight on a lit edge. */
export const ICE_HIGHLIGHT = 0xd8f0ff;
/** Deep glacier blue — glows, beams and anything additive. */
export const ICE_DEEP = 0x1e6fa8;
/** The cold wash laid over a teasing column. */
export const ICE_WASH = 0x2e7fb8;
/** Broken-ice blue, for debris and shards thrown by the transition blast. */
export const ICE_SHARD = 0x2b5f80;

// ── the warm accents (value, and nothing else) ──────────────────────────────
/** Win gold. Unchanged from Go Bananas 100 — see rule 2. */
export const GOLD = 0xffd75e;
/** Lighter gold, for the brighter pass of a two-tone gold edge. */
export const GOLD_BRIGHT = 0xffe98a;
/** Cream — gold type and icon fills. */
export const GOLD_PALE = 0xfff3bd;
/** Dark bronze, for outlining gold type against a light ground. */
export const GOLD_DARK = 0xd8a334;

// ── ink ─────────────────────────────────────────────────────────────────────
/**
 * The win line's underlay. Was 0x1a1206, a brown scorch mark, which was chosen
 * to read as a burn across the gold expanding-wild panel. A burn is the wrong
 * idea on this front; this is the shadow the line casts, in the board's own
 * darkness rather than in soot.
 */
export const LINE_SHADOW = 0x0b1220;
/** Near-black with a blue cast, for text strokes and drop shadows. */
export const INK = 0x0a1420;

/**
 * Every symbol whose win is a deforming mesh — every symbol that can win: the
 * four high pays, the five letters, the Wild and the Scatter — by the symbol id
 * the maths uses. WinWays draws a winning cell's popped copy through
 * SymbolMeshWin.svelte when its name is a key here.
 *
 * The method and the core (meshRig.ts) are GoBananubis's and GoBananasBoat's;
 * see wp/.claude/skills/mesh-cast-rig, "The same method on reel SYMBOLS".
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Kabuto';
import { H2 } from './h2Shuriken';
import { H3 } from './h3Bomb';
import { H4 } from './h4Fan';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { W } from './wNinja';
import { S } from './sBananas';
import { withLeap } from './leaps';
import { LANDS } from './lands';
import { IDLES } from './idles';
import { splitOf } from './splitRig';

// every win blends home at the end, so the swap back to the static tile is
// seamless (meshRig.settled); the high pays and the Scatter leap (leaps.ts)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S }).map(([k, spec]) => [k, settled(withLeap(spec))]),
);

/** the landings — what each symbol does when its reel stops (lands.ts) */
export const MESH_LANDS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(LANDS).map(([k, spec]) => [k, settled(spec)]),
);

/** the idle acts between spins (idles.ts), by symbol id */
export const MESH_IDLES: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(IDLES).map(([k, spec]) => [k, settled(spec)]),
);
export { IDLE_WEIGHT } from './idles';

/** the SPLIT tiles' wins (splitRig.ts): the katana's cut cell, its symbol twice
 *  — by the BASE symbol id; drawn from h1s_* etc. */
export const MESH_SPLIT: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W })
		.map(([k, spec]) => [k, splitOf(spec)] as const)
		.filter((e): e is readonly [string, MeshWinSpec] => !!e[1])
		.map(([k, spec]) => [k, settled(spec)]),
);

/** for the gate: the split wins by their own ids (H1S ...) */
export const MESH_EXTRA: Record<string, MeshWinSpec> = Object.fromEntries(Object.values(MESH_SPLIT).map((s) => [s.symbol, s]));

/** the longest beat, so the board holds long enough for every act to finish */
export const MESH_WIN_MAX_MS = Math.max(...Object.values(MESH_WINS).map((s) => s.durationMs));

export type { MeshWinSpec } from './meshRig';
export { AMP_MAX } from './meshRig';

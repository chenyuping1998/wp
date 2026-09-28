/**
 * Every symbol whose win is a deforming mesh — every symbol that can win: the
 * four high pays, the five letters, the Wild and the Scatter — by the symbol
 * id the maths uses. WinWays draws a winning cell's popped copy through
 * SymbolMeshWin.svelte when its name is a key here.
 *
 * The method and the core (meshRig.ts) are GoBananubis's; see
 * wp/.claude/skills/mesh-cast-rig, "The same method on reel SYMBOLS".
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Helmet';
import { H2 } from './h2Mine';
import { H3 } from './h3Lantern';
import { H4 } from './h4Flags';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { W } from './wCaptain';
import { S } from './sScatter';
import { LANDS } from './lands';
import { M } from './mReveal';
import { BG_PATCHES } from './bgPatches';
import { withLeap } from './leaps';

// every win blends home at the end, so the swap back to the static tile is
// seamless (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	// the high pays leap out of their cells (leaps.ts)
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S }).map(([k, spec]) => [k, settled(withLeap(spec))]),
);

/** the landings — what the high pays, the Scatter and the Wild do when their
 *  reel stops (lands.ts), by symbol id */
export const MESH_LANDS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(LANDS).map(([k, spec]) => [k, settled(spec)]),
);

/** the tarp coming off a crate (mReveal.ts) — not settled: it ends gone */
export const MESH_REVEAL: MeshWinSpec = M;

/** the moving background patches, by plate key (bgPatches.ts) */
export const MESH_BG: Record<string, MeshWinSpec[]> = BG_PATCHES;

/** the longest beat, so the board holds long enough for every act to finish */
export const MESH_WIN_MAX_MS = Math.max(...Object.values(MESH_WINS).map((s) => s.durationMs));

export type { MeshWinSpec } from './meshRig';
export { AMP_MAX } from './meshRig';

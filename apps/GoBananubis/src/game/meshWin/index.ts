/**
 * Every symbol whose win is a deforming mesh rather than a Spine clip — all
 * of the ones that can win — by the
 * symbol id the maths uses. Symbol.svelte routes a winning symbol here when its
 * name is a key; SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Scarab';
import { H2 } from './h2Eye';
import { H3 } from './h3Chest';
import { H4 } from './h4Ankh';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { W } from './wAnubis';
import { S } from './sScatter';
import { M } from './mSeal';
import { P } from './pCoin';

// every win blends home at the end, so the swap back to the static sprite is
// seamless (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S }).map(([k, spec]) => [k, settled(spec)]),
);

/**
 * Every symbol whose LANDING is a mesh: all of the above, and the two feature
 * symbols that never win on a line — M (the sealed tablet) and P (the
 * superspin coin). Symbol.svelte routes a landing here; a win only through
 * MESH_WINS, so a tablet or a coin can never be drawn as a line win.
 */
export const MESH_LANDS: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	M: settled(M),
	P: settled(P),
};

export type { MeshWinSpec } from './meshRig';

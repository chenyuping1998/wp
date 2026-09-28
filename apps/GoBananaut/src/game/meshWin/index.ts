/**
 * Every symbol whose win is a deforming mesh — all of the ones that can win in
 * a ways pay — by the symbol id the maths uses. Symbol.svelte routes a winning
 * symbol here when its name is a key; SymbolMeshWin.svelte draws it.
 *
 * These entries are not line wins:
 *   S_TRIGGER  the Scatter going off on the Free Spins trigger (Symbol.svelte
 *              picks it while stateGame.scatterTrigger is set)
 *   G          the grow marker letting go (ReelGrow draws it)
 *   C          the canister thrown to open the feature (TransitionAnimation)
 *   W_IDLE / S_IDLE  a Wild or Scatter acting while the board waits (IdleActors)
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Planet';
import { H2 } from './h2Comet';
import { H3 } from './h3Boot';
import { H4 } from './h4Pack';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { W, W_IDLE } from './wMonkey';
import { S, S_IDLE, S_TRIGGER } from './sLamp';
import { G } from './gMarker';
import { CANISTER_SPEC as C } from './cCanister';

// every win blends home at the end, so the swap back to the static sprite is
// seamless (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S, S_TRIGGER, G, C, W_IDLE, S_IDLE }).map(([k, spec]) => [k, settled(spec)]),
);

export type { MeshWinSpec } from './meshRig';

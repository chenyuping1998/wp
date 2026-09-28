/**
 * Every symbol whose win is a deforming mesh rather than the Spine clip, by the
 * symbol id the maths uses. Symbol.svelte routes a winning symbol here when its
 * name is a key; SymbolMeshWin.svelte draws it.
 *
 * The four high pays are CUT mode: the subject comes off its plate
 * (design/make_symbol_layers.mjs) and acts on it. The letters, the Wild and the
 * Scatter are not here yet — measured, their art does not separate from the
 * plate by colour the way these do (the letters are steel on slate, the gorilla
 * is grey fur on slate), so they need PANEL mode, which is the next batch.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Ushanka';
import { H2 } from './h2Flare';
import { H3 } from './h3Sled';
import { H4 } from './h4Lantern';

// every win blends home at the end, so the swap back to the static sprite is
// seamless (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4 }).map(([k, spec]) => [k, settled(spec)]),
);

export type { MeshWinSpec } from './meshRig';

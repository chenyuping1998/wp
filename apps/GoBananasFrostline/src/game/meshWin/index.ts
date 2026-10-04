/**
 * Every symbol whose win is a deforming mesh rather than the Spine clip, by the
 * symbol id the maths uses. Symbol.svelte routes a winning symbol here when its
 * name is a key; SymbolMeshWin.svelte draws it.
 *
 * The four high pays are CUT mode: the subject comes off its plate
 * (design/make_symbol_layers.mjs) and acts on it. The letters, the Wild and the
 * Scatter are PANEL mode (panelWins.ts): their art does not separate from the
 * slate by colour, so the frame stays nailed down and the inside is the mesh.
 *
 * MESH_LANDS is the same rigs on the LAND state (lands.ts): SymbolSprite plays
 * it in place of its whole-tile squash.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { LANDS } from './lands';
import { hopped } from './winHop';
import { IDLES } from './idles';
import { FREEZES, ROARS } from './freezes';
import { H1 } from './h1Ushanka';
import { H2 } from './h2Flare';
import { H3 } from './h3Sled';
import { H4 } from './h4Lantern';
import { L1, L2, L3, L4, L5, W, S } from './panelWins';
export { MESH_BG } from './bgPatches';
export { COIN } from './coinP';
export { COUNTER } from './counterPanel';
export { PILLAR } from './wxPillar';
export { SIGN } from './fsSign';
export { FRAME, REELS as FRAME_REELS } from './frameEdge';

// every win bounces ON THE PICTURE (winHop.ts — the tile stays put) and
// blends home at the end, so the swap back to the static sprite is seamless
// (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S }).map(([k, spec]) => [k, settled(hopped(spec))]),
);

// the landings blend home too: a reel that spins again mid-act is cut off by
// the blur anyway, but one that does not must hand back to the sprite exactly
export const MESH_LANDS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(LANDS).map(([k, spec]) => [k, settled(spec)]),
);

// the idle acts between spins (idles.ts), played by the idle director
export const MESH_IDLES: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(IDLES).map(([k, spec]) => [k, settled(spec)]),
);
export { IDLE_WEIGHT } from './idles';

// the reel freezing over in the free game (freezes.ts): each symbol flinches,
// chatters and stiffens as the frost reaches it, and the landed Wild roars
export const MESH_FREEZES: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(FREEZES).map(([k, spec]) => [k, settled(spec)]),
);
export const MESH_ROARS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(ROARS).map(([k, spec]) => [k, settled(spec)]),
);

// the Scatter's sway while the spin is still undecided (teases.ts). Not
// `settled`: it has no fixed end — teasePose blends it home when told to stop.
export { TEASES as MESH_TEASES, teasePose, teaseWeight, TEASE_HOME_MS, type TeaseSpec } from './teases';

export { AMP_MAX } from './meshRig';
export type { MeshWinSpec } from './meshRig';

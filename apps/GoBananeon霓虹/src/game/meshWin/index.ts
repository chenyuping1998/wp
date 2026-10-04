/**
 * Every symbol whose win is a deforming mesh, by the symbol id the maths uses.
 * Symbol.svelte routes a winning symbol here when its name is a key;
 * SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1, H2, H3, H4, W, S, L1, L2, L3, L4, L5 } from './neonSymbols';

// every win blends home at the end, so the swap back to the static sprite is
// seamless (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S } as Record<string, MeshWinSpec>).map(([k, spec]) => [k, settled(spec)]),
);

export type { MeshWinSpec } from './meshRig';

// The dynamite's LANDING (its win is unreachable: it is consumed by its own
// blast). Symbol.svelte routes a landing B here.
import { B_LAND } from './landB';
// …and the Scatter's (landS.ts), which lands harder with each one in the spin:
// MESH_LANDS.S is the first; Symbol.svelte picks the tier from S_LANDS.
import { S_LANDS as S_LANDS_RAW } from './landS';
export const S_LANDS: Record<1 | 2 | 3, MeshWinSpec> = {
	1: settled(S_LANDS_RAW[1]),
	2: settled(S_LANDS_RAW[2]),
	3: settled(S_LANDS_RAW[3]),
};
export const MESH_LANDS: Record<string, MeshWinSpec> = { B: settled(B_LAND), S: S_LANDS[1] };

// The swell every covered tile makes during a blast's CHARGE (BlastSwell.svelte),
// by symbol id. One generic rig; the dynamite's own cell trembles hardest.
import { swellSpec } from './swell';
const SWELL_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'S', 'B', 'X', 'P'];
export const SWELLS: Record<string, MeshWinSpec> = Object.fromEntries(
	SWELL_SYMBOLS.map((s) => [s, swellSpec(s, `gb${s}`, s === 'B')]),
);

// The big-win plaque (BannerMesh.svelte): one rig for all five tiers.
import { bannerSpec } from './banner';
export { bannerSpec };

// The props hanging in the backgrounds (BgProps.svelte).
import { BG_BASE, BG_FEATURE, BG_FEATURE_R } from './bgProps';
export { BG_BASE, BG_FEATURE, BG_FEATURE_R };

// The transition's dynamite (DynamiteMesh.svelte), the free-game sign
// (SignMesh.svelte) and the free-spin counter's plate (CounterMesh.svelte).
import { DYNAMITE, DYNAMITE_THROWN } from './dynamiteProp';
import { SIGN } from './fsSign';
import { COUNTER } from './fsCounter';
export { DYNAMITE, SIGN, COUNTER };

// The board frame's rails, bowing out over each blasted reel (BoardFrame.svelte).
import { FRAME } from './frameEdge';
export { FRAME };

// The held hold-and-spin coin (StickyPrizes.svelte).
import { COIN } from './coinP';
export { COIN };

// The settled board's idle acts (idles.ts), played by Symbol.svelte when the
// idle director (game/idleDirector.ts) picks the cell.
import { MESH_IDLES as MESH_IDLES_RAW, IDLE_WEIGHT } from './idles';
export const MESH_IDLES: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(MESH_IDLES_RAW).map(([k, spec]) => [k, settled(spec)]),
);
export { IDLE_WEIGHT };

/** Every mesh in the game, for design/check_mesh_wins.mjs: the gate holds all
 *  of them to the same rules, not just the wins. */
export const MESH_ALL: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	'B:land': MESH_LANDS.B,
	'S:land1': S_LANDS[1],
	'S:land2': S_LANDS[2],
	'S:land3': S_LANDS[3],
	'swell:H1': SWELLS.H1,
	'swell:B': SWELLS.B,
	// settled only for the gate's end-at-rest rule: in the game they never stop
	'bg:base': settled(BG_BASE),
	'bg:feature': settled(BG_FEATURE),
	'bg:featureR': settled(BG_FEATURE_R),
	banner: settled(bannerSpec('gbWinBannerEpic')),
	dynamite: settled(DYNAMITE),
	'dynamite:thrown': settled(DYNAMITE_THROWN),
	fsSign: settled(SIGN),
	fsCounter: settled(COUNTER),
	frameEdge: settled(FRAME),
	coinP: settled(COIN),
	...Object.fromEntries(Object.entries(MESH_IDLES).map(([k, spec]) => [`idle:${k}`, spec])),
};

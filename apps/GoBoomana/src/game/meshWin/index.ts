/**
 * Every symbol whose win is a deforming mesh, by the symbol id the maths uses.
 * Symbol.svelte routes a winning symbol here when its name is a key;
 * SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Lantern';
import { H2 } from './h2Crystal';
import { H3 } from './h3Picks';
import { H4 } from './h4Cart';
import { W } from './wMiner';
import { S } from './sBananas';
import { L1, L2, L3, L4, L5 } from './lowLetters';

// every win blends home at the end, so the swap back to the static sprite is
// seamless (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries({ H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S } as Record<string, MeshWinSpec>).map(([k, spec]) => [k, settled(spec)]),
);

export type { MeshWinSpec } from './meshRig';

// The dynamite's LANDING (its win is unreachable: it is consumed by its own
// blast). Symbol.svelte routes a landing B here.
import { B_LAND } from './landB';
export const MESH_LANDS: Record<string, MeshWinSpec> = { B: settled(B_LAND) };

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
import { BG_BASE, BG_FEATURE } from './bgProps';
export { BG_BASE, BG_FEATURE };

// The transition's dynamite (DynamiteMesh.svelte), the free-game sign
// (SignMesh.svelte) and the free-spin counter's plate (CounterMesh.svelte).
import { DYNAMITE, DYNAMITE_THROWN } from './dynamiteProp';
import { SIGN } from './fsSign';
import { COUNTER } from './fsCounter';
export { DYNAMITE, SIGN, COUNTER };

/** Every mesh in the game, for design/check_mesh_wins.mjs: the gate holds all
 *  of them to the same rules, not just the wins. */
export const MESH_ALL: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	'B:land': MESH_LANDS.B,
	'swell:H1': SWELLS.H1,
	'swell:B': SWELLS.B,
	// settled only for the gate's end-at-rest rule: in the game they never stop
	'bg:base': settled(BG_BASE),
	'bg:feature': settled(BG_FEATURE),
	banner: settled(bannerSpec('gbWinBannerEpic')),
	dynamite: settled(DYNAMITE),
	'dynamite:thrown': settled(DYNAMITE_THROWN),
	fsSign: settled(SIGN),
	fsCounter: settled(COUNTER),
};

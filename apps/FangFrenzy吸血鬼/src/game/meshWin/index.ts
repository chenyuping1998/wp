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
import { MUMMY_SYMBOLS } from './mummySymbols';
import { MUMMY_CUT } from './mummyActing';
import { L1, L2, L3, L4, L5 } from './lowLetters';

// every win blends home at the end, so the swap back to the static sprite is
// seamless (meshRig.settled)
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	// the high pays act cut off their plates (mummyActing.ts); W, S and the
	// letters stay in panel mode (mummySymbols.ts)
	Object.entries({ ...MUMMY_SYMBOLS, ...MUMMY_CUT }).map(([k, spec]) => [k, settled(spec)]),
);

export type { MeshWinSpec } from './meshRig';

// The Scatter's landing (landS.ts), which lands harder with each one in the spin:
// MESH_LANDS.S is the first; Symbol.svelte picks the tier from S_LANDS.
import { S_LANDS as S_LANDS_RAW } from './landS';
export const S_LANDS: Record<1 | 2 | 3, MeshWinSpec> = {
 1:settled({...MUMMY_SYMBOLS.S,durationMs:800,landMs:750}),
 2:settled({...MUMMY_SYMBOLS.S,durationMs:800,landMs:750}),
 3:settled({...MUMMY_SYMBOLS.S,durationMs:800,landMs:750}),
};
export const MESH_LANDS: Record<string, MeshWinSpec> = { S: S_LANDS[1] };

// The big-win plaque (BannerMesh.svelte): one rig for all five tiers.
import { bannerSpec } from './banner';
export { bannerSpec };

// The props hanging in the backgrounds (BgProps.svelte).
import { BG_BASE, BG_FEATURE } from './bgProps';
export { BG_BASE, BG_FEATURE };

// The free-game sign (SignMesh.svelte) and the free-spin counter's plate (CounterMesh.svelte).
import { SIGN } from './fsSign';
import { COUNTER } from './fsCounter';
export { SIGN, COUNTER };

// The board frame's rails, bowing out over each blasted reel (BoardFrame.svelte).
import { FRAME } from './frameEdge';
export { FRAME };

// The held hold-and-spin coin (StickyPrizes.svelte).
import { COIN } from './coinP';
export { COIN };

/** Every mesh in the game, for design/check_mesh_wins.mjs: the gate holds all
 *  of them to the same rules, not just the wins. */
export const MESH_ALL: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	'S:land1': S_LANDS[1],
	'S:land2': S_LANDS[2],
	'S:land3': S_LANDS[3],
	// settled only for the gate's end-at-rest rule: in the game they never stop
	'bg:base': settled(BG_BASE),
	'bg:feature': settled(BG_FEATURE),
	banner: settled(bannerSpec('gbWinBannerEpic')),
	fsSign: settled(SIGN),
	fsCounter: settled(COUNTER),
	frameEdge: settled(FRAME),
	coinP: settled(COIN),
};

/**
 * Every symbol whose win is a deforming mesh, by the symbol id the maths uses.
 * Symbol.svelte routes a winning symbol here when its name is a key;
 * SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Teapot';
import { H2 } from './h2Gaiwan';
import { H3 } from './h3Steamer';
import { H4 } from './h4Tray';
import { W } from './wMaster';
import { S } from './sLantern';
import { L1, L2, L3, L4, L5 } from './lowLetters';

// Each symbol acts through its OWN rig, traced on Jade Teahouse's paintings
// (2026-10-09): the card stays still and the painting (or the letter) leaps off
// it. Every win blends home at the end, so the swap back to the static sprite
// is seamless (meshRig.settled).
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	[H1, H2, H3, H4, W, S, L1, L2, L3, L4, L5].map((spec) => [spec.symbol, settled(spec)]),
);

/** the longest win act at normal speed: WinWays holds the board this long */
export const MESH_WIN_LONGEST_MS = Math.max(...Object.values(MESH_WINS).map((s) => s.durationMs));

export type { MeshWinSpec } from './meshRig';

// The landings (lands.ts): Symbol.svelte routes a landing symbol here.
import { MESH_LANDS, LAND_MS } from './lands';
export { MESH_LANDS, LAND_MS };

// The settled board's idle acts (idles.ts, run by game/idleDirector.ts).
import { IDLES, IDLE_WEIGHT } from './idles';
export { IDLES, IDLE_WEIGHT };

// The jade cup's collection beat (BanditCollect.svelte).
import { P_PICK, P_PICK_MS, pPickLift } from './pCup';
export { P_PICK, P_PICK_MS, pPickLift };

// The free-spin board's pendants (FreeSpinAnimation.svelte).
import { FG_BOARD, FG_BOARD_CANVAS } from './fgBoard';
export { FG_BOARD, FG_BOARD_CANVAS };

// The transition's curtain (TransitionAnimation.svelte).
import { NOREN } from './noren';
export { NOREN };

// The apprentice's cut-in in the meter's level-up (BanditMeter.svelte).
import { CUTIN } from './cutIn';
export { CUTIN };

// The Buy Bonus plate swinging on its ropes (BuyPlateMesh.svelte).
import { BUY_PLATE } from './buyPlate';
export { BUY_PLATE };

// The intro signboard's lantern (FeatureIntro.svelte).
import { LOGO_BOARD } from './logoBoard';
export { LOGO_BOARD };

// The things that hang and grow in the backgrounds (BgProps.svelte).
import { BG_PROPS, BG_PROPS_FEATURE } from './bgProps';
export { BG_PROPS, BG_PROPS_FEATURE };

/** Every mesh in the game, for design/check_mesh_wins.mjs: the gate holds all
 *  of them to the same rules, not just the wins. */
export const MESH_ALL: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	...Object.fromEntries(Object.entries(MESH_LANDS).map(([k, v]) => [`land:${k}`, v])),
	...Object.fromEntries(Object.entries(IDLES).map(([k, v]) => [`idle:${k}`, v])),
	'P:pick': P_PICK,
	// settled only for the gate's end-at-rest rule: in the game they never stop
	'fgBoard': settled(FG_BOARD('v8FgIntro')),
	noren: settled(NOREN),
	cutIn: settled(CUTIN),
	buyPlate: settled(BUY_PLATE('gbUiBuyBonusStone')),
	logoBoard: settled(LOGO_BOARD),
	...Object.fromEntries([...BG_PROPS, ...BG_PROPS_FEATURE.slice(0, 2)].map((spec) => [spec.symbol, settled(spec)])),
};

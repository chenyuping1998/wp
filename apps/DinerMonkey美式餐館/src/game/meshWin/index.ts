/**
 * Every symbol whose win is a deforming mesh, by the symbol id the maths uses.
 * Symbol.svelte routes a winning symbol here when its name is a key;
 * SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1, H2, H3, H4, W, S } from './dinerWins';
import { L1, L2, L3, L4, L5 } from './lowLetters';

// Each symbol acts through its OWN rig, traced on the Diner art (2026-10-09):
// the card stays still and the dish (or the letter) leaps off it. Every win
// blends home at the end, so the swap back to the static sprite is seamless
// (meshRig.settled).
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

// The order tray's collection beat (BanditCollect.svelte).
import { P_PICK, P_PICK_MS, pPickLift } from './pTray';
export { P_PICK, P_PICK_MS, pPickLift };

// The free-spin boards' bells, burgers and plates (FreeSpinAnimation.svelte).
import { FG_BOARD_DECOR, FG_BOARD_ALL, FG_BOARD_CANVAS } from './fgBoard';
export { FG_BOARD_DECOR, FG_BOARD_CANVAS };

// The big-win plaques' burgers, bells, shake, stars and laughing faces (Win.svelte).
import { WIN_DECOR, WIN_DECOR_ALL } from './winDecor';
export { WIN_DECOR };

// The lamps and the jukebox in the backgrounds (BgProps.svelte).
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
	...Object.fromEntries(FG_BOARD_ALL.map((spec) => [spec.symbol, settled(spec)])),
	...Object.fromEntries(WIN_DECOR_ALL.map((spec) => [spec.symbol, settled(spec)])),
	...Object.fromEntries(BG_PROPS.map((spec) => [spec.symbol, settled(spec)])),
};

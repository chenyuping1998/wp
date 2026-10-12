/**
 * Every symbol whose win is a deforming mesh, by the symbol id the maths uses.
 * Symbol.svelte routes a winning symbol here when its name is a key;
 * SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1, H2, H3, H4, W, S } from './pochaWins';
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

// The landings, the settled board's idle acts and the prize's collection beat
// (acts.ts, built from the win rigs above).
import { MESH_LANDS, LAND_MS, IDLES, IDLE_WEIGHT, P_PICK, P_PICK_MS, pPickLift } from './acts';
export { MESH_LANDS, LAND_MS, IDLES, IDLE_WEIGHT, P_PICK, P_PICK_MS, pPickLift };

// The things that hang and grow in the backgrounds (BgProps.svelte).
import { BG_PROPS } from './bgProps';
export { BG_PROPS };

// The big-win plaque (BannerMesh.svelte): one rig for all five tiers.
import { bannerSpec } from './banner';
export { bannerSpec };

// The free-game sign (SignMesh.svelte).
import { SIGN } from './fsSign';
export { SIGN };

// The things on the free-spin boards and the big-win plaques (decorMeshes.ts).
import { FG_BOARD_DECOR, WIN_DECOR, DECOR_ALL } from './decorMeshes';
export { FG_BOARD_DECOR, WIN_DECOR };

/** Every mesh in the game, for design/check_mesh_wins.mjs: the gate holds all
 *  of them to the same rules, not just the wins. */
export const MESH_ALL: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	...Object.fromEntries(Object.entries(MESH_LANDS).map(([k, v]) => [`land:${k}`, v])),
	...Object.fromEntries(Object.entries(IDLES).map(([k, v]) => [`idle:${k}`, v])),
	'P:pick': P_PICK,
	...Object.fromEntries(DECOR_ALL.map((spec) => [spec.symbol, settled(spec)])),
	// settled only for the gate's end-at-rest rule: in the game they never stop
	...Object.fromEntries(BG_PROPS.map((spec) => [spec.symbol, settled(spec)])),
	banner: settled(bannerSpec('gbWinBannerEpic')),
	fsSign: settled(SIGN),
};

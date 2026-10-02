/**
 * Every symbol whose win is a deforming mesh, by the symbol id the maths uses.
 * Symbol.svelte routes a winning symbol here when its name is a key;
 * SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';

// EMPTY ON PURPOSE (Go Banandit, 2026-10-01). Go Boomana's per-symbol rigs were
// cut to its lantern / crystal / pick / cart drawings by pixel coordinates; on
// the new screenprint art they would bend the wrong parts. Until each new symbol
// gets its own rig, every win falls through to SymbolWinAnim's generic move.
export const MESH_WINS: Record<string, MeshWinSpec> = {};

export type { MeshWinSpec } from './meshRig';

export const MESH_LANDS: Record<string, MeshWinSpec> = {};

// The big-win plaque (BannerMesh.svelte): one rig for all five tiers.
import { bannerSpec } from './banner';
export { bannerSpec };

// The free-game sign (SignMesh.svelte).
import { SIGN } from './fsSign';
export { SIGN };

/** Every mesh in the game, for design/check_mesh_wins.mjs: the gate holds all
 *  of them to the same rules, not just the wins. */
export const MESH_ALL: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	banner: settled(bannerSpec('gbWinBannerEpic')),
	fsSign: settled(SIGN),
};

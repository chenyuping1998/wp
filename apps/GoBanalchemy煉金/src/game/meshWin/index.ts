/**
 * Every symbol whose win is a deforming mesh, by the symbol id the maths uses.
 * Symbol.svelte routes a winning symbol here when its name is a key;
 * SymbolMeshWin.svelte draws it.
 */
import { settled, type MeshWinSpec } from './meshRig';
import { H1 } from './h1Lantern';
import { H2 } from './h2Crystal';
import { H3 } from './h3Tongs';
import { H4 } from './h4Cart';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { W } from './wGorilla';
import { S } from './sMedallion';
import { emphasizeWin } from './winEmphasis';
import { leapWin, LEAP_STYLES } from './leapWin';
import { boiling } from './potionBoil';

// Each symbol acts through its OWN rig, traced on Go Banalchemy's paintings
// (2026-10-04). Every win blends home at the end, so the swap back to the
// static sprite is seamless (meshRig.settled).
const SCORE_SPECS = [H1, H2, H3, H4, L1, L2, L3, L4, L5, W, S];
export const MESH_WINS: Record<string, MeshWinSpec> = Object.fromEntries(
	SCORE_SPECS.map((spec) => {
		// the cut ones leap off their plate (leapWin.ts); the Wild's portrait
		// fills its tile and acts inside it
		const style = LEAP_STYLES[spec.symbol];
		const loud = boiling(emphasizeWin(spec), 1);
		return [spec.symbol, settled(style ? leapWin(loud, style) : loud)];
	}),
);

export type { MeshWinSpec } from './meshRig';
export { W_BLINKS, blinkLid } from './wGorilla';

// The settled board's idle acts (idles.ts, run by game/idleDirector.ts).
import { IDLES, IDLE_WEIGHT } from './idles';
export { IDLES, IDLE_WEIGHT };

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
// A short internal reaction on reel stop. The same pinned art and joints as
// its win, with a gentle envelope; the slate/porcelain never lands as a board.
const QUIET_LANDS: Record<string, MeshWinSpec> = Object.fromEntries(
	Object.entries(Object.fromEntries(SCORE_SPECS.map((spec) => [spec.symbol, settled(boiling(spec, 0.45))])))
		.filter(([name]) => name !== 'S')
		.map(([name, spec]) => [
			name,
			{
				...spec,
				symbol: `${name}:land`,
				durationMs: 360,
				landMs: 99999,
				hitMs: 150,
				pose: (rig, t) => {
					const pose = spec.pose(rig, Math.max(0, t) * 2.2);
					const k = 0.55 * Math.sin(Math.PI * Math.max(0, Math.min(1, t / 360))) ** 2;
					for (const b of pose.bones) {
						b.angle *= k;
						b.dx *= k;
						b.dy *= k;
						b.along = 1 + (b.along - 1) * k;
						b.across = 1 + (b.across - 1) * k;
					}
					return pose;
				},
			} satisfies MeshWinSpec,
		]),
);
export const MESH_LANDS: Record<string, MeshWinSpec> = {
	...QUIET_LANDS,
	B: settled(B_LAND),
	S: S_LANDS[1],
};

// The swell every covered tile makes during a blast's CHARGE (BlastSwell.svelte),
// by symbol id. One generic rig; the dynamite's own cell trembles hardest.
import { swellSpec } from './swell';
const SWELL_SYMBOLS = [
	'H1',
	'H2',
	'H3',
	'H4',
	'L1',
	'L2',
	'L3',
	'L4',
	'L5',
	'W',
	'S',
	'B',
	'X',
	'P',
];
export const SWELLS: Record<string, MeshWinSpec> = Object.fromEntries(
	SWELL_SYMBOLS.map((s) => [s, swellSpec(s, `gb${s}`, s === 'B')]),
);

// The big-win plaque (BannerMesh.svelte): one rig for all five tiers.
import { bannerSpec } from './banner';
export { bannerSpec };

// The props hanging in the backgrounds (BgProps.svelte).
import { BG_BASE, BG_CLOTH, BG_CRYSTALS_FLOOR, BG_CRYSTALS_CORNER, BG_CRYSTALS_RIGHT, BG_COINS } from './bgProps';
export { BG_BASE, BG_CLOTH, BG_CRYSTALS_FLOOR, BG_CRYSTALS_CORNER, BG_CRYSTALS_RIGHT, BG_COINS };

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

/** Every mesh in the game, for design/check_mesh_wins.mjs: the gate holds all
 *  of them to the same rules, not just the wins. */
export const MESH_ALL: Record<string, MeshWinSpec> = {
	...MESH_WINS,
	...Object.fromEntries(Object.entries(QUIET_LANDS).map(([name, spec]) => [`land:${name}`, spec])),
	'B:land': MESH_LANDS.B,
	'S:land1': S_LANDS[1],
	'S:land2': S_LANDS[2],
	'S:land3': S_LANDS[3],
	'swell:H1': SWELLS.H1,
	'swell:B': SWELLS.B,
	// settled only for the gate's end-at-rest rule: in the game they never stop
	'bg:base': settled(BG_BASE),
	'bg:cloth': settled(BG_CLOTH),
	'bg:crystalsFloor': settled(BG_CRYSTALS_FLOOR),
	'bg:crystalsCorner': settled(BG_CRYSTALS_CORNER),
	'bg:crystalsRight': settled(BG_CRYSTALS_RIGHT),
	'bg:coins': settled(BG_COINS),
	banner: settled(bannerSpec('gbWinBannerEpic')),
	dynamite: settled(DYNAMITE),
	'dynamite:thrown': settled(DYNAMITE_THROWN),
	fsSign: settled(SIGN),
	fsCounter: settled(COUNTER),
	frameEdge: settled(FRAME),
	coinP: settled(COIN),
	...Object.fromEntries(Object.entries(IDLES).map(([k, v]) => [`idle:${k}`, v])),
};

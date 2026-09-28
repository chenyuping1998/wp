/**
 * P — THE SUPERSPIN COIN: a gold coin with a rope rim on a riveted plate, its
 * value written across its face. LAND ONLY — a coin never pays on a line; it
 * sticks and is tallied at the end.
 *
 * It lands like a COIN: a small drop, then it RINGS DOWN — tilting about its
 * upright axis faster and flatter each time, the way a coin settles on a
 * table (seen face on, a tilt is a narrowing) — with a ting of light and a
 * glint across the face.
 *
 * The value is drawn OVER the coin by Symbol.svelte, not baked into it, so it
 * has to ride the same face: `coinFace` is the one description of the wobble,
 * and both the mesh and the text read it (a number standing still on a coin
 * that rocks under it is a sticker, not a coin).
 *
 * PANEL mode (meshRig.panelParts); the plate barely moves. Its "win" is its
 * landing (the gate checks both through the same pose).
 */
import { bump, circle, landPose, panelParts, boneOf, smoothstep, type MeshWinSpec, type Rect } from './meshRig';

const INNER: Rect = [14, 14, 242, 242];
const COIN_AT: [number, number] = [128, 128];
const COIN = circle(COIN_AT, 94);
const LAND = 520;
const RING_FROM = 60, RING_TO = 460;

/** the coin's face at `t` ms into its landing: x scale and a small turn (deg,
 *  clockwise). Rest outside [RING_FROM, RING_TO]; continuous at both ends. */
export const coinFace = (t: number, k = 1) => {
	if (t <= RING_FROM || t >= RING_TO) return { across: 1, angle: 0 };
	const s = (t - RING_FROM) / 1000;
	const span = (RING_TO - RING_FROM) / 1000;
	// a chirp, 7 -> 19 Hz: the ring-down speeds up as it flattens
	const phase = 2 * Math.PI * (7 * s + (0.5 * (19 - 7) * s * s) / span);
	const env = Math.exp(-s / 0.15) * smoothstep((RING_TO - t) / 70);
	const amp = Math.min(k, 1.2);
	return {
		across: 1 - 0.18 * amp * env * (0.5 - 0.5 * Math.cos(phase)),
		angle: 2.5 * amp * env * Math.sin(phase / 2),
	};
};

export const P: MeshWinSpec = {
	symbol: 'P',
	key: 'gbP',
	sprite: 'gbP',
	mode: 'panel',
	feetY: INNER[3],
	durationMs: LAND,
	landMs: 40,
	hitMs: 60,
	landDuration: LAND,
	landLight: true,
	// riveted steel: the plate hardly gives; the coin does the acting
	landDepth: 0.04,
	landSpread: 0.01,
	landRebound: 0.008,
	inked: (p) => COIN(p) === 0,
	// gold (chroma ~170) against grey steel (~15)
	inkColor: (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 90,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		// wide: the coin narrowing by up to a fifth puts all its change of width
		// into the band round the rim, and at 4px that band stretched to 172%
		soft: 10,
		parts: [
			...panelParts(INNER),
			// axis [1, 0]: `along` is the coin's width
			{ name: 'coin', parent: 'panel', pivot: COIN_AT, axis: [1, 0], priority: 1, dist: COIN },
		],
	},
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		coin: { pos: 3.2, neg: 3.2 },
	},
	land: (rig, t, k, pose) => {
		const face = coinFace(t, k);
		const coin = boneOf(rig, pose, 'coin');
		coin.along = face.across;
		coin.angle = face.angle;
		// the ting, and a glint across the face as it settles
		pose.flash = 0.4 * Math.min(1, k) * bump(t, 30, 220);
		pose.sheen = t >= 140 && t <= 440 ? (t - 140) / 300 : -1;
	},
	pose: (rig, t) => landPose(P, rig, t, 1),
};

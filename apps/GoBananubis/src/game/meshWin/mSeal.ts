/**
 * M — THE SEALED TABLET, the free game's mystery symbol: a parchment slab with
 * a black wax seal stamped with the Eye. LAND ONLY — it never pays on a line;
 * MysteryReveal cracks it open. Its landing was the last whole-tile squash on
 * the board, on the one symbol the whole feature is about.
 *
 * It lands like a SLAB: a deeper squash than the other panels, almost no
 * rebound, a puff of dust. The wax takes the blow a beat after the stone —
 * pressed flat, then it springs back proud and rings down, the way a stamp
 * does — and the Eye flares gold as it does, so each sealed tablet arriving
 * reads as something waking up rather than a tile arriving.
 *
 * PANEL mode (meshRig.panelParts). Its "win" is its landing (the gate checks
 * both through the same pose).
 */
import { boneOf, bump, circle, flick, landPose, panelParts, type MeshWinSpec, type Rect } from './meshRig';

const INNER: Rect = [20, 20, 236, 236];
const SEAL_AT: [number, number] = [132, 126];
const SEAL = circle(SEAL_AT, 70);
const LAND = 440;

export const M: MeshWinSpec = {
	symbol: 'M',
	key: 'gbM',
	sprite: 'gbM',
	mode: 'panel',
	feetY: INNER[3],
	durationMs: LAND,
	landMs: 50,
	hitMs: 90,
	landDuration: LAND,
	landLight: true,
	landDust: 50,
	// it does not bounce: it is stone. Shallower than the default panel, not
	// deeper — at 0.13 the parchment's top corners tore away from the frame in
	// a V; the weight is the seal's to carry
	landDepth: 0.06,
	landRebound: 0.006,
	inked: (p) => SEAL(p) === 0,
	// the gold ring and the lapis Eye; the black wax (chroma ~5) is not
	inkColor: (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 70,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{ name: 'seal', parent: 'panel', pivot: SEAL_AT, axis: [0, -1], priority: 1, dist: SEAL },
		],
	},
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		seal: { pos: 2, neg: 2 },
	},
	land: (rig, t, k, pose) => {
		const seal = boneOf(rig, pose, 'seal');
		const press = bump(t, 40, 130);
		const ring = flick(t, 120, 6, 9);
		seal.along = 1 - 0.06 * k * press + 0.05 * k * ring;
		seal.across = 1 + 0.04 * k * press - 0.035 * k * ring;
		seal.angle = 1.5 * k * flick(t, 90, 4, 8);
		// the Eye opens
		pose.flash = 0.55 * Math.min(1, k) * bump(t, 80, 380);
	},
	pose: (rig, t) => landPose(M, rig, t, 1),
};

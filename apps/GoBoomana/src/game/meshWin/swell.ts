/**
 * THE SWELL — what a symbol does in the 380ms before the dynamite under it
 * goes off (ReelBlast's CHARGE beat, drawn by BlastSwell.svelte).
 *
 * The CHARGE used to darken the column and draw cracks over symbols that sat
 * perfectly still, so the explosion arrived with nothing building up to it.
 * Here each covered tile BULGES from its middle, as if the rock were being
 * pushed from inside, and trembles harder the closer the bang gets. It never
 * comes back down: at the bang the shards take over and the tile is gone.
 *
 * One generic rig for every symbol — the pressure is the rock's, not the
 * subject's — so there is nothing to author per symbol. The dynamite's own
 * cell trembles hardest (`strong`), because that is where the charge is.
 *
 * PANEL mode: the frame band holds, the middle swells into it. The pose runs
 * back to rest after CHARGE only so the gate's end-at-rest rule holds; the
 * player never sees that part, because the tile is replaced by the void first.
 */
import {
	circle,
	panelParts,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Rect,
	type Rig,
} from './meshRig';

/** must match ReelBlast's CHARGE_MS */
export const SWELL_MS = 380;
const INNER: Rect = [14, 14, 242, 242];
const C: [number, number] = [128, 128];

export const swellSpec = (symbol: string, sprite: string, strong = false): MeshWinSpec => ({
	symbol,
	key: sprite,
	sprite,
	mode: 'panel',
	feetY: INNER[3],
	durationMs: SWELL_MS + 240,
	landMs: 99999,
	hitMs: 99999,
	inked: () => true,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 24, rows: 24 },
		soft: 6,
		parts: [
			...panelParts(INNER),
			{
				name: 'core',
				parent: 'panel',
				pivot: C,
				axis: [0, -1],
				priority: 1,
				dist: circle(C, 60),
				// full in the middle, handing back to the panel toward the rim, so
				// the tile bulges like a dome rather than scaling as a flat card
				keep: (p) => smoothstep((104 - Math.hypot(p[0] - C[0], p[1] - C[1])) / 48),
			},
		],
	},
	limits: { panel: { pos: 0.5, neg: 0.5 }, core: { pos: 0.5, neg: 0.5 } },
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		// builds with the fuse: slow at first, fastest just before the bang
		const build = t <= SWELL_MS ? smoothstep(t / SWELL_MS) ** 1.4 : 1 - smoothstep((t - SWELL_MS) / 220);
		const k = strong ? 1.6 : 1;
		const core = pose.bones[rig.bones.findIndex((b) => b.name === 'core')];
		core.along = 1 + 0.075 * k * build;
		core.across = 1 + 0.075 * k * build;
		// A tremble that is not a sine: two incommensurate waves per axis, 16-30Hz,
		// so it reads as rock straining rather than as a vibrating motor. (t is in
		// ms: the first pass wrote these as if it were seconds and got 150-330Hz
		// noise, which the gate's continuity check flagged as pops.)
		const shake = 1.4 * k * build;
		core.dx = shake * (Math.sin(t * 0.1) + 0.6 * Math.sin(t * 0.17 + 1.3));
		core.dy = shake * (Math.sin(t * 0.12 + 0.7) + 0.6 * Math.sin(t * 0.19 + 2.1));
		pose.flash = 0;
		return pose;
	},
});

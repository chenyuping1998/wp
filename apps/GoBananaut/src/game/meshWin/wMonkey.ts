/**
 * W — THE BANANAUT. The Wild is the game's own face, so it gets the most
 * character: the helmet pops off the cell, the monkey's face bobs inside the
 * visor a beat after the helmet (it is a head inside a shell, and it lags), and
 * the banana in its mouth WAGS — chomped up, flopping down, twice — trailing the
 * face on a spring of its own.
 *
 * The finer acting: the CHEEKS puff out on each chomp; the two EAR PODS (the
 * speaker boxes on the helmet's sides) pop outward on the jump and snap back on
 * the landing; and the light sweep is confined to the goggle lenses
 * (spec.sheenMask), where it reads as a glint off glass rather than a wipe over
 * the whole helmet.
 */
import { blob, bump, flick, polygon, polyline, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Rig, boneOf, landFlick } from './meshRig';

const T = { crouch: 110, rise: 290, fall: 640, land: 820, done: 1000 };
const FACE: Point = [128, 144];
const BANANA = polyline([[122, 184], [104, 204], [86, 226]], 10);
// the cheeks either side of the muzzle, and the helmet's two speaker pods
// (fastened along their inner edge)
const CHEEK_L: Point = [115, 160];
const CHEEK_R: Point = [173, 155];
const cheek = (name: string, c: Point, r: number) => ({
	name,
	parent: 'face',
	pivot: c,
	priority: 5,
	dist: (p: Point) => Math.max(0, Math.hypot(p[0] - c[0], p[1] - c[1]) - r),
	// full inside r, fading over the next 8: a cheek is only ~20px across
	keep: (p: Point) => smoothstep((r + 8 - Math.hypot(p[0] - c[0], p[1] - c[1])) / 8),
});
const POD_L = { box: [[30, 52], [74, 52], [74, 104], [30, 104]] as Point[], edge: 74 };
const POD_R = { box: [[190, 54], [228, 54], [228, 104], [190, 104]] as Point[], edge: 190 };
// the goggles' two lenses, for the glint
const lensMask = (p: Point) => smoothstep((1 - Math.hypot((p[0] - 142) / 48, (p[1] - 114) / 21)) / 0.25);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	feetY: 229,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 230,
	rig: {
		// finer than the first pass (46x48): the cheeks are ~20px across
		grid: { x0: 26, y0: 20, x1: 230, y1: 234, cols: 60, rows: 62 },
		soft: 4,
		parts: [
			{ name: 'core', pivot: [128, 229], dist: (p) => Math.min(14, blob([128, 128], 96, 102, 3)(p)) },
			{
				// the face in the visor: free in the middle, fading to the rim
				name: 'face',
				parent: 'core',
				pivot: [128, 196],
				axis: [0, -1],
				priority: 3,
				dist: blob(FACE, 52, 54, 2.2),
				keep: (p) => smoothstep((50 - Math.hypot(p[0] - FACE[0], (p[1] - FACE[1]) * 0.95)) / 16),
			},
			{
				name: 'banana',
				parent: 'face',
				pivot: [122, 184],
				axis: [-36, 42],
				priority: 6,
				dist: BANANA.dist,
				keep: (p) => smoothstep((BANANA.along(p) - 2) / 14),
			},
			cheek('cheek_l', CHEEK_L, 12),
			cheek('cheek_r', CHEEK_R, 10),
			{
				name: 'pod_l',
				parent: 'core',
				pivot: [POD_L.edge, 78],
				axis: [-1, 0],
				priority: 2,
				dist: polygon(POD_L.box),
				keep: (p) => smoothstep((POD_L.edge - p[0]) / 12),
			},
			{
				name: 'pod_r',
				parent: 'core',
				pivot: [POD_R.edge, 78],
				axis: [1, 0],
				priority: 2,
				dist: polygon(POD_R.box),
				keep: (p) => smoothstep((p[0] - POD_R.edge) / 12),
			},
		],
	},
	sheenMask: lensMask,
	// geometric (check_mesh_wins.mjs W --limits): face +8 -8.5   banana +7.5 -9
	limits: {
		face: { pos: 2, neg: 2 },
		banana: { pos: 5, neg: 6.5 },
		cheek_l: { pos: 0.5, neg: 0.5 },
		cheek_r: { pos: 0.5, neg: 0.5 },
		pod_l: { pos: 0.5, neg: 0.5 },
		pod_r: { pos: 0.5, neg: 0.5 },
	},
	// landing: the banana flops
	land: (rig, t, k, pose) => {
		const press = Math.max(0, track(t, [[0, 0], [70, 1, 'out'], [155, 0, 'out']]));
		boneOf(rig, pose, 'face').along = 1 - 0.06 * press * k;
		boneOf(rig, pose, 'cheek_l').across = 1 + 0.07 * press * k;
		boneOf(rig, pose, 'cheek_r').across = 1 + 0.07 * press * k;
		boneOf(rig, pose, 'banana').angle = -4 * k * landFlick(t, 40);
		boneOf(rig, pose, 'pod_l').dx = -2 * press * k;
		boneOf(rig, pose, 'pod_r').dx = 2 * press * k;
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const top = ramp(t, T.rise - 30, T.rise + 70) * (1 - ramp(t, T.fall - 100, T.fall));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.06, 'out'], [210, 0.96, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 1.07, 'out'], [930, 0.99], [T.done, 1]]),
			sy: track(t, [[0, 1], [T.crouch, 0.9, 'out'], [210, 1.03, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 0.9, 'out'], [930, 1.01], [T.done, 1]]),
			// a cheeky head-tilt, one way then the other, at the top
			rot: 5 * top * Math.sin((2 * Math.PI * (t - T.rise)) / 520),
			pop: 1 + 0.03 * air,
			dx: 0,
			dy: -6 * air,
		};

		// the face lags the helmet: sinks as it rises, bobs up as it lands
		const face = b('face');
		face.dy = 3 * flick(t, T.crouch + 40, 2.2, 3) - 2.5 * flick(t, T.land, 2.8, 4);
		face.dx = 1.5 * top * Math.sin((2 * Math.PI * (t - T.rise)) / 520);

		// the banana: chomped up (- lifts its tip), flops, chomped again
		const banana = b('banana');
		banana.angle = -6.2 * Math.max(0, flick(t, 200, 2.4, 2.4)) - 4.2 * Math.max(0, flick(t, 470, 2.4, 3)) + 3 * flick(t, T.land, 3, 4.5);
		banana.along = 1 + 0.05 * bump(t, 180, 360);

		// the cheeks puff on each chomp
		const puff = bump(t, 170, 330) + 0.75 * bump(t, 440, 600);
		for (const [name, k] of [['cheek_l', 1], ['cheek_r', 0.9]] as const) {
			const c = b(name);
			c.along = c.across = 1 + 0.1 * k * puff;
		}
		// the ear pods pop outward as it jumps and snap back in on the landing
		const pop = 4 * track(t, [[0, 0], [T.crouch, 0], [T.rise - 40, 1, 'back'], [T.land - 40, 0.9], [T.land + 40, 0, 'in']]) + 1.2 * flick(t, T.land + 40, 4, 6);
		b('pod_l').dx = -pop;
		b('pod_r').dx = pop;

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.3 * track(t, [[T.crouch, 0], [230, 1, 'out'], [600, 0, 'in']]);
		pose.sheen = t >= 330 && t <= 800 ? (t - 330) / 470 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 400) + 0.02 * bump(t, T.land, T.land + 150);
		return pose;
	},
};

/**
 * W_IDLE — the Bananaut waiting on the board (IdleActors.svelte picks one
 * idle W or S every few seconds). Quiet on purpose: two lazy chomps of the
 * banana and a small bob of the face in the visor, no flash, no sparks — a
 * sign of life, not a win.
 */
export const W_IDLE: MeshWinSpec = {
	...W,
	noLand: true,
	durationMs: 1100,
	landMs: 1100,
	// past the end: no sparks
	hitMs: 99999,
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		b('banana').angle = -4.5 * Math.max(0, flick(t, 120, 2.6, 3)) - 3.2 * Math.max(0, flick(t, 460, 2.6, 3.4));
		b('face').dy = 2.2 * Math.sin((Math.PI * t) / 900) * (t < 900 ? 1 : 0);
		// the cheeks fill with each lazy chomp, and the ear pods twitch once
		const puff = bump(t, 100, 300) + 0.7 * bump(t, 440, 640);
		b('cheek_l').along = b('cheek_l').across = 1 + 0.07 * puff;
		b('cheek_r').along = b('cheek_r').across = 1 + 0.06 * puff;
		const twitch = 2 * bump(t, 650, 850);
		b('pod_l').dx = -twitch;
		b('pod_r').dx = twitch;
		pose.rigid.pop = 1 + 0.012 * bump(t, 80, 700);
		return pose;
	},
};

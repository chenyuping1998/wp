/**
 * THE TRANSITION'S CURTAIN (sushiScene/noren.png, "玉茗茶樓") as a mesh.
 *
 * TransitionAnimation drops it from the lintel over the shutting doors and
 * swings it; as a sprite it was one stiff card. Here it is cloth:
 *
 *   - the body hangs from the rod (the rod row never moves) and is cut into
 *     overlapping vertical STRIPS with a wide soft blend, so lifting each a
 *     little on its own phase runs a wave along the scalloped hem;
 *   - the drop's stop and the doors' clack kick that wave hard, and it dies
 *     away into a slow breathing ripple while the doors are shut;
 *   - the five hem tassels and the two at the rod ends each hang on their own
 *     bone and swing a beat behind the cloth, the far ones further.
 *
 * Rig units are the art's own pixels (1920 x 420), measured 2026-10-09 from the
 * alpha: rod y 54..62, cloth to the hem at y ~240..260, hem tassels centred at
 * x 187 / 600 / 960 / 1320 / 1733 from y ~232 to ~345, end tassels x 13..71
 * and 1849..1907 from y ~62 to ~252.
 */
import { flick, polygon, restPose, smoothstep, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rig } from './meshRig';

export const NOREN_CANVAS: [number, number] = [1920, 420];

export type NorenEnv = {
	/** ms since the curtain started to drop, or < 0 before */
	dropT: number;
	/** ms since the doors clacked shut, or < 0 before */
	clackT: number;
};
export type NorenSpec = MeshWinSpec & { drive: (rig: Rig, env: NorenEnv) => Pose };

/** when the drop reaches the lintel (TransitionAnimation: 0.8 of SHUT_MS) */
export const NOREN_LAND_MS = 448;

const ROD_Y = 62;
const STRIPS = [150, 450, 780, 1140, 1470, 1770];
const STRIP_HALF = 150;
const HEM_TASSELS = [187, 600, 960, 1320, 1733];
const END_TASSELS: [string, number][] = [['endL', 42], ['endR', 1878]];

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

const parts = (): PartSpec[] => {
	const out: PartSpec[] = [
		// the rod and everything the cloth does not claim: still
		{ name: 'rod', pivot: [960, 58], dist: (p) => (p[1] < ROD_Y + 4 ? 0 : 30) },
	];
	STRIPS.forEach((cx, i) => {
		out.push({
			name: `strip${i}`,
			parent: 'rod',
			pivot: [cx, ROD_Y],
			axis: [0, 1],
			priority: 1,
			dist: (p) => Math.max(0, Math.abs(p[0] - cx) - STRIP_HALF),
			// hangs from the rod: nothing at the hem line, all of it by y 200
			keep: (p) => smoothstep((p[1] - ROD_Y - 6) / 130),
		});
	});
	const nearestStrip = (x: number) => STRIPS.reduce((b, cx, i) => (Math.abs(cx - x) < Math.abs(STRIPS[b] - x) ? i : b), 0);
	HEM_TASSELS.forEach((x, i) => {
		const shape = polygon([[x - 8, 226], [x + 8, 226], [x + 24, 300], [x + 26, 350], [x - 26, 350], [x - 24, 300]]);
		out.push({
			name: `tassel${i}`,
			parent: `strip${nearestStrip(x)}`,
			pivot: [x, 236],
			axis: [0, 1],
			priority: 3,
			dist: shape,
			keep: (p) => smoothstep((p[1] - 236) / 14),
		});
	});
	for (const [name, x] of END_TASSELS) {
		const shape = polygon([[x - 10, 64], [x + 10, 64], [x + 30, 160], [x + 32, 258], [x - 32, 258], [x - 30, 160]]);
		out.push({
			name,
			parent: 'rod',
			pivot: [x, 66],
			axis: [0, 1],
			priority: 3,
			dist: shape,
			keep: (p) => smoothstep((p[1] - 66) / 16),
		});
	}
	return out;
};

export const NOREN: NorenSpec = {
	symbol: 'noren',
	key: 'smNoren',
	sprite: 'smNoren',
	mode: 'panel',
	feetY: 420,
	durationMs: 2400,
	landMs: 99999,
	hitMs: 99999,
	// the cloth and the tassels: the air below the hem may bend freely
	inked: (p) => p[1] > ROD_Y + 4 && p[1] < 350 && p[0] > 10 && p[0] < 1910,
	rig: {
		canvas: NOREN_CANVAS,
		grid: { x0: 0, y0: 0, x1: 1920, y1: 420, cols: 128, rows: 28 },
		soft: 40,
		parts: parts(),
	},
	limits: {
		rod: { pos: 0, neg: 0 },
		...Object.fromEntries(STRIPS.map((_, i) => [`strip${i}`, { pos: 1, neg: 1 }])),
		...Object.fromEntries(HEM_TASSELS.map((_, i) => [`tassel${i}`, { pos: 14, neg: 14 }])),
		endL: { pos: 8, neg: 8 },
		endR: { pos: 8, neg: 8 },
	},
	drive: (rig, { dropT, clackT }) => {
		const pose = restPose(rig);
		if (dropT < 0) return pose;
		// the kicks: the drop stopping on the lintel, and the doors meeting
		const landK = (hz: number, d: number, lag = 0) => flick(dropT, NOREN_LAND_MS + lag, hz, d);
		const clackK = (hz: number, d: number, lag = 0) => (clackT < 0 ? 0 : flick(clackT, lag, hz, d));
		// the breathing ripple while it hangs, faded in after the landing
		const calm = smoothstep((dropT - NOREN_LAND_MS) / 600);
		STRIPS.forEach((_, i) => {
			const strip = bone(rig, pose, `strip${i}`);
			// a wave running along the hem: each strip a little later
			const lag = i * 55;
			strip.dy = HEM_LIFT * (landK(2.2, 2.6, lag) + 0.7 * clackK(2.6, 3, lag)) + 5 * calm * Math.sin(dropT / 260 - i * 0.9);
			// the cloth stretches a touch on the drop's stop
			strip.along = 1 + 0.03 * Math.max(0, -landK(2.2, 3, lag));
			strip.angle = 0.5 * clackK(2, 3, lag) * (i < STRIPS.length / 2 ? -1 : 1);
		});
		HEM_TASSELS.forEach((_, i) => {
			const side = i - 2 || (i % 2 ? 1 : -1) * 0.5;
			bone(rig, pose, `tassel${i}`).angle =
				TASSEL_DEG * (landK(1.6, 1.8, 90 + 40 * i) * (i % 2 ? 1 : -1) + 0.8 * clackK(1.8, 2, 80) * Math.sign(side)) +
				2 * calm * Math.sin(dropT / 340 + i * 1.3);
		});
		for (const [name] of END_TASSELS) {
			const side = name === 'endL' ? -1 : 1;
			bone(rig, pose, name).angle = side * (END_DEG * (Math.abs(landK(1.4, 1.6, 120)) + 0.7 * Math.abs(clackK(1.6, 2, 100))) + 1 * calm * (0.5 + 0.5 * Math.sin(dropT / 420)));
		}
		return pose;
	},
	pose: (rig, t) => NOREN.drive(rig, { dropT: t, clackT: t - 300 }),
};

// set from the measured limits
const HEM_LIFT = -18;
const TASSEL_DEG = 12;
const END_DEG = 7;

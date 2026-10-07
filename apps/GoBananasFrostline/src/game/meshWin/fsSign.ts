/**
 * THE FREE-GAME SIGN (gbFsSign) — the snow-capped board that drops in over the
 * reels for the intro and the outro — as a mesh. Go Bananas Boomana's fsSign,
 * in this game's material.
 *
 * FreeSpinAnimation.svelte drops the board with a back-out and swings it on
 * its container; as a sprite that was all it could do, a flat card that
 * stopped dead. Here what is ON the board answers the fall:
 *
 *   FALL     the snow along the top is dragged UP a little by the drop
 *   LAND     it slumps onto the board, spreads, and bounces back twice
 *   SHIVER   the icicles under it shake on the hit, a beat later than the snow
 *
 * The slate face and its ice rim never move — the text is drawn over them by
 * FreeSpinIntro/Outro, not through the mesh, and must stay legible.
 *
 * The snow's blend into the board runs ACROSS its base, which here is right:
 * the deformation is a vertical squash about that base line, the same at every
 * x, so the base itself moves nothing. (A hinged part is different — see
 * meshRig.hinge.)
 *
 * Normalised 256x256 canvas over the 1280x1002 art (PropMesh stretches it).
 * Measured on fs_sign.png as drawn by generate_fs_counter_frost.mjs --sign:
 * the drift runs y 90..270 px (units 23..69), the plate ends at 932 (238) and
 * the icicles hang below it to the canvas edge.
 */
import { bump, flick, polygon, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Pose, type Rig } from './meshRig';

export type SignEnv = {
	/** ms since the sign started to drop */
	t: number;
};
export type SignSpec = MeshWinSpec & { drive: (rig: Rig, env: SignEnv) => Pose };

const SNOW = polygon([[18, 18], [238, 18], [238, 70], [18, 70]]);
const ICICLES = polygon([[40, 237], [216, 237], [216, 256], [40, 256]]);
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** when the board lands, ms: FreeSpinAnimation's 700ms back-out crosses its
 *  rest at about 72% of its run */
const LAND = 500;

export const SIGN: SignSpec = (() => {
	const spec: SignSpec = {
		symbol: 'fsSign',
		key: 'gbFsSign',
		sprite: 'gbFsSign',
		mode: 'panel',
		feetY: 69,
		durationMs: 1700,
		landMs: 99999,
		hitMs: 99999,
		inked: (p: Point) => SNOW(p) === 0 || ICICLES(p) === 0,
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 32, rows: 48 },
			soft: 4,
			parts: [
				{ name: 'frame', pivot: [128, 128], dist: () => 12 },
				// pivot on the base the snow sits on, axis UP: `along` is its depth
				{
					name: 'snow',
					parent: 'frame',
					pivot: [128, 70],
					axis: [0, -1],
					priority: 2,
					dist: SNOW,
					keep: (p) => smoothstep((72 - p[1]) / 16),
				},
				// pivot on the board's bottom edge, axis DOWN: `along` is their length
				{
					name: 'icicles',
					parent: 'frame',
					pivot: [128, 237],
					axis: [0, 1],
					priority: 2,
					dist: ICICLES,
					keep: (p) => smoothstep((p[1] - 234) / 6),
				},
			],
		},
		limits: { snow: { pos: 0.5, neg: 0.5 }, icicles: { pos: 0.5, neg: 0.5 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const t = env.t;
			if (t < 0) return pose;
			const s = bone(rig, pose, 'snow');
			const i = bone(rig, pose, 'icicles');
			// dragged up by the fall, slumped by the hit, two bounces home
			s.along =
				1 +
				track(t, [[0, 0], [260, 0.05, 'out'], [LAND, 0.02], [LAND + 70, -0.12, 'out'], [LAND + 200, 0.04, 'out'], [LAND + 340, -0.015, 'out'], [LAND + 520, 0, 'out']]);
			s.across = 1 + 0.03 * bump(t, LAND, LAND + 300);
			// the icicles shiver a beat after the snow takes the hit
			// a spring decays but never reaches zero, so it is faded out before the
			// beat ends: the board is handed back to the static sprite exactly on
			// the drawing, which the gate checks to the thousandth of a pixel
			const home = 1 - ramp(t, 1300, 1600);
			i.along = 1 + 0.08 * home * flick(t, LAND + 60, 6, 6) + 0.05 * bump(t, LAND + 40, LAND + 240);
			i.across = 1 - 0.03 * bump(t, LAND + 40, LAND + 260);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t }),
	};
	return spec;
})();

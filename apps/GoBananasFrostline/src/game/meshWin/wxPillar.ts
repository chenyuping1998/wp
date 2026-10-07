/**
 * THE EXPANDING WILD'S ICE PILLAR (wx.png), drawn through a mesh.
 *
 * It was a flat sprite that grew in height as the panel arrived and then sat
 * dead still for the rest of the feature, while the one number on it — the
 * multiplier — climbed. Now the two things painted inside the ice answer what
 * happens to the reel, and the ice frame itself never moves:
 *
 *   ARRIVAL   the gorilla is set down hard as the panel slams open — a squash
 *             on his feet, the way every subject in this game lands
 *   SURGE     each time the multiplier grows he swells (chest out, a beat
 *             taller) and the WILD lettering pops — the growth reads on the
 *             art, not only on the badge
 *   WIN       the lettering shimmers once when the locked reel pays
 *   LOCKED    a slow breath, so a reel held for the whole feature reads as
 *             alive rather than as a sticker
 *
 * The canvas is normalised 256x256 (PropMesh stretches it to the reel, so one
 * unit is ~0.46px across and ~2.3px down). That anisotropy is why there is no
 * ROTATION here at all: a turn in a canvas stretched 5:1 shears. Everything
 * is scale and lift, which a non-uniform stretch carries through unchanged.
 *
 * Regions measured off wx.png (464x2320): the gorilla stands in the top 28%
 * (normalised y 3..72), the stacked WILD runs 29..58% (y 74..149), and the
 * bottom 40% is plain ice, kept quiet for the multiplier badge.
 */
import {
	bump,
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';

export type PillarEnv = {
	/** the banner tween: 0 -> 1 (with overshoot) as the panel is thrown open */
	banner: number;
	/** the multiplier surge envelope, 0..1 */
	surge: number;
	/** the win flash, 0..1 */
	win: number;
	/** ms, free-running while the reel is locked — the breath */
	clock: number;
};
export type PillarSpec = MeshWinSpec & { drive: (rig: Rig, env: PillarEnv) => Pose };

const GORILLA = polygon([[20, 4], [236, 4], [236, 73], [20, 73]]);
const LETTERS = polygon([[54, 74], [202, 74], [202, 150], [54, 150]]);
const depth = (x0: number, y0: number, x1: number, y1: number, p: Point) =>
	Math.min(p[0] - x0, x1 - p[0], p[1] - y0, y1 - p[1]);
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** How far into the slam the banner is: 0 before, peaking on the way, and
 *  EXACTLY 0 at b = 1 — the value the banner rests at. The banner tween eases
 *  out with an overshoot past 1, and a slam that was still non-zero at 1 would
 *  hold the gorilla squashed for the rest of the feature. Past 1 it is 0. */
const slam = (b: number) => (b <= 0.55 || b >= 1 ? 0 : Math.sin((Math.PI * (b - 0.55)) / 0.45));

export const PILLAR: PillarSpec = (() => {
	const spec: PillarSpec = {
		symbol: 'wxPillar',
		key: 'gbWxPanel',
		sprite: 'gbWxPanel',
		mode: 'panel',
		feetY: 73,
		durationMs: 2100,
		landMs: 99999,
		hitMs: 99999,
		inked: (p: Point) => GORILLA(p) === 0 || LETTERS(p) === 0,
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 24, rows: 64 },
			soft: 4,
			parts: [
				// the ice: owns everything not claimed below, and never moves
				{ name: 'frame', pivot: [128, 128], dist: () => 12 },
				// He stands on the ice at y 73; that is his pivot, so a squash
				// presses him onto his feet rather than about his middle. His fade
				// is wider DOWN than across — one unit across is a fifth of one
				// down on screen, and the gate measures in canvas units.
				{
					name: 'gorilla',
					parent: 'frame',
					pivot: [128, 73],
					axis: [0, -1],
					priority: 2,
					dist: GORILLA,
					keep: (p) => smoothstep(depth(20, 4, 236, 73, p) / 14),
				},
				// Pivot on the lettering's TOP edge, growing DOWN. The gorilla's feet
				// (y 73) sit one unit above the W (y 74): a pivot in the middle, or a
				// lift, pushed the W into that seam and folded a triangle to 28%. The
				// plain ice below the D has room to give; the seam above has none.
				{
					name: 'letters',
					parent: 'frame',
					pivot: [128, 74],
					axis: [0, 1],
					priority: 2,
					dist: LETTERS,
					keep: (p) => smoothstep(depth(54, 74, 202, 150, p) / 18),
				},
			],
		},
		// scale and lift only, never a turn (see the header)
		limits: { gorilla: { pos: 0.5, neg: 0.5 }, letters: { pos: 0.5, neg: 0.5 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const g = bone(rig, pose, 'gorilla');
			const l = bone(rig, pose, 'letters');
			const hit = slam(env.banner);
			const breath = Math.sin((2 * Math.PI * env.clock) / 700);
			// squashed onto his feet by the slam, swelled by each surge, breathing
			g.along = 1 - 0.07 * hit + 0.05 * env.surge + 0.012 * breath;
			g.across = 1 + 0.03 * hit + 0.025 * env.surge - 0.006 * breath;
			// the lettering pops up out of the ice on a surge, shimmers on a win
			// held to what the 14-unit fade round the box can absorb: at 1.07 the
			// growing D compressed that band to 42% at its lower-left corner
			l.along = 1 + 0.04 * env.surge + 0.02 * env.win;
			l.across = 1 + 0.025 * env.surge + 0.012 * env.win;
			return pose;
		},
		// THE GATE'S BEAT: the panel slams open, the multiplier grows once, the
		// reel wins once, all over a breath that is at zero at both ends (2100ms
		// is three whole 700ms breaths), so it starts and ends on the drawing.
		pose: (rig, t) =>
			spec.drive(rig, {
				banner: t < 120 ? 0 : t > 520 ? 1 : 0.0025 * (t - 120),
				surge: bump(t, 640, 1180),
				win: bump(t, 1300, 1800),
				clock: t,
			}),
	};
	return spec;
})();

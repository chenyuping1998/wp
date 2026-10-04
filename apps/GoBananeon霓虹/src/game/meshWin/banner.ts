/**
 * THE BIG-WIN PLAQUE (BIG, SUPER, MEGA, EPIC, MAX), as a mesh.
 *
 * Win.svelte already slams it in with a scale overshoot, a camera shake and a
 * white flash; what it could not do is make the PLAQUE react, because a sprite
 * can only scale as a flat card. Here the brass plate wobbles like jelly after
 * the slam, the title bulges out of it on the hit and pulses with every flare
 * (Win.svelte's blink), and when the count-up lands on the final amount the
 * plate takes one squash and the title swells hard — the number arriving, felt.
 *
 * The amount rolls in the dark well below the title as a separate GoldText,
 * not part of this mesh, so the well is kept nearly still: the number must
 * stay readable while it counts.
 *
 * One rig for all five tiers: the art is the same plaque with a different
 * title, and every title sits in the same band. Rig units are 256 x 143.36
 * over the 1000 x 560 art (design/generate_win_banners.mjs).
 */
import {
	bump,
	flick,
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

export const BANNER_CANVAS: [number, number] = [256, 143.36];

export type BannerEnv = {
	/** ms since the plaque slammed in */
	t: number;
	/** ms since the count-up landed on its final amount, or < 0 */
	landT: number;
	/** Win.svelte's flare, 0..1 */
	blink: number;
};

export type BannerSpec = MeshWinSpec & { drive: (rig: Rig, env: BannerEnv) => Pose };

const PLATE: Rect = [8, 8, 248, 136];
const TITLE: Rect = [44, 28, 212, 66];
// The title's influence reaches 14 units OUT into the plate. Blended only
// within the title band itself, the bulge pushed the lettering's ends 8 units
// past a fade 8 units wide and folded the corners to 10%: a bulge needs room
// round it to push into.
const TITLE_OUT: Rect = [30, 14, 226, 80];
const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));
const rect = (r: Rect) => polygon([[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]);

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

export const bannerSpec = (key: string): BannerSpec => {
	const spec: BannerSpec = {
		symbol: 'banner',
		key,
		sprite: key,
		mode: 'panel',
		feetY: PLATE[3],
		durationMs: 2600,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => depthIn(PLATE, p) > 0,
		rig: {
			canvas: BANNER_CANVAS,
			grid: { x0: 0, y0: 0, x1: 256, y1: BANNER_CANVAS[1], cols: 64, rows: 36 },
			soft: 3,
			parts: [
				// the transparent air round the plaque: fixed, and free to stretch
				{ name: 'frame', pivot: [128, 72], dist: () => 10 },
				{ name: 'plate', parent: 'frame', pivot: [128, 72], axis: [0, -1], dist: rect(PLATE) },
				{
					name: 'title',
					parent: 'plate',
					pivot: [128, 47],
					axis: [0, -1],
					priority: 2,
					dist: rect(TITLE_OUT),
					// the lettering bulges out of the plate: full inside the title
					// band, handed back to the plate across the 14 units round it
					keep: (p) => smoothstep(depthIn(TITLE_OUT, p) / 16),
				},
			],
		},
		// geometric (check_mesh_wins.mjs banner --limits, 2026-09-25):
		//   plate +13.5 -14 (the jelly is scale; the tilt stays small)   title +3 -3 (never turned)
		limits: { plate: { pos: 2, neg: 2 }, title: { pos: 2, neg: 2 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const t = env.t;
			const land = env.landT >= 0 ? env.landT : -1;
			const plate = bone(rig, pose, 'plate');
			// jelly after the slam: squashed tall, then wide, dying away
			const wob = flick(t, 40, 3.2, 4.2);
			const landWob = land >= 0 ? flick(land, 0, 3.6, 6) : 0;
			plate.along = 1 - 0.055 * wob - 0.035 * landWob;
			plate.across = 1 + 0.045 * wob + 0.025 * landWob;
			plate.angle = PLATE_TILT * flick(t, 70, 1.9, 2.6);

			const title = bone(rig, pose, 'title');
			const swell =
				0.1 * bump(t, 50, 380) +
				0.05 * env.blink +
				(land >= 0 ? 0.13 * bump(land, 0, 300) : 0) +
				0.012 * Math.sin(t / 260) * smoothstep((t - 400) / 300);
			title.along = 1 + swell;
			// wide and flat: it swells mostly in height
			title.across = 1 + 0.35 * swell;
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, landT: t - 1100, blink: 0.5 * (1 + Math.sin(t / 200)) * smoothstep(t / 200) }),
	};
	return spec;
};

// set from the measured limit
const PLATE_TILT = 1.2;

/**
 * THE WIN BANNER'S TIER NAME, AS JELLY (Win.svelte, BannerMesh.svelte).
 *
 * The plaques (design/generate_win_banners.mjs) are one baked picture each: a
 * gunmetal frame, a piece of sky, the tier name and the dark well the amount
 * rolls in. The whole plaque slams in and scales, and every 2.3s it flares.
 * Now the NAME answers the slam: it stretches up off its baseline, squashes
 * back into it, wobbles and settles — and gives a smaller jiggle on each
 * flare after that. Everything else holds still: the frame and the satellite
 * are metal, and the well has the live amount drawn in it.
 *
 * The same panel method as the letter tiles (lowLetters.ts), rigged in the
 * banner's own 1000x560 pixels (RigSpec.uvSize) since a banner is not square.
 * The plain sky round the name absorbs the stretch.
 *
 * One spec for all five tiers: every name is set on the same baseline (230)
 * inside the same box (generate_win_banners.mjs KEEP_OUT).
 */
import { bump, flick, settled, smoothstep, restPose, type MeshWinSpec, type Point, type Rig } from './meshRig';

export const BANNER_W = 1000;
export const BANNER_H = 560;
/** one beat: the flare period in Win.svelte's bannerPose */
export const BANNER_CYCLE_MS = 2300;

// Where the name may move: clear of the frame's inner steel line (x 60), the
// satellite over the top edge (to y ~72) and the well's rim (y 286). The widest
// name (SUPER WIN) inks x 136..864, y ~120..245, so it sits 30px+ inside and
// fully in the free zone; only plain sky lies in the fade band.
const TITLE: [number, number, number, number] = [100, 80, 900, 276];
const FADE = 24;
const depth = (p: Point) => Math.max(0, Math.min(p[0] - TITLE[0], TITLE[2] - p[0], p[1] - TITLE[1], TITLE[3] - p[1]));

/** the name's jiggle at strength `amp` (1 on the slam-in, less on later flares) */
export const bannerTitlePose = (rig: Rig, t: number, amp: number) => {
	const pose = restPose(rig);
	const title = pose.bones[rig.bones.findIndex((b) => b.name === 'title')];
	// up off the baseline, down into it, then a spring
	title.along = 1 + amp * (0.15 * bump(t, 160, 360) - 0.11 * bump(t, 360, 540) + 0.04 * flick(t, 540, 4, 6));
	title.across = 1 + amp * (-0.07 * bump(t, 160, 360) + 0.07 * bump(t, 360, 540) - 0.025 * flick(t, 540, 4, 6));
	title.dy = -amp * 7 * bump(t, 160, 360);
	title.angle = amp * 1.6 * flick(t, 400, 2.4, 3.6);
	return pose;
};

export const BANNER_TITLE: MeshWinSpec = settled({
	symbol: 'BANNER',
	key: 'gbWinBanner',
	sprite: 'gbWinBannerBig',
	mode: 'panel',
	noLand: true,
	feetY: 250,
	durationMs: BANNER_CYCLE_MS,
	landMs: 540,
	hitMs: 300,
	// what the gate judges: the name itself
	inked: (p) => p[0] >= 136 && p[0] <= 864 && p[1] >= 116 && p[1] <= 248,
	rig: {
		grid: { x0: 0, y0: 0, x1: BANNER_W, y1: BANNER_H, cols: 60, rows: 34 },
		soft: 6,
		uvSize: [BANNER_W, BANNER_H],
		parts: [
			{ name: 'frame', pivot: [BANNER_W / 2, BANNER_H / 2], dist: (p) => Math.min(14, depth(p)) },
			{
				name: 'title',
				parent: 'frame',
				// the baseline: the name stretches up from it and squashes into it
				pivot: [BANNER_W / 2, 250],
				axis: [0, -1],
				dist: (p) => (depth(p) > 0 ? 0 : 14),
				keep: (p) => smoothstep((depth(p) - 2) / FADE),
			},
		],
	},
	// geometric (check_mesh_wins.mjs BANNER --limits): title +2 -2
	limits: { title: { pos: 1.5, neg: 1.5 } },
	pose: (rig, t) => bannerTitlePose(rig, t, 1),
});

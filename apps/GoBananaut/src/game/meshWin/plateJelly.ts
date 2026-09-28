/**
 * A PLATE THAT RINGS WHEN IT IS STRUCK — the Free Spins sign and the spin
 * counter (PlateMesh.svelte). Both are generated plaques (generate_theme_jungle
 * .mjs): a gunmetal frame, and a piece of sky inside it that the frontend draws
 * its text over. They used to be flat pictures that only moved as a whole.
 *
 * Now the frame is held and the SKY FACE inside the inner steel line is a mesh
 * that wobbles when the plate takes a hit and settles — squash, stretch, a
 * little bounce — the way a struck panel rings. The text sits on top, drawn by
 * the frontend, and stays crisp. Panel method again (lowLetters.ts,
 * bannerTitle.ts), rigged in each plate's own pixels (RigSpec.uvSize).
 */
import { bump, flick, restPose, settled, smoothstep, type MeshWinSpec, type Point, type Rig } from './meshRig';

type Rect = [number, number, number, number];

/** the face's wobble `t` ms after a hit of strength `amp` (0..1) */
export const plateJellyPose = (rig: Rig, t: number, amp: number) => {
	const pose = restPose(rig);
	if (t < 0 || amp <= 0) return pose;
	const face = pose.bones[rig.bones.findIndex((b) => b.name === 'face')];
	// down and wide on the hit, then ringing out
	face.along = 1 + amp * (-0.045 * bump(t, 0, 140) + 0.03 * flick(t, 140, 4.2, 5.5));
	face.across = 1 + amp * (0.03 * bump(t, 0, 140) - 0.02 * flick(t, 140, 4.2, 5.5));
	face.dy = amp * (4 * bump(t, 0, 140) - 3 * flick(t, 140, 4.2, 5.5));
	return pose;
};
export const PLATE_RING_MS = 900;

const plateSpec = (name: string, sprite: string, W: number, H: number, face: Rect, fade: number): MeshWinSpec => {
	const depth = (p: Point) => Math.max(0, Math.min(p[0] - face[0], face[2] - p[0], p[1] - face[1], face[3] - p[1]));
	return settled({
		symbol: name,
		key: sprite,
		sprite,
		mode: 'panel',
		noLand: true,
		feetY: face[3],
		durationMs: PLATE_RING_MS,
		landMs: 0,
		hitMs: 0,
		// the gate judges the face well inside the fade band
		inked: (p) => depth(p) > fade,
		rig: {
			grid: { x0: 0, y0: 0, x1: W, y1: H, cols: Math.round(W / 16), rows: Math.round(H / 16) },
			soft: 6,
			uvSize: [W, H],
			parts: [
				{ name: 'frame', pivot: [W / 2, H / 2], dist: (p) => Math.min(14, depth(p)) },
				{
					name: 'face',
					parent: 'frame',
					// the face's bottom edge: it squashes down onto it
					pivot: [(face[0] + face[2]) / 2, face[3]],
					axis: [0, -1],
					dist: (p) => (depth(p) > 0 ? 0 : 14),
					keep: (p) => smoothstep((depth(p) - 2) / fade),
				},
			],
		},
		limits: { face: { pos: 0.5, neg: 0.5 } },
		pose: (rig, t) => plateJellyPose(rig, t, 1),
	});
};

// fs_sign.png 920x720: the inner steel line runs 146..774 x 176..624 and the
// satellite hangs over the top edge at y ~122 — both outside the face
export const SIGN_JELLY = plateSpec('FS_SIGN', 'gbFsSign', 920, 720, [150, 180, 770, 620], 40);
// fs_counter_panel.png 824x622: the inner steel line runs 76..748 x 106..516,
// the ringed planet sits on the face's top edge and rides it
export const COUNTER_JELLY = plateSpec('FS_COUNTER', 'gbFsPanel', 824, 622, [80, 110, 744, 512], 36);

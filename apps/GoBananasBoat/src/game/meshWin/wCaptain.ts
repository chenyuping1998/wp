/**
 * W — THE CAPTAIN IN THE PORTHOLE. A character, so it gets the most acting of
 * the set: he ducks on the wind-up, comes up and looks left, then right, out
 * of his porthole, chomps the banana twice (it wags with the jaw), and nods
 * once as it settles.
 *
 * PANEL mode, ROUND (meshRig.panelDiscParts): he is painted INTO the porthole's
 * glass and cannot be cut out of it, so the glass is the mesh and the ring,
 * the red steel and the gold border are the frame and never move. The plain
 * blue-grey of his coat and the dark glass round his head absorb the stretch.
 */
import {
	bump,
	flick,
	panelDiscParts,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 120, rise: 320, land: 1300, done: 1500 };
const GLASS: Point = [124, 120];
const GLASS_R = 72;
const HEAD = polygon([[86, 40], [168, 40], [178, 92], [170, 140], [150, 158], [104, 158], [82, 140], [78, 92]]);
const BANANA = polyline([[117, 126], [104, 162]], 9);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	mode: 'panel',
	noDust: true,
	feetY: GLASS[1] + GLASS_R,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 220,
	// the portrait: the glass disc, not the ring or the steel round it
	inked: (p) => Math.hypot(p[0] - GLASS[0], p[1] - GLASS[1]) < GLASS_R - 4,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelDiscParts(GLASS, GLASS_R),
			{
				name: 'head',
				parent: 'panel',
				pivot: [126, 160],
				axis: [0, -1],
				priority: 2,
				dist: HEAD,
				keep: (p) => smoothstep((160 - p[1]) / 14),
			},
			{
				name: 'banana',
				parent: 'head',
				pivot: [117, 126],
				axis: [-13, 36],
				priority: 4,
				dist: BANANA.dist,
				keep: (p) => smoothstep((BANANA.along(p) - 3) / 12),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs --limits, 2026-09-25, on the 512 layers):
	//   panel +3.5 -3    head +5.5 -4.5    banana +13 -13
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		head: { pos: 3.5, neg: 3.5 },
		banana: { pos: 9, neg: 9 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const up = track(t, [[0, 0], [T.crouch, -1, 'out'], [T.rise, 1, 'back'], [1100, 1], [T.land, 0, 'in']]);
		const hover = ramp(t, 300, 420) * (1 - ramp(t, 1050, 1200));
		// the whole portrait ducks, then comes up inside the glass
		const panel = b('panel');
		// BALANCED against the helmet (2026-09-26): the review measured the hanging and
		// bolted symbols moving a quarter of what the helmet did (4.5-7.9 board px
		// against 18.8), so a line of mixed symbols read as some acting and some not.
		// They cannot hop, so the size goes into the swing, inside the measured limits.
		// up 4.5 (at 6 the glass's rim band stretched to 180%), the duck 3
		panel.dy = up > 0 ? -4.2 * up : -3 * up;
		panel.along = 1 + 0.02 * up;
		// looks left, then right, out of the porthole; nods on the landing
		// the review measured the Wild moving least of the whole set (4.3 board
		// px): he has the most to do and the least room in his porthole, so the
		// size goes into the head, the knock and the flash
		b('head').angle = 3.0 * hover * Math.sin((2 * Math.PI * (t - 400)) / 760) + 2 * flick(t, T.land, 2.6, 5);
		b('head').along = 1 + 0.03 * bump(t, T.rise, 600);
		// chomps twice: the banana wags with the jaw
		b('banana').angle = 5.2 * flick(t, 520, 3, 4) + 4.3 * flick(t, 820, 3, 4);

		pose.air = 0;
		pose.flash = 0.45 * track(t, [[T.crouch, 0], [230, 1, 'out'], [650, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 1000 ? (t - 380) / 620 : -1;
		// bigger (2026-09-27): he cannot leave his porthole, so the whole cell
		// knocks harder instead
		// and every CHOMP thumps the whole porthole (2026-09-27, "focus on how the
		// symbols move"): the one move the frame is allowed is the uniform knock,
		// so his two bites are felt through it — a beat the eye can count
		pose.plateHit =
			1 + 0.11 * bump(t, T.crouch, 420) + 0.045 * bump(t, 500, 640) + 0.04 * bump(t, 800, 940) + 0.05 * bump(t, T.land, T.land + 140);
		return pose;
	},
};

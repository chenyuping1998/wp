/**
 * H1 — THE ALCHEMIST'S LANTERN. It swings from its top ring like a lantern
 * someone has just lifted, the green elixir in the glass sloshes the other
 * way, and the little golden banana floating in it bobs and turns.
 *
 * CUT mode (design/make_alchemy_layers.py, 2026-10-04): the lantern is lifted
 * off its slate, so the TILE stays still and the lantern itself leaps off it,
 * turns a full backflip in the air, lands with a squash and a small second
 * hop — the user asked for the picture to jump, not the cell. Inside it the
 * elixir sloshes and the banana turns as before.
 *
 * NO LIGHT (2026-10-04): no flash and no light sweep — the acting carries it.
 *
 * Coordinates are the 256 canvas (goBanalchemySymbols/h1.png, 2026-10-04):
 * cap (97..158, 13..36), guard (58..198, 42..186), glass (82..172, 84..166),
 * floating banana (110..148, 105..148), base (75..180, 172..232).
 */
import {
	blob,
	flick,
	leap,
	polygon,
	turnAbout,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { crouch: 110, hit: 260, land: 900, done: 1450 };
const LEAP = { crouch: 120, rise: 330, fall: 720, land: 900, hop2: 1140, done: 1450 };

const LANTERN = polygon([[98, 12], [158, 12], [160, 30], [178, 40], [198, 44], [202, 186], [184, 190], [182, 236], [74, 236], [72, 190], [54, 186], [58, 44], [78, 40], [96, 30]]);
const GLASS = blob([127, 125], 44, 41, 2.6);
const BANANA = blob([129, 127], 22, 26, 2.2);

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	feetY: 234,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.hit,
	sparkAt: [128, 126],
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			// the air round it: transparent in the subject layer
			{ name: 'root', pivot: [128, 234], dist: () => 14 },
			{
				name: 'body',
				parent: 'root',
				// hung from the top ring
				pivot: [128, 26],
				axis: [0, 1],
				priority: 1,
				dist: LANTERN,
			},
			{
				name: 'elixir',
				parent: 'body',
				// sloshes about the bottom of the glass
				pivot: [127, 164],
				axis: [0, -1],
				priority: 3,
				dist: GLASS,
				keep: (p) => smoothstep((164 - p[1]) / 14) * smoothstep((p[1] - 86) / 10),
			},
			{
				name: 'banana',
				parent: 'elixir',
				// floats about its own middle
				pivot: [129, 127],
				axis: [0.3, -1],
				priority: 6,
				dist: BANANA,
				keep: (p) => smoothstep((26 - Math.hypot((p[0] - 129) / 0.85, p[1] - 127)) / 10),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H1 --limits, 2026-10-04) — see the gate
	limits: {
		body: { pos: 2.3, neg: 2.3 },
		elixir: { pos: 3, neg: 3 },
		banana: { pos: 9, neg: 9 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// lifted: a small drop on the wind-up, then the swing, dying away slowly
		// enough to still be moving through the hold
		const swing = flick(t, T.crouch + 60, 1.25, 1.3) + 0.5 * flick(t, T.land, 2.2, 4);
		const body = b('body');
		body.angle = SWING_DEG * swing;
		body.along = track(t, [[0, 1], [T.crouch, 0.965, 'out'], [T.hit, 1.022, 'out'], [460, 1], [T.land - 20, 1], [T.land + 50, 0.978, 'out'], [T.done, 1, 'out']]);
		body.across = track(t, [[0, 1], [T.crouch, 1.03, 'out'], [T.hit, 0.986, 'out'], [460, 1], [T.done, 1]]);

		// the elixir lags the swing and leans against it, and swells on the hit
		const live = ramp(t, T.crouch, 260) * (1 - ramp(t, T.done - 320, T.done - 160));
		const slosh = flick(t, T.crouch + 180, 1.25, 1.5);
		const elixir = b('elixir');
		elixir.angle = -SLOSH_DEG * slosh;
		const swell = track(t, [[0, 0], [T.crouch, -0.3, 'out'], [T.hit, 1, 'out'], [700, 0.25], [T.land, 0.1], [T.done - 200, 0]]);
		elixir.along = 1 + 0.05 * swell + 0.015 * live * Math.sin(t / 47);
		elixir.across = 1 + 0.035 * swell + 0.012 * live * Math.sin(t / 41 + 1.1);

		// the banana floats: rises with the swell, bobs and turns lazily
		const banana = b('banana');
		banana.dy = -3 * Math.max(0, swell) - 2.2 * live * Math.sin((2 * Math.PI * (t - T.hit)) / 620);
		banana.angle = BANANA_DEG * live * Math.sin((2 * Math.PI * (t - T.crouch)) / 900) + 2 * flick(t, T.land, 2.4, 4);
		banana.along = 1 + 0.06 * Math.max(0, swell);
		banana.across = 1 + 0.06 * Math.max(0, swell);

		// THE LEAP, and a backflip at the top of it, about the lantern's middle
		const { rigid, air } = leap(t, LEAP, 26);
		rigid.rot = -360 * smoothstep((t - LEAP.rise + 60) / (LEAP.fall - LEAP.rise + 40));
		pose.rigid = turnAbout(rigid, [128, 128], 234);
		pose.air = air;
		return pose;
	},
};

// set from the measured limits
const SWING_DEG = 2.2;
const SLOSH_DEG = 2.6;
const BANANA_DEG = 7;

/**
 * H1 — THE MINER'S LANTERN. It sways from its handle like a lantern someone has
 * just picked up, and the flame inside flares up with the hit and keeps
 * flickering while it swings.
 *
 * PANEL mode (meshRig.panelParts), not cut: the lantern throws its glow onto
 * the stone round it, and a cut takes a torn ring of that lit stone along (see
 * design/make_symbol_layers.mjs). So the frame holds still and the lantern acts
 * inside it.
 *
 * WHY IT SWINGS RATHER THAN HOPS. Its cap sits ~4px under the frame band, so a
 * hop squeezes that strip until it folds — GoBananubis's Wild found the same
 * wall with its crown. A lantern hung from the top pivots at the top: the cap
 * barely moves and the base travels most, which is both what the drawing can
 * take and what a lantern actually does.
 *
 * Coordinates are the 256 canvas (h1.png, 2026-09-25): cap (100..155, 20..48),
 * glass (95..165, 85..170), flame (107..150, 110..165), base (80..175, 180..226).
 */
import {
	blob,
	bump,
	flick,
	panelParts,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [18, 16, 238, 238];
const T = { crouch: 110, hit: 260, land: 1150, done: 1450 };

const LANTERN = polygon([[98, 20], [158, 20], [164, 48], [190, 60], [192, 190], [178, 196], [178, 228], [78, 228], [78, 196], [64, 190], [64, 60], [92, 48]]);
const FLAME = blob([128, 136], 22, 32, 2.4);

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	sprite: 'gbH1',
	mode: 'panel',
	feetY: 226,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.hit,
	sparkAt: [128, 132],
	flashTint: 0xffc45a,
	inked: (p) => LANTERN(p) === 0,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'body',
				parent: 'panel',
				// hung from the handle
				pivot: [128, 36],
				axis: [0, 1],
				priority: 1,
				dist: LANTERN,
				// the cap hands its weight back to the panel as it nears the frame
				keep: (p) => smoothstep((p[1] - 20) / 14),
			},
			{
				name: 'flame',
				parent: 'body',
				// rises from the wick
				pivot: [128, 166],
				axis: [0, -1],
				priority: 4,
				dist: FLAME,
				keep: (p) => smoothstep((166 - p[1]) / 14),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H1 --limits, 2026-09-25):
	//   body +3 -3.5 (the guard's foot at (59,181))   flame +13.5 -12.5
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		body: { pos: 2.3, neg: 2.6 },
		flame: { pos: 8, neg: 8 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// picked up: a small drop on the wind-up, then the swing, dying away
		// slowly enough to still be moving through the hold
		const body = b('body');
		body.angle = SWING_DEG * flick(t, T.crouch + 60, 1.25, 1.3) + 1.2 * flick(t, T.land, 2.2, 4);
		body.along = track(t, [[0, 1], [T.crouch, 0.96, 'out'], [T.hit, 1.025, 'out'], [460, 1], [T.land - 20, 1], [T.land + 50, 0.975, 'out'], [T.done, 1, 'out']]);
		body.across = track(t, [[0, 1], [T.crouch, 1.03, 'out'], [T.hit, 0.985, 'out'], [460, 1], [T.done, 1]]);

		// the flame: a flare on the hit, then a flicker that is not a sine
		const flare = track(t, [[0, 0], [T.crouch, -0.3, 'out'], [T.hit, 1, 'out'], [700, 0.25], [T.land, 0.1], [T.done - 200, 0]]);
		const live = ramp(t, T.crouch, 300) * (1 - ramp(t, T.done - 300, T.done - 150));
		const flicker = live * (0.5 * Math.sin(t / 37) + 0.35 * Math.sin(t / 23 + 1.3) + 0.15 * Math.sin(t / 11 + 0.4));
		const flame = b('flame');
		flame.along = 1 + 0.16 * flare + 0.05 * flicker;
		flame.across = 1 - 0.05 * flare + 0.03 * flicker;
		flame.angle = 1.5 * flicker;

		pose.air = 0;
		pose.flash = 0.4 * track(t, [[T.crouch, 0], [T.hit, 1, 'out'], [700, 0.15, 'in'], [T.done - 200, 0]]);
		pose.sheen = t >= 420 && t <= 980 ? (t - 420) / 560 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 420) + 0.02 * bump(t, T.land, T.land + 140);
		return pose;
	},
};

// how far the lantern swings: set from the measured limit below
const SWING_DEG = 2.4;

/**
 * W — THE ANUBIS GORILLA. A character, so it gets the most acting of the low
 * set: ducks its head on the wind-up; comes up with the ears perking and the
 * cobra on the brow rearing; chews the banana twice, the banana wagging with
 * the jaw; a short growling head-shake; the ears flick once more as it lands.
 *
 * PANEL mode: the head is painted onto a dark slate panel (meshRig.panelParts),
 * and the plain slate round it absorbs the stretch. The ears rise past the
 * panel's gold border into the frame band, so they take priority over the
 * frame there — a little of the border line rides with them.
 */
import {
	landFlick,
	boneOf,
	bump,
	flick,
	panelParts,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [28, 28, 228, 228];
const T = { crouch: 120, rise: 320, land: 1300, done: 1500 };

const HEAD = polygon([[76, 36], [184, 36], [228, 216], [28, 216]]);
const ear = (name: string, path: Point[]): PartSpec => {
	const line = polyline(path, 11);
	return {
		name,
		parent: 'head',
		pivot: path[0],
		axis: [path[1][0] - path[0][0], path[1][1] - path[0][1]],
		priority: 6,
		dist: line.dist,
		keep: (p) => smoothstep((line.along(p) - 4) / 16),
	};
};
const BANANA = polyline([[130, 180], [98, 194], [64, 214]], 11);
const EAR_L = polyline([[86, 80], [80, 12]], 11);
const EAR_R = polyline([[176, 80], [182, 12]], 11);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	mode: 'panel',
	feetY: INNER[3],
	durationMs: T.done,
	landMs: T.land,
	hitMs: 220,
	// the head and the two ears — not the frame band they rise into
	inked: (p) => HEAD(p) === 0 || EAR_L.dist(p) === 0 || EAR_R.dist(p) === 0,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'head',
				parent: 'panel',
				// scaled about its middle, not its chin: from the chin every
				// 1% of growth pushed the crown 2px up into the strip under the frame
				pivot: [128, 128],
				axis: [0, -1],
				priority: 1,
				dist: HEAD,
				// The crown sits 8px under the fixed frame. The panel fades its own
				// weight into the frame there, but a CHILD's weight does not fade
				// with it — the crown rode the full lift and folded the strip to
				// 40%. So the head hands its weight to the panel near the top too.
				keep: (p) => smoothstep((p[1] - 30) / 18),
			},
			ear('ear_l', [[86, 80], [80, 12]]),
			ear('ear_r', [[176, 80], [182, 12]]),
			{
				name: 'cobra',
				parent: 'head',
				pivot: [128, 92],
				axis: [0, -1],
				priority: 4,
				dist: polygon([[114, 50], [142, 50], [142, 92], [114, 92]]),
				keep: (p) => smoothstep((92 - p[1]) / 10),
			},
			{
				name: 'jaw',
				parent: 'head',
				pivot: [140, 176],
				axis: [0, 1],
				priority: 3,
				dist: polygon([[108, 176], [172, 176], [172, 206], [108, 206]]),
				keep: (p) => smoothstep((p[1] - 172) / 10),
			},
			{
				name: 'banana',
				parent: 'jaw',
				pivot: [130, 180],
				axis: [-66, 34],
				priority: 6,
				dist: BANANA.dist,
			},
		],
	},
	// geometric: panel +-1.5, head +-2, ear_l +7 -7, ear_r +6.5 -7,
	// cobra +15.5 -14.5, jaw +6 -7, banana +6.5 -8
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		head: { pos: 1.8, neg: 1.8 },
		ear_l: { pos: 2, neg: 5 },
		ear_r: { pos: 5, neg: 2 },
		cobra: { pos: 9, neg: 9 },
		jaw: { pos: 0.5, neg: 0.5 },
		banana: { pos: 5.5, neg: 5.5 },
	},
	// landing: the ears twitch, the banana wags, the cobra sways. No rebound —
	// the crown sits 8px under the frame (see the panel note in the pose)
	landRebound: 0,
	// and no widening: the headdress's lappets sit against the frame's sides
	landSpread: 0,
	landDepth: 0.012,
	land: (rig, t, k, pose) => {
		const perk = 3 * k * Math.max(0, landFlick(t, 40));
		boneOf(rig, pose, 'ear_l').angle = -perk;
		boneOf(rig, pose, 'ear_r').angle = perk;
		boneOf(rig, pose, 'banana').angle = 3 * k * landFlick(t, 50);
		boneOf(rig, pose, 'cobra').angle = 4 * k * landFlick(t, 60);
	},
	// IDLE: two chews on the banana and a flick of the ears
	idle: (rig, t) => {
		const pose = restPose(rig);
		boneOf(rig, pose, 'jaw').dy = 3 * (bump(t, 120, 360) + bump(t, 440, 680));
		boneOf(rig, pose, 'banana').angle = 3 * (bump(t, 160, 400) - bump(t, 480, 720));
		boneOf(rig, pose, 'ear_l').angle = -3.5 * bump(t, 620, 860);
		boneOf(rig, pose, 'ear_r').angle = 3.5 * bump(t, 680, 920);
		return pose;
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const up = track(t, [[0, 0], [T.crouch, -0.5, 'out'], [T.rise, 1, 'back'], [1100, 1], [T.land, 0, 'in']]);

		const panel = b('panel');
		// The head fills its panel: the crown is 8px under the fixed frame, so
		// it never LIFTS (5px of lift folded that strip inside out, and 2.5 still
		// folded it to 40%). It ducks — down, away from the frame — and the size
		// of the win comes from the ears, the cobra, the chewing and the growl.
		panel.dy = up >= 0 ? 0 : -5 * up;
		panel.along = 1 - 0.02 * bump(t, T.land, T.land + 140);

		// chews: two bites, 400-800ms
		const chew = Math.max(0, Math.sin((2 * Math.PI * (t - 400)) / 200)) * ramp(t, 380, 420) * (1 - ramp(t, 780, 820));
		const head = b('head');
		// a growl: a quick decaying head shake after the chewing
		head.angle = 1.5 * flick(t, 860, 3.2, 4.5);
		head.along = 1 + 0.015 * chew;
		head.across = 1 + 0.02 * Math.max(0, up);

		// ears: - swings the left ear out, + the right. Perk on the hit, flick on
		// the landing, twitch once mid-chew
		const perk = 4 * Math.max(0, flick(t, 250, 2.4, 3)) + 1.5 * Math.max(0, flick(t, 600, 4, 6)) + 2.5 * Math.max(0, flick(t, T.land, 3, 5));
		b('ear_l').angle = -perk;
		b('ear_r').angle = perk;

		const cobra = b('cobra');
		// rears 6%: at 12% its head pushed up into the headdress crown (fold 39%)
		cobra.along = 1 + 0.06 * Math.max(0, flick(t, 280, 1.8, 2.4));
		cobra.angle = 6 * flick(t, 340, 2.2, 2.8);

		b('jaw').dy = 4 * chew;
		b('banana').angle = 5 * chew * Math.sin((2 * Math.PI * (t - 400)) / 400) + 2 * flick(t, T.land, 3, 5);

		pose.air = Math.max(0, Math.min(1, up));
		// It is the Wild and it cannot lift (see the panel above), so its hit is
		// the whole cell knocking and a longer, stronger flash. The review had
		// it moving 2.9px at most — the least of all eleven, on the symbol that
		// matters most.
		pose.flash = 0.5 * track(t, [[T.crouch, 0], [230, 1, 'out'], [420, 0.7], [800, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 1000 ? (t - 380) / 620 : -1;
		pose.plateHit = 1 + 0.07 * bump(t, T.crouch, 420) + 0.03 * bump(t, 860, 1000) + 0.035 * bump(t, T.land, T.land + 150);
		return pose;
	},
};

/**
 * THE BIG WIN MOVE (2026-10-16, user: 「獎圖的動態可以大一點」).
 *
 * The 10-15 repaint left every win in PANEL mode: the parts bend inside a
 * pinned plate, and however much winEmphasis.ts amplified the bones, the
 * picture could only travel a few px before the slate round it tore. So the
 * repainted art is cut again (design/make_alchemy_layers.py → goBanalchemyMesh/)
 * and the WIN plays in CUT mode: the subject itself leaps off a plate that
 * never moves (「圖案本身跳、不要整格跳」, 2026-10-04), tilts in the air, lands
 * with a squash and a second hop — while its own parts keep acting through the
 * same rig (elixir, crystals, tongs, coil...).
 *
 * No flips: the repaint pass removed the whole-subject turnovers, so the turn
 * here is a lean (a swing, a nose-up), never past ~16°. Landings and idle acts
 * stay PANEL (index.ts / idles.ts): only a win leaves its plate.
 */
import { leap, turnAbout, track, flick, type Key, type LeapBeats, type MeshWinSpec, type Point } from './meshRig';

export type LeapStyle = {
	/** canvas px at the top of the leap */
	height: number;
	/** extra uniform scale at the top (on top of leap's own 6%) */
	pop: number;
	/** the lean, degrees over ms (positive = clockwise) */
	tilt: Key[];
	/** a springy wobble after the landing: degrees, Hz */
	wobble?: [number, number];
	/** what the lean turns about (default: the canvas middle) */
	centre?: Point;
	beats: LeapBeats;
	/** how much harder the parts act in the win than in the panel landing/idle (2026-10-31, user: 加強獎圖). The
	 *  win is cut off its plate, so its parts measure ~2x the panel's fold limits (check_mesh_wins --limits); the
	 *  rig's own pose is reused unchanged and only scaled here. */
	acting?: number;
};

export const leapWin = (spec: MeshWinSpec, style: LeapStyle): MeshWinSpec => ({
	...spec,
	mode: 'cut',
	limits: Object.fromEntries(Object.entries(spec.limits).map(([k, l]) => [k, { pos: l.pos * (style.acting ?? 1), neg: l.neg * (style.acting ?? 1) }])),
	pose: (rig, t) => {
		const pose = spec.pose(rig, t);
		const g = style.acting ?? 1;
		if (g !== 1)
			for (const b of pose.bones) {
				b.angle *= g;
				b.dx *= g;
				b.dy *= g;
				b.along = 1 + (b.along - 1) * g;
				b.across = 1 + (b.across - 1) * g;
			}
		const { rigid, air } = leap(t, style.beats, style.height);
		rigid.pop *= 1 + style.pop * air;
		rigid.rot = track(t, style.tilt);
		if (style.wobble) rigid.rot += style.wobble[0] * flick(t, style.beats.land, style.wobble[1], 4.5);
		pose.rigid = turnAbout(rigid, style.centre ?? [128, 128], spec.feetY);
		pose.air = air;
		return pose;
	},
});

const beats = (crouch: number, land: number, done: number): LeapBeats => ({
	crouch,
	rise: crouch + 230,
	fall: land - 210,
	land,
	hop2: Math.min(land + 230, done - 200),
	done,
});

/**
 * per symbol: how high, how it leans in the air.
 *
 * 2026-10-29 (user: 「獎圖動態要做得更明顯生動」): every leap ~1.6x higher
 * (22-28 -> 36-46 canvas px, about a sixth of the cell), twice the pop, the
 * leans ~1.4x and the landing wobble ~1.3x. All of it is the RIGID move of
 * the cut subject, which cannot fold a mesh; the parts' own acting is
 * unchanged.
 */
const HEIGHT = 1.62;
const LEAN = 1.4;
const WOBBLE = 1.3;
export const LEAP_STYLES: Record<string, LeapStyle> = {
	// the lantern swings on its ring as it rises, the other way as it drops
	H1: {
		acting: 1.5,
		height: 28 * HEIGHT,
		pop: 0.12,
		beats: beats(110, 900, 1450),
		tilt: [[0, 0], [110, 0], [360, -10 * LEAN, 'out'], [620, 8 * LEAN], [860, -3 * LEAN], [900, 0, 'in']],
		wobble: [5 * WOBBLE, 2.4],
		centre: [128, 96],
	},
	// the crystals throw themselves up and shiver at the top
	H2: {
		acting: 1.18,
		height: 26 * HEIGHT,
		pop: 0.12,
		beats: beats(110, 900, 1450),
		tilt: [[0, 0], [110, 0], [330, 7 * LEAN, 'out'], [470, -7 * LEAN], [600, 6 * LEAN], [730, -3 * LEAN], [900, 0, 'in']],
		wobble: [4 * WOBBLE, 3],
	},
	// the tongs twirl a quarter of the way about their crossing and back
	H3: {
		acting: 1.5,
		height: 26 * HEIGHT,
		pop: 0.12,
		beats: beats(110, 900, 1450),
		tilt: [[0, 0], [110, 4 * LEAN], [380, -13 * LEAN, 'out'], [640, 8 * LEAN], [900, 0, 'in']],
		wobble: [6 * WOBBLE, 2.6],
		centre: [131, 125],
	},
	// the cart pops a wheelie on the way up and noses down to land
	H4: {
		acting: 1.6,
		height: 24 * HEIGHT,
		pop: 0.12,
		beats: beats(110, 880, 1400),
		tilt: [[0, 0], [110, 2 * LEAN], [330, -13 * LEAN, 'out'], [560, -6 * LEAN], [800, 9 * LEAN], [880, 0, 'in']],
		wobble: [4 * WOBBLE, 3],
		centre: [128, 210],
	},
	// the seal springs and rocks like a tossed coin finding its edge
	S: {
		height: 28 * HEIGHT,
		pop: 0.12,
		beats: beats(110, 1040, 1400),
		tilt: [[0, 0], [110, 0], [360, 12 * LEAN, 'out'], [560, -12 * LEAN], [760, 9 * LEAN], [960, -5 * LEAN], [1040, 0, 'in']],
		wobble: [6 * WOBBLE, 2.8],
	},
};

const LETTER_LEAN: Record<string, number> = { L1: -10, L2: 10, L3: -9, L4: 11, L5: -8 };
for (const [s, lean] of Object.entries(LETTER_LEAN))
	LEAP_STYLES[s] = {
		// L4's hook already sits near its fold limit in the panel act
		acting: s === 'L4' ? 1 : 1.2,
		height: 22 * HEIGHT,
		pop: 0.12,
		beats: beats(100, 800, 1200),
		tilt: [[0, 0], [100, 0], [330, lean * LEAN, 'out'], [560, -0.6 * lean * LEAN], [800, 0, 'in']],
		wobble: [Math.abs(lean) * 0.5 * WOBBLE, 3],
	};

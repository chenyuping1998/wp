/**
 * Each low pay is one printed pennant: lettering always follows its cloth.
 *
 * 2026-10-23 (user: the flags should billow when they score): the cloth was
 * ONE bone turning about the pole, so the edge sewn to the pole turned with it
 * and the whole pennant could only rock 4deg like a board. It is now a chain
 * of four strips from the pole to the point, each hanging from the one before
 * and taking its weight over from it across a soft seam, with the sewn edge
 * left on the pole. A win is a gust: a ripple runs out from the pole to the
 * point — each strip a beat behind the one before and further out, so the
 * point whips most — the cloth thins a little on each rise, and it dies away
 * to hang still. The strips move up and down, never round.
 */
import { circle, impact, polygon, restPose, hump, smoothstep, settled, track, turnAbout, type MeshWinSpec, type Pose, type Rig, type Point } from './meshRig';

// the pennant on the 256 canvas: sewn to the pole from (62,52) to (62,182),
// its point at (238,117); the edges carry ~6px of ink beyond that
const POLE_X = 62, TIP: Point = [238, 117];
// the strips reach 7px past the cloth's edge (its ink is ~5px); the air round
// the cloth is the cloth's too (root is far everywhere it does not claim), so
// the only soft seam is the clear air between the cloth and the ball, tee and
// grass — a seam through the outline stretched it into a ghost second edge
const MARGIN = 7;
const top = (x: number) => 52 + ((TIP[1] - 52) * (x - POLE_X)) / (TIP[0] - POLE_X) - MARGIN;
// over the ball the lower edge's ink is ~9px thick: the strips take 10px there,
// leaving the ~4px of air above the ball's ink for the seam
const bot = (x: number) => 182 - ((182 - TIP[1]) * (x - POLE_X)) / (TIP[0] - POLE_X) + (x > 140 && x < 205 ? 10 : MARGIN);
// the ball and the tee on the grass, under the cloth's lower edge
const BALL = circle([177.5, 182.5], 26); // the ball with its whole ink ring
const TEE = polygon([[200, 172], [226, 172], [218, 206], [206, 206]]);
/** the grass: its top is ~y 177 under the free cloth; nearer the pole the
 *  cloth hangs lower over it, and that end is held by the pole's seam anyway */
const GROUND = (q: Point) => Math.max(0, (q[0] >= 108 ? 178 : 190) - q[1]);
/** where each strip starts (its pivot, on the pennant's centre line): five,
 *  so the ripple reads as one curve rather than four bends. The sewn end
 *  (x 62..90) is the pole's, handed to the first strip across 30px. */
const SEAMS = [90, 118, 146, 174, 202];
const STRIP = SEAMS.map((x0, i) => {
	x0 = i ? x0 : POLE_X + 2;
	const x1 = i < SEAMS.length - 1 ? SEAMS[i + 1] : TIP[0] + 16;
	return polygon([[x0, top(x0)], [x1, Math.min(top(x1), TIP[1])], [x1, Math.max(bot(x1), TIP[1])], [x0, bot(x0)]]);
});
const NAMES = SEAMS.map((_, i) => `cloth${i}`);
/** each strip takes its weight over from the one before across this many px,
 *  wide, so the joins blend into the curve */
const RAMP = 26;

// turn limits for the gate (the strips are never turned: turning folded each
// over the next at the point and drew it twice)
const LIMIT = 2;

/**
 * THE CLOTH (2026-10-23, user: more natural). A pennant in wind is a wave
 * running out from the pole that grows toward the free end, never quite
 * regular, and the cloth pulls back toward the pole a little as it ripples:
 *
 *   height  A(x) = RISE x u^1.3, u = how far along from the pole (0..1)
 *   wave    sin(w t - k x) + 0.3 sin(1.9 w t - 1.7 k x + 1): a main ripple of
 *           ~1.2 waves along the flag and a faster, shorter one over it, so
 *           no two crests look alike
 *   gusts   two puffs, the second smaller and later, overlapping
 *   pull    the free end draws in by up to 3% of its distance on a crest
 *
 * The strips only move up and down (and in); a dip toward the ball under the
 * cloth's lower edge is kept to 40% of a rise, smoothly.
 */
const RISE = 14; // px at the point, at a full gust
const K = (2 * Math.PI) / 190; // per px: a wave ~190px long on a 176px flag
const HZ = 2.4;
const wave = (x: number, t: number) => {
	const w = (2 * Math.PI * HZ * t) / 1000;
	return Math.sin(w - K * (x - POLE_X)) + 0.3 * Math.sin(1.9 * w - 1.7 * K * (x - POLE_X) + 1);
};
const along = (x: number) => Math.max(0, Math.min(1, (x - POLE_X) / (TIP[0] - POLE_X)));

/** pose the strips for a gust strength `g` (0..1) at time t */
const blow = (rig: Rig, pose: Pose, t: number, g: number) => {
	let belowY = 0, belowX = 0;
	NAMES.forEach((name, i) => {
		const b = pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const x = SEAMS[i];
		const u = along(x);
		const v = wave(x, t);
		// the wind lifts it: a dip is kept to 40% of a rise
		const lift = v * (0.7 + 0.3 * Math.tanh(3 * v));
		const y = -RISE * u ** 1.3 * g * lift;
		// rippling, the cloth is shorter: the far end comes in a little on a crest
		const dx = -0.03 * (x - POLE_X) * g * u * (0.5 + 0.5 * Math.abs(Math.tanh(1.5 * v)));
		// each strip hangs from the one before: its own move is the difference
		b.dy = y - belowY;
		b.dx = dx - belowX;
		belowY = y;
		belowX = dx;
		// and a touch thinner on a rise
		b.across = 1 - 0.03 * g * u * (0.5 + 0.5 * Math.tanh(2 * v));
	});
	return pose;
};

/**
 * THE LETTER (2026-10-23, user: the letters should move too). It is printed on
 * the cloth, so it is given its own part on top of the strips: inked letter
 * inside its box, handed back to the cloth over the plain cream round
 * it, which takes the stretch where nobody can see it (the panel idea of
 * meshRig). Each pennant's box, measured on its art (l{n}_flag_v2.png at 256):
 * "10" is two parts, the 1 and the 0 a beat after it.
 */
type Box = [number, number, number, number];
const GLYPHS: Record<number, Box[]> = {
	1: [[82, 92, 136, 139]],
	2: [[86, 91, 135, 140]],
	3: [[85, 91, 133, 140]],
	4: [[87, 91, 127, 140]],
	5: [[80, 98, 99, 133], [111, 98, 142, 133]],
};
/** px of cream each side of the letter takes the stretch over: left (the pole), top, right, bottom */
const RAMPS = [10, 22, 16, 14];
const boxDist = (b: Box) => polygon([[b[0] - 2, b[1] - 2], [b[2] + 2, b[1] - 2], [b[2] + 2, b[3] + 2], [b[0] - 2, b[3] + 2]]);
const glyphParts = (index: number) =>
	GLYPHS[index].map((b, j) => ({
		name: `glyph${j}`,
		// it rides the strip it is printed on (its middle)
		parent: NAMES[Math.max(0, SEAMS.findIndex((x, i) => (b[0] + b[2]) / 2 < (SEAMS[i + 1] ?? 999)))],
		pivot: [(b[0] + b[2]) / 2, b[3]] as Point,
		axis: [0, -1] as Point,
		priority: 12,
		dist: boxDist(b),
		// handed back over as much plain cream as each side has: most above
		// (where the hop and the stretch push), least toward the pole
		keep: (q: Point) => {
			const [l, tp, r, bt] = RAMPS;
			const k = Math.min((q[0] - (b[0] - l)) / l, (b[2] + r - q[0]) / r, (q[1] - (b[1] - tp)) / tp, (b[3] + bt - q[1]) / bt);
			return smoothstep(k);
		},
	}));

const rigFor = (index: number) => ({
	grid: { x0: 12, y0: 8, x1: 248, y1: 244, cols: 59, rows: 59 }, soft: 3,
	parts: [
		// the pole, the ball, the tee and the grass stay put: the ball sits
		// ~20px under the cloth's lower edge and was dragged by its swing.
		// Claimed by their own shapes, so the air between them and the cloth
		// is what stretches.
		{ name: 'root', pivot: [54, 216] as Point, dist: (q: Point) => Math.min(40, q[0] < POLE_X - 2 ? 0 : 40, BALL(q), TEE(q), GROUND(q)) },
		...NAMES.map((name, i) => ({
			name,
			parent: i ? NAMES[i - 1] : 'root',
			pivot: [SEAMS[i], TIP[1]] as Point,
			axis: [1, 0] as Point,
			priority: 4 + i,
			dist: STRIP[i],
			// the sewn edge stays on the pole; each later strip takes its
			// weight over from the one before across RAMP px
			keep: (q: Point) => (i ? smoothstep((q[0] - SEAMS[i] + RAMP / 2) / RAMP) : smoothstep((q[0] - POLE_X - 2) / 30)),
		})),
		...glyphParts(index),
	],
});
const RIGS = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, rigFor(n)]));

/** the letter catches the wind: popped up by the gust (a hop, a stretch that
 *  springs back — the kit's impact), leaning with it; a smaller one on the
 *  second puff. "10": the 0 follows the 1 a beat later. Strength k (1 = win). */
// measured with check_mesh_wins.mjs L1 --limits: +4.5 -3.5
const GLYPH_LIM = 3.5;
const letter = (rig: Rig, pose: Pose, t: number, k: number, puffs: number[]) => {
	rig.bones.forEach((bone, bi) => {
		if (!bone.name.startsWith('glyph')) return;
		const j = Number(bone.name.slice(5));
		const b = pose.bones[bi];
		let pop = 0, hop = 0;
		puffs.forEach((at, n) => {
			const t0 = at + 40 * j, s = n ? 0.55 : 1;
			pop += s * impact(t, t0, 3.6, 0.42);
			hop += s * hump(t, t0, t0 + 300);
		});
		b.along = 1 + 0.07 * k * pop;
		b.across = 1 - 0.04 * k * pop;
		b.dy = -2.7 * k * hop;
		// leaning into the wind and back, a beat after the pop
		b.angle = GLYPH_LIM * 0.6 * k * puffs.reduce((a, at, n) => a + (n ? 0.5 : 1) * impact(t, at + 60 + 40 * j, 2.4, 0.35), 0) * (j % 2 ? -1 : 1);
	});
	return pose;
};

const base = (index: number, symbol: string, durationMs: number) => ({
	symbol, key: `gbL${index}`, sprite: `gbL${index}`,
	art: `sushiSymbols/l${index}.png`,
	feetY: 220, durationMs, landMs: 99999, hitMs: 150,
	rig: RIGS[index],
	limits: Object.fromEntries([...NAMES.map((n) => [n, { pos: LIMIT, neg: LIMIT }]), ...GLYPHS[index].map((_, j) => [`glyph${j}`, { pos: GLYPH_LIM, neg: GLYPH_LIM }])]),
});

/**
 * The whole pennant hops with the gust (2026-10-25, user: 繼續優化高爾夫的動態).
 * The cloth's mesh is already at 57%..142% of its rest area at a full gust, so
 * the extra size lives in the RIGID move, which bends nothing: a dip, a hop
 * that leans downwind, a squash on the turf and a small settle. The low pays
 * are the wins the player sees most; they were the stillest on the board.
 */
const HOP = { crouch: 90, up: 300, down: 560, land: 640 };
const hopRigid = (t: number) => {
	const air = track(t, [[0, 0], [HOP.crouch, 0], [HOP.up, 1, 'out'], [HOP.down, 0.75], [HOP.land, 0, 'in']]);
	const squash = 0.12 * hump(t, 0, HOP.crouch + 70) + 0.16 * impact(t, HOP.land, 4, 0.5);
	const stretch = 0.08 * hump(t, HOP.crouch - 10, HOP.up + 40);
	return {
		air,
		rigid: {
			sx: 1 + squash * 0.8 - stretch * 0.5,
			sy: 1 - squash + stretch,
			// leans downwind (toward the point) in the air, and rocks back as it lands
			rot: track(t, [[0, 0], [HOP.crouch, -1.5], [HOP.up, 5, 'out'], [HOP.down, 3], [HOP.land, -2, 'in'], [HOP.land + 160, 0.8], [HOP.land + 320, 0, 'inOut']]),
			pop: 1 + 0.06 * air,
			dx: 0,
			dy: -16 * air + 3 * hump(t, 0, HOP.crouch + 60),
		},
	};
};

/** the win: a gust and a smaller one after it, dying away to hang still */
const flag = (index: number): MeshWinSpec => ({
	...base(index, `L${index}`, 1180),
	landMs: HOP.land,
	// 0: the crouch starts the act on purpose — a dip, not a fault
	events: [0, 60, 500, HOP.land],
	pose: (r, t) => {
		const pose = letter(r, blow(r, restPose(r), t, Math.min(1, hump(t, 0, 760) ** 0.7 + 0.6 * hump(t, 420, 1120) ** 0.7)), t, 1, [60, 500]);
		const { rigid, air } = hopRigid(t);
		// turned about the foot of the pole, where it stands on the turf
		pose.rigid = turnAbout(rigid, [POLE_X, 200], 220);
		pose.air = air;
		return pose;
	},
});
export const L1 = flag(1), L2 = flag(2), L3 = flag(3), L4 = flag(4), L5 = flag(5);

/** the still board's idle: the same cloth in a light breeze, once */
const breeze = (index: number): MeshWinSpec =>
	settled({ ...base(index, `L${index}:idle`, 1100), events: [180], pose: (r, t) => letter(r, blow(r, restPose(r), t, 0.35 * hump(t, 0, 1100) ** 0.8), t, 0.35, [180]) });
export const L_IDLES = [1, 2, 3, 4, 5].map(breeze);

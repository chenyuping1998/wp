/**
 * Swing Monkey's signs (signRig.ts), measured on the art 2026-10-16.
 *
 * Title (sushiV8/logo_board.png, 1600 x 600): SWING MONKEY in red
 * italics, y 247..342 — since 2026-10-18 free-standing, no plate
 * (design/build_swing_wordmark.py): a cream and an ink outer line and an ink
 * drop block reach ~18px round the letters and ~30px under them, so the boxes
 * below are padded by that much and the parts reach across it. Every few seconds the letters swing to the band — two
 * beats, the second late like a swung eighth: lean and lift on one, lean back
 * on the other, each letter a hair behind the one before, then still.
 *
 * Buy Bonus record (sushiUi/buybonus_jazz.png and its lit copy, 800 x 800):
 * disc r 328 about (400, 400), cream label r 176. A new round scratches it —
 * pulled back and let go — and the label thumps twice on its own now and then.
 */
import { flick, type Point } from './meshRig';
import { disc, hump, inBoxes, letterParts, nth, signSpec } from './signRig';

// ── the title ────────────────────────────────────────────────────────────────
const TOP = 226;
const FOOT = 374;
const LETTERS: [number, number][] = [
	[175, 298], [312, 450], [450, 509], [509, 618], [618, 719],
	[743, 893], [893, 989], [989, 1092], [1092, 1200], [1200, 1305], [1310, 1440],
];
const CYCLE = 5800;
const SWUNG = 470; // the late second beat

export const LOGO_BOARD = signSpec({
	symbol: 'logoBoard',
	sprite: 'v8LogoBoard',
	canvas: [1600, 600],
	cols: 200,
	rows: 75,
	soft: 8,
	reach: 30,
	parts: letterParts(LETTERS, TOP, FOOT),
	inked: inBoxes(LETTERS, TOP, FOOT),
	limits: Object.fromEntries(LETTERS.map((_, i) => [`l${i}`, { pos: 7, neg: 7 }])),
	act: (name, bone, { t }) => {
		const i = nth(name);
		const u = (t % CYCLE) - (500 + i * 38);
		bone.angle = 5 * flick(u, 0, 1.6, 5) - 4 * flick(u, SWUNG, 1.6, 5);
		bone.dy = -7 * hump(u, 0, 260) - 5 * hump(u, SWUNG, 240);
		bone.along = 1 - 0.05 * hump(u, 220, 140) - 0.04 * hump(u, SWUNG + 200, 140);
		bone.across = 2 - bone.along;
	},
});

// ── the Buy Bonus record ─────────────────────────────────────────────────────
const C: Point = [400, 400];
const THUMP_EVERY = 5200;

export const BUY_PLATE_CANVAS: [number, number] = [800, 800];
export const BUY_PLATE_KEYS = ['gbUiBuyBonusJazz', 'gbUiBuyBonusJazzLit'];

export const BUY_PLATE = (sprite: string) =>
	signSpec({
		symbol: `buyPlate:${sprite}`,
		sprite,
		canvas: BUY_PLATE_CANVAS,
		cols: 100,
		rows: 100,
		soft: 6,
		// the disc owns everything near it: the air round its rim may smear,
		// the rim itself may not
		reach: 60,
		parts: [
			{ name: 'disc', pivot: C, dist: disc(C[0], C[1], 330) },
			{ name: 'label', parent: 'disc', pivot: C, dist: disc(C[0], C[1], 176), priority: 30 },
		],
		inked: (p) => Math.hypot(p[0] - C[0], p[1] - C[1]) < 330,
		limits: { disc: { pos: 12, neg: 12 }, label: { pos: 0, neg: 0 } },
		act: (name, bone, { t, pushT }) => {
			const u = (t % THUMP_EVERY) - 2600;
			if (name === 'disc') {
				// the scratch: dragged back, released, rocks to rest
				bone.angle = -9 * flick(pushT, 0, 1.3, 2.6) + 2.5 * flick(u, 0, 1.2, 3);
			} else {
				const thump = 0.035 * hump(u, 0, 150) + 0.025 * hump(u, 260, 150) + 0.03 * hump(pushT, 120, 160);
				bone.along = 1 + thump;
				bone.across = 1 + thump;
			}
		},
	});

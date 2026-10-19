/**
 * Strike Monkey's signs (signRig.ts), measured on the art 2026-10-16.
 *
 * Title board (sushiV8/logo_board_titled.png, 1600 x 600, the title baked in
 * by design/bake_logo_title.py — the letter boxes below are its printout).
 * Every few seconds a ball runs along the line: each letter is struck in turn,
 * rocks over on its foot like a pin, rocks back past upright and settles.
 *
 * Buy Bonus sign (sushiUi/buybonus_sign*.svg, 512 x 512): the three pins,
 * standing at (306, 182), (358, 177), (405, 186). A new round knocks them,
 * one after another; now and then they teeter on their own. The lit copy is
 * the strike itself (pins already down) and stays as drawn.
 */
import { flick, type Point } from './meshRig';
import { hump, inBoxes, letterParts, nth, rect, signSpec } from './signRig';

// ── the title ────────────────────────────────────────────────────────────────
const TOP = 240;
const FOOT = 350;
const LETTERS: [number, number][] = [
	[256, 342], [342, 418], [418, 507], [507, 555], [555, 649], [649, 724],
	[765, 892], [892, 987], [987, 1086], [1086, 1180], [1180, 1255], [1255, 1343],
];
const CYCLE = 5400;

export const LOGO_KEY = 'v8LogoBoardTitled';

export const LOGO_BOARD = signSpec({
	symbol: 'logoBoard',
	sprite: LOGO_KEY,
	canvas: [1600, 600],
	cols: 200,
	rows: 75,
	soft: 8,
	parts: letterParts(LETTERS, TOP, FOOT),
	inked: inBoxes(LETTERS, TOP, FOOT),
	limits: Object.fromEntries(LETTERS.map((_, i) => [`l${i}`, { pos: 8, neg: 8 }])),
	act: (name, bone, { t }) => {
		const i = nth(name);
		const hit = 500 + i * 60;
		const tc = t % CYCLE;
		bone.angle = 6.5 * flick(tc, hit, 1.5, 3.6);
		bone.dy = -3 * hump(tc, hit, 200);
	},
});

// ── the Buy Bonus sign ───────────────────────────────────────────────────────
// pin centres and lean from the SVG (translate/rotate of each <g>); the art
// runs y -33..+40 about the centre, so the foot is at +38
const PINS: [number, number, number][] = [
	[306, 144, -7],
	[358, 139, 5],
	[405, 148, 12],
];
const TEETER_EVERY = 5600;

export const BUY_PLATE_CANVAS: [number, number] = [512, 512];
// the idle plate and the two frames of the ball rolling in, in both skins
export const BUY_PLATE_KEYS = [
	'gbUiBuyBonus', 'gbUiBuyBonusRoll1', 'gbUiBuyBonusRoll2',
	'gbUiBuyBonusStone', 'gbUiBuyBonusStoneRoll1', 'gbUiBuyBonusStoneRoll2',
];

export const BUY_PLATE = (sprite: string) =>
	signSpec({
		symbol: `buyPlate:${sprite}`,
		sprite,
		canvas: BUY_PLATE_CANVAS,
		cols: 128,
		rows: 128,
		soft: 4,
		reach: 6,
		parts: PINS.map(([x, y], i) => ({
			name: `p${i}`,
			pivot: [x, y + 38] as Point,
			axis: [0, -1] as Point,
			dist: rect(x - 20, y - 38, x + 20, y + 40),
		})),
		inked: (p) => PINS.some(([x, y]) => Math.abs(p[0] - x) < 20 && p[1] > y - 36 && p[1] < y + 40),
		limits: Object.fromEntries(PINS.map((_, i) => [`p${i}`, { pos: 12, neg: 12 }])),
		act: (name, bone, { t, pushT }) => {
			const i = nth(name);
			const tc = (t % TEETER_EVERY) - 2800;
			bone.angle = 9 * flick(pushT, i * 70, 1.9, 3) + 3.5 * flick(tc, i * 110, 1.6, 3.4);
		},
	});

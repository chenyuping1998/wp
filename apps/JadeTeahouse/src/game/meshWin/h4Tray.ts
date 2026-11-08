/**
 * H4 — THE FAN TRAY OF THREE TEA CUPS. The tray springs off its card and rocks
 * like it is being carried in a hurry; the three cups hop on it one after
 * another, left to right, each tipping a little as it comes down — and they
 * rattle once more, all together, on the landing.
 *
 * CUT mode, over its card (Symbol.svelte).
 *
 * Coordinates are the 256 canvas of sushiSymbols/h4.png (2026-10-09):
 * cups (76,108) (136,89) (190,108), each ~26 round with its ring; tray
 * (22..242, 62..170), legs to y 193.
 */
import { circle, flick, polygon, restPose, smoothstep, type MeshWinSpec, type Point, type Rig, turnAbout } from './meshRig';
import { ACT, stageAct } from './act';
import { lagged, ppTrack, type PPKey } from './ppVocabulary';

const TRAY = polygon([[22, 118], [60, 80], [128, 62], [196, 80], [242, 118], [230, 155], [195, 170], [190, 193], [176, 193], [176, 168], [128, 158], [80, 168], [78, 193], [64, 193], [60, 160], [28, 150]]);
const CUPS: [string, Point][] = [['cupL', [76, 108]], ['cupM', [136, 89]], ['cupR', [190, 108]]];
const R = 27;

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	sprite: 'gbH4',
	art: 'sushiSymbols/h4.png',
	feetY: 193,
	durationMs: ACT.done,
	landMs: ACT.back,
	hitMs: ACT.pop1,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'root', pivot: [128, 193], dist: () => 14 },
			{ name: 'tray', parent: 'root', pivot: [128, 193], axis: [0, -1], priority: 1, dist: TRAY },
			...CUPS.map(([name, c]) => ({
				name,
				parent: 'tray',
				// sits on its ring: it tips about the bottom of the cup
				pivot: [c[0], c[1] + 20] as Point,
				axis: [0, -1] as Point,
				priority: 4,
				dist: circle(c, R),
				keep: (p: Point) => smoothstep((R + 3 - Math.hypot(p[0] - c[0], p[1] - c[1])) / 12),
			})),
		],
	},
	limits: {
		tray: { pos: 0, neg: 0 },
		cupL: { pos: 6, neg: 6 },
		cupM: { pos: 6, neg: 6 },
		cupR: { pos: 6, neg: 6 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// presenting the tea: back on the card the tray tips toward the player
		// one way, then the other, and the cups lean after it (a frame late)
		const presentKeys: PPKey[] = [[0, 0], [ACT.back, 0], [790, 1], [910, -0.8], [ACT.hold + 40, 0.3], [ACT.hold + 140, 0]];
		const present = ppTrack(t, presentKeys);

		// a wave across the cups: left to right on the way up, right to left on
		// the second beat; each cup two frames after its neighbour
		const wave1: PPKey[] = [[0, 0], [ACT.anticipate + 60, 0], [ACT.anticipate + 180, 1], [ACT.pop1 + 40, 0]];
		const wave2: PPKey[] = [[0, 0], [ACT.hold + 60, 0], [ACT.hold + 170, 1], [ACT.pop2 + 30, 0]];
		CUPS.forEach(([name], i) => {
			const cup = b(name);
			const lean = lagged(t, presentKeys, 1, 33, 1);
			const up = lagged(t, wave1, i, 67, 1) + 0.7 * lagged(t, wave2, 2 - i, 67, 1);
			cup.dy = -CUP_UP * up - 1.4 * Math.max(0, flick(t, ACT.back + 30 * i, 5, 8));
			cup.dx = -2.5 * lean;
			cup.angle = CUP_DEG * (-0.8 * lean + (i - 1 || 0.6) * flick(t, ACT.back + 30 * i, 3, 4.5) + 0.5 * flick(t, ACT.land2 + 30 * i, 3.4, 5));
			cup.along = 1 - 0.05 * Math.max(0, flick(t, ACT.back + 30 * i, 5, 8));
		});

		const act = stageAct(t, { height: 18 });
		act.rigid.rot += 6 * present;
		pose.rigid = turnAbout(act.rigid, [128, 160], 193);
		pose.air = act.air;
		pose.flash = act.flash;
		return pose;
	},
};

const CUP_UP = 6;
const CUP_DEG = 4;

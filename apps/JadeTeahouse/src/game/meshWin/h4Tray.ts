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
import { circle, flick, strongLeap, polygon, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Point, type Rig } from './meshRig';

const LEAP = { crouch: 120, rise: 330, fall: 740, land: 920, hop2: 1150, done: 1450 };

const TRAY = polygon([[22, 118], [60, 80], [128, 62], [196, 80], [242, 118], [230, 155], [195, 170], [190, 193], [176, 193], [176, 168], [128, 158], [80, 168], [78, 193], [64, 193], [60, 160], [28, 150]]);
const CUPS: [string, Point][] = [['cupL', [76, 108]], ['cupM', [136, 89]], ['cupR', [190, 108]]];
const R = 27;

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	sprite: 'gbH4',
	art: 'sushiSymbols/h4.png',
	feetY: 193,
	durationMs: LEAP.done,
	landMs: LEAP.land,
	hitMs: LEAP.rise,
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

		CUPS.forEach(([name], i) => {
			const at = LEAP.rise - 80 + i * 110;
			const cup = b(name);
			const hop = track(t, [[0, 0], [at, 0], [at + 120, 1, 'out'], [at + 240, 0, 'in']]);
			cup.dy = -CUP_UP * hop - 1.4 * Math.max(0, flick(t, LEAP.land + 30 * i, 5, 8));
			cup.angle = CUP_DEG * ((i - 1 || 0.6) * flick(t, at + 240, 3, 4.5) + 0.6 * flick(t, LEAP.land + 30 * i, 3.4, 5));
			cup.along = 1 - 0.05 * Math.max(0, flick(t, at + 240, 5, 8));
		});

		const { rigid, air } = strongLeap(t, LEAP, 35);
		// carried in a hurry: it rocks side to side while it hangs
		rigid.rot += 6 * Math.sin((2 * Math.PI * (t - LEAP.rise + 80)) / 420) * smoothstep((t - LEAP.rise + 120) / 120) * (1 - smoothstep((t - LEAP.fall + 60) / 160));
		pose.rigid = turnAbout(rigid, [128, 120], 193);
		pose.air = air;
		return pose;
	},
};

// set from the measured limits
const CUP_UP = 6;
const CUP_DEG = 4;

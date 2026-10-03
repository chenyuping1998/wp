/** Mesh wins for the ice-alloy low pays, arctic Wild and banana Scatter.
 * The fixed border keeps the GB100-style tile aligned with its neighbours;
 * only the painted contents move. Gestures follow each symbol's silhouette.
 */
import {
	bump, flick, panelParts, polygon, polyline, restPose, smoothstep,
	track, union, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rig,
} from './meshRig';

const INNER: [number, number, number, number] = [24, 24, 232, 232];
const GRID = { x0: 0, y0: 0, x1: 256, y1: 256, cols: 44, rows: 44 };
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

const stroke = (name: string, path: Point[], half: number): PartSpec => {
	const line = polyline(path, half);
	return {
		name, parent: 'panel', pivot: path[0],
		axis: [path.at(-1)![0] - path[0][0], path.at(-1)![1] - path[0][1]],
		priority: 3, dist: line.dist,
		keep: (p) => smoothstep((line.along(p) - 4) / 19),
	};
};

const LOW_T = { crouch: 105, rise: 300, land: 980, done: 1220 };
const low = (
	symbol: string,
	ink: (p: Point) => number,
	parts: PartSpec[],
	limits: MeshWinSpec['limits'],
	act: (rig: Rig, pose: Pose, t: number) => void,
): MeshWinSpec => ({
	symbol, key: `gb${symbol}`, sprite: `gb${symbol}`, mode: 'panel',
	inked: (p) => ink(p) === 0,
	inkColor: (r, g, b) => (r + g + b) / 3 > 85,
	feetY: 232, durationMs: LOW_T.done, landMs: LOW_T.land, hitMs: 250,
	rig: { grid: GRID, soft: 4, parts: [...panelParts(INNER), ...parts] },
	limits: { panel: { pos: 2, neg: 2 }, ...limits },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const air = track(t, [[0, 0], [LOW_T.crouch, 0], [LOW_T.rise, 1, 'back'], [850, 1], [LOW_T.land, 0, 'in']]);
		const p = bone(rig, pose, 'panel');
		p.along = track(t, [[0, 1], [LOW_T.crouch, 0.95, 'out'], [260, 1.025, 'out'], [LOW_T.rise, 1], [LOW_T.land, 1], [1040, 0.97, 'out'], [LOW_T.done, 1]]);
		p.across = track(t, [[0, 1], [LOW_T.crouch, 1.03, 'out'], [260, 0.98, 'out'], [LOW_T.rise, 1], [LOW_T.land, 1], [1040, 1.02, 'out'], [LOW_T.done, 1]]);
		p.dy = -4 * air;
		act(rig, pose, t);
		pose.air = Math.max(0, air);
		pose.flash = 0.28 * track(t, [[0, 0], [250, 1, 'out'], [600, 0, 'in']]);
		pose.sheen = t >= 320 && t <= 850 ? (t - 320) / 530 : -1;
		pose.plateHit = 1 + 0.027 * bump(t, 130, 390) + 0.018 * bump(t, LOW_T.land, 1100);
		return pose;
	},
});

export const L1 = low('L1', polygon([[42, 45], [200, 45], [216, 211], [39, 211]]),
	[stroke('left', [[126, 72], [66, 201]], 15), stroke('right', [[130, 72], [193, 201]], 15)],
	{ left: { pos: 3.5, neg: 3.5 }, right: { pos: 3.5, neg: 3.5 } },
	(r, p, t) => { const s = 2.4 * flick(t, 390, 2.3, 2.9); bone(r, p, 'left').angle = s; bone(r, p, 'right').angle = -s; });

export const L2 = low('L2', polygon([[43, 43], [211, 43], [211, 208], [43, 208]]),
	[stroke('arm', [[112, 128], [192, 57]], 14), stroke('leg', [[115, 131], [200, 197]], 15)],
	{ arm: { pos: 4, neg: 4 }, leg: { pos: 4, neg: 4 } },
	(r, p, t) => { bone(r, p, 'leg').angle = -3.4 * flick(t, 390, 2.1, 2.6); bone(r, p, 'arm').angle = 2.8 * flick(t, 460, 2.1, 2.6); });

export const L3 = low('L3', polygon([[43, 43], [211, 43], [211, 208], [43, 208]]),
	[stroke('tail', [[145, 156], [173, 183], [208, 206]], 13)],
	{ tail: { pos: 6, neg: 6 } },
	(r, p, t) => { bone(r, p, 'tail').angle = 5.2 * flick(t, 410, 2.2, 2.7); });

export const L4 = low('L4', polygon([[53, 43], [208, 43], [208, 215], [53, 215]]),
	[{ name: 'hook', parent: 'panel', pivot: [171, 122], axis: [0, 1], priority: 3,
		dist: polygon([[53, 129], [207, 129], [207, 216], [53, 216]]),
		keep: (p) => smoothstep((p[1] - 124) / 21) }],
	{ hook: { pos: 8, neg: 8 } },
	(r, p, t) => { bone(r, p, 'hook').angle = 6.8 * flick(t, 400, 1.9, 2.7); });

export const L5 = low('L5', union(polygon([[35, 43], [117, 43], [117, 218], [35, 218]]), polygon([[115, 43], [222, 43], [222, 218], [115, 218]])),
	[{ name: 'one', parent: 'panel', pivot: [78, 208], axis: [0, -1], priority: 3, dist: polygon([[35, 43], [117, 43], [117, 218], [35, 218]]) },
	 { name: 'zero', parent: 'panel', pivot: [169, 208], axis: [0, -1], priority: 3, dist: polygon([[117, 43], [222, 43], [222, 218], [117, 218]]) }],
	{ one: { pos: 0.5, neg: 0.5 }, zero: { pos: 0.5, neg: 0.5 } },
	(r, p, t) => { bone(r, p, 'one').dy = -3.2 * bump(t, 350, 600); bone(r, p, 'zero').dy = -3.2 * bump(t, 490, 740); });

const W_HEAD = polygon([[58, 41], [198, 41], [226, 201], [32, 201]]);
export const W: MeshWinSpec = {
	symbol: 'W', key: 'gbW', sprite: 'gbW', mode: 'panel',
	inked: (p) => W_HEAD(p) === 0,
	feetY: 232, durationMs: 1500, landMs: 1260, hitMs: 260,
	rig: { grid: GRID, soft: 4, parts: [
		...panelParts(INNER),
		{ name: 'head', parent: 'panel', pivot: [128, 119], axis: [0, -1], priority: 1, dist: W_HEAD, keep: (p) => smoothstep((p[1] - 35) / 20) },
		{ name: 'goggles', parent: 'head', pivot: [129, 66], axis: [0, -1], priority: 4,
			dist: polygon([[66, 26], [199, 26], [205, 86], [59, 86]]), keep: (p) => smoothstep((87 - p[1]) / 20) },
		{ name: 'banana', parent: 'head', pivot: [126, 163], axis: [-1, 0.4], priority: 5,
			dist: polygon([[56, 150], [131, 143], [143, 190], [63, 197]]) },
	] },
	limits: { panel: { pos: 1, neg: 1 }, head: { pos: 2, neg: 2 }, goggles: { pos: 4, neg: 4 }, banana: { pos: 5, neg: 5 } },
	pose: (rig, t) => {
		const p = restPose(rig);
		const up = track(t, [[0, 0], [140, -1, 'out'], [340, 1, 'back'], [1110, 1], [1260, 0, 'in']]);
		bone(rig, p, 'panel').dy = up < 0 ? -3 * up : 0;
		bone(rig, p, 'head').angle = 1.5 * flick(t, 780, 3, 4);
		bone(rig, p, 'head').across = 1 + 0.014 * Math.max(0, up);
		bone(rig, p, 'goggles').angle = 2.7 * flick(t, 340, 2.4, 3.2);
		const chew = bump(t, 420, 650) + bump(t, 670, 900);
		bone(rig, p, 'banana').angle = 4 * flick(t, 510, 2.4, 3.4) + 2 * flick(t, 780, 2.5, 4);
		bone(rig, p, 'banana').dy = 1.7 * chew;
		p.air = Math.max(0, up);
		p.flash = 0.4 * track(t, [[0, 0], [250, 1, 'out'], [730, 0, 'in']]);
		p.sheen = t >= 370 && t <= 1060 ? (t - 370) / 690 : -1;
		p.plateHit = 1 + 0.05 * bump(t, 150, 440) + 0.027 * bump(t, 1260, 1400);
		return p;
	},
};

const S_BUNCH = polygon([[42, 27], [215, 27], [232, 215], [24, 215]]);
export const S: MeshWinSpec = {
	symbol: 'S', key: 'gbS', sprite: 'gbS', mode: 'panel',
	inked: (p) => S_BUNCH(p) === 0,
	inkColor: (r, g, b) => r > 90 && r > b * 1.4,
	feetY: 232, durationMs: 1450, landMs: 1190, hitMs: 230,
	rig: { grid: GRID, soft: 4, parts: [
		...panelParts(INNER),
		{ name: 'bunch', parent: 'panel', pivot: [129, 76], axis: [0, 1], priority: 1, dist: S_BUNCH },
		{ name: 'bow_l', parent: 'bunch', pivot: [125, 77], axis: [-1, 0], priority: 4,
			dist: polygon([[45, 36], [131, 40], [138, 113], [56, 118]]), keep: (p) => smoothstep((128 - p[0]) / 23) },
		{ name: 'bow_r', parent: 'bunch', pivot: [135, 77], axis: [1, 0], priority: 4,
			dist: polygon([[130, 37], [213, 31], [219, 119], [131, 110]]), keep: (p) => smoothstep((p[0] - 132) / 23) },
	] },
	limits: { panel: { pos: 1, neg: 1 }, bunch: { pos: 3, neg: 3 }, bow_l: { pos: 8, neg: 8 }, bow_r: { pos: 8, neg: 8 } },
	pose: (rig, t) => {
		const p = restPose(rig);
		const air = track(t, [[0, 0], [115, 0], [330, 1, 'back'], [1060, 1], [1190, 0, 'in']]);
		bone(rig, p, 'panel').dy = -2 * air;
		bone(rig, p, 'bunch').angle = 1.7 * flick(t, 330, 1.8, 2.3);
		const flap = 3.5 * flick(t, 390, 2.4, 3) + 1.5 * flick(t, 1190, 2.4, 4);
		bone(rig, p, 'bow_l').angle = flap;
		bone(rig, p, 'bow_r').angle = -flap;
		p.air = Math.max(0, air);
		p.flash = 0.34 * track(t, [[0, 0], [240, 1, 'out'], [640, 0, 'in']]);
		p.sheen = t >= 350 && t <= 1000 ? (t - 350) / 650 : -1;
		p.plateHit = 1 + 0.036 * bump(t, 130, 420) + 0.024 * bump(t, 1190, 1350);
		return p;
	},
};

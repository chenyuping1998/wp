/**
 * W — THE ALCHEMIST GORILLA. A character, so it acts like one: ducks on the
 * wind-up, comes up with its goggles jolting up off its brow and rattling
 * back down, chomps the banana twice with the banana wagging on each bite,
 * and gives one last chomp as it settles.
 *
 * PANEL mode, and the head fills the tile — the fur reaches y 5 and the
 * jacket runs off the left, right and bottom edges — so, like GoBananubis's
 * Wild, it cannot lift. The head bobs a few px about its neck and hands its
 * weight back to the panel toward every edge; the size of the win is in the
 * jaw, the banana and the goggles.
 *
 * NO LIGHT (2026-10-04).
 *
 * Coordinates are the 256 canvas (goBanalchemySymbols/w.png, 2026-10-04):
 * goggles L (141,40) r~20 and R (188,48) r~19, strap (50,64)->(122,38),
 * lips (110,135)->(190,150), banana from the mouth (136,144) down-left to
 * (77,197), chin to y ~185.
 */
import {
	bump,
	circle,
	flick,
	hump,
	turnAbout,
	panelParts,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [8, 8, 248, 248];
const T = { crouch: 120, rise: 320, bite1: 420, bite2: 700, land: 1180, done: 1500 };

const HEAD = polygon([[46, 112], [48, 72], [70, 40], [100, 14], [150, 5], [204, 18], [224, 52], [226, 104], [212, 142], [202, 172], [180, 192], [120, 194], [80, 176], [58, 144]]);
const GOGGLES = union(circle([141, 40], 23), circle([188, 48], 22), polyline([[164, 42], [168, 46]], 8).dist);
const JAW = polygon([[116, 142], [196, 142], [202, 176], [160, 190], [116, 180]]);
const BANANA = polyline([[138, 146], [112, 156], [90, 172], [78, 198]], 14);
// the whole drawing matters: the gorilla fills the tile
const BODY = polygon([[10, 120], [46, 70], [100, 10], [150, 4], [210, 16], [236, 60], [246, 130], [246, 246], [10, 246]]);
const edgeDepth = (p: [number, number]) => Math.min(p[0] - 4, p[1] - 2, 252 - p[0], 252 - p[1]);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	mode: 'panel',
	feetY: INNER[3],
	durationMs: T.done,
	landMs: T.land,
	hitMs: 300,
	sparkAt: [164, 44],
	inked: (p) => BODY(p) === 0,
	rig: {
		fixedBorder: 10,
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'head',
				parent: 'panel',
				// scaled about its neck; every edge hands back to the panel
				pivot: [140, 190],
				axis: [0, -1],
				priority: 1,
				dist: HEAD,
				keep: (p) => smoothstep(edgeDepth(p) / 22),
			},
			{
				name: 'goggles',
				parent: 'head',
				// they sit on the brow and jolt UP off it
				pivot: [164, 66],
				axis: [0, -1],
				priority: 4,
				dist: GOGGLES,
				keep: (p) => smoothstep((p[1] - 6) / 14) * smoothstep((70 - p[1]) / 8),
			},
			{
				name: 'jaw',
				parent: 'head',
				pivot: [156, 142],
				axis: [0, 1],
				priority: 3,
				dist: JAW,
				keep: (p) => smoothstep((p[1] - 138) / 14) * smoothstep(edgeDepth(p) / 16),
			},
			{
				name: 'banana',
				parent: 'jaw',
				pivot: [138, 146],
				axis: [-1, 0.9],
				priority: 5,
				dist: BANANA.dist,
				keep: (p) => smoothstep((BANANA.along(p) - 6) / 16) * smoothstep(edgeDepth(p) / 14),
			},
		],
	},
	// geometric (check_mesh_wins.mjs W --limits, 2026-10-04) — see the gate
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		head: { pos: 1.2, neg: 1.2 },
		goggles: { pos: 3, neg: 3 },
		jaw: { pos: 1, neg: 1 },
		banana: { pos: 5, neg: 5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the head: ducks, comes up, a small bob and tilt while it chews
		const head = b('head');
		const chew = ramp(t, T.bite1 - 60, T.bite1) * (1 - ramp(t, T.bite2 + 240, T.bite2 + 360));
		head.dy = track(t, [[0, 0], [T.crouch, 1.5, 'out'], [T.rise, -1.2, 'back'], [T.bite1, 0]]) + 1.2 * chew * Math.sin((2 * Math.PI * (t - T.bite1)) / 280);
		head.along = track(t, [[0, 1], [T.crouch, 0.985, 'out'], [T.rise, 1.01, 'out'], [T.bite1 + 60, 1], [T.land - 20, 1], [T.land + 50, 0.985, 'out'], [T.done, 1, 'out']]);
		head.across = track(t, [[0, 1], [T.crouch, 1.02, 'out'], [T.rise, 0.99, 'out'], [T.bite1 + 60, 1]]);
		head.angle = HEAD_DEG * flick(t, T.rise, 1.4, 2.2);

		// the goggles: jolted up off the brow on the rise, rattle back down
		const goggles = b('goggles');
		goggles.dy = -GOGGLE_LIFT * Math.max(0, bump(t, T.crouch + 60, T.rise + 120)) - 1.2 * flick(t, T.rise + 120, 4.2, 5) - 0.8 * flick(t, T.land, 4.5, 6);
		goggles.angle = 2.2 * flick(t, T.rise, 2.6, 3.4) - 1.2 * flick(t, T.land, 3, 5);
		goggles.across = 1 + 0.03 * bump(t, T.crouch + 60, T.rise + 120);

		// two bites and a last one on the landing: the jaw closes (shorter) and
		// the banana kicks with each
		const bite = (t0: number) => bump(t, t0, t0 + 150);
		const bites = bite(T.bite1) + bite(T.bite2) + 0.6 * bite(T.land);
		const jaw = b('jaw');
		jaw.along = 1 - 0.05 * bites;
		jaw.dy = -2 * bites;
		b('banana').angle =
			BANANA_DEG * (flick(t, T.bite1, 3, 3.2) + 0.8 * flick(t, T.bite2, 3, 3.2) + 0.5 * flick(t, T.land, 3.4, 4.5));

		pose.air = 0;
		// no plate knock: the cell never moves (2026-10-04)
		return pose;
	},
};

/**
 * THE WIN LIFTS THE WHOLE TILE (2026-10-29, user: 「W 也加大」). The portrait
 * fills its tile, so the gorilla cannot leave its frame the way the cut
 * symbols leave their plates — but the tile can leave its cell, frame and all
 * (GoBananinja's Wild, spec.lifts): a crouch, a pop up out of the cell toward
 * the player (x1.18, 32px) on the rise, a side-to-side rock in time with the
 * chewing, and a slam back down with a squash on the last bite. All of it is
 * the RIGID move, which cannot fold a triangle; the head, goggles, jaw and
 * banana keep acting inside the tile as before. Wins only: the reel-stop
 * reaction and the idle act reuse W.pose and stay in the cell.
 */
export const liftWin = (spec: MeshWinSpec): MeshWinSpec => ({
	...spec,
	lifts: true,
	pose: (rig: Rig, t: number) => {
		const pose = spec.pose(rig, t);
		const up = track(t, [
			[0, 0],
			[T.crouch, 0],
			[T.rise + 40, 1, 'out'],
			[T.land - 170, 0.88],
			[T.land, 0, 'in'],
			[T.land + 110, 0.08, 'out'],
			[T.done - 80, 0, 'in'],
		]);
		// a rock per chew, between the first bite and the drop
		const rock = Math.sin((2 * Math.PI * (t - T.bite1)) / 280) * hump(t, T.bite1 - 60, T.land - 120);
		const r = pose.rigid;
		r.sx = track(t, [[0, 1], [T.crouch, 1.07, 'out'], [T.rise, 0.95, 'out'], [T.bite1 + 60, 1], [T.land - 20, 0.97], [T.land + 40, 1.09, 'out'], [T.land + 170, 0.98, 'out'], [T.done - 80, 1, 'out']]);
		r.sy = track(t, [[0, 1], [T.crouch, 0.91, 'out'], [T.rise, 1.06, 'out'], [T.bite1 + 60, 1], [T.land - 20, 1.04], [T.land + 40, 0.89, 'out'], [T.land + 170, 1.02, 'out'], [T.done - 80, 1, 'out']]);
		r.rot = 6 * rock;
		r.pop = 1 + 0.18 * up;
		r.dy = -32 * up;
		pose.rigid = turnAbout(r, [128, 150], spec.feetY);
		pose.air = up;
		return pose;
	},
});

// set from the measured limits
const HEAD_DEG = 1;
const GOGGLE_LIFT = 3;
const BANANA_DEG = 3.5;

/** WHEN THE WILD BLINKS (2026-10-16), ms into each act, by spec symbol. The
 *  lids are painted overlays on w.png's canvas (design/w_blink.py) drawn on
 *  the Wild's own mesh by SymbolMeshWin.svelte: a squint on the wind-up and a
 *  blink as it settles on a win; a blink as it looks round and another as the
 *  goggles are shoved back up in its idle act. */
export const W_BLINKS: Record<string, number[]> = {
	W: [130, T.land - 40],
	'W:idle': [240, 830],
};

/** which lid shows `t` ms into an act: none, half or closed */
export const blinkLid = (t: number, starts: number[]): 'half' | 'closed' | null => {
	for (const s of starts) {
		const dt = t - s;
		if (dt < 0 || dt >= 160) continue;
		return dt < 45 || dt >= 115 ? 'half' : 'closed';
	}
	return null;
};

/**
 * M — THE TARP COMING OFF THE CRATE (MysteryReveal).
 *
 * Not a win and not a landing: the one act that ends somewhere other than the
 * drawing. The tarp bundle strains against its ropes, then is yanked up by the
 * knot on top — the top of the canvas stretching toward the pull before the
 * rest follows — and flies up and off, turning, while MysteryReveal fades it.
 * The board swaps the cell to the cargo underneath at RATTLE_END, while the
 * tarp still covers it, exactly as before.
 *
 * Only the SUBJECT is drawn (SymbolMeshWin `subjectOnly`): what the tarp
 * uncovers is the new symbol's own tile. The whole M tile used to be lifted
 * off — steel panel and all — which read as a floor tile flying away rather
 * than a canvas being pulled off a crate.
 *
 * `endsAway`: it is not blended home at the end (meshRig.settled) and the gate
 * does not ask it to end at rest. It is gone by then.
 */
import { polygon, restPose, restRigid, smoothstep, track, type MeshWinSpec, type Rig } from './meshRig';

/** MysteryReveal's own timeline, at normal speed; turbo plays it faster */
export const REVEAL_MS = 460;
/** the fraction at which the rope gives and the board swaps underneath */
export const RATTLE_END = 0.22;
const GIVE = REVEAL_MS * RATTLE_END;

const BUNDLE = polygon([[20, 162], [34, 84], [76, 60], [112, 44], [162, 50], [220, 74], [226, 138], [240, 150], [234, 172], [208, 190], [152, 228], [88, 212], [54, 192], [24, 174]]);

export const M: MeshWinSpec = {
	symbol: 'M',
	key: 'gbM',
	feetY: 212,
	durationMs: REVEAL_MS,
	landMs: 0,
	hitMs: 0,
	noDust: true,
	endsAway: true,
	plateUntilMs: GIVE,
	rig: {
		grid: { x0: 12, y0: 36, x1: 244, y1: 236, cols: 50, rows: 44 },
		soft: 4,
		parts: [
			{ name: 'crate', pivot: [128, 212], axis: [0, -1], dist: BUNDLE },
			{
				// the canvas above the crate's shoulders, hanging from the knot: it
				// takes the pull first, over a long blend, so the stretch is spread
				// through the cloth rather than torn at a seam
				name: 'top',
				parent: 'crate',
				pivot: [128, 160],
				axis: [0, -1],
				// It OWNS the canvas above the shoulders outright; the blend is the
				// `keep` ramp's alone. At priority 2 the crate still claimed 6-38% of
				// it by distance, changing over 9px, and the pull tore that band to
				// 207%.
				priority: 30,
				dist: polygon([[16, 150], [240, 150], [240, 36], [16, 36]]),
				keep: (p) => smoothstep((176 - p[1]) / 80),
			},
		],
	},
	// the canvas is loose cloth with nothing drawn round it to tear
	limits: { top: { pos: 9, neg: 9 } },
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const top = pose.bones[rig.bones.findIndex((b) => b.name === 'top')];
		const crate = pose.bones[rig.bones.findIndex((b) => b.name === 'crate')];
		// THE STRAIN: the ropes bite, the canvas bulges between them, shivering
		const strain = t < GIVE ? Math.sin((Math.PI * t) / GIVE) : 0;
		crate.across = 1 + 0.035 * strain * (0.7 + 0.3 * Math.sin(t / 9));
		top.along = 1 - 0.03 * strain;
		const shiver = t < GIVE ? (1 - t / GIVE) * Math.sin(t / 6.5) : 0;

		// THE YANK: the knot is pulled up; the top stretches toward it first,
		// then the whole tarp goes, turning, and flies off up and to the right
		const lift = smoothstep((t - GIVE) / (REVEAL_MS - GIVE));
		const snap = track(t, [[0, 0], [GIVE, 0], [GIVE + 70, 1, 'out'], [GIVE + 200, 0.55], [REVEAL_MS, 0.4]]);
		top.along = Math.max(top.along, 1 + 0.3 * snap);
		top.across = 1 - 0.06 * snap;
		// the cloth flaps as it goes
		top.angle = t > GIVE ? 6.5 * Math.sin((t - GIVE) / 38) * Math.min(1, (t - GIVE) / 90) : 0;
		pose.rigid = {
			...restRigid(),
			dx: 5 * shiver + 78 * lift,
			dy: -2 * Math.abs(shiver) - 150 * lift * lift - 10 * snap,
			rot: 24 * lift,
			// yanked by a corner, it narrows as it flies
			sx: 1 - 0.18 * lift,
			sy: 1 - 0.12 * lift,
		};
		return pose;
	},
};

/**
 * THE HEAVE — Full Shipment only (MysteryReveal, 2026-10-02). Before a board
 * that is ALL crates is unloaded, every tarp heaves twice, as if the cargo
 * under it were shoving to get out: the bundle swells, the canvas above the
 * shoulders is pushed up taut, the crate hops a hair and comes down. Played
 * on every crate with a small delay per reel, so it rolls across the board as
 * one wave — then the column pulls begin. Starts and ends on the drawing.
 */
export const HEAVE_MS = 620;
export const M_HEAVE: MeshWinSpec = {
	...M,
	symbol: 'M',
	durationMs: HEAVE_MS,
	endsAway: false,
	plateUntilMs: undefined,
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const top = pose.bones[rig.bones.findIndex((b) => b.name === 'top')];
		const crate = pose.bones[rig.bones.findIndex((b) => b.name === 'crate')];
		const bump = (a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);
		const h = bump(0, 280) + 0.75 * bump(300, HEAVE_MS);
		crate.across = 1 + 0.045 * h;
		crate.along = 1 + 0.02 * h;
		top.along = 1 + 0.1 * h;
		top.across = 1 - 0.025 * h;
		pose.rigid = { ...restRigid(), dy: -3.5 * h, sx: 1 + 0.015 * h, sy: 1 + 0.02 * h };
		return pose;
	},
};

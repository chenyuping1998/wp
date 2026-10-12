/**
 * THE DINER BREATHES — the things in the backgrounds that hang or groove.
 *
 *   lamps     the three red pendant lamps over the counter sway on their
 *             cords, each at its own pace (the long-corded small one slowest)
 *   jukebox   the jukebox by the counter thumps to the music: a small squash
 *             on its feet on every beat, a bigger one on the bar
 *
 * A gust runs through the room on every win (BgProps.svelte): the lamps swing
 * harder for a couple of seconds.
 *
 * Each is a mesh over ONE rectangle of its background, drawn exactly on top of
 * the unchanged plate by BgProps.svelte. The rectangle's border belongs to
 * `frame` and never moves, so there is no seam where the mesh meets the plate.
 * Both plates (bg_base / bg_feature) share one layout, so one set of rigs
 * serves both. Rig units are PLATE PIXELS (1920 x 1080), measured 2026-10-09.
 *
 * The separate transparent cels Codex painted (fan, jukebox arch, OPEN sign,
 * steam — DINER_BG_PROPS) are drawn by DinerBgProps.svelte; the jukebox's arch
 * cel rides the jukebox mesh's thump (jukeboxThump).
 */
import { flick, polygon, polyline, restPose, smoothstep, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rect, type Rig } from './meshRig';

export const BG_CANVAS: [number, number] = [1920, 1080];

/** what drives the props this frame */
export type BgEnv = {
	/** ms since the scene appeared (the idle sway) */
	t: number;
	/** ms since the last gust (a win), or < 0 */
	gustT: number;
};

export type BgPropSpec = MeshWinSpec & {
	/** the rectangle this mesh covers, plate px */
	rect: Rect;
	drive: (rig: Rig, env: BgEnv) => Pose;
};

const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

const frame = (reach = 10): PartSpec => ({ name: 'frame', pivot: [0, 0], dist: () => reach });

/** a prop: its own shape, handed back to the frame near the rectangle's border */
const prop = (
	rect: Rect,
	name: string,
	pivot: Point,
	dist: (p: Point) => number,
	opts: { parent?: string; axis?: Point; keep?: (p: Point) => number; priority?: number } = {},
): PartSpec => ({
	name,
	parent: opts.parent ?? 'frame',
	pivot,
	axis: opts.axis ?? [0, 1],
	priority: opts.priority ?? 0,
	dist,
	keep: (p) => smoothstep((depthIn(rect, p) - 2) / 10) * (opts.keep ? opts.keep(p) : 1),
});

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const wave = (t: number, period: number, phase = 0) => Math.sin((2 * Math.PI * t) / period + phase);
/** the gust after a win: a kick that dies away */
const gust = (env: BgEnv, hz: number, decay: number) => (env.gustT < 0 ? 0 : flick(env.gustT, 0, hz, decay));

const spec = (
	name: string,
	rect: Rect,
	cells: [number, number],
	parts: PartSpec[],
	inked: (p: Point) => boolean,
	limits: MeshWinSpec['limits'],
	drive: (rig: Rig, env: BgEnv) => Pose,
	reach = 10,
): BgPropSpec => {
	const s: BgPropSpec = {
		symbol: name,
		key: 'gbBgBase',
		sprite: 'gbBgBase',
		mode: 'panel',
		feetY: rect[3],
		durationMs: 4000,
		landMs: 99999,
		hitMs: 99999,
		rect,
		inked,
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: cells[0], rows: cells[1] },
			soft: 3,
			parts: [frame(reach), ...parts],
		},
		limits,
		// The motion eases in over FADE_IN_MS: at t = 0 the mesh must sit exactly
		// on the plate, or it would jump into place the frame it appears.
		drive: (rig, env) => {
			const pose = drive(rig, env);
			const k = smoothstep(env.t / FADE_IN_MS);
			for (const b of pose.bones) {
				b.angle *= k;
				b.along = 1 + (b.along - 1) * k;
				b.across = 1 + (b.across - 1) * k;
				b.dx *= k;
				b.dy *= k;
			}
			return pose;
		},
		// the gate poses it through the idle sway with a gust at 0
		pose: (rig, t) => s.drive(rig, { t, gustT: t }),
	};
	return s;
};

// ---------------------------------------------------------------------------
// the pendant lamps: a shade hung from its cord

type Lamp = { name: string; cx: number; top: number; shade: [number, number, number, number]; period: number; phase: number };

const lampShape = (l: Lamp) => {
	const [x0, y0, x1, y1] = l.shade;
	const w = x1 - x0, h = y1 - y0;
	// a dome: narrow cap on top, flaring to the rim
	return polygon([[l.cx - w * 0.12, y0], [l.cx + w * 0.12, y0], [x1 - w * 0.08, y0 + h * 0.55], [x1, y0 + h * 0.75], [x1 - w * 0.06, y1], [x0 + w * 0.06, y1], [x0, y0 + h * 0.75], [x0 + w * 0.08, y0 + h * 0.55]]);
};

const lampSpec = (l: Lamp, rect: Rect) => {
	const shade = lampShape(l);
	const cord = polyline([[l.cx, l.top], [l.cx, l.shade[1] + 4]], 3);
	const dist = (p: Point) => Math.min(shade(p), cord.dist(p));
	return spec(
		l.name,
		rect,
		[Math.round((rect[2] - rect[0]) / 4), Math.round((rect[3] - rect[1]) / 4)],
		[
			prop(rect, l.name, [l.cx, l.top], dist, {
				// the ceiling rose stays on the ceiling
				keep: (p) => smoothstep((p[1] - l.top - 4) / 12),
				priority: 1,
			}),
		],
		(p) => shade(p) === 0,
		{ [l.name]: { pos: 4, neg: 4 } },
		(rig, env) => {
			const pose = restPose(rig);
			bone(rig, pose, l.name).angle = SWAY_DEG * wave(env.t, l.period, l.phase) + GUST_DEG * gust(env, 0.6 + l.phase * 0.05, 0.8);
			return pose;
		},
	);
};

// traced on bg_base.png 2026-10-09; bg_feature.png has them in the same place
export const BG_LAMP_L = lampSpec({ name: 'lampL', cx: 435, top: 0, shade: [382, 22, 489, 86], period: 3800, phase: 0 }, [366, 0, 506, 100]);
export const BG_LAMP_M = lampSpec({ name: 'lampM', cx: 554, top: 0, shade: [518, 92, 591, 135], period: 5200, phase: 1.4 }, [508, 0, 602, 148]);
export const BG_LAMP_R = lampSpec({ name: 'lampR', cx: 971, top: 0, shade: [923, 28, 1021, 86], period: 4200, phase: 2.3 }, [908, 0, 1036, 100]);

// ---------------------------------------------------------------------------
// the jukebox: a squash on its feet to the beat

export const JUKEBOX_FEET: Point = [1183, 574];
const BEAT_MS = 500; // 120 bpm: the BGM's swing feel, not synced to it
/** the thump at `t`: 0 at rest, 1 at the peak of the bar's downbeat */
export const jukeboxThump = (t: number) => {
	const inBeat = (t % BEAT_MS) / BEAT_MS;
	const bar = Math.floor(t / BEAT_MS) % 4 === 0 ? 1 : 0.55;
	// a quick hit and a slower release
	return bar * (inBeat < 0.12 ? smoothstep(inBeat / 0.12) : 1 - smoothstep((inBeat - 0.12) / 0.6));
};
/** the squash the thump gives: along (up its height) and across */
export const jukeboxScale = (thump: number) => ({ along: 1 - JUKE_SQUASH * thump, across: 1 + 0.6 * JUKE_SQUASH * thump });

/** the same squash at scene time `t`, eased in as the mesh is (the arch cel
 *  in DinerBgProps.svelte rides it) */
export const jukeboxScaleAt = (t: number) => {
	const k = smoothstep(t / FADE_IN_MS);
	const s = jukeboxScale(jukeboxThump(t));
	return { along: 1 + (s.along - 1) * k, across: 1 + (s.across - 1) * k };
};

const JUKEBOX = polygon([[1094, 330], [1110, 290], [1140, 268], [1183, 262], [1230, 268], [1262, 295], [1275, 340], [1275, 572], [1094, 572]]);
const JUKE_RECT: Rect = [1076, 246, 1292, 590];
export const BG_JUKEBOX = spec(
	'jukebox',
	JUKE_RECT,
	[54, 86],
	[prop(JUKE_RECT, 'jukebox', JUKEBOX_FEET, JUKEBOX, { axis: [0, -1], priority: 1 })],
	(p) => JUKEBOX(p) === 0,
	{ jukebox: { pos: 0, neg: 0 } },
	(rig, env) => {
		const pose = restPose(rig);
		const s = jukeboxScale(jukeboxThump(env.t));
		const b = bone(rig, pose, 'jukebox');
		b.along = s.along;
		b.across = s.across;
		return pose;
	},
	6,
);

/** the props over each plate: the same room both times */
export const BG_PROPS: BgPropSpec[] = [BG_LAMP_L, BG_LAMP_M, BG_LAMP_R, BG_JUKEBOX];
export const BG_PROPS_FEATURE: BgPropSpec[] = BG_PROPS;

// The independent transparent cels over the day/night plates (DinerBgProps.svelte).
export const DINER_BG_PROPS = [
	{ key: 'dinerPropFan', x: 1550, y: 140, width: 180, height: 180, motion: 'spin' },
	{ key: 'dinerPropJukebox', x: 1178, y: 415, width: 210, height: 260, motion: 'glimmer' },
	{ key: 'dinerPropOpen', x: 1610, y: 280, width: 310, height: 136, motion: 'flicker' },
	{ key: 'dinerPropSteam', x: 470, y: 262, width: 126, height: 130, motion: 'steam' },
] as const;

// set from the measured limits
const SWAY_DEG = 1.4;
const GUST_DEG = 2.4;
const FADE_IN_MS = 1500;
const JUKE_SQUASH = 0.012;

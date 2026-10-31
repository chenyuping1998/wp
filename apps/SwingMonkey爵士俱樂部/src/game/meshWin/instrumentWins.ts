/**
 * H1-H4 — THE INSTRUMENTS PLAY THEMSELVES (2026-10-10, user request:
 * 「鼓要用鼓棒打鼓，大提琴要撥弦，喇叭的音符要動」).
 *
 * Each win is a short phrase on the instrument, not a hop: the snare's two
 * sticks lift from their butt ends and strike the head in turn, the head dips
 * and the spray of impact lines bursts; the bass and the banjo are plucked and
 * strummed — the strings shiver between their two fixed ends while the
 * pulled-string mark snaps back; the sax honks — the bell flares, the note
 * jumps and sways, its sparks flash out, and the keys press down in a run.
 *
 * One image, one mesh (meshRig): nothing is cut, so a string vibrates because
 * the drawing round it bends. A string's weight follows sin(pi u) along its
 * length, so both ends stay nailed to the nut and the bridge.
 *
 * Coordinates are the 256 canvas of static/assets/sprites/sushiSymbols/h*.png,
 * measured from a colour map of the paintings.
 */
import {
	blob,
	bump,
	circle,
	flick,
	polyline,
	restPose,
	smoothstep,
	union,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';

import { JAZZ_HITS, phraseRelease } from './phrase';
import { ppTrack, PP_FRAME } from './ppVocabulary';

const DURATION = 1440;
const GRID = { x0: 0, y0: 0, x1: 256, y1: 256, cols: 72, rows: 72 };

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const sum = (hits: number[], f: (h: number) => number) => hits.reduce((acc, h) => acc + f(h), 0);
/** the act fades in over its first beat and is fully on until the settle */
const live = (t: number) => smoothstep(t / 160);

/** a string pinned at both ends: its weight is sin(pi u) along it */
const string = (name: string, from: Point, to: Point, half: number): PartSpec => {
	const line = polyline([from, to], half);
	const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
	return {
		name,
		parent: 'body',
		pivot: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
		axis: [to[0] - from[0], to[1] - from[1]],
		priority: 20,
		dist: line.dist,
		keep: (p) => Math.sin(Math.PI * Math.min(1, Math.max(0, line.along(p) / len))) ** 0.8,
	};
};
/** unit vector across a string, for its sideways shiver */
const across = (from: Point, to: Point): Point => {
	const dx = to[0] - from[0], dy = to[1] - from[1];
	const l = Math.hypot(dx, dy);
	return [-dy / l, dx / l];
};

const spec = (
	symbol: string,
	feetY: number,
	hitMs: number,
	landMs: number,
	parts: PartSpec[],
	limits: MeshWinSpec['limits'],
	act: (rig: Rig, pose: Pose, t: number) => void,
	soft = 6,
): MeshWinSpec => ({
	symbol,
	key: `gb${symbol}`,
	sprite: `gb${symbol}`,
	art: `sushiSymbols/${symbol.toLowerCase()}.png`,
	feetY,
	durationMs: DURATION,
	landMs,
	hitMs,
	rig: {
		grid: GRID,
		soft,
		parts: [
			{ name: 'root', pivot: [128, feetY], dist: () => 15 },
			{ name: 'body', parent: 'root', pivot: [128, feetY], dist: circle([128, 128], 111), priority: 1 },
			...parts,
		],
	},
	limits: { body: { pos: 0, neg: 0 }, ...limits },
	pose: (rig, t) => {
		const pose = restPose(rig);
		act(rig, pose, t);
		// Grounded performance: the case, stand and card remain in place. The
		// research's local gesture + delayed follow-through carries the phrase.
		const release = phraseRelease(t);
		for (const part of pose.bones) {
			part.angle *= release;
			part.dx *= release;
			part.dy *= release;
			part.along = 1 + (part.along - 1) * release;
			part.across = 1 + (part.across - 1) * release;
		}
		return pose;
	},
});

/** A drawn-back string has a readable preparation before it releases. */
const pull = (t: number, h: number) => ppTrack(t, [[h - 4 * PP_FRAME, 0], [h - PP_FRAME, 1], [h, 0, 'leave']]);
/** The material answers after contact, with one overshoot and a soft settle. */
const answer = (t: number, h: number) => ppTrack(t, [[h, 0], [h + PP_FRAME, 1], [h + 3 * PP_FRAME, -0.22], [h + 6 * PP_FRAME, 0, 'settle']]);

// ---------------------------------------------------------------------------
// H1 — saxophone: two honks; between them the fingers run down the keys

const SAX_HONKS = JAZZ_HITS.H1;
const SAX_PADS: [Point, number][] = [[[114, 72], 9], [[113, 107], 10], [[118, 133], 8], [[111, 157], 9], [[120, 199], 11]];

export const H1 = spec(
	'H1',
	236,
	SAX_HONKS[0],
	SAX_HONKS[1],
	[
		{ name: 'neck', parent: 'body', pivot: [114, 90], axis: [0, -1], priority: 6,
			dist: polyline([[30, 38], [65, 24], [92, 26], [107, 49], [113, 77]], 10).dist,
			keep: (p) => smoothstep((65 - p[1]) / 20) },
		{ name: 'bell', parent: 'body', pivot: [160, 178], axis: [1, -1], priority: 8, dist: blob([194, 136], 52, 48, 2.5), keep: (p) => smoothstep((Math.hypot(p[0] - 160, p[1] - 178) - 8) / 26) },
		{ name: 'note', parent: 'body', pivot: [214, 98], axis: [0, -1], priority: 10, dist: blob([216, 76], 38, 44, 2) },
		{ name: 'sparkL', parent: 'note', pivot: [197, 90], axis: [-12, -23], priority: 16, dist: polyline([[195, 86], [183, 62]], 5).dist },
		{ name: 'sparkR', parent: 'note', pivot: [224, 110], axis: [18, -18], priority: 16, dist: polyline([[228, 106], [246, 88]], 5).dist },
		...SAX_PADS.map(([c, r], i): PartSpec => ({ name: `pad${i + 1}`, parent: 'body', pivot: c, axis: [0, -1], priority: 12, dist: circle(c, r) })),
	],
	{
		neck: { pos: 3, neg: 3 },
		bell: { pos: 1, neg: 1 },
		note: { pos: 12, neg: 12 },
		sparkL: { pos: 1, neg: 1 },
		sparkR: { pos: 1, neg: 1 },
		...Object.fromEntries(SAX_PADS.map((_, i) => [`pad${i + 1}`, { pos: 1, neg: 1 }])),
	},
	(rig, pose, t) => {
		const honk = (h: number) => bump(t, h - 40, h + 300);
		const blow = sum(SAX_HONKS, honk);
		// Air travels from the neck to the bell; the neck and note answer later.
		bone(rig, pose, 'neck').angle = -2.6 * sum(SAX_HONKS, h => answer(t, h + PP_FRAME));
		const bell = bone(rig, pose, 'bell');
		bell.along = 1 + 0.07 * blow;
		bell.across = 1 + 0.06 * blow;
		// the note is blown up out of the bell, sways, and drops back
		const note = bone(rig, pose, 'note');
		note.dy = -7 * blow;
		note.dx = 2 * blow;
		note.angle = 10 * sum(SAX_HONKS, (h) => flick(t, h + 2 * PP_FRAME, 2.6, 4)) * live(t);
		note.along = 1 + 0.08 * sum(SAX_HONKS, (h) => flick(t, h + 60, 4, 7));
		// the sparks ride on the note and flash outward on each honk
		for (const name of ['sparkL', 'sparkR']) {
			const s = bone(rig, pose, name);
			const out = sum(SAX_HONKS, (h) => bump(t, h, h + 240));
			s.along = 1 + 0.35 * out;
		}
		// fingering: the keys press down in a run between the honks, and back up
		SAX_PADS.forEach(([, r], i) => {
			const pad = bone(rig, pose, `pad${i + 1}`);
			const pressAt = (at: number) => ppTrack(t, [[at, 0], [at + PP_FRAME, 1], [at + 3 * PP_FRAME, 0.75], [at + 5 * PP_FRAME, 0, 'settle']]);
			const press = pressAt(100 + PP_FRAME * i) + pressAt(660 + PP_FRAME * (4 - i));
			pad.along = pad.across = 1 - 0.24 * press;
			pad.dy = 0.2 * r * press;
		});
	},
);

// ---------------------------------------------------------------------------
// H2 — upright bass: four plucks, the strings shiver, the bass rocks on its pin

const BASS_PLUCKS = JAZZ_HITS.H2;
const BASS_FROM: Point = [112, 46];
const BASS_TO: Point = [140, 158];
const BASS_ACROSS = across(BASS_FROM, BASS_TO);

export const H2 = spec(
	'H2',
	240,
	BASS_PLUCKS[0],
	BASS_PLUCKS[3],
	[
		{ name: 'box', parent: 'body', pivot: [128, 214], axis: [0, -1], priority: 8, dist: blob([128, 172], 44, 48, 2) },
		{ name: 'scroll', parent: 'body', pivot: [114, 50], axis: [0, -1], priority: 10, dist: blob([106, 26], 14, 22, 2), keep: (p) => smoothstep((50 - p[1]) / 10) },
		string('strings', BASS_FROM, BASS_TO, 6),
		{ name: 'pluck', parent: 'body', pivot: [146, 151], axis: [1, -0.3], priority: 16, dist: union(polyline([[146, 150], [162, 146], [178, 139]], 5).dist, circle([182, 132], 8)) },
	],
	{ box: { pos: 1, neg: 1 }, scroll: { pos: 4, neg: 4 }, strings: { pos: 1, neg: 1 }, pluck: { pos: 12, neg: 12 } },
	(rig, pose, t) => {
		// Pull, release, shiver: fixed endpoints keep the nut and bridge planted.
		const shiver = sum(BASS_PLUCKS, h => -2.1 * pull(t, h) + 4.5 * flick(t, h, 12, 6));
		const strings = bone(rig, pose, 'strings');
		strings.dx = BASS_ACROSS[0] * shiver;
		strings.dy = BASS_ACROSS[1] * shiver;
		// the pulled-string mark: drawn back, then snaps past and settles
		const pluck = bone(rig, pose, 'pluck');
		pluck.angle = 9 * sum(BASS_PLUCKS, h => pull(t, h)) - 6 * sum(BASS_PLUCKS, h => flick(t, h + PP_FRAME, 6, 9));
		pluck.along = 1 + 0.12 * sum(BASS_PLUCKS, h => pull(t, h));
		// the wooden body breathes with each note, the scroll nods after it
		const box = bone(rig, pose, 'box');
		const swell = sum(BASS_PLUCKS, (h) => bump(t, h, h + 220));
		box.across = 1 + 0.04 * swell;
		box.along = 1 + 0.02 * swell;
		bone(rig, pose, 'scroll').angle = 3.5 * sum(BASS_PLUCKS, (h) => flick(t, h + 40, 4, 6));
	},
);

// ---------------------------------------------------------------------------
// H3 — snare: the sticks strike in turn, a flam to finish

const LEFT_HITS = [300, 680, 1050];
const RIGHT_HITS = [490, 860, 1090];
const LEFT_BUTT: Point = [32, 84];
const RIGHT_BUTT: Point = [238, 34];
/** a stick lifts from its butt end, comes down on the head, bounces off it */
const strike = (t: number, hits: number[], lift: number) =>
	lift * sum(hits, h => ppTrack(t, [[h - 5 * PP_FRAME, 0], [h - 2 * PP_FRAME, 1],
		[h, 0, 'leave'], [h + PP_FRAME * 0.5, -0.09], [h + 2 * PP_FRAME, 0.18], [h + 4 * PP_FRAME, 0, 'settle']]));

export const H3 = spec(
	'H3',
	234,
	LEFT_HITS[0],
	RIGHT_HITS[2],
	[
		{ name: 'head', parent: 'body', pivot: [138, 150], axis: [0, -1], priority: 8, dist: blob([138, 132], 82, 24, 2) },
		{ name: 'stickL', parent: 'body', pivot: LEFT_BUTT, axis: [100, 50], priority: 20, dist: union(polyline([LEFT_BUTT, [132, 134]], 6).dist, circle(LEFT_BUTT, 9)) },
		{ name: 'stickR', parent: 'body', pivot: RIGHT_BUTT, axis: [-55, 78], priority: 20, dist: union(polyline([RIGHT_BUTT, [183, 112]], 6).dist, circle(RIGHT_BUTT, 10)) },
		{ name: 'spray', parent: 'body', pivot: [183, 112], axis: [0, -1], priority: 12, dist: union(circle([156, 94], 9), circle([172, 88], 9), circle([218, 100], 11)) },
	],
	{ head: { pos: 1, neg: 1 }, stickL: { pos: 1, neg: 10 }, stickR: { pos: 10, neg: 1 }, spray: { pos: 1, neg: 1 } },
	(rig, pose, t) => {
		bone(rig, pose, 'stickL').angle = strike(t, LEFT_HITS, -8);
		bone(rig, pose, 'stickR').angle = strike(t, RIGHT_HITS, 9);
		const hitL = sum(LEFT_HITS, h => answer(t, h)), hitR = sum(RIGHT_HITS, h => answer(t, h));
		const head = bone(rig, pose, 'head');
		head.dy = 2 * (hitL + hitR);
		head.along = 1 - 0.025 * (hitL + hitR);
		// the impact lines burst out of the right stick's tip
		const spray = bone(rig, pose, 'spray');
		spray.along = spray.across = 1 + 0.18 * sum(RIGHT_HITS, (h) => bump(t, h - 5, h + 100));
	},
	10,
);

// ---------------------------------------------------------------------------
// H4 — banjo: four strums, the head rings, the neck bobs

const BANJO_STRUMS = JAZZ_HITS.H4;
const BANJO_FROM: Point = [92, 180];
const BANJO_TO: Point = [190, 64];
const BANJO_ACROSS = across(BANJO_FROM, BANJO_TO);

export const H4 = spec(
	'H4',
	238,
	BANJO_STRUMS[0],
	BANJO_STRUMS[3],
	[
		{ name: 'skin', parent: 'body', pivot: [86, 176], axis: [0, -1], priority: 8, dist: blob([86, 176], 50, 50, 2) },
		{ name: 'neck', parent: 'body', pivot: [140, 124], axis: [1, -1.1], priority: 10, dist: polyline([[150, 112], [224, 26]], 16).dist, keep: (p) => smoothstep((Math.hypot(p[0] - 140, p[1] - 124) - 8) / 30) },
		string('strings', BANJO_FROM, BANJO_TO, 5),
		{ name: 'strum', parent: 'body', pivot: [122, 162], axis: [-1, -1], priority: 12, dist: blob([116, 152], 16, 14, 2) },
	],
	{ skin: { pos: 1, neg: 1 }, neck: { pos: 4, neg: 4 }, strings: { pos: 1, neg: 1 }, strum: { pos: 1, neg: 1 } },
	(rig, pose, t) => {
		const shiver = 4 * sum(BANJO_STRUMS, (h) => flick(t, h, 14, 7));
		const strings = bone(rig, pose, 'strings');
		strings.dx = BANJO_ACROSS[0] * shiver;
		strings.dy = BANJO_ACROSS[1] * shiver;
		// the drum head rings with each strum
		const ring = sum(BANJO_STRUMS, (h) => flick(t, h, 8, 8));
		const skin = bone(rig, pose, 'skin');
		skin.along = 1 + 0.025 * ring;
		skin.across = 1 - 0.02 * ring;
		// the strum marks flash out from the strings
		const strum = bone(rig, pose, 'strum');
		strum.dx = sum(BANJO_STRUMS, h => ppTrack(t, [[h - 3 * PP_FRAME, 0], [h - PP_FRAME, -1.8], [h + PP_FRAME, 2.3, 'leave'], [h + 4 * PP_FRAME, 0, 'settle']]));
		strum.dy = -strum.dx * 0.6;
		strum.along = strum.across = 1 + 0.3 * sum(BANJO_STRUMS, (h) => bump(t, h - 10, h + 200));
		bone(rig, pose, 'neck').angle = -3 * sum(BANJO_STRUMS, (h) => flick(t, h + 30, 3.5, 6));
	},
);

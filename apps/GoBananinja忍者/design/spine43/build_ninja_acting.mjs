// The ninja's acting, rewritten with spine-generator (2026-10-23).
//
// What the kit check and the contact sheets showed: every clip keyed all its
// bones on the SAME frames (hip, torso, head and both arms stop and start
// together, so the body moves like one rigid board), the cuts had no real
// wind-up or overshoot, and the cheer's arms only swung ±30°. Rewritten here:
//
//   - each gesture is the kit's strike (anticipation -> snap -> overshoot ->
//     hold -> recover) or pose-to-pose curve, then handed down the chain with
//     a delay: hip -> torso (+1f) -> head (+2-3f), shoulder -> forearm (+1-2f),
//     so joints break one after another (overlapping action)
//   - keys are placed by the kit's baker the way the 4.2/4.3 runtime plays
//     them (each Bezier as ten lines, no segment over 0.2s)
//   - the cut / throw / scatter impacts stay on the frames the game times its
//     effects to (ReelSplits 170/320ms, scatter 300/560/1020ms, the smoke-bomb
//     release at 580ms), and are marked as `hit` events so the kit's checker
//     reads them as intended impacts, not jolts
//
// Each clip OWNS the channels it writes (they are rebuilt from nothing), so
// running this again gives the same file; other channels of the clip (the
// cheer's squash and stretch, the cloth's flutter on track 1) are kept.
// Runs last in the mascot pipeline: ... -> ninja_blink.py -> this.
//
//   node design/spine43/build_ninja_acting.mjs [--report]
import fs from 'node:fs';
import path from 'node:path';
import { kit, readRig, to43, RIG, HERE, LOOPS } from './kit.mjs';

const { bake } = await kit('bake.ts');
const { poses, strike, wave, padTo } = await kit('motions.ts');
const { checkSkeleton, reportMarkdown } = await kit('check.ts');

const raw = readRig();

// ── helpers ──────────────────────────────────────────────────────────────
const F = 1 / 30;
/** strike() filled out to the clip length (the kit's own key times as breaks) */
const hit = (D, rest, A, tA, B, tB, o = {}) =>
	padTo(strike({
		rest,
		anticipation: { value: A, time: tA, ease: o.easeA ?? 'sineInOut' },
		action: { value: B, time: tB - tA, ease: o.easeB ?? 'quartIn' },
		overshoot: { amount: o.os ?? 0, frequency: o.freq ?? 4, damping: o.damp ?? 0.45 },
		hold: o.hold ?? 0.18,
		recover: { time: D - tB - (o.hold ?? 0.18) - (o.delay ?? 0), ease: 'sineInOut' },
	}), D - (o.delay ?? 0));
/**
 * A motion started `d` seconds late and still home at D (the follower's
 * drag): shifted, and squeezed into D - d when it was written for all of D.
 */
const lag = (m, d, D) => {
	if (!d) return m;
	const k = m.duration / (D - d);
	return { duration: D, loop: false, breaks: (m.breaks ?? []).map((b) => d + b / k), value: (t) => m.value(Math.min(m.duration, Math.max(0, (t - d) * k))) };
};
const P = (D, pts, loop = false) => poses(pts.map(([time, value, ease]) => ({ time, value, ease: ease ?? 'sineInOut' })), { duration: D, loop });

const TOL = { rotate: 0.05, translatex: 0.1, translatey: 0.1, scalex: 0.0005, scaley: 0.0005 };
const OLD = { rotate: 'rotate', translatex: 'translate', translatey: 'translate', scalex: 'scale', scaley: 'scale' };

/**
 * One clip: { name, D, loop, tracks: [[bone, timeline, motion], ...], hits: [s...] }.
 * The clip's owned timelines replace whatever was keyed there (the combined
 * 4.2 `translate` / `scale` timelines included); everything else is kept.
 */
function writeClip(out, c) {
	const a = (out.animations[c.name] ??= {});
	a.bones ??= {};
	for (const [bone, timeline, motion] of c.tracks) {
		const tl = (a.bones[bone] ??= {});
		delete tl[OLD[timeline]];
		const keys = bake(motion, { tolerance: TOL[timeline], fps: 30, maxSegment: c.maxSegment ?? 0.1 });
		tl[timeline] = keys.map((k) => ({ ...(k.time ? { time: +k.time.toFixed(4) } : {}), value: +k.value.toFixed(4), ...(k.curve ? { curve: k.curve.map((v) => +v.toFixed(4)) } : {}) }));
	}
	if (c.hits?.length) {
		out.events ??= {};
		out.events.hit ??= {};
		a.events = c.hits.map((time) => ({ time, name: 'hit' }));
	} else delete a.events;
}

// ── the cuts ─────────────────────────────────────────────────────────────
//
// The left arm (screen left, the board's side) cuts: + swings it across the
// body, - out toward the board. The guard (coil) peaks at 0.17s, where
// ReelSplits plays the blade draw; the blade lands at 0.32s, the reveal beat.

function cut(name, D, k, recoverHold) {
	const tA = 0.17, tB = 0.32, h = { hold: recoverHold };
	const tracks = [
		['hip', 'translatex', hit(D, 0, 6 * k, tA, -12 * k, tB, { ...h, os: 2 })],
		['hip', 'translatey', hit(D, 0, -15 * k, tA, -5 * k, tB, { ...h, os: -3, easeB: 'cubicIn' })],
		['torso', 'rotate', hit(D, 0, 11 * k, tA, -13 * k, tB, { ...h, os: 3 })],
		['head', 'rotate', lag(hit(D, 0, -7 * k, tA, 9 * k, tB, { ...h, os: 3, delay: 2 * F }), 2 * F, D)],
		['armL', 'rotate', hit(D, 0, 30 * k, tA, -20 * k, tB, { ...h, os: 4 * k, freq: 4.5 })],
		// the forearm folds across in the guard and whips straight a frame late
		['armL_fore', 'rotate', lag(hit(D, 0, 42 * k, tA, 8 * k, tB, { ...h, os: -7 * k, freq: 5, delay: F }), F, D)],
		['armR', 'rotate', lag(hit(D, 0, -18 * k, tA, 14 * k, tB, { ...h, os: 3, delay: F }), F, D)],
		['armR_fore', 'rotate', lag(hit(D, 0, -30 * k, tA, -10 * k, tB, { ...h, os: 4, delay: 2 * F }), 2 * F, D)],
		['legL', 'rotate', hit(D, 0, -3, tA, 3, tB, h)],
		['legR', 'rotate', hit(D, 0, 3, tA, -3, tB, h)],
	];
	return { name, D, tracks, hits: [tB] };
}

// scatter_slash: draw 0.30, first cut 0.56 (out toward the board), wind back
// across the body, second cut 1.02 (a rising backhand), then settle.
function scatterSlash() {
	const D = 1.62;
	const seq = (rest, a1, b1, o1, a2, b2, o2) => P(D, [
		[0, rest], [0.38, a1, 'sineInOut'], [0.56, b1, 'quartIn'], [0.66, b1 + o1, 'cubicOut'],
		[0.9, a2, 'sineInOut'], [1.02, b2, 'quartIn'], [1.14, b2 + o2, 'cubicOut'], [1.3, b2 + o2 * 0.4, 'sineInOut'], [D, rest, 'sineInOut'],
	]);
	const tracks = [
		['hip', 'translatex', seq(0, 6, -11, -2, 2, -9, -2)],
		['hip', 'translatey', seq(0, -15, -6, -3, -2, -10, -2)],
		['torso', 'rotate', lag(seq(0, 11, -13, -3, 4, -10, -2), F, D)],
		['head', 'rotate', lag(seq(0, -7, 9, 3, -2, 7, 2), 2 * F, D)],
		['armL', 'rotate', seq(0, 32, -30, -7, -8, -26, -5)],
		['armL_fore', 'rotate', lag(seq(0, 50, 8, -9, -30, 24, 6), F, D)],
		['armR', 'rotate', lag(seq(0, -18, 14, 3, 6, 12, 2), F, D)],
		['armR_fore', 'rotate', lag(seq(0, -30, -10, 4, 12, -8, -3), 2 * F, D)],
		['legL', 'rotate', seq(0, -3, 3, 0, 0, 2, 0)],
		['legR', 'rotate', seq(0, 3, -3, 0, 0, -2, 0)],
	];
	return { name: 'scatter_slash', D, tracks, hits: [0.56, 1.02] };
}

// throwit: the smoke bomb leaves the left hand at 0.58s (TransitionAnimation
// THROW_RELEASE_MS); the wind-up peaks at 0.44 and the body rises into it.
function throwIt() {
	const D = 1.2, tA = 0.44, tB = 0.58, h = { hold: 0.16 };
	const tracks = [
		['hip', 'translatex', hit(D, 0, 9, tA, -10, tB, { ...h, os: -2 })],
		['hip', 'translatey', hit(D, 0, -15, tA, 9, tB, { ...h, os: 2, easeB: 'cubicIn' })],
		['torso', 'rotate', hit(D, 0, 12, tA, -13, tB, { ...h, os: -3 })],
		['head', 'rotate', lag(hit(D, 0, 8, tA, -8, tB, { ...h, os: -2, delay: 2 * F }), 2 * F, D)],
		['armL', 'rotate', hit(D, 0, 36, tA, -36, tB, { ...h, os: -6, freq: 4.5 })],
		['armL_fore', 'rotate', hit(D, 0, 30, tA, -12, tB, { ...h, os: -5, freq: 5 })],
		['armR', 'rotate', lag(hit(D, 0, -16, tA, 18, tB, { ...h, os: 3, delay: F }), F, D)],
		['armR_fore', 'rotate', lag(hit(D, 0, -12, tA, 12, tB, { ...h, os: 3, delay: 2 * F }), 2 * F, D)],
	];
	return { name: 'throwit', D, tracks, hits: [tB] };
}

// ── the cheer ────────────────────────────────────────────────────────────
//
// Kept: the crouch-jump-land of the hip and the legs' squash and stretch
// (0.18 crouch, 0.42 top, 0.66 land). New: the right fist (away from the
// board) punches up on the jump and pumps twice; the left arm swings out for
// balance; torso and head follow a few frames behind.
function cheer() {
	const D = 2.05;
	const pump = (rest, crouch, up, p1, p2) => P(D, [
		[0, rest], [0.16, crouch, 'sineOut'], [0.42, up, 'cubicInOut'], [0.52, up * 0.9, 'sineInOut'],
		[0.86, p1, 'sineInOut'], [1.02, up, 'quartIn'], [1.14, up * 0.94, 'cubicOut'],
		[1.3, p2, 'sineInOut'], [1.44, up * 0.96, 'quartIn'], [1.56, up * 0.9, 'cubicOut'], [D, rest, 'sineInOut'],
	]);
	const tracks = [
		['armR', 'rotate', pump(0, -12, 30, 20, 24)],
		['armR_fore', 'rotate', lag(pump(0, 6, -48, -26, -36), 2 * F, D)],
		['armL', 'rotate', lag(pump(0, 12, -24, -14, -18), F, D)],
		['armL_fore', 'rotate', lag(pump(0, -6, 22, 12, 16), 3 * F, D)],
		['torso', 'rotate', lag(P(D, [[0, 0], [0.16, 4], [0.44, -5, 'cubicInOut'], [1.02, -3], [1.44, -4], [D, 0]]), F, D)],
		['head', 'rotate', lag(P(D, [[0, 0], [0.16, 6], [0.44, -9, 'cubicInOut'], [0.7, -5], [1.02, -8, 'quartIn'], [1.44, -7, 'quartIn'], [D, 0]]), 3 * F, D)],
	];
	// the body (2026-10-23 round 2; it was the old keys, eased to a stop every
	// 0.2s and squashed to 0.8): crouch, launch at full speed, fall under
	// gravity, land on a spring, and a small hop with each pump
	const hipY = P(D, [
		[0, 0], [0.18, -22], [0.42, 42, 'cubicOut'], [0.64, -10, 'quadIn'], [0.78, 3, 'cubicOut'], [0.9, 0],
		[1.02, 9, 'quadOut'], [1.14, 0, 'quadIn'], [1.44, 7, 'quadOut'], [1.56, 0, 'quadIn'], [1.66, 1.5, 'cubicOut'], [D, 0],
	]);
	const squash = (a) => P(D, [
		[0, 1], [0.18, 1 + 0.07 * a], [0.3, 1 - 0.05 * a, 'cubicOut'], [0.42, 1], [0.64, 1 + 0.08 * a, 'quadIn'],
		[0.76, 1 - 0.025 * a, 'cubicOut'], [0.9, 1], [1.14, 1 + 0.03 * a, 'quadIn'], [1.26, 1], [1.56, 1 + 0.025 * a, 'quadIn'], [1.68, 1], [D, 1],
	]);
	const legY = P(D, [[0, 1], [0.18, 0.94], [0.32, 1.03, 'cubicOut'], [0.5, 1], [0.64, 0.94, 'quadIn'], [0.8, 1], [1.14, 0.97, 'quadIn'], [1.26, 1], [D, 1]]);
	tracks.push(
		['hip', 'translatey', hipY],
		['torso', 'scalex', squash(1)],
		['torso', 'scaley', squash(-1.2)],
		['legL', 'scaley', legY],
		['legR', 'scaley', lag(legY, F, D)],
		['head', 'translatey', lag(P(D, [[0, 0], [0.18, -4], [0.44, 9, 'cubicOut'], [0.66, -3, 'quadIn'], [0.84, 1], [1.04, 3], [1.16, 0], [D, 0]]), 2 * F, D)],
	);
	return { name: 'cheer', D, tracks, hits: [0.18, 0.64, 1.02, 1.44] };
}

// ── the quiet ones: same poses as before, the chain staggered ─────────────

function nod() {
	const D = 1.0;
	return {
		name: 'nod', D, tracks: [
			['hip', 'translatey', P(D, [[0, 0], [0.22, -7], [0.54, 2], [D, 0]])],
			['torso', 'rotate', lag(P(D, [[0, 0], [0.26, 2.5], [D, 0]]), F, D)],
			['head', 'rotate', lag(P(D, [[0, 0], [0.2, 7, 'cubicOut'], [0.46, -3], [0.7, 1], [D, 0]]), 2 * F, D)],
			['armR', 'rotate', lag(P(D, [[0, 0], [0.24, -7], [0.56, 2], [D, 0]]), F, D)],
			['armL', 'rotate', lag(P(D, [[0, 0], [0.24, 7], [0.56, -2], [D, 0]]), 2 * F, D)],
			['armR_fore', 'rotate', lag(P(D, [[0, 0], [0.26, 6], [0.58, -1.5], [D, 0]]), 3 * F, D)],
			['armL_fore', 'rotate', lag(P(D, [[0, 0], [0.26, -6], [0.58, 1.5], [D, 0]]), 4 * F, D)],
		],
	};
}

// watch: glance over at the board and back (the goggle tease plays on it)
function watch() {
	const D = 2.3;
	return {
		name: 'watch', D, tracks: [
			['head', 'rotate', P(D, [[0, 0], [0.32, 4, 'cubicOut'], [1.2, 3], [1.5, -1.5], [D, 0]])],
			['torso', 'rotate', lag(P(D, [[0, 0], [0.32, 1.2], [1.2, 0.8], [1.6, -1], [D, 0]]), 2 * F, D)],
			['armL', 'rotate', lag(P(D, [[0, 0], [0.4, 3], [1.2, 4], [1.7, 0.5], [D, 0]]), 3 * F, D)],
			['armL_fore', 'rotate', lag(P(D, [[0, 0], [0.4, 4], [1.2, 7], [1.75, 1], [D, 0]]), 5 * F, D)],
			['armR', 'rotate', lag(P(D, [[0, 0], [0.4, -1.5], [1.2, -2], [1.7, 0], [D, 0]]), 3 * F, D)],
		],
	};
}

// dance (loops while a big win counts): a two-step bounce, the shoulders
// rolling against the hips, the head half a beat late. Built from whole waves
// so the seam is exact.
function dance() {
	const D = 2.8, beat = D / 4;
	const W = (amplitude, period, peakAt) => wave({ amplitude, period, peakAt, duration: D });
	const bounce = { duration: D, loop: true, value: (t) => -6 * Math.sin((Math.PI * t) / beat) ** 2 };
	return {
		name: 'dance', D, maxSegment: 0.1, tracks: [
			['hip', 'translatey', bounce],
			['hip', 'translatex', W(3, D, D / 4)],
			['torso', 'rotate', W(2.5, D, 0.1 + D / 4)],
			['head', 'rotate', W(-1.8, D, 0.28 + D / 4)],
			['armL', 'rotate', W(-5, D / 2, 0.12)],
			['armR', 'rotate', W(5, D / 2, 0.12)],
			['armL_fore', 'rotate', W(-4, D / 2, 0.22)],
			['armR_fore', 'rotate', W(4, D / 2, 0.22)],
		],
	};
}

// ── write ────────────────────────────────────────────────────────────────
const clips = [
	cut('slash', 0.94, 1, 0.18), cut('slash_alt', 0.94, 1, 0.18), cut('split_finale', 1.18, 1, 0.3),
	scatterSlash(), throwIt(), cheer(), nod(), watch(), dance(),
];
const out = structuredClone(raw);
for (const c of clips) writeClip(out, c);

// ── the shoulder shuriken (2026-10-23, user: 「讓人物身上插著的手裡劍更有趣」) ──
//
// It was a region on armL that only caught the light every 6s. Now it hangs
// on two bones of its own:
//   shuriken_root  the point where the lower-right blade goes into the
//                  shoulder, aimed at the hub, with a stiff, lightly damped
//                  physics spring: every cut, landing and throw makes it
//                  quiver like a dart in a post ("boing") and settle
//   shuriken       the hub, which the cheer and the scatter cut spin like a
//                  pinwheel — a four-point star at any multiple of 90deg looks
//                  exactly as drawn, so a spin ends on a turn the eye can't see
//                  and the bone then snaps back to 0 unseen
// The glint's star and the shine copy ride on the hub so they turn with it.
// Rebuilt from ninja_shuriken_glint.py's armL coordinates on every run.
{
	const HUB = [-14, 48.9]; // armL local: the region centre (-14, 43.5) + 5.4 up to the jewel
	const EMBED = [10, 24]; // where the hidden blade enters the shoulder
	const dx = HUB[0] - EMBED[0], dy = HUB[1] - EMBED[1];
	const aim = (Math.atan2(dy, dx) * 180) / Math.PI;
	const len = Math.hypot(dx, dy);
	const glintBone = out.bones.find((b) => b.name === 'shuriken_glint');
	if (glintBone.parent === 'armL') {
		// first run on a fresh glint pass: armL frame -> the hub's frame (the
		// hub's net rotation relative to armL is 0, so only the origin moves)
		glintBone.x = +(glintBone.x - HUB[0]).toFixed(3);
		glintBone.y = +(glintBone.y - HUB[1]).toFixed(3);
		glintBone.parent = 'shuriken';
	}
	out.bones = out.bones.filter((b) => !['shuriken_root', 'shuriken', 'shuriken_glint'].includes(b.name));
	out.bones.push(
		{ name: 'shuriken_root', parent: 'armL', length: +len.toFixed(2), rotation: +aim.toFixed(2), x: EMBED[0], y: EMBED[1] },
		{ name: 'shuriken', parent: 'shuriken_root', length: 30, rotation: +(-aim).toFixed(2), x: +len.toFixed(2) },
		glintBone,
	);
	for (const s of out.slots) if (s.name === 'shoulder_shuriken' || s.name === 'shuriken_shine') s.bone = 'shuriken';
	const skin = out.skins[0].attachments;
	for (const s of ['shoulder_shuriken', 'shuriken_shine']) {
		const a = Object.values(skin[s])[0];
		a.x = +(-14 - HUB[0]).toFixed(2);
		a.y = +(43.5 - HUB[1]).toFixed(2);
	}
	// the quiver: stiff (fast) and lightly damped (several swings), limited so
	// a big jolt can't fling the star round the shoulder
	const orders = [...(out.ik ?? []), ...(out.transform ?? []), ...(out.path ?? []), ...(out.physics ?? [])].filter((c) => c.name !== 'shuriken_twang').map((c) => c.order ?? 0);
	out.physics = (out.physics ?? []).filter((c) => c.name !== 'shuriken_twang');
	out.physics.push({ name: 'shuriken_twang', bone: 'shuriken_root', order: Math.max(...orders) + 1, rotate: 1, inertia: 0.5, strength: 900, damping: 0.8, mass: 0.6, limit: 60, ...JSON.parse(process.env.SHURIKEN_PHYS ?? '{}') });

	// the spins, written as keys on `shuriken` (rotate only, - = clockwise)
	const spin = (name, t0, turns) => {
		const tE = t0 + 0.22 + 0.16 * turns, end = tE + 0.24, total = -360 * turns;
		const m = P(end, [[0, 0], [t0, 0], [t0 + 0.07, 14, 'sineOut'], [tE, total - 8, 'cubicOut'], [tE + 0.1, total + 3], [end, total]]);
		const keys = bake(m, { tolerance: 0.05, fps: 30, maxSegment: 0.05 });
		const last = keys[keys.length - 1];
		delete last.curve;
		const rot = keys.map((k) => ({ ...(k.time ? { time: +k.time.toFixed(4) } : {}), value: +k.value.toFixed(3), ...(k.curve ? { curve: k.curve.map((v) => +v.toFixed(4)) } : {}) }));
		rot[rot.length - 1].curve = 'stepped';
		rot.push({ time: +(end + 1 / 30).toFixed(4), value: 0 });
		const a = out.animations[name];
		a.bones.shuriken = { rotate: rot };
	};
	spin('cheer', 0.3, 2); // off the ground at the top of the jump
	spin('scatter_slash', 0.95, 1); // launched by the second cut, home inside the clip
}

fs.writeFileSync(RIG, JSON.stringify(out));

const reports = checkSkeleton(to43(out), { loops: LOOPS, only: clips.map((c) => c.name) });
for (const r of reports) {
	const tally = {};
	for (const i of r.issues) tally[`${i.severity}:${i.code}`] = (tally[`${i.severity}:${i.code}`] ?? 0) + 1;
	console.log(`${r.name.padEnd(14)} score ${String(r.score).padStart(3)}  ${JSON.stringify(tally)}`);
}
if (process.argv.includes('--report')) fs.writeFileSync(path.join(HERE, 'acting_check.md'), reportMarkdown('ninja.json (acting)', reports));

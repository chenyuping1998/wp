// The Saucer cast's acting (2026-10-23, after Stake's "poor animation"):
// what the cut forearms, hands and props do in every clip, and the lights.
// Runs after wp/tools/build_cast_mesh.py Saucer (body mesh, faces and the
// body's motion, with the forearms, hands and props hung as pieces by
// design/arms/cut_arms.py) and rewrites both casts' monkey.json in place.
//
//   the captain (mg)   the remote is his whole act: he thrusts it at the sky
//                      and calls the saucer down (cheer), aims it at the board
//                      (glance, throwit), checks it (alert), and presses it by
//                      accident when he laughs; his free hand flourishes
//   the farm kid (fg)  the torch: he searches the sky with it (cheer), sweeps
//                      the board (glance), flicks it on at the reels (nod),
//                      and it splutters when he is startled or idle too long
//
// Every gesture is anticipation -> action -> overshoot -> a long hold (user,
// 2026-10-16: no constant wobble); the idles are almost still.
//
// Keys are baked by spine-generator (E:/stake/spine-generator) the way the
// runtime plays them (no Bezier segment over 0.2s); its smoothness check runs
// on a 4.3 copy, as for Putt's golfer. Angles are offsets from the drawing,
// degrees, Spine's sign (+ is counter-clockwise on screen):
//   foreLx  the left forearm points down-left: - raises it out and up
//   foreRx  the right forearm points down: + swings it out to his left side
//
//   node design/arms/build_saucer_acting.mjs [mg|fg]...

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = process.env.SPINE_MOTION_KIT ?? 'E:/stake/spine-generator';
const kit = (f) => import(pathToFileURL(path.join(KIT, 'src', f)).href);
const { bake } = await kit('bake.ts');
const { poses, padTo } = await kit('motions.ts');
const { checkSkeleton } = await kit('check.ts');
const { upsertPhysics, parseSkeleton, sampleAnimation } = await kit('spineJson.ts');
const { sampled } = await kit('solve.ts');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '../..');
const LAUGH = JSON.parse(fs.readFileSync(path.join(APP, 'src/game/laughTiming.json'), 'utf8'));

const hump = (t, a, len) => (t <= a || t >= a + len ? 0 : Math.sin((Math.PI * (t - a)) / len));
const K = (pts, D) => {
	const m = padTo(poses(pts.map(([time, value, ease]) => ({ time, value, ease }))), D);
	return (t) => m.value(Math.min(t, m.duration));
};
const fn = (D, f, loop = false) => ({ duration: D, loop, value: f });
const TOL = { rotate: 0.06, translatex: 0.1, translatey: 0.1, scalex: 0.0005, scaley: 0.0005 };
const bk = (bone, timeline, D, f, loop) => ({ bone, timeline, keys: bake(fn(D, f, loop), { tolerance: TOL[timeline], fps: 30, maxSegment: 0.2 }) });

const beats = Array.from({ length: LAUGH.beats }, (_, i) => (LAUGH.startMs + i * LAUGH.gapMs) / 1000);
const GAP = LAUGH.gapMs / 1000;
const LAUGH_END = LAUGH.endMs / 1000;
/** on while laughing, eased in before the first HA and out after the last */
const laughOn = (D) => K([[0, 0], [Math.max(0.12, beats[0] - 0.12), 1, 'sineOut'], [LAUGH_END - 0.1, 1], [D - 0.05, 0, 'sineInOut']], D);
/** a pulse on every HA (every other one stronger) */
const laughPump = (t) => beats.reduce((a, b, i) => a + (i % 2 ? 0.65 : 1) * hump(t, b - 0.03, Math.min(0.22, GAP * 1.05)), 0);
/** a light flash: up fast, a short hold, down slower */
const flash = (at, hold = 0.06, peak = 1, out = 0.16) => [[at - 0.001, 0], [at + 0.03, peak, 'quadOut'], [at + 0.03 + hold, peak], [at + 0.03 + hold + out, 0, 'sineIn']];
const lights = (D, ...flashes) => {
	const pts = [[0, 0], ...flashes.flat().sort((a, b) => a[0] - b[0])];
	return K(pts, D);
};

// ── the captain ─────────────────────────────────────────────────────────────
// ── follow-through (2026-10-23, the kit's 4.3 physics, baked) ───────────────
// Every clip is simulated with Spine 4.3 Physics on the finished motion and
// the loose things' swing baked to plain rotate keys (editable, and the 4.2
// runtime plays them with no physics of its own). Limits are what the mesh
// can bend (build_cast_mesh.py's measured limits x0.85); a piece (the aerial)
// can go further. `sway` is the idle's own slow drift, once a loop.
const PHYS = {
	mg: {
		antenna: { lim: [-23, 18.7], phys: { inertia: 0.6, strength: 120, damping: 0.55, mass: 1 }, sway: 4 },
		cape: { lim: [-3, 3.5], phys: { inertia: 0.5, strength: 70, damping: 0.85, mass: 1.5 }, sway: 2.5 },
		tail: { lim: [-3.4, 3.4], phys: { inertia: 0.5, strength: 90, damping: 0.85, mass: 1.2 }, sway: 2 },
		aerialL: { lim: [-28, 28], phys: { inertia: 0.7, strength: 150, damping: 0.45, mass: 0.8 }, sway: 0 },
	},
	fg: {
		antenna: { lim: [-25, 25], phys: { inertia: 0.6, strength: 110, damping: 0.55, mass: 1 }, sway: 5 },
		net: { lim: [-2.5, 2.5], phys: { inertia: 0.45, strength: 120, damping: 0.85, mass: 1.4 }, sway: 1.5 },
		tail: { lim: [-3, 2.8], phys: { inertia: 0.5, strength: 90, damping: 0.85, mass: 1.2 }, sway: 3 },
	},
};

function to43(j) {
	const c = structuredClone(j);
	c.skeleton.spine = '4.3.13';
	c.constraints = (c.ik ?? []).map(({ order: _o, ...k }) => ({ type: 'ik', ...k }));
	delete c.ik;
	return c;
}

const smooth01 = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const keysOf = (bone, D, f, loop, tol = 0.08) =>
	bake(fn(D, f, loop), { tolerance: tol, fps: 30, maxSegment: 0.2 }).map((k) => ({ ...(k.time ? { time: k.time } : {}), value: k.value, ...(k.curve ? { curve: k.curve } : {}) }));

/** simulate each clip's follow-through and bake it over the old hand-keyed swing */
function followThrough(j, cast, names) {
	const P = PHYS[cast];
	const apps = Object.keys(P).filter((b) => j.bones.some((x) => x.name === b));
	const out = [];
	for (const name of names) {
		const a = j.animations[name];
		const D = dur(a);
		const loop = name === 'idle' || name === 'control';
		const scratch = to43(j);
		for (const b of apps) delete scratch.animations[name].bones?.[b];
		upsertPhysics(scratch, apps.map((bone) => ({ name: `phys-${bone}`, bone, rotate: 1, mix: 1, ...P[bone].phys })));
		const data = parseSkeleton(scratch);
		// a loop is simulated one extra time round first, so it starts in its
		// own steady state rather than from rest
		const smp = sampleAnimation(data, name, { rate: 240, seconds: D, loop, warmUp: loop ? D : 0 });
		for (const bone of apps) {
			const { lim, sway } = P[bone];
			const setup = data.findBone(bone).setupPose.rotation;
			let v = smp.bones.get(bone).localRot.map((r) => ((r - setup + 540) % 360) - 180);
			const n = v.length - 1;
			// the idle's drift, once a loop, each part a beat after the last
			if (name === 'idle' && sway) {
				const off = 0.6 * apps.indexOf(bone);
				v = v.map((x, i) => {
					const t = (i / n) * D, u = (((t - 1.2 - off) % D) + D) % D;
					return x + sway * Math.sin((2 * Math.PI * u) / 2.4) * (u < 2.4 ? Math.sin((Math.PI * u) / 2.4) : 0);
				});
			}
			const hi = Math.max(...v), lo = Math.min(...v);
			const k = Math.min(1, hi > 0 ? lim[1] / hi : 1, lo < 0 ? lim[0] / lo : 1);
			v = v.map((x) => x * k);
			if (loop) {
				// close the loop: the last 0.3s blends onto where it began
				const gap = v[0] - v[n];
				v = v.map((x, i) => x + gap * smooth01((i / n - (1 - 0.3 / D)) / (0.3 / D)));
			} else {
				// a one-shot settles home over its last 0.15s
				v = v.map((x, i) => x * (1 - smooth01((i / n - (1 - 0.15 / D)) / (0.15 / D))));
			}
			a.bones[bone] = { rotate: bake(sampled(v, D, loop), { tolerance: 0.1, fps: 30, maxSegment: 0.2 }).map((kk) => ({ ...(kk.time ? { time: kk.time } : {}), value: kk.value, ...(kk.curve ? { curve: kk.curve } : {}) })) };
			out.push(`${name} ${bone} ${lo.toFixed(1)}..${hi.toFixed(1)}${k < 1 ? ` x${k.toFixed(2)}` : ''}`);
		}
	}
	return out;
}

const CAPTAIN = {
	dir: 'sushiMaster',
	sides: ['L', 'R'],
	// his forearm is short and points at the camera, so swinging it swings
	// the remote round with it (at -84 its stick pointed into his chest): the
	// wrist takes back most of the forearm's turn, and handL below is only the
	// remote's own aim (- tips its stick up and right, + toward the board)
	gimbal: { L: 0.8 },
	clips: {
		idle: (D) => ({
			loop: true,
			// still, but alive: the remote rides a breath, and once a loop he
			// thumbs it (a little click, a dim blink)
			foreL: (t) => -2 * Math.sin((2 * Math.PI * t) / D),
			handL: (t) => -9 * hump(t, 3.15, 0.2) + 2 * hump(t, 3.35, 0.2),
			foreR: (t) => 1.5 * Math.sin((2 * Math.PI * (t - 0.6)) / D),
			handR: () => 0,
			lightL: lights(D, flash(3.24, 0.04, 0.55, 0.12)),
		}),
		// a big win and every collection: he CALLS THE SAUCER. Remote in to the
		// chest on the squat, thrust at the sky on the hop, two hard presses
		// (pings), the free hand flung out — ta-da — and held while he lands
		cheer: (D) => ({
			foreL: K([[0, 0], [0.18, 16, 'sineOut'], [0.42, -84, 'backOut'], [0.62, -78], [0.7, -84, 'quadOut'], [0.8, -78], [0.88, -84, 'quadOut'], [1.12, -76], [1.5, 0, 'sineInOut']], D),
			handL: K([[0, 0], [0.18, 14, 'sineOut'], [0.42, -26, 'backOut'], [0.62, -20], [0.66, -32, 'quadOut'], [0.74, -20], [0.84, -32, 'quadOut'], [0.92, -20], [1.5, 0, 'sineInOut']], D),
			foreR: K([[0, 0], [0.2, -10, 'sineOut'], [0.5, 66, 'backOut'], [1.15, 58], [1.55, 0, 'sineInOut']], D),
			handR: K([[0, 0], [0.2, 8, 'sineOut'], [0.5, -26, 'backOut'], [0.62, -18], [1.15, -14], [1.55, 0, 'sineInOut']], D),
			lightL: lights(D, flash(0.64, 0.06), flash(0.82, 0.08)),
			signalL: lights(D, flash(0.66, 0.1, 1, 0.12), flash(0.84, 0.16, 1, 0.2)),
			faces: [[0, 'figure'], [0.4, 'figure_grin'], [1.4, 'figure']],
		}),
		// the laugh: the remote hand shakes with every HA, the free hand slaps
		// his thigh every other beat — and halfway through he leans on the
		// button by accident (one ping, a startled glance at it, laughs on)
		chestbeat: (D) => {
			const on = laughOn(D);
			const slap = (t) => beats.reduce((a, b, i) => a + (i % 2 ? 0 : hump(t, b - 0.24, 0.24) * (t < b ? 1 : 0)), 0);
			const oops = beats[5];
			return {
				foreL: (t) => on(t) * (-26 - 7 * laughPump(t)) - 18 * hump(t, oops, 0.5),
				handL: (t) => on(t) * (8 * Math.sin((2 * Math.PI * (t - beats[0])) / (2 * GAP))) - 14 * hump(t, oops - 0.02, 0.18),
				foreR: (t) => on(t) * (6 + 30 * slap(t)),
				handR: (t) => on(t) * (-6 - 14 * slap(t)),
				lightL: lights(D, flash(oops, 0.08)),
			};
		},
		// an ordinary win: a thumb on the button, one click
		nod: (D) => ({
			foreL: K([[0, 0], [0.16, -8, 'sineOut'], [0.5, -6], [0.78, 0, 'sineInOut']], D),
			handL: K([[0, 0], [0.16, -6, 'sineOut'], [0.24, -16, 'quadOut'], [0.32, -6, 'quadIn'], [0.78, 0, 'sineInOut']], D),
			foreR: () => 0,
			handR: () => 0,
			lightL: lights(D, flash(0.24, 0.05, 0.85)),
		}),
		// the free spins: he aims at the board and fires — the saucer
		// (TransitionAnimation) comes in on the press (0.58s)
		throwit: (D) => ({
			foreL: K([[0, 0], [0.24, 14, 'sineOut'], [0.48, -52, 'backOut'], [0.54, -46], [0.6, -55, 'quadOut'], [0.92, -50], [1.25, 0, 'sineInOut']], D),
			handL: K([[0, 0], [0.24, 12, 'sineOut'], [0.48, 36, 'backOut'], [0.56, 24, 'quadOut'], [0.66, 32], [1.25, 0, 'sineInOut']], D),
			foreR: K([[0, 0], [0.28, -12, 'sineOut'], [0.6, 24, 'backOut'], [0.92, 18], [1.25, 0, 'sineInOut']], D),
			handR: K([[0, 0], [0.6, -12, 'backOut'], [1.25, 0, 'sineInOut']], D),
			lightL: lights(D, flash(0.56, 0.14, 1, 0.22)),
			signalL: lights(D, flash(0.58, 0.3, 1, 0.2)),
			faces: [[0, 'figure'], [0.5, 'figure_grin'], [1.15, 'figure']],
		}),
		// startled: both hands jump, a twitch on the button
		flinch: (D) => ({
			foreL: K([[0, 0], [0.07, -30, 'backOut'], [0.3, -26], [0.58, 0, 'sineInOut']], D),
			handL: K([[0, 0], [0.07, 16, 'backOut'], [0.3, 12], [0.58, 0, 'sineInOut']], D),
			foreR: K([[0, 0], [0.07, 30, 'backOut'], [0.3, 25], [0.58, 0, 'sineInOut']], D),
			handR: K([[0, 0], [0.07, -18, 'backOut'], [0.3, -14], [0.58, 0, 'sineInOut']], D),
			lightL: lights(D, flash(0.08, 0.03, 0.7, 0.08)),
		}),
		// the meter climbs: he lifts the remote to his visor and reads it
		alert: (D) => ({
			foreL: K([[0, 0], [0.12, 8, 'sineOut'], [0.32, -46, 'backOut'], [0.6, -44], [0.8, 0, 'sineInOut']], D),
			handL: K([[0, 0], [0.32, -30, 'backOut'], [0.6, -28], [0.8, 0, 'sineInOut']], D),
			foreR: () => 0,
			handR: () => 0,
			lightL: lights(D, flash(0.36, 0.03, 0.8, 0.08), flash(0.5, 0.03, 0.8, 0.08)),
		}),
		// HE IS FLYING THE SAUCER (the whole collection; Mascot.svelte loops it
		// from mascotCollect to mascotCollectEnd): remote up, button lit and
		// throbbing, radio waves off the aerial, thumb working the stick —
		// and a smug grin
		control: (D) => ({
			loop: true,
			foreL: (t) => -64 + 2 * Math.sin((2 * Math.PI * t) / D),
			handL: (t) => -30 + 7 * Math.sin((2 * Math.PI * t * 4) / D) + 4 * Math.sin((2 * Math.PI * t * 3) / D + 1),
			foreR: (t) => 14 + 3 * Math.sin((2 * Math.PI * t) / D + 2),
			handR: (t) => -8,
			lightL: (t) => 0.82 + 0.18 * Math.sin((2 * Math.PI * t * 6) / D),
			// three waves rolling out per second-and-a-bit, each fading as it goes
			signalL: (t) => 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin((2 * Math.PI * t * 6) / D), 2),
			body: { head: (t) => 3 + 1.2 * Math.sin((2 * Math.PI * t * 2) / D), torso: (t) => 1 + 0.6 * Math.sin((2 * Math.PI * t) / D) },
			faces: [[0, 'figure_grin']],
		}),
		// he points the remote at the board, holds it there, lowers it
		glance: (D) => ({
			foreL: K([[0, 0], [0.32, -40, 'cubicOut'], [0.86, -37], [1.16, 0, 'sineInOut']], D),
			handL: K([[0, 0], [0.32, 34, 'cubicOut'], [0.86, 30], [1.16, 0, 'sineInOut']], D),
			foreR: () => 0,
			handR: () => 0,
			lightL: () => 0,
		}),
	},
};

// ── the farm kid ────────────────────────────────────────────────────────────
// 2026-10-23 (user, second pass): his arms do not move at all any more —
// raised, the cut arms still read broken — so every clip leaves them where
// they are drawn (and the mesh's upper arms too, see ARMS_STILL). What acts is
// LIGHT: the torch's lens lights and flickers (lightL, a lit face with short
// comic rays — no beam), and the aerial on his pot lights its red ball
// (lightA) and throws comic radio waves (signalA, its rings pulsing out by
// scale) whenever he scores ('ping', Mascot.svelte plays it on a free-game win).
/** the aerial's waves: a ring pulse every `period`s, `n` of them from `at` */
const wavePulse = (at, n, period) => (t) => {
	const u = (t - at) / period;
	if (u < 0 || u >= n) return 1;
	const f = u % 1;
	// each ring snaps out past full size and eases back: 0.7 -> 1.3 -> 1
	return 0.7 + 0.6 * (f < 0.3 ? Math.sin((Math.PI / 2) * (f / 0.3)) : 1 - 0.5 * ((f - 0.3) / 0.7));
};
const blink = (at, n, period, on = 0.6) => (t) => {
	const u = (t - at) / period;
	if (u < 0 || u >= n) return 0;
	return u % 1 < on ? 1 : 0.25;
};
const KID = {
	dir: 'sushiApprentice',
	sides: ['L', 'R'],
	armsStill: true,
	clips: {
		// almost still; once a loop the cheap torch splutters
		idle: (D) => ({
			loop: true,
			lightL: lights(D, flash(3.5, 0.03, 0.55, 0.06), flash(3.66, 0.05, 0.75, 0.14)),
		}),
		// a big win: the torch blazes and the pot signals
		cheer: (D) => ({
			lightL: K([[0, 0], [0.3, 0], [0.36, 1, 'quadOut'], [1.2, 1], [1.4, 0, 'sineIn']], D),
			lightA: (t) => blink(0.32, 4, 0.26, 0.7)(t),
			signalA: K([[0, 0], [0.3, 0], [0.34, 1, 'quadOut'], [1.3, 1], [1.4, 0, 'sineIn']], D),
			signalScale: wavePulse(0.34, 4, 0.26),
			faces: [[0, 'figure'], [0.45, 'figure_grin'], [1.4, 'figure']],
		}),
		// laughing: the lens pumps with every HA
		chestbeat: (D) => {
			const lit = K([[0, 0], [beats[0] - 0.05, 0], [beats[0], 1], [LAUGH_END - 0.15, 1], [LAUGH_END - 0.05, 0]], D);
			return { lightL: (t) => lit(t) * Math.min(1, 0.25 + 0.75 * laughPump(t)) };
		},
		// a win in the base game: one click of the lens
		nod: (D) => ({ lightL: lights(D, flash(0.2, 0.06, 0.85, 0.16)) }),
		// HE SCORES (free game): the pot's bulb blinks and the waves roll out
		// (2026-10-23, user: louder — it is the score's own effect): four
		// pulses over 1.5s, the bulb bursting on each, the head jerking up
		ping: (D) => ({
			lightA: (t) => blink(0.04, 4, 0.34, 0.7)(t),
			signalA: K([[0, 0], [0.04, 1, 'quadOut'], [1.36, 1], [1.5, 0, 'sineIn']], D),
			signalScale: wavePulse(0.04, 4, 0.34),
			lightL: lights(D, flash(0.06, 0.12, 0.9, 0.2), flash(0.72, 0.1, 0.8, 0.2)),
			body: { head: K([[0, 0], [0.1, 3.5, 'backOut'], [0.6, 2.5], [1.4, 0, 'sineInOut']], D) },
			faces: [[0, 'figure'], [0.06, 'figure_grin'], [1.45, 'figure']],
		}),
		throwit: (D) => ({ lightL: lights(D, flash(0.5, 0.3, 1, 0.2)) }),
		// startled: the lens stutters
		flinch: (D) => ({ lightL: K([[0, 0], [0.08, 0], [0.1, 0.9], [0.14, 0], [0.19, 0.9], [0.24, 0]], D) }),
		// the meter climbs: the bulb blinks twice
		alert: (D) => ({
			lightA: blink(0.12, 2, 0.24),
			lightL: lights(D, flash(0.14, 0.1, 0.8, 0.12)),
		}),
		// the collection: lens on and throbbing, the pot signalling the saucer
		control: (D) => ({
			loop: true,
			lightL: (t) => 0.75 + 0.25 * Math.sin((2 * Math.PI * t * 4) / D),
			lightA: (t) => (Math.sin((2 * Math.PI * t * 6) / D) > -0.3 ? 1 : 0.3),
			signalA: () => 1,
			signalScale: (t) => { const f = ((t * 6) / D) % 1; return 0.8 + 0.4 * (f < 0.35 ? Math.sin((Math.PI / 2) * (f / 0.35)) : 1 - 0.5 * ((f - 0.35) / 0.65)); },
			body: { head: (t) => 2 + 1 * Math.sin((2 * Math.PI * t * 2) / D) },
			faces: [[0, 'figure_grin']],
		}),
		// a look at the board, torch flicked on for it
		glance: (D) => ({ lightL: lights(D, flash(0.32, 0.4, 0.8, 0.2)) }),
	},
};
const smoothBump = (t, a, b) => {
	// up over the first 0.35s, held, down over the last 0.35s
	const u = (t - a) / 0.35, v = (b - t) / 0.35;
	const s = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
	return Math.min(s(u), s(v));
};

// clips whose length changes here (throwit gets room to lower the arm)
const LENGTH = { throwit: 1.25, control: 2.4, ping: 1.6 };

function dur(a) {
	let d = 0;
	for (const g of [a.bones, a.slots]) for (const tl of Object.values(g ?? {})) for (const keys of Object.values(tl)) for (const k of keys) d = Math.max(d, k.time ?? 0);
	return d;
}

function build(cast) {
	const C = cast === 'mg' ? CAPTAIN : KID;
	const file = path.join(APP, 'static/assets/spines', C.dir, 'monkey.json');
	const j = JSON.parse(fs.readFileSync(file, 'utf8'));
	if (!j.bones.some((b) => b.name === 'foreLx')) throw new Error(`${C.dir}: no cut arms — run build_cast_mesh.py Saucer with cut='arms' first`);
	// the lights: drawn, but invisible until a clip raises them
	for (const s of j.slots) if (s.name.startsWith('light') || s.name.startsWith('signal')) s.color = 'ffffff00';
	for (const name of C.behind ?? []) {
		const i = j.slots.findIndex((s) => s.name === name);
		if (i > 0) j.slots.unshift(...j.slots.splice(i, 1));
	}
	const report = [];
	for (const [name, make] of Object.entries(C.clips)) {
		// clips made here from nothing (control) start with no body keys
		const a = (j.animations[name] ??= { bones: {}, slots: {} });
		const D = Math.max(LENGTH[name] ?? 0, dur(a));
		const c = make(D);
		const loop = !!c.loop;
		a.bones ??= {};
		for (const side of C.sides) {
			// the mesh's own forearm stays at rest: it is only a stub now, and
			// turning it would bend the end of the sleeve the pieces hang from
			delete a.bones[`fore${side}`];
			const g = C.gimbal?.[side] ?? 0;
			const handF = c[`hand${side}`] && ((t) => c[`hand${side}`](t) - g * c[`fore${side}`](t));
			for (const [bone, key] of [[`fore${side}x`, `fore${side}`], [`hand${side}`, `hand${side}`]]) {
				const f = key.startsWith('hand') ? handF : c[key];
				if (!f) continue;
				a.bones[bone] = { rotate: bk(bone, 'rotate', D, f, loop).keys.map((k) => ({ ...(k.time ? { time: k.time } : {}), value: k.value, ...(k.curve ? { curve: k.curve } : {}) })) };
			}
			for (const kind of ['light', 'signal']) {
				const lf = c[`${kind}${side}`];
				if (!lf || !j.slots.some((sl) => sl.name === `${kind}${side}`)) continue;
				a.slots ??= {};
				a.slots[`${kind}${side}`] = { rgba: alphaKeys(D, lf) };
			}
		}
		// body keys for a clip written here (local rotations, degrees)
		for (const [bone, f] of Object.entries(c.body ?? {})) a.bones[bone] = { rotate: bk(bone, 'rotate', D, f, loop).keys.map((k) => ({ ...(k.time ? { time: k.time } : {}), value: k.value, ...(k.curve ? { curve: k.curve } : {}) })) };
		// the kid's arms stay as drawn (pieces and the mesh's upper arms)
		if (C.armsStill) for (const b of ['armL', 'armR', 'foreL', 'foreR', 'foreLx', 'foreRx', 'handL', 'handR']) delete a.bones[b];
		// lights that are not an arm's (the kid's pot aerial)
		for (const kind of ['lightA', 'signalA']) {
			if (!c[kind] || !j.slots.some((sl) => sl.name === kind)) continue;
			a.slots ??= {};
			a.slots[kind] = { rgba: alphaKeys(D, c[kind]) };
		}
		if (c.signalScale) {
			const n = Math.round(D * 30);
			a.bones.signalA = { scale: Array.from({ length: n + 1 }, (_, i) => { const v = +c.signalScale(i / 30).toFixed(4); return { ...(i ? { time: +(i / 30).toFixed(4) } : {}), x: v, y: v }; }) };
		}
		if (c.faces) {
			a.slots ??= {};
			a.slots.figure = { attachment: c.faces.map(([time, n]) => ({ ...(time ? { time } : {}), name: n })) };
		}
		// a clip lengthened here keeps its last key held to the new end
		if (LENGTH[name]) for (const tl of Object.values(a.bones)) for (const keys of Object.values(tl)) if (keys.length && (keys.at(-1).time ?? 0) < D) keys.push({ ...keys.at(-1), time: D, curve: undefined });
		report.push(`${name} ${D.toFixed(2)}s`);
	}
	// the second track (Mascot.svelte plays 'flutter' on track 1, always): it
	// used to sway the antenna, cape and tail, which would override every
	// follow-through baked on track 0 — so it keys only an empty bone now, and
	// the sway is in the idle itself
	if (!j.bones.some((b) => b.name === 'beat')) j.bones.push({ name: 'beat', parent: 'root' });
	j.animations.flutter = { bones: { beat: { rotate: [{ value: 0 }, { time: 7.2, value: 0 }] } } };
	const ft = followThrough(j, cast, Object.keys(j.animations).filter((n) => n !== 'flutter'));
	if (process.argv.includes('--verbose')) console.log(ft.join(String.fromCharCode(10)));
	fs.writeFileSync(file, JSON.stringify(j));

	// the kit's smoothness check on a 4.3 copy
	const c43 = structuredClone(j);
	c43.skeleton.spine = '4.3.13';
	c43.constraints = (c43.ik ?? []).map(({ order: _o, ...k }) => ({ type: 'ik', ...k }));
	delete c43.ik;
	const reps = checkSkeleton(c43, { loops: ['idle', 'flutter'], only: Object.keys(C.clips) });
	for (const r of reps) {
		const bad = r.issues.filter((i) => i.severity !== 'info');
		console.log(`${cast} ${r.name}: score ${r.score}${bad.length ? ' — ' + bad.map((i) => `${i.severity} ${i.code}${i.bone ? ' ' + i.bone : ''}${i.time !== undefined ? '@' + i.time.toFixed(2) : ''}`).join('; ') : ''}`);
	}
}

/** a light's alpha as linear colour keys at 60fps, the flat stretches merged
 *  (flashes are faster than a Bezier's ten segments could follow cleanly) */
function alphaKeys(D, f) {
	const hex = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
	const n = Math.round(D * 60);
	const vals = Array.from({ length: n + 1 }, (_, i) => hex(f(i / 60)));
	const keys = [];
	for (let i = 0; i <= n; i++) {
		// keep a key where the value changes on either side of it
		if (i === 0 || i === n || vals[i] !== vals[i - 1] || vals[i] !== vals[i + 1]) keys.push({ ...(i ? { time: +(i / 60).toFixed(4) } : {}), color: `ffffff${vals[i]}` });
	}
	return keys;
}

const CASTS_ASKED = process.argv.slice(2).filter((a) => !a.startsWith('--'));
for (const cast of CASTS_ASKED.length ? CASTS_ASKED : ['mg', 'fg']) build(cast);

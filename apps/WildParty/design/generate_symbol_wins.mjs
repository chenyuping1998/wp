// Rewrites animations.win in every wildPartySymbols spine with designer-grade
// motion: anticipation crouch → explosive pop (ease-out) → overshoot settle →
// decaying wiggle → eased return. All keys carry bezier curves (no linear
// interpolation) and each symbol gets a small timing/direction variation so
// simultaneous wins don't move in lockstep.
// Usage: node design/generate_symbol_wins.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(appRoot, 'static/assets/spines/wildPartySymbols');

// ── bezier helpers (Spine 4.1 curve = [t1, v1, t2, v2] per component) ───────
// ease-out: value moves fast early, coasts into the key
const outCurve = (t0, v0, t1, v1) => [t0 + (t1 - t0) * 0.2, v0 + (v1 - v0) * 0.75, t0 + (t1 - t0) * 0.55, v1];
// ease-in: value leaves slowly, accelerates
const inCurve = (t0, v0, t1, v1) => [t0 + (t1 - t0) * 0.45, v0, t0 + (t1 - t0) * 0.8, v0 + (v1 - v0) * 0.25];
// smooth in-out
const smooth = (t0, v0, t1, v1) => [t0 + (t1 - t0) * 0.35, v0, t0 + (t1 - t0) * 0.65, v1];

// build a curved keyframe list for a 2-component track (scale / translate)
const track2 = (keys, curveFns, names = ['x', 'y']) =>
	keys.map((k, i) => {
		const frame = { time: k.t, [names[0]]: k.a, [names[1]]: k.b };
		if (k.t === 0) delete frame.time;
		const fn = curveFns[i];
		if (fn && i < keys.length - 1) {
			const n = keys[i + 1];
			frame.curve = [...fn(k.t, k.a, n.t, n.a), ...fn(k.t, k.b, n.t, n.b)];
		}
		return frame;
	});

const track1 = (keys, curveFns) =>
	keys.map((k, i) => {
		const frame = { time: k.t, value: k.v };
		if (k.t === 0) delete frame.time;
		if (k.v === 0) delete frame.value;
		const fn = curveFns[i];
		if (fn && i < keys.length - 1) {
			const n = keys[i + 1];
			frame.curve = fn(k.t, k.v, n.t, n.v);
		}
		return frame;
	});

// ── the win animation, parameterized per symbol ─────────────────────────────
const winAnimation = (variant) => {
	// variant: 0..9 — shifts timing ±6% and alternates lean direction
	const s = 1 + (variant % 5) * 0.024 - 0.048; // time stretch 0.952..1.048
	const dir = variant % 2 === 0 ? 1 : -1;
	const T = (t) => Number((t * s).toFixed(4));

	return {
		bones: {
			symbol: {
				scale: track2(
					[
						{ t: 0, a: 1, b: 1 },
						{ t: T(0.1), a: 0.92, b: 0.88 }, // anticipation crouch
						{ t: T(0.3), a: 1.52, b: 1.52 }, // explosive pop
						{ t: T(0.52), a: 1.24, b: 1.24 }, // overshoot down
						{ t: T(0.72), a: 1.4, b: 1.4 }, // rebound
						{ t: T(0.95), a: 1.3, b: 1.3 }, // settle
						{ t: T(1.18), a: 1.34, b: 1.34 }, // last breath
						{ t: 1.4, a: 1, b: 1 },
					],
					[inCurve, outCurve, outCurve, smooth, smooth, smooth, inCurve],
				),
				rotate: track1(
					[
						{ t: 0, v: 0 },
						{ t: T(0.1), v: -3 * dir }, // wind-up lean
						{ t: T(0.32), v: 7 * dir },
						{ t: T(0.6), v: -5 * dir },
						{ t: T(0.88), v: 3 * dir },
						{ t: T(1.14), v: -1.5 * dir },
						{ t: 1.4, v: 0 },
					],
					[inCurve, outCurve, smooth, smooth, smooth, smooth],
				),
				translate: track2(
					[
						{ t: 0, a: 0, b: 0 },
						{ t: T(0.1), a: 0, b: -8 }, // crouch sinks
						{ t: T(0.32), a: 0, b: 24 }, // pop jumps
						{ t: T(0.6), a: 0, b: 4 },
						{ t: T(0.85), a: 0, b: 12 },
						{ t: T(1.1), a: 0, b: 2 },
						{ t: 1.4, a: 0, b: 0 },
					],
					[inCurve, outCurve, smooth, smooth, smooth, inCurve],
				),
			},
		},
		slots: {
			symbol: {
				color: [
					{ color: 'ffffffff' },
					{ time: T(0.24), color: 'ffffffff' },
					{ time: T(0.32), color: 'ffeeb0ff' }, // hot flash on the pop
					{ time: T(0.5), color: 'ffffffff' },
					{ time: T(0.78), color: 'ffe9a8ff' }, // softer echo
					{ time: 1.4, color: 'ffffffff' },
				],
			},
		},
	};
};

// idle keeps its shape but gets smoothing curves
const idleAnimation = () => ({
	bones: {
		symbol: {
			scale: track2(
				[
					{ t: 0, a: 1, b: 1 },
					{ t: 0.25, a: 1.04, b: 1.04 },
					{ t: 0.5, a: 1, b: 1 },
					{ t: 0.75, a: 0.98, b: 0.98 },
					{ t: 1, a: 1, b: 1 },
				],
				[smooth, smooth, smooth, smooth],
			),
		},
	},
});

const FILES = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 's', 'w'];
FILES.forEach((name, index) => {
	const file = path.join(DIR, `${name}.json`);
	const spine = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
	spine.animations.win = winAnimation(index);
	spine.animations.idle = idleAnimation();
	fs.writeFileSync(file, JSON.stringify(spine, null, 2) + '\n');
	console.log('rewrote', `${name}.json`);
});
console.log('done');

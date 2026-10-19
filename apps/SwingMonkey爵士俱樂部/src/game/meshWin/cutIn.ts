/**
 * THE FREE-SPIN HELPER'S CUT-IN (sushiScene/chef_cut_in.png, 1024 square) in
 * the meter's level-up (BanditMeter.svelte), as a mesh (2026-10-16).
 *
 * BanditMeter slides the figure in and swings it on the hit; what hangs off it
 * answers those two moves — the tail's tip rising out of his right hand; the two tails of the coat — trailing the slide in, whipping
 * on the hit a beat late, then still. No idle breathing: the hold is a hold.
 *
 * Keyed to BanditMeter's phase clock (its CUT), measured on the art 2026-10-16.
 */
import { flick, smoothstep, type Point } from './meshRig';
import { rect, signSpec } from './signRig';

/** BanditMeter's hit, ms into a step's phase (its CUT) */
export const CUTIN_CUT_MS = 950;

// arriving from the right at speed: what hangs trails right, swings back as it stops
const arrive = (t: number, hz: number, d: number) => -Math.min(1, t / 120) * Math.exp(-t / 260) + 0.6 * flick(t, 300, hz, d);
const hit = (t: number, lag: number, hz: number, d: number) => flick(t, CUTIN_CUT_MS + lag, hz, d);
const tail = (t: number) => 0.6 * arrive(t, 1.4, 2.6) + hit(t, 70, 1.3, 2.4);
const hang = (t: number) => 0.7 * arrive(t, 1.7, 2.8) + 0.8 * hit(t, 40, 1.7, 2.6);

export const CUTIN = signSpec({
	symbol: 'cutIn',
	sprite: 'gbChefCutIn',
	canvas: [1024, 1024],
	cols: 128,
	rows: 128,
	soft: 6,
	reach: 14,
	parts: [
		{ name: 'tail', pivot: [712, 536] as Point, axis: [0.4, -1] as Point, priority: 1, dist: rect(705, 372, 836, 540), keep: (p: Point) => smoothstep((536 - p[1]) / 40) },
		{ name: 'coatL', pivot: [468, 482] as Point, axis: [-0.2, 1] as Point, priority: 1, dist: rect(424, 480, 482, 680), keep: (p: Point) => smoothstep((p[1] - 484) / 60) },
		{ name: 'coatR', pivot: [584, 524] as Point, axis: [0.2, 1] as Point, priority: 1, dist: rect(574, 522, 620, 668), keep: (p: Point) => smoothstep((p[1] - 526) / 50) },
	],
	inked: (p) => rect(705, 372, 836, 540)(p) === 0 || rect(424, 480, 482, 680)(p) === 0 || rect(574, 522, 620, 668)(p) === 0,
	limits: { tail: { pos: 10, neg: 10 }, coatL: { pos: 6, neg: 6 }, coatR: { pos: 6, neg: 6 } },
	act: (name, bone, { t }) => {
		if (name === 'tail') bone.angle = 7.5 * tail(t);
		if (name === 'coatL') bone.angle = 4.5 * hang(t);
		if (name === 'coatR') bone.angle = 4.5 * hang(t);
	},
});

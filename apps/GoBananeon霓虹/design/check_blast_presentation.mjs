import assert from 'node:assert/strict';
import { alphaFragments, MAX_SHARDS_PER_CELL } from '../src/game/blastFragments.ts';
import {
	CHARGE_MS, COPY_FLIGHT_MS, COLUMN_FLASH_DELAY_MS, COLUMN_FLASH_MS, CELL_REVEAL_MS,
	blastBeats, blastEndAt, blastLook, cellRevealAt, copyArriveAt, impactAt, phasesAt, pillarAt,
} from '../src/game/blastTimeline.ts';

let previousEnd = 0;
for (let width = 1; width <= 5; width++) {
	const beats = blastBeats(width);
	const ph = phasesAt(0, beats);
	assert.ok(beats.hold >= 120, 'The hidden swap lost its safety window');
	assert.equal(ph.SWAP_AT + beats.hold, ph.DISPERSE_AT);
	assert.equal(beats.total, ph.DISPERSE_AT + beats.disperse);
	const done = [];
	for (let reel = 0; reel < width; reel++) {
		let previousArrival = 0;
		for (let row = 1; row <= 4; row++) {
			const at = copyArriveAt(ph.DISPERSE_AT, beats.disperse, reel, row);
			assert.ok(at - COPY_FLIGHT_MS >= ph.SWAP_AT, 'A copy exposes the new fill before the board swap');
			assert.ok(at > previousArrival, 'Cell reveals must cascade down each reel');
			for (let t = ph.SWAP_AT; t < at; t += 1000 / 60)
				assert.equal(cellRevealAt(t, at), 0, 'The mask opens before the copy lands');
			assert.equal(cellRevealAt(at + CELL_REVEAL_MS, at), 1);
			previousArrival = at;
		}
		done.push(previousArrival + COLUMN_FLASH_DELAY_MS);
	}
	const end = blastEndAt(beats, done);
	assert.ok(end >= Math.max(...done) + COLUMN_FLASH_MS, 'The blast promise finishes before the final frame flash');
	assert.ok(end >= previousEnd, 'Larger blasts should not cut off sooner');
	previousEnd = end;
	for (let t = -500; t < end + 500; t += 1000 / 30) {
		const p = phasesAt(t, beats);
		for (const key of ['charge', 'shatter', 'puff', 'disperse']) assert.ok(p[key] >= 0 && p[key] <= 1);
		const pillar = pillarAt(p.puff, p.disperse, 140, 560);
		for (const value of Object.values(pillar)) assert.ok(Number.isFinite(value) && value >= 0);
	}
	console.log(`OK: ${width} reel(s): bang ${CHARGE_MS} / smoke ${ph.PUFF_AT} / swap ${ph.SWAP_AT} / reveal ${ph.DISPERSE_AT} / finished ${Math.round(end)} ms`);
}
for (let level = 1; level <= 5; level++) {
	const look = blastLook(level, level === 5);
	assert.equal(impactAt(-1, look.hitStop).flash, 0);
	assert.equal(impactAt(look.hitStop / 2, look.hitStop).expand, 0, 'Impact hold is missing');
	assert.ok(impactAt(look.hitStop + 40, look.hitStop).expand > 0);
	assert.deepEqual(impactAt(900, look.hitStop), { flash: 0, expand: 1, shock: 0, afterglow: 0 });
}
console.log('OK: masks remain closed during swaps, reveals cascade, impact holds are bounded, every column flash completes before flow resumes');

// A narrow transparent symbol is the hard case: its empty margins must not
// consume the debris budget, and its fragments must keep their board positions.
const rgba = new Uint8ClampedArray(96 * 96 * 4);
for (let y = 15; y < 81; y++) for (let x = 40; x < 56; x++) rgba[(y * 96 + x) * 4 + 3] = 255;
const narrow = alphaFragments(rgba, 96, 96);
assert.ok(narrow.length > 0 && narrow.length <= MAX_SHARDS_PER_CELL);
for (const p of narrow) {
	assert.ok(p.x >= 40 / 96 && p.x + p.w <= 56 / 96 + 1e-8, 'Transparent side margins became fragments');
	assert.ok(p.y >= 15 / 96 && p.y + p.h <= 81 / 96 + 1e-8);
	assert.ok(p.mass > 0, 'An invisible fragment wasted the particle budget');
}
assert.equal(alphaFragments(new Uint8ClampedArray(rgba.length), 96, 96).length, 0, 'Empty art creates invisible sprites');
const area = narrow.reduce((sum, p) => sum + p.w * p.h, 0);
assert.ok(Math.abs(area - 16 * 66 / (96 * 96)) < 1e-8, 'Alpha trimming lost or duplicated visible symbol area');
console.log('OK: alpha-aware fragments reconstruct narrow art and skip empty padding; full-board art debris is capped at 360 sprites including edge copies');

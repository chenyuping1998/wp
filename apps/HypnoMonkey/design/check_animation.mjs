// @ts-nocheck -- Node-only offline checker; assertions execute against runtime data.
// Offline timing and five multiplier scenarios from the exported math books.
// Use E:/stake/tools/node-v22.23.1-win-x64/node.exe design/check_animation.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
	medusaAnimations,
	tumbleTiming,
	throwTiming,
	multiplierStages,
} from '../src/game/animationTimeline.ts';

const books = JSON.parse(
	fs.readFileSync(new URL('../src/dev/devBooks.json', import.meta.url), 'utf8'),
);
const cases = new Map();
let checkedThrows = 0;
let noThrowWins = 0;
for (const [category, entries] of Object.entries(books)) {
	for (const book of entries) {
		let cumulative = 0;
		let spin;
		const finishSpin = () => {
			if (!spin || spin.mode !== 'freegame' || spin.thrown || !spin.baseWin || spin.scatterWin)
				return;
			assert.equal(spin.finalWin, spin.baseWin, 'FG win without a throw must remain ×1');
			noThrowWins += 1;
			if (!cases.has('fg_no_throw_win'))
				cases.set('fg_no_throw_win', {
					category,
					bookId: book.id,
					revealIndex: spin.index,
					baseWin: spin.baseWin,
					priorTotal: cumulative,
					newTotal: cumulative,
					totalWin: spin.finalWin,
					stages: multiplierStages({
						freegame: true,
						turbo: false,
						applied: true,
						orbCount: 0,
						mult: 1,
					}),
				});
		};
		for (const event of book.state) {
			if (event.type === 'freeSpinTrigger') cumulative = 0;
			if (event.type === 'reveal') {
				finishSpin();
				spin = {
					mode: event.gameType,
					index: event.index,
					baseWin: 0,
					thrown: false,
					finalWin: 0,
					scatterWin: false,
				};
			}
			if (event.type === 'winInfo') spin.baseWin += event.totalWin;
			if (event.type === 'scatterWin') spin.scatterWin = true;
			if (event.type === 'setWin') spin.finalWin = event.amount;
			if (event.type !== 'medusaThrow') continue;
			spin.thrown = true;
			checkedThrows += 1;
			const freegame = spin.mode === 'freegame';
			const priorTotal = cumulative;
			const sum = event.multipliers.reduce((a, b) => a + b, 0);
			assert.equal(event.applied, event.baseWin > 0);
			assert.equal(event.baseWin, spin.baseWin);
			if (event.applied) {
				assert.equal(event.mult, freegame ? cumulative + sum : sum);
				assert.equal(event.totalWin, Math.min(1500000, event.baseWin * event.mult));
				if (freegame) cumulative = event.mult;
			} else {
				assert.equal(event.totalWin, 0);
				assert.equal(event.mult, freegame ? cumulative : 1);
			}
			const name = `${freegame ? 'fg' : 'base'}_throw_${event.applied ? 'win' : 'dud'}`;
			const input = {
				freegame,
				applied: event.applied,
				orbCount: event.multipliers.length,
				mult: event.mult,
			};
			const normal = throwTiming({ ...input, turbo: false });
			const turbo = throwTiming({ ...input, turbo: true });
			assert.equal(normal.flightMs, 450);
			assert.equal(turbo.flightMs, 270);
			assert.ok(normal.firstArrivalMs > normal.releaseMs);
			if (event.applied) {
				assert.ok(turbo.landMs >= 80, 'Turbo must preserve a readable impact');
				assert.ok(normal.countMs >= 600 && normal.countMs <= 1200);
				if (freegame) {
					assert.equal(normal.plateCountMs, 400);
					assert.equal(
						normal.scoreStartMs,
						normal.lastArrivalMs + normal.landMs + 400 + normal.beamMs,
					);
				}
			} else {
				assert.equal(cumulative, priorTotal, 'wasted orb must never add to the plate');
				assert.ok(normal.endMs <= 1200, 'wasted-orb visual must end within 1.2 seconds');
			}
			if (!cases.has(name))
				cases.set(name, {
					category,
					bookId: book.id,
					eventIndex: event.index,
					multipliers: event.multipliers,
					baseWin: event.baseWin,
					totalWin: event.totalWin,
					priorTotal,
					newTotal: cumulative,
					normal,
					turbo,
					stages: multiplierStages({ ...input, turbo: false }),
				});
		}
		finishSpin();
	}
}
assert.deepEqual([...cases.keys()].sort(), [
	'base_throw_dud',
	'base_throw_win',
	'fg_no_throw_win',
	'fg_throw_dud',
	'fg_throw_win',
]);
const chainMs = (turbo, turboLevel = 1) =>
	Array.from(
		{ length: 8 },
		(_, i) => tumbleTiming({ chain: i + 1, turbo, turboLevel }).totalMs,
	).reduce((a, b) => a + b, 0);
assert.ok(chainMs(false) <= 10000);
assert.equal(tumbleTiming({ chain: 4 }).scale, 0.8);
assert.equal(chainMs(true), chainMs(false) * 0.5);
assert.equal(medusaAnimations.gaze.peekAtMs + 250, medusaAnimations.gaze.beamAtMs);
assert.equal(medusaAnimations.gaze_turbo.durationMs, 900);
const threeOrbs = throwTiming({
	freegame: true,
	turbo: false,
	applied: true,
	orbCount: 3,
	mult: 15,
});
assert.equal(threeOrbs.lastArrivalMs - threeOrbs.firstArrivalMs, 300);
const report = {
	verification:
		'Offline timings and exported book data only; no rendered recording or Stake Engine run.',
	checkedThrows,
	noThrowWins,
	eightLinkChainMs: {
		normal: chainMs(false),
		turbo: chainMs(true),
		turbo2: chainMs(true, 2),
	},
	cases: Object.fromEntries(cases),
	pending: [
		'Approved character art and Spine 4.2.74 rig',
		'Frame-by-frame hand/sunglasses and snake checks',
		'60s idle recording',
		'8-link cascade recording',
		'Five multiplier scenario recordings',
		'User upload and validation in Stake Engine',
	],
};
fs.writeFileSync(
	new URL('./animation-validation.json', import.meta.url),
	JSON.stringify(report, null, 2) + '\n',
);
console.log(
	`Animation checks passed: ${checkedThrows} throws, ${noThrowWins} FG wins without throw, all five scenarios. Eight-link budget ${chainMs(false)}ms; Turbo ${chainMs(true)}ms; Turbo 2 ${chainMs(true, 2)}ms.`,
);

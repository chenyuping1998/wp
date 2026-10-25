// Real-time/background lighting invariants, using the same pure code as Pixi.
// node 22.18+ design/check_background_stage.mjs
import assert from 'node:assert/strict';
import { BackgroundClock, CLUB_STYLE, clubStageFrame, projectStagePoint, quietStageCues, stageBeat, stageResponse } from '../src/game/backgroundStage.ts';

for (const fps of [30, 60, 144]) {
	const clock = new BackgroundClock();
	clock.frame(0);
	for (let i = 1; i <= fps * 10; i++) clock.frame(i * 1000 / fps);
	assert.ok(Math.abs(clock.frame(10000) - 10000) < 1e-6, `clock drifts at ${fps} FPS`);
}
const clock = new BackgroundClock();
clock.frame(0); clock.frame(20);
assert.equal(clock.frame(20000, false), 20);
assert.equal(clock.frame(50000), 20, 'returning to a hidden tab must not catch up');
assert.equal(clock.frame(50020), 40);
assert.equal(clock.frame(51020), 115, 'long stalls are bounded to 75ms');
assert.equal(clock.frame(50000), 115, 'backwards input cannot reverse the scene');
assert.equal(clock.frame(51040), 135, 'backwards input cannot count the same interval twice');
console.log('ok clock: 30/60/144Hz agree; hidden tabs, stalls and backwards inputs do not jump');

assert.equal(CLUB_STYLE.base.bpm, 105);
assert.equal(CLUB_STYLE.feature.bpm, 128);
assert.equal(CLUB_STYLE.hold.bpm, 128);
for (const bpm of [105, 128, 125]) for (const t of [0, 38, 120, 245, 1900])
	assert.ok(Math.abs(stageBeat(t, bpm) - stageBeat(t + 60000 / bpm, bpm)) < 1e-10);

const quiet = quietStageCues();
const dj = { ...quiet, djAt: 0 };
const stopped = { ...dj, djStopAt: 900 };
assert.equal(stageResponse('base', 1000, quiet).dj, 0);
assert.equal(stageResponse('base', 800, dj).dj, 1);
assert.ok(stageResponse('base', 950, stopped).dj < 1);
assert.equal(stageResponse('base', 1120, stopped).dj, 0, 'DJ stop must finish its release');
assert.equal(stageResponse('base', 3200, dj).dj, 0, 'DJ light may not remain active after its gesture');
const beatCue = { ...quiet, chestAt: 0 };
assert.equal(stageResponse('base', 479, beatCue).chest, 0);
assert.ok(stageResponse('base', 510, beatCue).chest > 0.5);
assert.equal(stageResponse('base', 2300, beatCue).chest, 0);
console.log('ok cues: 105/128 BPM groove; 125 BPM DJ releases on stop; chest accents end');

const viewports = [{ width: 2039, height: 1000 }, { width: 1422, height: 800 }, { width: 800, height: 1422 }, { width: 390, height: 844 }];
for (const viewport of viewports) {
	const scale = Math.max(viewport.width / 1920, viewport.height / 1080) * 1.08;
	const plate = { x: (viewport.width - 1920 * scale) / 2, y: (viewport.height - 1080 * scale) / 2, width: 1920 * scale, height: 1080 * scale };
	const a = projectStagePoint(plate, 0, 0), b = projectStagePoint(plate, 256, 144);
	assert.deepEqual(a, { x: plate.x, y: plate.y });
	assert.deepEqual(b, { x: plate.x + plate.width, y: plate.y + plate.height });
	for (const mode of ['base', 'feature', 'hold']) {
		for (let t = 0; t <= 12000; t += 113) {
			const cues = { ...quiet, djAt: 300, chestAt: 1700, fuseAt: 4500, burstAt: 4880, burstStrength: 1, coinAt: 6000 };
			const frame = clubStageFrame(mode, t, plate, viewport, cues);
			assert.equal(frame.beams.length, 4);
			assert.ok(frame.rails.length <= 5 && frame.signs.length <= 4 && frame.particles.length <= 18 && frame.rain.length <= 24);
			assert.equal(frame.reflections.length, 22);
			const numbers = (value) => typeof value === 'number' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(numbers) : [];
			assert.ok(numbers(frame).every(Number.isFinite), `non-finite ${mode} geometry at ${t}`);
			for (const collection of [frame.beams, frame.rails, frame.signs, frame.reflections, frame.particles, frame.rain])
				for (const item of collection) assert.ok(item.alpha >= 0 && item.alpha <= 0.65, 'lighting exceeds its opacity budget');
			for (const beam of frame.beams) {
				assert.ok(beam.end.x >= 0 && beam.end.x <= viewport.width && beam.end.y <= viewport.height);
				assert.ok(beam.end.x + beam.spread < viewport.width * 0.34 || beam.end.x - beam.spread > viewport.width * 0.66, 'beam fills the central reel area');
			}
		}
	}
}
console.log('ok geometry: landscape/tablet/portrait; fixed object budgets, finite values, readable centre');
console.log('check_background_stage: all checks passed');

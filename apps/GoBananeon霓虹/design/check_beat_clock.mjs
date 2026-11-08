// The music grid (src/game/beatClock.ts) against the track it mirrors, and the
// stage lighting fed from it. node 22.18+ design/check_beat_clock.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chordAt, kickSteps, LOOP_BARS, MUSIC_GRID, musicAt, pulse } from '../src/game/beatClock.ts';
import { clubStageFrame, quietStageCues } from '../src/game/backgroundStage.ts';
import loops from '../src/game/neonAudioLoops.json' with { type: 'json' };

// 1. the grid is the track's: tempo, loop length, kick pattern, chords
const build = fs.readFileSync(new URL('./build_neon_audio_v3.py', import.meta.url), 'utf8');
assert.equal(loops.bgm_main.bpm, MUSIC_GRID.base.bpm);
assert.equal(loops.bgm_freespin.bpm, MUSIC_GRID.freespin.bpm);
for (const [key, scene] of [['bgm_main', 'base'], ['bgm_freespin', 'freespin']]) {
	const seconds = loops[key].frames / loops[key].sampleRate;
	assert.ok(Math.abs(seconds - LOOP_BARS * 4 * 60 / MUSIC_GRID[scene].bpm) < 1e-6, `${key} loop is not ${LOOP_BARS} bars`);
}
assert.ok(build.includes('for b in ([0, 1.5, 2, 3.25] if not energy else [0, 1, 2, 3]):'), 'kick pattern changed in music(); update MUSIC_GRID');
assert.ok(build.includes('roots = [48, 44, 51, 46]'), 'chord roots changed in music(); update CHORD_ROOTS');
assert.deepEqual([...MUSIC_GRID.base.kicks], [0, 1.5, 2, 3.25]);
assert.deepEqual(kickSteps('base'), [0, 6, 8, 13]);
assert.deepEqual(kickSteps('freespin'), [0, 4, 8, 12]);
assert.deepEqual(chordAt(0), [60, 63, 67, 70]);
assert.deepEqual(chordAt(2), [56, 60, 63, 66]);
assert.deepEqual(chordAt(16), chordAt(0));
console.log('ok grid: 105/128 BPM, 16-bar loops, kick patterns and chords match build_neon_audio_v3.py');

// 2. kicks land where the drummer plays them, nothing leads the sound
const anchor = { scene: 'base', startMs: 1000 };
const beatMs = 60000 / 105;
for (const k of MUSIC_GRID.base.kicks) {
	const at = 1000 + 4 * beatMs * 3 + k * beatMs;
	assert.ok(musicAt(at - 1, 'base', anchor).kick < 0.25, `light leads the kick at ${k}`);
	assert.ok(musicAt(at + 16, 'base', anchor).kick > 0.99, `no flare on the kick at ${k}`);
}
assert.ok(musicAt(1000 + beatMs * 1.0 + 20, 'base', anchor).kick < 0.15, 'base has no kick on beat 2');
const loopMs = LOOP_BARS * 4 * beatMs;
for (const t of [1234, 5000, 20000]) {
	const a = musicAt(t, 'base', anchor), b = musicAt(t + loopMs, 'base', anchor);
	assert.ok(Math.abs(a.beats - b.beats) < 1e-6 && Math.abs(a.kick - b.kick) < 1e-9);
}
assert.ok(musicAt(500, 'base', anchor).beats >= 0, 'before the anchor the grid still wraps forward');
assert.equal(musicAt(0, 'freespin', null).live, false);
assert.equal(pulse(-1), 0);
assert.equal(pulse(Infinity), 0);
console.log('ok kick: zero before each hit, full 16ms after, base syncopation, loop-periodic');

// 3. the stage keeps its light budget with the music driving it
const quiet = quietStageCues();
const viewport = { width: 1422, height: 800 };
const scale = Math.max(viewport.width / 1920, viewport.height / 1080) * 1.08;
const plate = { x: (viewport.width - 1920 * scale) / 2, y: (viewport.height - 1080 * scale) / 2, width: 1920 * scale, height: 1080 * scale };
for (const mode of ['base', 'feature', 'hold'])
	for (const kick of [0, 0.5, 1]) for (const downbeat of [0, 1]) for (const bars of [0, 0.37, 3.9]) {
		const cues = { ...quiet, chestAt: 0, burstAt: 600, burstStrength: 1, coinAt: 700 };
		const frame = clubStageFrame(mode, 800, plate, viewport, cues, { kick, downbeat, bars });
		for (const collection of [frame.beams, frame.rails, frame.signs, frame.reflections, frame.particles, frame.rain])
			for (const item of collection) assert.ok(item.alpha >= 0 && item.alpha <= 0.65, `${mode} light over budget with music`);
	}
const lo = clubStageFrame('base', 5000, plate, viewport, quiet, { kick: 0, downbeat: 0, bars: 0.5 });
const hi = clubStageFrame('base', 5000, plate, viewport, quiet, { kick: 1, downbeat: 0, bars: 0.5 });
assert.ok(hi.beams[0].alpha > lo.beams[0].alpha * 1.4, 'the kick must read in the lamp beams');
const fused = clubStageFrame('base', 5000, plate, viewport, { ...quiet, fuseAt: 4630 }, { kick: 1, downbeat: 0, bars: 0.5 });
assert.ok(fused.response.beat < hi.response.beat * 0.4, 'the fuse holds the groove');
console.log('ok stage: kick-driven light stays in budget; beams flare on kicks; the fuse holds the groove');
console.log('check_beat_clock: all checks passed');

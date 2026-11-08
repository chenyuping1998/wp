// The band's harmony and tempo exist twice: in the generator that writes the
// music (design/generate_swing_audio_v2.py) and in the runtime that plays
// notes over it (src/game/musicClock.ts CHORDS, Sound.svelte BGM_FILES /
// LOOP_BPM). If they drift, every reel stop, win note and instrument hit is
// pitched to a chord the band is not playing, or scheduled on a beat it is
// not on — and nothing else would notice. 2026-11-06.
//
// Usage: node design/check_swing_music.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const gen = read('design/generate_swing_audio_v2.py');
const clock = read('src/game/musicClock.ts');
const sound = read('src/components/Sound.svelte');
const errors = [];

const pyChords = [...(gen.match(/^CHORDS = \[([\s\S]*?)^\]/m)?.[1] ?? '').matchAll(/\((\d+),\s*'(\w+)'\)/g)].map((m) => `${m[1]}:${m[2]}`);
const tsChords = [...(clock.match(/export const CHORDS[^=]*= \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/\[(\d+),\s*'(\w+)'\]/g)].map((m) => `${m[1]}:${m[2]}`);
if (pyChords.length !== 16) errors.push(`generator CHORDS parsed as ${pyChords.length} bars, expected 16`);
if (pyChords.join(' ') !== tsChords.join(' ')) errors.push(`chord tables differ:\n  generator ${pyChords.join(' ')}\n  runtime   ${tsChords.join(' ')}`);

const pyQual = Object.fromEntries([...(gen.match(/^QUALITY = \{(.*)\}/m)?.[1] ?? '').matchAll(/'(\w+)':\s*\(([\d,\s]+)\)/g)].map((m) => [m[1], m[2].replace(/\s/g, '')]));
const tsQual = Object.fromEntries([...(clock.match(/export const QUALITY[^=]*= \{([\s\S]*?)\};/)?.[1] ?? '').matchAll(/(\w+):\s*\[([\d,\s]+)\]/g)].map((m) => [m[1], m[2].replace(/\s/g, '')]));
if (JSON.stringify(pyQual) !== JSON.stringify(tsQual)) errors.push(`chord qualities differ: ${JSON.stringify(pyQual)} vs ${JSON.stringify(tsQual)}`);

const num = (src, re, what) => {
	const m = src.match(re);
	if (!m) errors.push(`could not find ${what}`);
	return m ? Number(m[1]) : NaN;
};
const bpmBase = num(gen, /^BPM_BASE, BPM_FREE = (\d+), \d+/m, 'BPM_BASE');
const bpmFree = num(gen, /^BPM_BASE, BPM_FREE = \d+, (\d+)/m, 'BPM_FREE');
const swBase = num(gen, /SWING = \{BPM_BASE: ([\d.]+)/, 'base swing');
const swFree = num(gen, /BPM_FREE: ([\d.]+)\}/, 'free swing');
const loopBpm = num(gen, /^LOOP_BPM = (\d+)/m, 'generator LOOP_BPM');
const sBase = sound.match(/base: \{[^}]*bpm: (\d+), swing: ([\d.]+)/);
const sFree = sound.match(/freespin: \{[^}]*bpm: (\d+), swing: ([\d.]+)/);
if (!sBase || Number(sBase[1]) !== bpmBase || Number(sBase[2]) !== swBase) errors.push(`Sound.svelte base bpm/swing ${sBase?.slice(1)} != generator ${bpmBase}/${swBase}`);
if (!sFree || Number(sFree[1]) !== bpmFree || Number(sFree[2]) !== swFree) errors.push(`Sound.svelte freespin bpm/swing ${sFree?.slice(1)} != generator ${bpmFree}/${swFree}`);
if (num(sound, /const LOOP_BPM = (\d+);/, 'Sound LOOP_BPM') !== loopBpm) errors.push('Sound.svelte LOOP_BPM differs from the generator');

for (const f of ['bgm_main.mp3', 'bgm_main_groove.mp3', 'bgm_freespin.mp3', 'bgm_freespin_groove.mp3'])
	if (!fs.existsSync(path.join(root, 'static/assets/audio/swing', f))) errors.push(`missing stem ${f}`);

if (errors.length) {
	console.error('check_swing_music:\n' + errors.join('\n'));
	process.exit(1);
}
console.log(`OK: band tables agree (16 bars, ${bpmBase}/${bpmFree} bpm, swing ${swBase}/${swFree}, loops at ${loopBpm})`);

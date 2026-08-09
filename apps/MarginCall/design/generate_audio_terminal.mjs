// Margin Call audio — pure-Node synthesis, writes 16-bit PCM WAV. No deps.
//
// Palette is a trading floor at night rather than an orchestra: filtered square
// and saw blips for the terminal, a sine sub for weight, band-passed noise for
// air, and one klaxon for the margin call itself. Everything is built from the
// same four generators so the set sounds like one instrument family, which is
// what stops a synthesized set reading as stock sounds glued together.
//
// Usage: node design/generate_audio_terminal.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/audio/terminal');
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100; // one-shots
const SR_BGM = 22050; // loops stay small as 22 kHz mono

// ─── plumbing ───────────────────────────────────────────────────────────────
// Deterministic PRNG: regenerating must produce byte-identical files, or every
// rebuild churns the repo and nobody can tell a real change from noise.
let seed = 20260808;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const rand2 = () => rand() * 2 - 1;

const buffer = (dur, sr = SR) => new Float32Array(Math.ceil(dur * sr));

const addAt = (dst, src, offsetSec, gain = 1, sr = SR) => {
	const start = Math.round(offsetSec * sr);
	for (let i = 0; i < src.length && start + i < dst.length; i++) dst[start + i] += src[i] * gain;
};

const normalize = (buf, peak = 0.82) => {
	let max = 1e-9;
	for (const v of buf) max = Math.max(max, Math.abs(v));
	const g = peak / max;
	for (let i = 0; i < buf.length; i++) buf[i] *= g;
	return buf;
};

// Short fades at both ends. On a loop this is what removes the click at the
// seam; on a one-shot it removes the click at the start.
const fadeEnds = (buf, sr, ms = 6) => {
	const n = Math.min(buf.length >> 1, Math.round((ms / 1000) * sr));
	for (let i = 0; i < n; i++) {
		buf[i] *= i / n;
		buf[buf.length - 1 - i] *= i / n;
	}
	return buf;
};

const writeWav = (name, buf, sr = SR) => {
	const data = Buffer.alloc(buf.length * 2);
	for (let i = 0; i < buf.length; i++) {
		const s = Math.max(-1, Math.min(1, buf[i]));
		data.writeInt16LE(Math.round(s * 32767), i * 2);
	}
	const header = Buffer.alloc(44);
	header.write('RIFF', 0);
	header.writeUInt32LE(36 + data.length, 4);
	header.write('WAVE', 8);
	header.write('fmt ', 12);
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20); // PCM
	header.writeUInt16LE(1, 22); // mono
	header.writeUInt32LE(sr, 24);
	header.writeUInt32LE(sr * 2, 28);
	header.writeUInt16LE(2, 32);
	header.writeUInt16LE(16, 34);
	header.write('data', 36);
	header.writeUInt32LE(data.length, 40);
	const out = path.join(OUT, `${name}.wav`);
	fs.writeFileSync(out, Buffer.concat([header, data]));
	console.log(`  ${name}.wav  ${(fs.statSync(out).size / 1024).toFixed(1)} KB  ${(buf.length / sr).toFixed(2)}s`);
};

// ─── generators ─────────────────────────────────────────────────────────────
// Exponential decay: percussive unless `hold` keeps the head flat.
const env = (i, len, decay = 6, hold = 0) => {
	const t = i / len;
	if (t < hold) return 1;
	return Math.exp((-(t - hold) / (1 - hold)) * decay);
};

// freq may be a number or a function of normalised time, which is what makes
// one generator cover both a steady blip and a sweep.
const at = (f, t) => (typeof f === 'function' ? f(t) : f);

const tone = (dur, freq, { shape = 'sine', decay = 6, hold = 0, sr = SR } = {}) => {
	const buf = buffer(dur, sr);
	let phase = 0;
	for (let i = 0; i < buf.length; i++) {
		const t = i / buf.length;
		phase += (2 * Math.PI * at(freq, t)) / sr;
		let v;
		if (shape === 'sine') v = Math.sin(phase);
		else if (shape === 'square') v = Math.sin(phase) >= 0 ? 1 : -1;
		else if (shape === 'saw') v = ((phase / Math.PI) % 2) - 1;
		else v = Math.sin(phase) + 0.35 * Math.sin(2 * phase); // 'rich'
		buf[i] = v * env(i, buf.length, decay, hold);
	}
	return buf;
};

const noise = (dur, { decay = 8, hold = 0, sr = SR } = {}) => {
	const buf = buffer(dur, sr);
	for (let i = 0; i < buf.length; i++) buf[i] = rand2() * env(i, buf.length, decay, hold);
	return buf;
};

// One-pole low-pass; cutoff may sweep, which is how the spin whoosh opens up.
const lowpass = (buf, cutoff, sr = SR) => {
	let y = 0;
	for (let i = 0; i < buf.length; i++) {
		const fc = at(cutoff, i / buf.length);
		const a = 1 - Math.exp((-2 * Math.PI * fc) / sr);
		y += a * (buf[i] - y);
		buf[i] = y;
	}
	return buf;
};

const highpass = (buf, cutoff, sr = SR) => {
	let y = 0;
	const out = new Float32Array(buf.length);
	for (let i = 0; i < buf.length; i++) {
		const a = 1 - Math.exp((-2 * Math.PI * at(cutoff, i / buf.length)) / sr);
		y += a * (buf[i] - y);
		out[i] = buf[i] - y;
	}
	return out;
};

// Feedback delay. Cheap depth: a dry blip sounds like a UI beep, the same blip
// with a short tail sounds like it happened in a room.
const delay = (buf, timeSec, feedback = 0.35, mix = 0.3, sr = SR) => {
	const d = Math.round(timeSec * sr);
	const out = Float32Array.from(buf);
	for (let i = d; i < out.length; i++) out[i] += out[i - d] * feedback * mix;
	return out;
};

// ─── one-shots ──────────────────────────────────────────────────────────────
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI number -> Hz

// A soft key click, not a beep: mostly the transient.
const uiClick = () => {
	const b = buffer(0.09);
	addAt(b, lowpass(noise(0.05, { decay: 30 }), 3200), 0, 0.55);
	addAt(b, tone(0.07, NOTE(81), { shape: 'sine', decay: 22 }), 0, 0.35);
	return fadeEnds(normalize(b, 0.6), SR, 3);
};

// Spin: a filter opening upward, which reads as machinery starting rather than
// as a sound effect being triggered.
const spinStart = () => {
	const b = noise(0.42, { decay: 3, hold: 0.1 });
	const swept = lowpass(b, (t) => 300 + 5200 * t * t, SR);
	const out = buffer(0.45);
	addAt(out, swept, 0, 0.9);
	addAt(out, tone(0.4, (t) => 90 + 60 * t, { shape: 'sine', decay: 4 }), 0, 0.5);
	return fadeEnds(normalize(out, 0.62), SR, 6);
};

// Reel stop. Deliberately the DULLEST cue in the set: a dry mechanical knock
// with almost no pitch to it. It fires five times a spin, under everything else,
// and anything with tone in it competes with the two cues that actually carry
// information (a LEVERAGE landing and a MARGIN CALL landing). Pitched per reel by
// playbackRate in Sound.svelte, so it has to hold up across roughly 0.9x-1.3x —
// hence the short body and the hard head.
const reelStop = () => {
	const b = buffer(0.12);
	// the knock: a band of noise, gone almost immediately
	addAt(b, lowpass(highpass(noise(0.05, { decay: 55 }), 250), 2600), 0, 0.85);
	// just enough body to feel weight, not enough to sing
	addAt(b, tone(0.07, (t) => 150 - 60 * t, { shape: 'sine', decay: 26 }), 0, 0.4);
	return fadeEnds(normalize(b, 0.55), SR, 3);
};

// A MARGIN CALL landing. Five of them, rising, so three in a row is audibly a
// countdown rather than three unrelated pings.
//
// Built as a siren, not a note: two saws detuned against each other and swept
// upward, which beats and buzzes the way an alarm does. That is what separates it
// from the LEVERAGE chime - different waveform, different envelope, different
// motion - so the two are never in doubt even when both land in one spin.
const alert = (step) => {
	const root = NOTE(70 + step * 2);
	const b = buffer(0.62);
	const sweep = (t) => root * (1 + 0.22 * t);
	addAt(b, tone(0.42, sweep, { shape: 'saw', decay: 5, hold: 0.15 }), 0, 0.34);
	// the detune is the whole point: the beating between them is the alarm
	addAt(b, tone(0.42, (t) => sweep(t) * 1.012, { shape: 'saw', decay: 5, hold: 0.15 }), 0, 0.34);
	// a hard transient so it cuts through a busy board
	addAt(b, highpass(noise(0.05, { decay: 34 }), 1800), 0, 0.4);
	// sub thump underneath, growing with the count
	addAt(b, tone(0.3, NOTE(38), { shape: 'sine', decay: 8 }), 0, 0.2 + step * 0.06);
	const shaped = lowpass(b, 3400);
	return fadeEnds(normalize(delay(shaped, 0.13, 0.34, 0.3), 0.72), SR, 4);
};

// The margin call itself: a two-tone klaxon. This is the only sound in the set
// allowed to be unpleasant.
const marginCall = () => {
	const b = buffer(2.4);
	for (let k = 0; k < 3; k++) {
		const t0 = k * 0.72;
		addAt(b, tone(0.34, NOTE(70), { shape: 'saw', decay: 3, hold: 0.5 }), t0, 0.5);
		addAt(b, tone(0.34, NOTE(65), { shape: 'saw', decay: 3, hold: 0.5 }), t0 + 0.36, 0.5);
	}
	addAt(b, tone(2.2, (t) => 60 + 18 * Math.sin(t * 26), { shape: 'sine', decay: 1.4 }), 0, 0.55);
	const shaped = lowpass(b, 2600);
	return fadeEnds(normalize(shaped, 0.78), SR, 10);
};

// Big-win impact: sub drop under a bright transient.
const blast = () => {
	const b = buffer(1.5);
	addAt(b, tone(1.1, (t) => 150 * Math.exp(-3.4 * t) + 38, { shape: 'sine', decay: 2.6 }), 0, 1);
	addAt(b, highpass(noise(0.5, { decay: 7 }), 900), 0, 0.5);
	addAt(b, tone(0.5, (t) => 900 - 500 * t, { shape: 'rich', decay: 7 }), 0, 0.3);
	return fadeEnds(normalize(b, 0.85), SR, 6);
};

// A LEVERAGE symbol landing: a struck metal chime.
//
// This has to be identifiable in one hearing and never mistaken for the scatter.
// It is therefore MUSICAL — a clean two-note rise with a bell's inharmonic
// partial ringing over it — where the scatter is a siren and the reel stop is a
// knock. Three different physical objects, not three settings of one.
const leverageLand = () => {
	const b = buffer(0.55);
	const root = NOTE(74);
	// strike
	addAt(b, highpass(noise(0.03, { decay: 60 }), 3000), 0, 0.35);
	// the two notes, a fifth apart, the second a beat later
	addAt(b, tone(0.4, root, { shape: 'sine', decay: 6 }), 0, 0.55);
	addAt(b, tone(0.42, root * 1.5, { shape: 'sine', decay: 5.5 }), 0.075, 0.5);
	// inharmonic partials: what makes it read as struck metal rather than a beep
	addAt(b, tone(0.45, root * 2.76, { shape: 'sine', decay: 7 }), 0, 0.16);
	addAt(b, tone(0.5, root * 5.4, { shape: 'sine', decay: 9 }), 0, 0.07);
	return fadeEnds(normalize(delay(b, 0.11, 0.28, 0.3), 0.62), SR, 4);
};

// The meter ratcheting up one step.
const meterTick = () => {
	const b = buffer(0.2);
	addAt(b, tone(0.12, NOTE(88), { shape: 'square', decay: 16 }), 0, 0.28);
	addAt(b, lowpass(noise(0.03, { decay: 40 }), 7000), 0, 0.3);
	return fadeEnds(normalize(b, 0.5), SR, 3);
};

// The board opening two rows: a mechanical slam with the room opening after it.
const boardExpand = () => {
	const b = buffer(1.2);
	addAt(b, tone(0.7, (t) => 120 * Math.exp(-4 * t) + 34, { shape: 'sine', decay: 3 }), 0, 1);
	addAt(b, lowpass(noise(0.28, { decay: 9 }), (t) => 900 + 4000 * t), 0, 0.6);
	addAt(b, tone(0.6, (t) => 300 + 700 * t, { shape: 'saw', decay: 5 }), 0.06, 0.22);
	return fadeEnds(normalize(b, 0.8), SR, 6);
};

// Win runs. Same chord shape at two lengths so a small win and a big one are
// obviously the same game reacting at two intensities.
const winRun = (big) => {
	const steps = big ? [0, 3, 7, 10, 12, 15, 19, 24] : [0, 3, 7, 12];
	const gap = big ? 0.075 : 0.09;
	const b = buffer(steps.length * gap + 0.7);
	steps.forEach((s, i) => {
		const f = NOTE(69 + s);
		addAt(b, tone(0.42, f, { shape: 'rich', decay: 7 }), i * gap, big ? 0.32 : 0.28);
		if (big) addAt(b, tone(0.4, f * 2, { shape: 'sine', decay: 9 }), i * gap + 0.005, 0.16);
	});
	if (big) addAt(b, tone(0.9, NOTE(45), { shape: 'sine', decay: 3 }), 0, 0.5);
	return fadeEnds(normalize(delay(b, 0.13, 0.36, 0.32), big ? 0.8 : 0.62), SR, 6);
};

// Feature entry: a riser that resolves onto the downbeat.
const featureIntro = () => {
	const b = buffer(2.6);
	addAt(b, lowpass(noise(1.7, { decay: 0.6, hold: 0.85 }), (t) => 400 + 6000 * t * t), 0, 0.55);
	addAt(b, tone(1.7, (t) => NOTE(45) * (1 + 1.6 * t * t), { shape: 'saw', decay: 0.8, hold: 0.7 }), 0, 0.35);
	addAt(b, blast(), 1.6, 0.9);
	[0, 7, 12].forEach((s, i) => {
		addAt(b, tone(0.8, NOTE(69 + s), { shape: 'rich', decay: 5 }), 1.62 + i * 0.06, 0.3);
	});
	return fadeEnds(normalize(b, 0.85), SR, 8);
};

// ─── loops ──────────────────────────────────────────────────────────────────
// Anticipation bed: a tremolo drone that climbs while it plays and loops back
// on itself, so holding it for a long tease does not turn into a flat tone.
const tension = () => {
	const dur = 2.0;
	const b = buffer(dur);
	for (let i = 0; i < b.length; i++) {
		const t = i / b.length;
		const trem = 0.62 + 0.38 * Math.sin(2 * Math.PI * (7 + 5 * t) * (i / SR));
		b[i] = (Math.sin((2 * Math.PI * NOTE(52) * i) / SR) + 0.4 * rand2()) * trem;
	}
	return fadeEnds(normalize(lowpass(b, 1400), 0.42), SR, 40);
};

// Big-win bed under the count-up.
const shimmer = () => {
	const dur = 2.4;
	const b = buffer(dur);
	for (let k = 0; k < 22; k++) {
		const f = NOTE(81 + (k % 5) * 2);
		addAt(b, tone(0.5, f, { shape: 'sine', decay: 8 }), (k / 22) * dur, 0.18);
	}
	return fadeEnds(normalize(delay(b, 0.19, 0.45, 0.4), 0.4), SR, 60);
};

// Music. Both loops are the same 4-bar minor progression at two tempos, so the
// switch into the feature reads as the same room getting busier.
const CHORDS = [
	[45, 52, 60], // Am
	[41, 48, 57], // F
	[43, 50, 59], // G
	[40, 47, 55], // Em
];

const bgm = ({ bpm, bright }) => {
	const beat = 60 / bpm;
	const bars = 4;
	const dur = beat * 4 * bars;
	const b = buffer(dur, SR_BGM);

	for (let bar = 0; bar < bars; bar++) {
		const chord = CHORDS[bar % CHORDS.length];
		const barT = bar * beat * 4;

		// sub pulse on every beat, harder on 1 and 3
		for (let beatIndex = 0; beatIndex < 4; beatIndex++) {
			const t = barT + beatIndex * beat;
			const gain = beatIndex % 2 === 0 ? 0.85 : 0.45;
			addAt(b, tone(beat * 0.8, NOTE(chord[0] - 12), { shape: 'sine', decay: 5, sr: SR_BGM }), t, gain, SR_BGM);
		}

		// arpeggio: eighths in the base loop, sixteenths in the feature
		const div = bright ? 16 : 8;
		for (let step = 0; step < div; step++) {
			const t = barT + (step / div) * beat * 4;
			const note = chord[step % chord.length] + (bright && step % 4 === 3 ? 12 : 0);
			addAt(
				b,
				tone(beat * 0.7, NOTE(note), { shape: 'square', decay: bright ? 9 : 11, sr: SR_BGM }),
				t,
				bright ? 0.2 : 0.14,
				SR_BGM,
			);
		}

		// offbeat hats for movement
		for (let step = 0; step < 8; step++) {
			if (step % 2 === 0) continue;
			const t = barT + (step / 8) * beat * 4;
			addAt(b, highpass(noise(0.05, { decay: 30, sr: SR_BGM }), 5000, SR_BGM), t, 0.16, SR_BGM);
		}
	}

	const shaped = lowpass(b, bright ? 5200 : 3200, SR_BGM);
	return fadeEnds(normalize(shaped, bright ? 0.6 : 0.5), SR_BGM, 30);
};

// ─── render ─────────────────────────────────────────────────────────────────
console.log('one-shots');
writeWav('ui_click', uiClick());
writeWav('spin_start', spinStart());
writeWav('reel_stop', reelStop());
for (let i = 1; i <= 5; i++) writeWav(`alert_${i}`, alert(i - 1));
writeWav('margin_call', marginCall());
writeWav('blast', blast());
writeWav('leverage_land', leverageLand());
writeWav('meter_tick', meterTick());
writeWav('board_expand', boardExpand());
writeWav('win_small', winRun(false));
writeWav('win_big', winRun(true));
writeWav('feature_intro', featureIntro());

console.log('loops');
writeWav('tension', tension());
writeWav('shimmer', shimmer());
writeWav('bgm_main', bgm({ bpm: 96, bright: false }), SR_BGM);
writeWav('bgm_feature', bgm({ bpm: 126, bright: true }), SR_BGM);

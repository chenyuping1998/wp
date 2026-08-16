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

// Short fades against clicks. The head and the tail are separate on purpose.
//
// A percussive cue peaks within the first millisecond or two. A symmetrical 3ms
// fade therefore lands squarely on the loudest part of it and scales it down by
// most of its value - which is exactly what made the reel stop inaudible after
// it had supposedly been normalised to 0.98: the file measured 0.55. The head
// only needs to be long enough to stop the waveform starting at full amplitude,
// which is a fraction of a millisecond; the tail can be longer because nothing
// important is happening there.
const fadeEnds = (buf, sr, tailMs = 6, headMs = 0.4) => {
	const head = Math.min(buf.length >> 1, Math.round((headMs / 1000) * sr));
	const tail = Math.min(buf.length >> 1, Math.round((tailMs / 1000) * sr));
	for (let i = 0; i < head; i++) buf[i] *= i / head;
	for (let i = 0; i < tail; i++) buf[buf.length - 1 - i] *= i / tail;
	return buf;
};

// Loudness, not peak.
//
// Peak-normalising cues of different lengths does not make them sound equally
// loud: a 0.18s knock that is mostly transient and a 1.3s run of sustained tones
// can share a peak of 0.8 and be 6 dB apart to the ear. Everything the player
// compares - reel stop against win, scatter against both - is levelled here by
// RMS instead, with a peak ceiling so nothing clips.
const LEVEL = (dbfs) => Math.pow(10, dbfs / 20);

/** Soft clip. Raises RMS towards the peak, which is how a very transient cue
 *  gets loud enough to sit with sustained ones without clipping. */
const saturate = (buf, drive = 2) => {
	let peak = 0;
	for (const v of buf) peak = Math.max(peak, Math.abs(v));
	const norm = peak > 0 ? 1 / peak : 1;
	for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * norm * drive);
	return buf;
};

const normalizeRms = (buf, dbfs, ceiling = 0.95) => {
	let sum = 0;
	for (const v of buf) sum += v * v;
	const rms = Math.sqrt(sum / buf.length) || 1e-9;
	let gain = LEVEL(dbfs) / rms;
	let peak = 0;
	for (const v of buf) peak = Math.max(peak, Math.abs(v));
	if (peak * gain > ceiling) gain = ceiling / peak;
	for (let i = 0; i < buf.length; i++) buf[i] *= gain;
	return buf;
};

/**
 * Perceived loudness, not RMS.
 *
 * RMS counts a 50 Hz sine and a 3 kHz sine as equally loud; the ear does not,
 * by something like 30 dB. Levelling this set by RMS produced numbers that all
 * looked right and a mix that was audibly wrong - the music, which is dark and
 * heavily filtered, measured -17 dBFS RMS and sat 10 dB below the win cues to
 * the ear. The reel stop, mostly low knock, was 7 dB down the same way.
 *
 * High-passing at 400 Hz before measuring is a crude stand-in for a loudness
 * curve, but it is enough to put a bass-heavy loop and a bright chime on the
 * same scale, which is the whole problem.
 */
const weightedRms = (buf, sr) => {
	let y = 0;
	let sum = 0;
	const a = 1 - Math.exp((-2 * Math.PI * 400) / sr);
	for (const v of buf) {
		y += a * (v - y);
		const hp = v - y;
		sum += hp * hp;
	}
	return Math.sqrt(sum / buf.length) || 1e-9;
};

const normalizeLoudness = (buf, dbfs, sr = SR, ceiling = 0.95) => {
	let gain = LEVEL(dbfs) / weightedRms(buf, sr);
	let peak = 0;
	for (const v of buf) peak = Math.max(peak, Math.abs(v));
	if (peak * gain > ceiling) gain = ceiling / peak;
	for (let i = 0; i < buf.length; i++) buf[i] *= gain;
	return buf;
};

// Target loudnesses (weighted), in one place so the mix can be read at a glance.
// The wins are the reference because they are what the player is listening for;
// the reel stop matches them, the music sits a shade under, the scatter sits
// clearly below both so it never buries a reel stop it lands on.
const MIX = {
	reelStop: -21,
	alert: -27,
	winSmall: -21.3,
	winBig: -20.6,
	marginCall: -19,
	shimmer: -23,
	bgmMain: -22,
	bgmFeature: -21,
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
	const b = buffer(0.18);
	// the click of the stop: a short band of noise, high enough to cut. Carries
	// most of the PERCEIVED loudness - the thump below it is felt, not heard.
	addAt(b, lowpass(highpass(noise(0.05, { decay: 38 }), 1400), 9000), 0, 1.5);
	// the knock: this is the part that carries, so it gets the room
	addAt(b, lowpass(highpass(noise(0.09, { decay: 26 }), 180), 1800), 0, 1);
	// and the weight underneath it - a short pitched thump, not a tone
	addAt(b, tone(0.11, (t) => 190 - 90 * t, { shape: 'sine', decay: 14 }), 0, 0.55);
	// Kept deliberately small. It is felt rather than heard, and every dB of it
	// is a dB of headroom the click cannot use - which is what held this cue 3 dB
	// short of its target on the first attempt at levelling it by loudness.
	addAt(b, tone(0.13, NOTE(33), { shape: 'sine', decay: 11 }), 0, 0.22);
	// Levelled with the win cues: the spin is only this and the scatter now, so
	// there is nothing for it to stay out of the way of.
	//
	// Saturated first. This cue is almost entirely transient, so its RMS sits far
	// below its peak and asking for -18 dBFS just hits the clipping ceiling and
	// stops short. A soft tanh curve pulls the body up towards the peak - the
	// same thing a compressor is for - and lets it actually reach the target.
	return fadeEnds(normalizeLoudness(saturate(b, 7), MIX.reelStop), SR, 4);
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
	// Under the reel stops, not over them: it lands on top of one.
	return fadeEnds(normalizeLoudness(delay(shaped, 0.13, 0.34, 0.3), MIX.alert), SR, 4);
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
	return fadeEnds(normalizeLoudness(shaped, MIX.marginCall), SR, 10);
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
	return fadeEnds(normalizeLoudness(delay(b, 0.13, 0.36, 0.32), big ? MIX.winBig : MIX.winSmall), SR, 6);
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
// Everything below has to survive being played back to back forever, which is a
// different problem from a one-shot sounding good once.
//
// Two rules, and the old versions broke both:
//
//  1. NO fade at the ends. A fade is a dip in level at the seam, and on a loop
//     the ear hears that dip once per pass as a pulse. It is the "obvious break
//     point" in the coin bed. Instead the content itself is made continuous
//     across the seam.
//  2. Anything still ringing when the buffer ends has to WRAP to the start
//     rather than being cut off. addWrapped does that, so the tail of the last
//     event is already playing underneath the first one.
//
// A loop also has to be periodic in everything that modulates it: a tremolo that
// speeds up over the buffer cannot line up with itself, so those rates are now
// whole numbers of cycles per loop.

/** Add `src` at `offsetSec`, wrapping anything past the end back to the start. */
const addWrapped = (dst, src, offsetSec, gain = 1, sr = SR) => {
	const start = Math.round(offsetSec * sr);
	for (let i = 0; i < src.length; i++) {
		dst[(start + i) % dst.length] += src[i] * gain;
	}
};

// Anticipation bed. Held for as long as the tease lasts, so it must not develop
// - a drone that climbs would reset audibly every couple of seconds.
const tension = () => {
	const dur = 2.0;
	const b = buffer(dur);
	// 14 tremolo cycles across 2s = exactly 7 Hz, and a whole number of cycles
	// per loop, so the amplitude curve meets itself at the seam.
	const TREM_CYCLES = 14;
	for (let i = 0; i < b.length; i++) {
		const phase = (i / b.length) * TREM_CYCLES * 2 * Math.PI;
		const trem = 0.62 + 0.38 * Math.sin(phase);
		// the carrier is also given a whole number of cycles per loop
		const carrierCycles = Math.round((NOTE(52) * dur) / 1) / dur;
		b[i] = (Math.sin((2 * Math.PI * carrierCycles * i) / SR) + 0.4 * rand2()) * trem;
	}
	return normalize(lowpass(b, 1400), 0.42);
};

// The coin bed under a big-win count-up. Long, dense and evenly spread: the ear
// finds a seam in a sparse loop far more easily than in a busy one, because in a
// busy one there is always something already ringing across the join.
const shimmer = () => {
	const dur = 3.2;
	const b = buffer(dur);
	const COUNT = 64;
	for (let k = 0; k < COUNT; k++) {
		// deterministic jitter so the grid does not turn into a pulse
		const jitter = (rand() - 0.5) * (dur / COUNT) * 0.8;
		const at = (k / COUNT) * dur + jitter;
		const note = 79 + [0, 3, 7, 10, 12, 15][k % 6];
		addWrapped(b, tone(0.55, NOTE(note), { shape: 'sine', decay: 7 }), at, 0.14);
		// a sparser upper layer for glitter
		if (k % 3 === 0) {
			addWrapped(b, tone(0.35, NOTE(note + 12), { shape: 'sine', decay: 11 }), at, 0.06);
		}
	}
	// delay adds tail; run it wrapped too so the echoes cross the seam as well
	const withTail = Float32Array.from(b);
	const d = Math.round(0.19 * SR);
	for (let i = 0; i < withTail.length; i++) {
		withTail[i] += b[(i - d + b.length) % b.length] * 0.35;
	}
	return normalizeLoudness(withTail, MIX.shimmer);
};

// ─── music ──────────────────────────────────────────────────────────────────
// A trading floor at night: a machine that does not stop. The point is pulse and
// texture rather than melody - a tune would be the wrong kind of memorable
// under a game the player will hear for hours.
//
// 16 bars in two halves. The first eight are sparse and filtered down; the
// second eight open the filter and add the arp and the open hat, so the loop has
// somewhere to go and back. The feature version is the same room at a faster
// tempo with the lid off.
const CHORDS = [
	[45, 52, 60], // Am
	[45, 52, 60],
	[41, 48, 57], // F
	[41, 48, 57],
	[43, 50, 59], // G
	[43, 50, 59],
	[40, 47, 55], // Em
	[38, 45, 53], // D
];

const bgm = ({ bpm, bright }) => {
	const sr = SR_BGM;
	const beat = 60 / bpm;
	const bar = beat * 4;
	const bars = 16;
	const dur = bar * bars;
	const b = buffer(dur, sr);

	for (let barIndex = 0; barIndex < bars; barIndex++) {
		const chord = CHORDS[barIndex % CHORDS.length];
		const barT = barIndex * bar;
		// second half is the lift
		const open = barIndex >= bars / 2;
		const root = chord[0];

		// ── kick: four on the floor, soft. The heartbeat. ──
		for (let beatIndex = 0; beatIndex < 4; beatIndex++) {
			const at = barT + beatIndex * beat;
			addWrapped(
				b,
				tone(0.22, (x) => 110 * Math.exp(-9 * x) + 44, { shape: 'sine', decay: 7, sr }),
				at,
				bright ? 0.5 : 0.42,
				sr,
			);
			addWrapped(b, lowpass(noise(0.03, { decay: 40, sr }), 900, sr), at, 0.18, sr);
		}

		// ── sub: root, held, the floor everything else stands on ──
		// The sub is the single biggest consumer of headroom and contributes almost
		// nothing to how loud the loop sounds, so it gets a lot less than instinct
		// says it should. The loop reads as heavy because of the bass SEQUENCE,
		// which is a saw and sits high enough to be heard.
		addWrapped(b, tone(bar * 0.95, NOTE(root - 12), { shape: 'sine', decay: 1.4, sr }), barT, 0.22, sr);

		// ── bass sequence: sixteenths, gated, the machine running ──
		for (let step = 0; step < 16; step++) {
			if (step % 4 === 2) continue; // the gap is what makes it groove
			const at = barT + (step / 16) * bar;
			const note = root - 12 + (step % 8 === 6 ? 7 : 0);
			addWrapped(
				b,
				tone(beat * 0.22, NOTE(note), { shape: 'saw', decay: 16, sr }),
				at,
				open ? 0.34 : 0.24,
				sr,
			);
		}

		// ── pad: the chord, quiet, holding the bar together ──
		for (const note of chord) {
			addWrapped(b, tone(bar * 1.05, NOTE(note), { shape: 'sine', decay: 1.1, sr }), barT, 0.1, sr);
			addWrapped(
				b,
				tone(bar * 1.05, NOTE(note) * 1.005, { shape: 'sine', decay: 1.1, sr }),
				barT,
				0.07,
				sr,
			);
		}

		// ── arp: only in the open half, and only sixteenths in the feature ──
		if (open) {
			const div = bright ? 16 : 8;
			for (let step = 0; step < div; step++) {
				const at = barT + (step / div) * bar;
				const note = chord[step % chord.length] + (step % 4 === 3 ? 12 : 0);
				addWrapped(
					b,
					tone(beat * 0.6, NOTE(note), { shape: 'square', decay: 12, sr }),
					at,
					bright ? 0.22 : 0.16,
					sr,
				);
			}
		}

		// ── hats: offbeat closed, with an open one to end each phrase ──
		for (let step = 0; step < 8; step++) {
			if (step % 2 === 0) continue;
			const at = barT + (step / 8) * bar;
			addWrapped(b, highpass(noise(0.045, { decay: 34, sr }), 6000, sr), at, 0.3, sr);
		}
		if (barIndex % 4 === 3) {
			addWrapped(
				b,
				highpass(noise(0.3, { decay: 7, sr }), 5000, sr),
				barT + bar * 0.75,
				0.12,
				sr,
			);
		}
	}

	// ── one filter sweep across the whole loop, ending where it started ──
	// A whole number of cycles per loop, so the tone at the seam matches.
	//
	// Opened up a long way from the first pass. The loop was so dark that it
	// could not be made loud enough to hear without clipping - almost all of its
	// energy sat below where the ear counts it. Brightness is what buys audible
	// level here, not gain.
	const base = bright ? 5200 : 3800;
	const swing = bright ? 3600 : 2600;
	const shaped = lowpass(b, (x) => base + swing * (0.5 - 0.5 * Math.cos(2 * Math.PI * x)), sr);
	// Below about 60 Hz there is nothing a laptop or a phone will reproduce, and
	// on headphones it only steals headroom from everything audible above it.
	const trimmed = highpass(shaped, 60, sr);
	// Mastering, in one line. The loop's peaks are the kick and a hat landing on
	// the same sample; without pulling those down the whole track has to sit
	// several dB lower than it should just to leave room for them. tanh does the
	// pulling and adds a little harmonic brightness on the way, which is exactly
	// the part of the spectrum the loudness measure counts.
	const pressed = saturate(trimmed, bright ? 2.6 : 2.2);

	return normalizeLoudness(pressed, bright ? MIX.bgmFeature : MIX.bgmMain, sr);
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

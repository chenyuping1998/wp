// Soul Seal audio — pure-Node synthesis, writes 16-bit PCM WAV. No deps.
//
// Palette is a trading floor at night rather than an orchestra: filtered square
// and saw blips for the terminal, a sine sub for weight, band-passed noise for
// air, and one klaxon for the triple witching itself. Everything is built from the
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
	soulSeal: -19,
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

// ─── instruments ────────────────────────────────────────────────────────────
//
// This set was inherited from a trading-floor game: key clicks, klaxons, sirens,
// servo sweeps. Soul Seal is a night shrine, so the objects making the sounds are
// the ones in the frame - brass bells hanging from peachwood posts, a wooden
// block, a gong on the altar.
//
// Three physical objects, and every cue is built from one of them. That is what
// keeps a set coherent: not a shared filter setting, but a shared idea of what is
// making the noise.

/**
 * A struck bell. Inharmonic partials are the whole point - a bell's overtones
 * are NOT integer multiples, which is exactly what separates "struck metal" from
 * "a beep at the same pitch".
 *
 * Ratios are a small tuned handbell's, which is what hangs on the posts. A large
 * temple bell has a much lower hum note and belongs to the gong below.
 */
const BELL_PARTIALS = [
	[1, 1, 6],
	[2.0, 0.42, 7],
	[3.01, 0.28, 8.5],
	[4.17, 0.16, 10],
	[5.43, 0.09, 12],
	[6.79, 0.05, 14],
];
const bell = (dur, freq, { gain = 1, strike = 0.35 } = {}) => {
	const b = buffer(dur);
	for (const [ratio, amp, decay] of BELL_PARTIALS) {
		addAt(b, tone(dur, freq * ratio, { shape: 'sine', decay }), 0, amp * gain);
	}
	// the clapper: a short bright transient, without which a bell is just a chord
	addAt(b, highpass(noise(0.02, { decay: 70 }), 4200), 0, strike);
	return b;
};

/**
 * A wooden block. Almost no sustain and a pitch you can hear but not name -
 * mostly the knock of one hard wood on another.
 */
const woodBlock = (dur, freq, { gain = 1 } = {}) => {
	const b = buffer(dur);
	addAt(b, tone(dur * 0.5, freq, { shape: 'sine', decay: 26 }), 0, 0.5 * gain);
	addAt(b, tone(dur * 0.4, freq * 2.4, { shape: 'sine', decay: 34 }), 0, 0.22 * gain);
	addAt(b, lowpass(highpass(noise(dur * 0.35, { decay: 40 }), 900), 6500), 0, 0.7 * gain);
	return b;
};

/**
 * A gong. A dense wash that BLOOMS - it gets louder for a moment after the
 * strike as the metal breaks up, which is what makes a gong feel large and a
 * bell feel small.
 */
const gong = (dur, freq, { gain = 1 } = {}) => {
	const b = buffer(dur);
	for (let i = 0; i < 14; i++) {
		const ratio = 1 + i * 0.63 + rand() * 0.4;
		const amp = (0.5 / (1 + i * 0.5)) * gain;
		addAt(b, tone(dur, freq * ratio, { shape: 'sine', decay: 1.4 + i * 0.25, hold: 0.05 }), 0, amp);
	}
	// the bloom: shimmer arriving slightly AFTER the strike
	addAt(b, lowpass(noise(dur * 0.7, { decay: 1.6, hold: 0.18 }), 5200), 0.05, 0.28 * gain);
	addAt(b, tone(dur, freq * 0.5, { shape: 'sine', decay: 1.1 }), 0, 0.45 * gain);
	return b;
};

// ─── one-shots ──────────────────────────────────────────────────────────────
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI number -> Hz

// A small wooden knock. Dry, no ring - the player presses this dozens of times a
// minute and anything that sustains starts stacking on itself.
const uiClick = () => {
	const b = woodBlock(0.09, NOTE(79));
	return fadeEnds(normalize(b, 0.6), SR, 3);
};

// Spin: a filter opening upward, which reads as machinery starting rather than
// as a sound effect being triggered.
const spinStart = () => {
	const out = buffer(0.55);
	// ── the temple bell, not the hanging chimes ──────────────────────────────
	//
	// This was two small bells at MIDI 88 and 91 - about E6 and G6 - which is the
	// register of a wind chime, and it is what the button sounded like: light,
	// bright, and identical in weight to the menu click. It is the control pressed
	// every few seconds for a whole session, and it should have some floor under
	// it.
	//
	// Dropped two octaves and a bit, to MIDI 64 and 71. The higher partial is
	// quieter than the lower one now, which is what makes a big bell read as big:
	// the fundamental carries and the overtones fall away fast.
	addAt(out, bell(0.5, NOTE(64), { gain: 0.42, strike: 0.14 }), 0, 0.72);
	addAt(out, bell(0.4, NOTE(71), { gain: 0.16, strike: 0.08 }), 0.03, 0.42);
	// The mallet's own thump, under the tone. Felt more than heard - it is what
	// separates a struck bell from a played one.
	addAt(out, tone(0.16, (t) => 96 - 34 * t, { shape: 'sine', decay: 13 }), 0, 0.5);
	// air moving through the courtyard underneath, so it is a room and not a chime.
	// Darker than it was, for the same reason as the bells.
	addAt(out, lowpass(noise(0.42, { decay: 3.4, hold: 0.08 }), (t) => 240 + 1500 * t), 0, 0.38);
	return fadeEnds(normalize(out, 0.66), SR, 6);
};

/**
 * The spin button while an ACTIVE mode is switched on.
 *
 * `level` is 0 for SPIRIT TIDE (5x) and 1 for SPIRIT FLOOD (10x).
 *
 * These are not the ordinary press louder. An active mode charges the stake on
 * every press, and the button glows for as long as it is on (uiTheme
 * spinButtonCharge); the sound is the other half of that statement, and it has
 * to say WHICH mode without the player reading anything.
 *
 * What makes it read as mana rather than as a bell:
 *
 *   · the fundamental RISES through the press instead of decaying from a strike,
 *     so it sounds like something being drawn rather than something being hit
 *   · a fifth and an octave above it, arriving late, so the chord opens out
 *   · a filtered noise sweep climbing with them - the air being pulled in
 *
 * The two levels differ in pitch, in how many voices open, and in how far the
 * sweep climbs. 10x is a fourth higher with an extra voice, which is audibly the
 * same gesture at more power rather than a different cue.
 */
const spinCharge = (level) => {
	const out = buffer(0.72);
	const root = NOTE(level ? 57 : 52); // A3 against E3
	const climb = level ? 1.6 : 1.35;

	// the drawn fundamental: pitch rises across the press
	addAt(out, tone(0.6, (t) => root * (1 + (climb - 1) * t), { shape: 'sine', decay: 2.2 }), 0, 0.5);
	// a fifth above, entering after it
	addAt(
		out,
		tone(0.5, (t) => root * 1.5 * (1 + (climb - 1) * t), { shape: 'sine', decay: 3 }),
		0.06,
		0.3,
	);
	// the octave, later still - this is the voice 10x has and 5x barely does
	addAt(
		out,
		tone(0.44, (t) => root * 2 * (1 + (climb - 1) * t), { shape: 'sine', decay: 3.6 }),
		0.12,
		level ? 0.26 : 0.1,
	);
	// 10x alone gets the twelfth on top, which is what tips it from warm to bright
	if (level) {
		addAt(
			out,
			tone(0.36, (t) => root * 3 * (1 + (climb - 1) * t), { shape: 'sine', decay: 5 }),
			0.16,
			0.13,
		);
	}
	// air drawn in with them: a band of noise climbing alongside the voices
	addAt(
		out,
		lowpass(
			highpass(noise(0.55, { decay: 2.4, hold: 0.1 }), 600),
			(t) => 900 + (level ? 5200 : 3000) * t,
		),
		0,
		0.3,
	);
	// a soft floor so the press still lands rather than only blooming
	addAt(out, tone(0.14, (t) => 88 - 26 * t, { shape: 'sine', decay: 14 }), 0, 0.42);
	return fadeEnds(normalize(out, 0.66), SR, 8);
};

// Reel stop. Deliberately the DULLEST cue in the set: a dry mechanical knock
// with almost no pitch to it. It fires five times a spin, under everything else,
// and anything with tone in it competes with the two cues that actually carry
// information (a scatter landing and a collect). Pitched per reel by
// playbackRate in Sound.svelte, so it has to hold up across roughly 0.9x-1.3x —
// hence the short body and the hard head.
const reelStop = () => {
	const b = buffer(0.18);
	// a block struck against the altar table. The click carries most of the
	// PERCEIVED loudness; the thump below it is felt, not heard.
	addAt(b, woodBlock(0.13, NOTE(52), { gain: 1.35 }), 0, 1);
	addAt(b, lowpass(highpass(noise(0.05, { decay: 38 }), 1400), 9000), 0, 0.9);
	// the weight underneath it - a short pitched thump, not a tone
	addAt(b, tone(0.11, (t) => 190 - 90 * t, { shape: 'sine', decay: 14 }), 0, 0.5);
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

// A TRIPLE WITCHING landing. Five of them, rising, so three in a row is audibly a
// countdown rather than three unrelated pings.
//
// Built as a siren, not a note: two saws detuned against each other and swept
// upward, which beats and buzzes the way an alarm does. That is what separates it
// from the LEVERAGE chime - different waveform, different envelope, different
// motion - so the two are never in doubt even when both land in one spin.
const alert = (step) => {
	const root = NOTE(72 + step * 3);
	const b = buffer(0.62);
	// A bell struck harder each time, climbing a minor third per scatter, so three
	// in a row is audibly a countdown rather than three unrelated pings.
	//
	// Not a siren: this game has no sirens in it. What separates the scatter from
	// the reel stop is metal against wood, and what separates it from a carrier
	// landing is that it CLIMBS.
	addAt(b, bell(0.55, root, { gain: 0.85 + 0.05 * step, strike: 0.45 }), 0, 1);
	// a second bell a fifth up, quieter, so the strike has width
	addAt(b, bell(0.45, root * 1.5, { gain: 0.3, strike: 0.15 }), 0.02, 0.7);
	// sub thump underneath, growing with the count
	addAt(b, tone(0.3, NOTE(38), { shape: 'sine', decay: 8 }), 0, 0.2 + step * 0.06);
	const shaped = lowpass(b, 3400);
	// Under the reel stops, not over them: it lands on top of one.
	return fadeEnds(normalizeLoudness(delay(shaped, 0.13, 0.34, 0.3), MIX.alert), SR, 4);
};

// The seal itself: the altar gong, struck three times.
//
// The inherited version was a two-tone klaxon, described in its own comment as
// "the only sound in the set allowed to be unpleasant". That was right for a
// trading floor. Here the loudest moment in the game should be the biggest
// object in the room, not the ugliest - a gong is already unmistakable without
// having to be unpleasant.
const soulSeal = () => {
	const b = buffer(2.6);
	for (let k = 0; k < 3; k++) {
		addAt(b, gong(2.4 - k * 0.4, NOTE(41 - k * 2), { gain: 0.8 }), k * 0.62, 1);
	}
	const shaped = lowpass(b, 3400);
	return fadeEnds(normalizeLoudness(shaped, MIX.soulSeal), SR, 10);
};

// Big-win impact: the gong, with a sub under it.
const blast = () => {
	const b = buffer(1.6);
	addAt(b, tone(1.1, (t) => 150 * Math.exp(-3.4 * t) + 38, { shape: 'sine', decay: 2.6 }), 0, 0.9);
	addAt(b, gong(1.5, NOTE(45), { gain: 0.75 }), 0, 1);
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
	// A spirit arriving: one small bell, rung once, with the room around it.
	// Held DELIBERATELY quiet and short - carriers land several to a spin, and a
	// cue that is satisfying once is exhausting five times.
	addAt(b, bell(0.5, NOTE(76), { gain: 0.7, strike: 0.3 }), 0, 1);
	return fadeEnds(normalize(delay(b, 0.11, 0.24, 0.26), 0.58), SR, 4);
};

// The meter ratcheting up one step.
// A talisman stamping onto the rail: the smallest bell in the set.
const meterTick = () => {
	const b = buffer(0.22);
	addAt(b, bell(0.18, NOTE(93), { gain: 0.4, strike: 0.3 }), 0, 1);
	return fadeEnds(normalize(b, 0.5), SR, 3);
};

// The heavy slam, used for the collect stamp. A hardwood beam dropped onto the
// altar, with the bells on the posts shaken loose by it.
//
// The file is still named board_expand.wav: renaming it means regenerating the
// packed audio bundle, which is a separate pass, and the sound itself suits the
// stamp unchanged.
const boardExpand = () => {
	const b = buffer(1.2);
	addAt(b, tone(0.7, (t) => 120 * Math.exp(-4 * t) + 34, { shape: 'sine', decay: 3 }), 0, 1);
	addAt(b, woodBlock(0.3, NOTE(36), { gain: 1.2 }), 0, 0.9);
	addAt(b, bell(0.7, NOTE(84), { gain: 0.18, strike: 0.1 }), 0.04, 0.5);
	addAt(b, bell(0.6, NOTE(89), { gain: 0.14, strike: 0.08 }), 0.09, 0.4);
	return fadeEnds(normalize(b, 0.8), SR, 6);
};

// Win runs. Same chord shape at two lengths so a small win and a big one are
// obviously the same game reacting at two intensities.
// Win runs: bells up a PENTATONIC scale, which is the scale the setting implies
// and which also has no semitones in it - so a fast run cannot produce a sour
// interval however many notes it lands on.
//
// Same shape at two lengths, so a small win and a big one are obviously the same
// game reacting at two intensities.
const winRun = (big) => {
	const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
	const steps = big ? PENTA.slice(0, 8) : PENTA.slice(0, 4);
	const gap = big ? 0.075 : 0.09;
	const b = buffer(steps.length * gap + 0.9);
	steps.forEach((s, i) => {
		addAt(b, bell(0.5, NOTE(69 + s), { gain: big ? 0.34 : 0.3, strike: 0.2 }), i * gap, 1);
	});
	if (big) addAt(b, gong(1.1, NOTE(45), { gain: 0.4 }), 0, 0.8);
	return fadeEnds(normalizeLoudness(delay(b, 0.13, 0.36, 0.32), big ? MIX.winBig : MIX.winSmall), SR, 6);
};

// Feature entry: a riser that resolves onto the downbeat.
// Feature entry: the courtyard filling with bells, resolving onto the gong.
const featureIntro = () => {
	const b = buffer(2.8);
	// the rise: air and a swarm of small bells getting denser
	addAt(b, lowpass(noise(1.7, { decay: 0.6, hold: 0.85 }), (t) => 400 + 6000 * t * t), 0, 0.45);
	for (let i = 0; i < 14; i++) {
		const t0 = 0.15 + Math.pow(i / 14, 1.6) * 1.4;
		addAt(b, bell(0.5, NOTE(81 + (i % 5) * 2), { gain: 0.1 + 0.1 * (i / 14), strike: 0.1 }), t0, 1);
	}
	addAt(b, blast(), 1.6, 0.9);
	[0, 7, 12].forEach((s, i) => {
		addAt(b, bell(0.9, NOTE(69 + s), { gain: 0.3, strike: 0.18 }), 1.62 + i * 0.06, 1);
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
writeWav('spin_charge_5', spinCharge(0));
writeWav('spin_charge_10', spinCharge(1));
writeWav('reel_stop', reelStop());
for (let i = 1; i <= 5; i++) writeWav(`alert_${i}`, alert(i - 1));
writeWav('soul_seal', soulSeal());
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

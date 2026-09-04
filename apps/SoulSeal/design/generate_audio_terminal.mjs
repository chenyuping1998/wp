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
/**
 * Make a buffer loop without a click.
 *
 * A looping file joins its own end to its own start, and unless those two
 * samples happen to agree the join is a step discontinuity - which is a click,
 * once per lap, forever. Measured on the shipped set, as a fraction of each
 * file's own peak:
 *
 *     bgm_feature  37%      shimmer  33%
 *     bgm_main     28%      tension  11%
 *
 * `tension` is two seconds long and plays under every anticipation, so that one
 * was clicking several times per tease.
 *
 * The fix is the standard one: crossfade the tail back over the head and then
 * discard the tail. What is left ends where its own head began, so the join is
 * continuous by construction rather than by luck. The fade has to be long enough
 * to cover a low-frequency period - 60ms is two cycles at 33 Hz - and short
 * enough not to smear the pulse of a loop that has one.
 */
const seamless = (buf, ms = 60, sr = SR) => {
	const n = Math.min(Math.round((ms / 1000) * sr), Math.floor(buf.length / 4));
	if (n < 8) return buf;
	const out = new Float32Array(buf.length - n);
	out.set(buf.subarray(0, buf.length - n));
	for (let i = 0; i < n; i++) {
		const t = i / n;
		out[i] = buf[i] * t + buf[buf.length - n + i] * (1 - t);
	}
	return out;
};

/**
 * Saturate until the crest factor comes down to `targetDb`, then stop.
 *
 * A fixed drive cannot serve a set whose members differ in how peaky they are,
 * and the win tiers differ a lot: at one drive they measured 8.9 dB of crest at
 * the top and 14.9 in the middle, and the peaky one could not reach its level at
 * all - its peaks hit the ceiling while its body was still 3 dB short, so the
 * second step of a five-step escalation came out QUIETER than the first.
 *
 * Driving to a crest target instead makes every member reach its level, which is
 * the only way a ladder expressed in decibels is actually a ladder.
 */
const pressToCrest = (buf, targetDb, maxDrive = 14) => {
	const crestOf = (b) => {
		let peak = 0;
		let sum = 0;
		for (const v of b) {
			peak = Math.max(peak, Math.abs(v));
			sum += v * v;
		}
		const rms = Math.sqrt(sum / b.length) || 1e-9;
		return 20 * Math.log10(peak / rms);
	};
	let drive = 1;
	let out = Float32Array.from(buf);
	// Doubling rather than stepping: the curve is gentle at low drive and the
	// search would otherwise spend most of its iterations doing nothing.
	while (crestOf(out) > targetDb && drive < maxDrive) {
		drive *= 1.6;
		out = saturate(Float32Array.from(buf), drive);
	}
	return out;
};

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
//
// EVERY cue is in here now, and that is the point. Eight of the twenty-two were
// levelled by loudness and the other fourteen by PEAK, and the two cannot sit in
// one set: peak normalisation makes a transient cue quiet and a sustained cue
// loud, because it only ever looks at the single largest sample. Measured on the
// shipped files, the button click came out at 0.025 RMS against the reel stop's
// 0.186 - sixteen decibels down, under a bed of music at 0.247. The control the
// player presses most was the quietest thing in the game.
const MIX = {
	// the controls: under everything, but audible over the music
	uiClick: -26,
	spinStart: -23,
	spinCharge: -24,
	// the board
	// The reel stop cannot be raised. It is almost entirely transient - its peak
	// is already at 0.95 while its RMS sits far below - so asking for a louder
	// target just runs into the clipping ceiling and stops short. Measured, -18
	// and -21 produce the same file.
	//
	// So the way to make it more present is to give it more room, which is what
	// the music below gives up.
	reelStop: -21,
	alert: -27,
	leverageLand: -25,
	meterTick: -26,
	boardExpand: -22,
	// the voice. Deliberately the loudest thing that is not a win: a voice in a
	// mix of struck objects is the one sound the ear picks out on its own, and
	// burying it wastes that.
	// Above the tension tremolo, which plays underneath the tease and was
	// measured LOUDER than the voice it was supposed to be under: -16.6 against
	// -17.1. A bed over a voice is not a bed.
	chantCollect: -20,
	chantTease: -18,
	// The five tiers, climbing. A tier that is louder AND carries more instruments
	// escalates on two axes at once, which is what makes five steps distinguishable
	// when three would normally be the limit.
	// The loudest things in the game, because they are the biggest moments in it.
	//
	// They were -20.5 to -18, which put every one of them BELOW the reel stop at
	// -14.6 and barely above the music. A five-tier escalation whose top step is
	// quieter than a reel landing is not an escalation.
	// Plain RMS - see the note where these are applied. Every step is 1 dB, which
	// is about the smallest difference that reads as a step at all, and the ladder
	// starts above the reel stop at -14.6 so even the first tier is the loudest
	// thing on screen when it plays.
	winTier: [-13.5, -12.5, -11.5, -10.5, -9.5],
	// the payoffs
	winSmall: -21.3,
	winBig: -20.6,
	soulSeal: -19,
	blast: -20,
	featureIntro: -21,
	shimmer: -23,
	// Ducked, so the voice has somewhere to sit.
	tension: -27,
	// beds
	// The bed drops 3 dB.
	//
	// The reel stop is the most-heard cue in the game - five a spin, all session -
	// and it was sitting level with the music rather than over it: measured, the
	// stop at -14.6 dBFS against a bed at -15.5. A music bed a decibel under the
	// loudest effect is not a bed, it is a second foreground.
	//
	// Everything else gains the same 3 dB of headroom by not moving.
	bgmMain: -25,
	bgmFeature: -24,
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

/**
 * A resonant band-pass, which is the one filter a voice needs and the low-passes
 * above cannot do.
 *
 * Two-pole, from the pole radius: r sets how long it rings, and the pair of
 * coefficients place it at `freq`. Q here is "how many cycles it rings for", so
 * a formant at Q 12 is a vowel and the same formant at Q 40 is a whistle.
 */
const resonate = (buf, freq, q, sr = SR) => {
	const out = new Float32Array(buf.length);
	let y1 = 0;
	let y2 = 0;
	// `freq` may be a function of 0..1, which is what lets a vowel MOVE. The
	// coefficients are then recomputed per sample - expensive, and this is a
	// design-time script that runs in seconds.
	const moving = typeof freq === 'function';
	let r = 0;
	let c = 0;
	if (!moving) {
		r = Math.exp((-Math.PI * freq) / (q * sr));
		c = 2 * r * Math.cos((2 * Math.PI * freq) / sr);
	}
	for (let i = 0; i < buf.length; i++) {
		if (moving) {
			const f = freq(i / buf.length);
			r = Math.exp((-Math.PI * f) / (q * sr));
			c = 2 * r * Math.cos((2 * Math.PI * f) / sr);
		}
		const y = buf[i] * (1 - r) + c * y1 - r * r * y2;
		y2 = y1;
		y1 = y;
		out[i] = y;
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
 * A VOICE, with no words in it.
 *
 * ── why this is synthesised and not a recording ──
 *
 * The obvious way to get a priest chanting is to find one. It was the wrong way
 * twice over. A recorded chant is a licence to verify per file and a download to
 * trust, and worse, a chant with WORDS in it cannot ship: this game runs in
 * twelve languages, and a phrase is baked into the sample where every other
 * piece of text in the game is not. Every slot that does this uses a wordless
 * vocalisation for exactly that reason.
 *
 * A wordless vowel is also the one vocal sound that IS straightforward to build.
 * Speech is hard because consonants are transients and transitions; a held vowel
 * is a buzz through a fixed set of resonances, and that is all this is.
 *
 * ── how it works ──
 *
 * A glottal pulse train - the vocal folds, modelled as a sawtooth-ish pulse
 * rather than a sine, because the harmonics above the fundamental are what the
 * formants have to work on - through three band-pass resonators. The resonator
 * frequencies ARE the vowel: the ear names a vowel from the first two formants
 * and nothing else, which is why the table below is the whole character.
 *
 * Measured formant centres for a low male voice:
 *
 *     "ah"   F1 700   F2 1150   F3 2600     open, the sound of a held note
 *     "oh"   F1 450   F2  800   F3 2600     rounder, darker, further away
 *     "om"   F1 350   F2  650   F3 2400     closed, the hum a chant settles on
 *
 * Vibrato is not decoration: a pitch held perfectly steady reads as a synth
 * immediately, and about 5 Hz of a few cents is what a voice does without
 * trying. The breath layer is the same idea - a little air through the same
 * formants, because a voice that is pure tone is an organ.
 */
const VOWELS = {
	ah: [700, 1150, 2600],
	oh: [450, 800, 2600],
	om: [350, 650, 2400],
};
const voice = (
	dur,
	freq,
	{
		vowel = 'ah',
		// Where the mouth ENDS UP. A held vowel is the giveaway in a synthetic
		// voice: a real one is always on its way somewhere, and the ear reads a
		// formant that does not move as a filter rather than as a mouth. Naming a
		// second vowel glides the resonators from one to the other across the note.
		vowelTo = null,
		gain = 1,
		vibrato = 0.012,
		rate = 5.2,
		breath = 0.12,
		attack = 0.08,
		// A small drop into the note, as the folds catch. Real singing scoops; a
		// note that starts exactly on pitch starts like a synthesiser.
		scoop = 0.04,
	} = {},
) => {
	const n = Math.ceil(dur * SR);
	const glottis = new Float32Array(n);
	let phase = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const p = i / n;
		// the scoop decays over the first fifth of the note
		const catchUp = 1 - scoop * Math.exp(-p * 18);
		const f = at(freq, p) * catchUp * (1 + vibrato * Math.sin(2 * Math.PI * rate * t));
		phase += f / SR;
		if (phase >= 1) phase -= 1;
		// A glottal pulse, stored as flow: the folds open smoothly and SLAM SHUT.
		//
		// The half-period sine reaches its maximum exactly at the closing instant,
		// so the flow drops from full to nothing in one sample. That discontinuity
		// is the entire high-frequency content of a voice, and getting it wrong is
		// what made the first two attempts a hum: a full-period sin^2 returns to
		// zero SMOOTHLY, with zero slope at both ends, so differentiating it
		// produced no edge at all. Measured against the fundamental, at 2.4 kHz:
		//
		//     sin^2, closing smoothly    0.007
		//     rising to peak, then shut  0.877     <- 125x more
		//
		// The second and third formants live up there. Without them the vowel has
		// no identity, and the ear names a vowel from F2 before anything else.
		const open = phase < 0.42 ? Math.sin((Math.PI * phase) / 0.84) ** 2 : 0;
		glottis[i] = open;
	}
	// ── the closing edge ──────────────────────────────────────────────────────
	//
	// What excites the vocal tract is the glottal flow DERIVATIVE, and the sharp
	// negative spike where the folds slam shut is where almost all of the high
	// harmonics come from. Feeding the smooth flow pulse in directly, as the first
	// version did, gives a spectrum that has rolled off before it reaches the
	// second formant - measured, the only resonance left was F1 at 400 Hz and the
	// vowel was unidentifiable, because F2 is the formant the ear names a vowel
	// from.
	//
	// One difference does it. The pulse is smooth on the way up and abrupt on the
	// way down, so differentiating leaves exactly the asymmetric spike a real
	// glottis makes.
	for (let i = n - 1; i > 0; i--) glottis[i] = (glottis[i] - glottis[i - 1]) * 26;
	glottis[0] = 0;
	const from = VOWELS[vowel] ?? VOWELS.ah;
	const to = vowelTo ? (VOWELS[vowelTo] ?? from) : from;
	// The glide is eased rather than linear: a mouth moves fastest in the middle
	// of a change and settles at both ends.
	const glide = (k) =>
		to === from ? from[k] : (t) => from[k] + (to[k] - from[k]) * (t * t * (3 - 2 * t));
	const body = new Float32Array(n);
	const add = (src, w) => {
		for (let i = 0; i < n; i++) body[i] += src[i] * w;
	};
	add(resonate(Float32Array.from(glottis), glide(0), 12), 1);
	add(resonate(Float32Array.from(glottis), glide(1), 14), 0.55);
	add(resonate(Float32Array.from(glottis), glide(2), 18), 0.22);
	if (breath > 0) {
		const air = new Float32Array(n);
		for (let i = 0; i < n; i++) air[i] = rand2();
		add(resonate(air, glide(1), 6), breath);
	}
	// A voice starts and stops with the breath behind it, not instantly.
	const rise = Math.max(1, Math.round(attack * SR));
	const fall = Math.max(1, Math.round(Math.min(dur * 0.45, 0.35) * SR));
	for (let i = 0; i < n; i++) {
		let e = 1;
		if (i < rise) e *= i / rise;
		if (i > n - fall) e *= (n - i) / fall;
		body[i] *= e * gain;
	}
	return body;
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
	return fadeEnds(normalizeLoudness(saturate(b, 4), MIX.uiClick), SR, 3);
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
	return fadeEnds(normalizeLoudness(out, MIX.spinStart), SR, 6);
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
	return fadeEnds(normalizeLoudness(out, MIX.spinCharge), SR, 8);
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

const chantCollect = () => {
	const b = buffer(0.85);
	const root = NOTE(45); // A2, a low male register
	addAt(b, voice(0.72, (t) => root * (1 + 0.33 * t), { vowel: 'oh', vowelTo: 'ah', gain: 0.9, attack: 0.05 }), 0, 1);
	// a second voice a fifth above, quieter and later - two people, not a chorus
	addAt(b, voice(0.55, (t) => root * 1.5 * (1 + 0.28 * t), { vowel: 'ah', gain: 0.34, attack: 0.09 }), 0.09, 1);
	// the room the shrine is in
	return fadeEnds(normalizeLoudness(delay(lowpass(b, 5200), 0.11, 0.28, 0.24), MIX.chantCollect), SR, 8);
};

/**
 * The priestess, as the reels are still turning: the incantation under the tease.
 *
 * Longer, lower and unhurried, because it arrives BEFORE the player knows what is
 * coming and its job is to make them wait rather than to tell them anything. It
 * settles onto "om" and stays there - the one place in the set where a sound is
 * allowed to just hold.
 *
 * No words, in any language. See the note on `voice`.
 */
const chantTease = () => {
	const b = buffer(2.4);
	const root = NOTE(40); // E2
	// three syllables, each a little higher, the last one held
	// Each utterance MOVES: the mouth opens on the way in and closes on the way
	// out, which is what a chanted syllable does and what a held vowel does not.
	addAt(b, voice(0.5, root, { vowel: 'oh', vowelTo: 'om', gain: 0.7, attack: 0.1 }), 0, 1);
	addAt(b, voice(0.5, root * 1.12, { vowel: 'om', vowelTo: 'ah', gain: 0.72, attack: 0.1 }), 0.52, 1);
	// The long one opens to 'ah' and settles back onto 'om', so the phrase ends
	// closed - a chant lands on a hum.
	addAt(
		b,
		voice(1.25, (t) => root * 1.25 * (1 - 0.04 * t), {
			vowel: 'ah',
			vowelTo: 'om',
			gain: 0.85,
			attack: 0.14,
			vibrato: 0.016,
			scoop: 0.055,
		}),
		1.04,
		1,
	);
	// the fifth above, entering only on the held note, so the ending opens out
	addAt(b, voice(1.0, root * 1.875, { vowel: 'om', gain: 0.26, attack: 0.3, scoop: 0 }), 1.25, 1);
	// one small bell under the first syllable - the censer being set down
	addAt(b, bell(0.9, NOTE(76), { gain: 0.2, strike: 0.1 }), 0.02, 0.5);
	return fadeEnds(normalizeLoudness(delay(lowpass(b, 4600), 0.17, 0.4, 0.3), MIX.chantTease), SR, 12);
};

/**
 * The weight under a win: a low sine dropping away, with a slam on top.
 *
 * This is the part a fanfare cannot do without and the tiers had none of. A run
 * of plucked notes and a bell is a nice piece of music and it is all TRANSIENT -
 * measured, the tiers ran at a crest factor of 16 to 20 dB, so their peaks were
 * at the ceiling while the sound arriving at the ear was 6 dB below a reel stop.
 * The five loudest moments in the game were quieter than a reel landing.
 *
 * A tone sweeping down through the bottom two octaves fixes it, because low
 * frequencies carry energy without carrying peak: it lands as pressure rather
 * than as a click, and it leaves the transient budget for the bell and the run
 * above it.
 */
const impact = (dur, freq, { gain = 1 } = {}) => {
	const b = buffer(dur);
	// the drop: an octave and a half down over the first third
	addAt(b, tone(dur, (t) => freq * Math.pow(0.36, Math.min(1, t * 3)), { shape: 'sine', decay: 3.4 }), 0, gain);
	// the slam that starts it - short, so it reads as the moment of arrival
	addAt(b, lowpass(noise(0.09, { decay: 22 }), 700), 0, 0.55 * gain);
	// one octave up at a fifth of the level, which is what stops a pure sine from
	// disappearing on a small speaker
	addAt(b, tone(dur * 0.6, (t) => freq * 2 * Math.pow(0.4, Math.min(1, t * 3)), { shape: 'sine', decay: 5 }), 0, 0.2 * gain);
	return b;
};

/**
 * The five win tiers, as five different pieces of the same music.
 *
 * They had no sound at all. The tiers named `bgm_winlevel_big` and friends, which
 * lived in the howler sprite - a different game's audio - and when that sprite was
 * removed for being 17MB of something nobody played, the five loudest moments in
 * the game went quiet with it.
 *
 * ── layers, not volumes ──
 *
 * Each tier ADDS an instrument rather than playing the same thing louder, because
 * a player cannot hear that a sound is 3dB up but can hear that a gong arrived.
 * The set is cumulative, so the escalation is audible in one hearing:
 *
 *     BIG        a struck bell and a plucked run
 *     SUPER      + the frame drum under it
 *     MEGA       + the gong
 *     EPIC       + the voice, and the run doubles back
 *     MAX        + a second gong and a bell cascade over the top
 *
 * All five are in the bed's own mode - A minor pentatonic, the scale
 * design/generate_audio_terminal's bgm() plays in - so a win sounds like this
 * game rather than like a stock fanfare dropped into it. The run climbs the scale
 * and each tier climbs further, which is the same shape the plaques escalate in.
 */
const WIN_TIER_MS = [1.7, 2.1, 2.6, 3.2, 4.0];
const winTier = (tier) => {
	const dur = WIN_TIER_MS[tier];
	const b = buffer(dur);
	const root = 45; // A2, the bed's root
	const scale = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
	const note = (i) => NOTE(root + scale[Math.min(scale.length - 1, i)] + 24);

	// ── the run: every tier has one, and it goes further each time ──
	const steps = 4 + tier * 2;
	const spacing = 0.075 - tier * 0.004;
	for (let i = 0; i < steps; i++) {
		addAt(
			b,
			pluck(0.9, note(i), { gain: 0.34 + tier * 0.03, damp: 0.009 }),
			0.04 + i * spacing,
			1,
		);
	}
	// EPIC and MAX double back down, so the top of the run is a turn rather than
	// a stop.
	if (tier >= 3) {
		for (let i = 0; i < steps - 2; i++) {
			addAt(b, pluck(0.7, note(steps - 2 - i), { gain: 0.2, damp: 0.012 }), 0.04 + steps * spacing + i * spacing * 0.8, 1);
		}
	}

	// ── the weight ──
	//
	// Every tier gets one and it grows with them. Deeper as well as louder: the
	// bottom of a sound is where "big" lives, and dropping the pitch a step per
	// tier does more for the escalation than the level does.
	// Measured back from a first pass that overdid it: at gain 0.85 the low band
	// carried 85% of the energy, which is not weight, it is mud - and on a phone
	// speaker that band is simply not reproduced, so the cue would have been
	// loudest exactly where most players cannot hear it.
	addAt(b, impact(dur * 0.75, 78 - tier * 8, { gain: 0.42 + tier * 0.055 }), 0, 1);

	// ── the bell: the arrival ──
	addAt(b, bell(dur * 0.8, NOTE(root + 24), { gain: 0.5 + tier * 0.06, strike: 0.3 }), 0, 1);

	// ── the drum, from SUPER up ──
	if (tier >= 1) {
		addAt(b, frameDrum(0.5, 60, { gain: 0.9 }), 0, 1);
		addAt(b, frameDrum(0.4, 60, { gain: 0.6 }), 0.28, 1);
	}
	// ── the gong, from MEGA up ──
	if (tier >= 2) {
		addAt(b, gong(dur * 0.85, NOTE(root - 5), { gain: 0.55 }), 0.02, 1);
	}
	// ── the voice, from EPIC up ──
	if (tier >= 3) {
		addAt(b, voice(dur * 0.55, NOTE(root - 5), { vowel: 'om', gain: 0.42, attack: 0.12 }), 0.22, 1);
	}
	// ── MAX: a second gong and a cascade of bells over the top ──
	if (tier >= 4) {
		addAt(b, gong(dur * 0.7, NOTE(root - 12), { gain: 0.5 }), 0.5, 1);
		for (let i = 0; i < 6; i++) {
			addAt(b, bell(1.1, NOTE(root + 24 + scale[i + 4]), { gain: 0.22, strike: 0.14 }), 0.9 + i * 0.13, 1);
		}
	}

	const shaped = lowpass(b, 6200 + tier * 500);
	// Saturated before levelling, and hard enough to matter.
	//
	// These cues are almost entirely transient, so asking for a loud target
	// without compressing first just runs the peaks into the ceiling and stops
	// short - the same thing that holds the reel stop where it is. A soft tanh
	// curve pulls the body up towards the peak, which is what a compressor is for,
	// and lets the level actually be reached. Measured, it takes the crest factor
	// from about 18 dB to about 12.
	// Pressed to a crest of 11 dB - a fanfare, not a wall. A fixed drive left the
	// peakiest tier unable to reach its level at all; see pressToCrest.
	const pressed = pressToCrest(delay(shaped, 0.15, 0.3, 0.26), 11);
	// PLAIN rms, not the weighted measure the rest of the set uses.
	//
	// The weighting is frequency-dependent, and these five differ from each other
	// precisely in their spectrum - each tier adds an instrument in a different
	// band. Levelling them by a weighted measure gave five files that met the same
	// weighted target and did NOT climb: tier 2, which adds the frame drum, came
	// out 2.3 dB QUIETER than tier 1, so the second step of the escalation went
	// down.
	//
	// A ladder should be levelled by the measure it is a ladder in.
	return fadeEnds(normalizeRms(pressed, MIX.winTier[tier]), SR, 10);
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
	return fadeEnds(normalizeLoudness(b, MIX.blast), SR, 6);
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
	return fadeEnds(normalizeLoudness(delay(b, 0.11, 0.24, 0.26), MIX.leverageLand), SR, 4);
};

// The meter ratcheting up one step.
// A talisman stamping onto the rail: the smallest bell in the set.
const meterTick = () => {
	const b = buffer(0.22);
	addAt(b, bell(0.18, NOTE(93), { gain: 0.4, strike: 0.3 }), 0, 1);
	return fadeEnds(normalizeLoudness(saturate(b, 4), MIX.meterTick), SR, 3);
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
	return fadeEnds(normalizeLoudness(b, MIX.boardExpand), SR, 6);
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
	return fadeEnds(normalizeLoudness(b, MIX.featureIntro), SR, 8);
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
	return normalizeLoudness(seamless(lowpass(b, 1400), 40), MIX.tension);
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
	return normalizeLoudness(seamless(withTail, 80), MIX.shimmer);
};

// ─── music ──────────────────────────────────────────────────────────────────
/**
 * A plucked string, by Karplus-Strong.
 *
 * A ring buffer one period long, filled with noise and averaged with itself as it
 * circulates. That is not an approximation of a string, it IS one: a wave running
 * a fixed length and losing its high frequencies a little on every return trip,
 * which is why the attack is bright and the tail is not.
 *
 * It replaces a sawtooth in the music bed. A saw at the same pitch is a buzz that
 * starts and stops; this decays the way a struck string does, and one line of it
 * carries a bar without needing a drum under it to be interesting.
 */
const pluck = (dur, freq, { gain = 1, damp = 0.012, sr = SR } = {}) => {
	const n = Math.ceil(dur * sr);
	const len = Math.max(2, Math.round(sr / freq));
	const ring = new Float32Array(len);
	for (let i = 0; i < len; i++) ring[i] = rand2();
	const out = new Float32Array(n);
	let idx = 0;
	let prev = 0;
	for (let i = 0; i < n; i++) {
		const cur = ring[idx];
		out[i] = cur * gain;
		// one-zero lowpass in the feedback path: the damping IS the decay
		ring[idx] = (cur + prev) * 0.5 * (1 - damp);
		prev = cur;
		idx = idx + 1 === len ? 0 : idx + 1;
	}
	return out;
};

/**
 * A frame drum. A membrane, not a kick: low, short, and with a body that is
 * wood rather than a sine sweep.
 */
const frameDrum = (dur, freq, { gain = 1, sr = SR } = {}) => {
	const b = buffer(dur, sr);
	addAt(b, tone(dur * 0.7, (t) => freq * (1 - 0.35 * t), { shape: 'sine', decay: 9, sr }), 0, 0.9 * gain, sr);
	addAt(b, tone(dur * 0.5, freq * 1.6, { shape: 'sine', decay: 16, sr }), 0, 0.25 * gain, sr);
	addAt(b, lowpass(noise(dur * 0.25, { decay: 26, sr }), 1600, sr), 0, 0.5 * gain, sr);
	return b;
};

// ── the bed ─────────────────────────────────────────────────────────────────
//
// This was a TECHNO LOOP, and it was the last of the trading floor left in the
// game: four on the floor, a sub, sixteenth-note gated saw - its own comment
// called it "the machine running" - a square arp and offbeat hi-hats, over
// Am / F / G / Em / D. The sound effects had been rebuilt around bells, a wood
// block and a gong long before, so the game was playing a night shrine over a
// dance track.
//
// What replaces it is the same objects the effects use, playing:
//
//   frame drum    a slow two-beat pulse, the room breathing
//   wood block    the offbeat, where the hats were - a temple block keeps time
//                 in a shrine, and it is dry where a hat is bright
//   guzheng       the line, plucked (see `pluck`), where the saw sequence was
//   drone         a held root and fifth instead of a sub, so the floor is a
//                 held note and not a pulse
//   bell          one strike to close each four-bar phrase
//
// PENTATONIC, not the old progression. Five notes with no semitone in them is
// what makes a line read as East Asian without any of the ornaments people reach
// for; a functional chord sequence with a flattened something on top is pastiche.
// The mode is A minor pentatonic - A C D E G - and the bed never leaves it.
// Named for the BED so it cannot be confused with the win-run scale inside
// winRun(), which is a different set of degrees for a different job.
const BED_PENTA = [0, 3, 5, 7, 10];
// The line, as scale degrees. Two four-bar phrases: the first sits, the second
// climbs and comes back, so sixteen bars have a shape rather than a repeat.
const PHRASE = [
	[0, 2, 1, 0, 2, 3, 2, 1],
	[0, 2, 1, 0, 4, 3, 2, 0],
	[2, 3, 4, 3, 2, 1, 0, 1],
	[0, 2, 1, 0, 2, 1, 0, 0],
];

const bgm = ({ bpm, bright }) => {
	const sr = SR_BGM;
	const beat = 60 / bpm;
	const bar = beat * 4;
	const bars = 16;
	const dur = bar * bars;
	const b = buffer(dur, sr);
	const root = 45; // A2
	const deg = (d) => {
		const octave = Math.floor(d / BED_PENTA.length);
		return root + BED_PENTA[((d % BED_PENTA.length) + BED_PENTA.length) % BED_PENTA.length] + 12 * octave;
	};

	for (let barIndex = 0; barIndex < bars; barIndex++) {
		const barT = barIndex * bar;
		// The second half opens up, so the loop has somewhere to go and back.
		const open = barIndex >= bars / 2;
		const phrase = PHRASE[barIndex % PHRASE.length];

		// ── frame drum: two to the bar, the room breathing ──
		for (let beatIndex = 0; beatIndex < 4; beatIndex += 2) {
			addWrapped(
				b,
				frameDrum(beat * 0.8, 62, { gain: beatIndex === 0 ? 1 : 0.7, sr }),
				barT + beatIndex * beat,
				0.5,
				sr,
			);
		}

		// ── drone: root and fifth, held. A floor, not a pulse. ──
		addWrapped(b, tone(bar * 1.02, NOTE(root - 12), { shape: 'sine', decay: 0.7, sr }), barT, 0.16, sr);
		addWrapped(b, tone(bar * 1.02, NOTE(root - 5), { shape: 'sine', decay: 0.7, sr }), barT, 0.09, sr);

		// ── the line, plucked ──
		for (let step = 0; step < 8; step++) {
			// the gap is what makes it breathe; a note on every eighth is a machine
			if (step === 3 || (!open && step === 6)) continue;
			const at = barT + (step / 8) * bar;
			const note = deg(phrase[step] + (open && step % 4 === 2 ? 5 : 0));
			addWrapped(
				b,
				pluck(beat * 1.6, NOTE(note + 12), { gain: open ? 0.5 : 0.38, damp: 0.010, sr }),
				at,
				1,
				sr,
			);
		}

		// ── wood block on the offbeat, where the hats were ──
		for (let step = 1; step < 8; step += 2) {
			addWrapped(
				b,
				woodBlock(0.09, NOTE(74 + (step === 5 ? 3 : 0)), { gain: 0.5, sr }),
				barT + (step / 8) * bar,
				open ? 0.34 : 0.26,
				sr,
			);
		}

		// ── one bell to close each four-bar phrase ──
		if (barIndex % 4 === 3) {
			addWrapped(b, bell(bar * 0.9, NOTE(81), { gain: 0.3, strike: 0.12, sr }), barT + bar * 0.5, 0.55, sr);
		}
	}

	// The feature is the same room with the lid off: brighter, and with the
	// priestess just audible under it. Not a different piece of music - a player
	// who has been in the base game for an hour should recognise where they are.
	const shaped = bright ? highpass(lowpass(b, 7200, sr), 60, sr) : lowpass(b, 4200, sr);
	const pressed = saturate(shaped, 1.6);
	return normalizeLoudness(seamless(pressed, 90, sr), bright ? MIX.bgmFeature : MIX.bgmMain, sr);
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
for (let tier = 0; tier < 5; tier++) writeWav(`win_tier_${tier + 1}`, winTier(tier));
writeWav('chant_collect', chantCollect());
writeWav('chant_tease', chantTease());
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

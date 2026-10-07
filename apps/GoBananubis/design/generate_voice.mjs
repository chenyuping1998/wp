// The sergeant's voice — chitters, hoots and grunts, synthesized in pure Node.
//
//   node design/generate_voice.mjs
//
// Writes static/assets/audio/jungle/voice_*.wav, one clip per animation, so the
// character makes a noise when he does something rather than miming.
//
// WHY IT IS SYNTHESIZED RATHER THAN A BEEP
//
// The existing `hoot` in generate_audio_jungle.mjs is a sine sweep. It works as
// a flourish buried inside a win jingle and it does not work on its own: a bare
// sine is a whistle, not an animal. What makes a sound read as a VOICE is
// formants - fixed resonances the throat and mouth impose on top of whatever
// pitch the vocal folds are producing.
//
// So every clip here is built the same way a voice is:
//
//   SOURCE     a pulse train at f0, one sharp glottal pulse per period, with a
//              little noise mixed in for breath
//   FILTER     two resonant bandpasses at F1 and F2, the vowel
//   ENVELOPE   per-syllable, because a monkey call is a run of syllables and an
//              evenly sustained tone is the giveaway that it is not one
//
// The vowel carries as much as the pitch: both clips here sit low and closed
// (an "uh"), which is what a primate does when it is straining rather than
// calling out.
//
// TWO CLIPS, FOR THE TWO QUIET MOMENTS
//
// There is deliberately none for the nod, which fires on most paying base spins
// — a character who vocalises that often is a notification sound, not a
// character.
//
// And none for the big-win cheer, for the opposite reason: that moment already
// has a blast, a coin shimmer and a plaque counting up. A voice added to it was
// not a reaction, it was one more thing in a pile. He still jumps; the animation
// is the reaction. What is left are the two moments quiet enough to hear him in.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/audio/jungle');
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;

// Deterministic, so regenerating gives byte-identical files and a diff means
// something actually changed.
let seed = 20260829;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const rand2 = () => rand() * 2 - 1;

const buffer = (dur) => new Float32Array(Math.ceil(dur * SR));

const addAt = (dst, src, at, gain = 1) => {
	const start = Math.round(at * SR);
	for (let i = 0; i < src.length && start + i < dst.length; i++) dst[start + i] += src[i] * gain;
};

const normalize = (buf, peak = 0.85) => {
	let max = 1e-9;
	for (const v of buf) max = Math.max(max, Math.abs(v));
	for (let i = 0; i < buf.length; i++) buf[i] *= peak / max;
	return buf;
};

const fadeEnds = (buf, ms = 6) => {
	const n = Math.min(buf.length >> 1, Math.round((ms / 1000) * SR));
	for (let i = 0; i < n; i++) {
		const g = i / n;
		buf[i] *= g;
		buf[buf.length - 1 - i] *= g;
	}
	return buf;
};

/** Resonant bandpass — one formant. */
const resonate = (buf, freq, q) => {
	const w = (2 * Math.PI * freq) / SR;
	const alpha = Math.sin(w) / (2 * q);
	const b0 = alpha, b2 = -alpha;
	const a0 = 1 + alpha, a1 = -2 * Math.cos(w), a2 = 1 - alpha;
	const out = new Float32Array(buf.length);
	let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
	for (let i = 0; i < buf.length; i++) {
		const x0 = buf[i];
		const y0 = (b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
		out[i] = y0;
		x2 = x1; x1 = x0; y2 = y1; y1 = y0;
	}
	return out;
};

/**
 * One syllable.
 *
 * `f1`/`f2` are the vowel. `breath` is how much of the source is noise rather
 * than pulses — a call with none is a synthesizer, a call with too much is a
 * whisper.
 */
const syllable = ({ dur, f0, f0End, f1, f2, breath = 0.07, rasp = 0, shape }) => {
	const src = buffer(dur);
	let phase = 0;
	for (let i = 0; i < src.length; i++) {
		const t = i / SR;
		const p = Math.min(1, t / dur);
		// pitch glides exponentially, the way a voice does, not linearly
		const f = f0 * Math.pow((f0End ?? f0) / f0, p);
		phase += f / SR;
		if (phase >= 1) phase -= 1;
		// glottal pulse: sharp opening, exponential close, once per period
		const pulse = Math.exp(-phase * 6.5) * 2 - 0.55;
		// rasp = irregular period-to-period amplitude, which is what makes a
		// growl sound like an animal under strain rather than a clean note
		const jitter = 1 + rasp * rand2();
		src[i] = pulse * jitter + rand2() * breath;
	}
	const a = resonate(src, f1, 11);
	const b = resonate(src, f2, 9);
	const out = new Float32Array(src.length);
	for (let i = 0; i < out.length; i++) {
		const p = i / out.length;
		// default: a fast attack and a longer release — a call is pushed out, not
		// faded in
		const env = shape ? shape(p) : Math.min(1, p * 14) * Math.pow(1 - p, 1.4);
		out[i] = (src[i] * 0.22 + a[i] * 1.0 + b[i] * 0.55) * env;
	}
	return fadeEnds(out, 4);
};

const write = (name, buf, peak = 0.8) => {
	const b = fadeEnds(normalize(buf, peak), 6);
	const n = b.length;
	const data = Buffer.alloc(44 + n * 2);
	data.write('RIFF', 0);
	data.writeUInt32LE(36 + n * 2, 4);
	data.write('WAVE', 8);
	data.write('fmt ', 12);
	data.writeUInt32LE(16, 16);
	data.writeUInt16LE(1, 20);
	data.writeUInt16LE(1, 22);
	data.writeUInt32LE(SR, 24);
	data.writeUInt32LE(SR * 2, 28);
	data.writeUInt16LE(2, 32);
	data.writeUInt16LE(16, 34);
	data.write('data', 36);
	data.writeUInt32LE(n * 2, 40);
	for (let i = 0; i < n; i++) {
		data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(b[i] * 32767))), 44 + i * 2);
	}
	fs.writeFileSync(path.join(OUT, name), data);
	console.log(`${name}  ${(n / SR).toFixed(2)}s`);
};

// ── roar: the chest beat ───────────────────────────────────────────────────
// One clip covering the whole animation rather than a grunt fired per strike,
// because the timing is fixed and baking it in is the only way it stays in sync.
//
// WHICH MEANS THE NUMBERS HAVE TO BE THE CURRENT ONES.
//
// They were the GORILLA's — six strikes 0.3s apart starting at 0.48, from
// design/generate_monkey_spine.mjs — and the character has been Anubis since
// 2026-09-06, whose beat is four strikes 0.42s apart starting at 0.36 over a
// 2.44s clip (printed by design/generate_anubis_spine.mjs). So the clip grunted
// six times against four hits and only the second one landed on anything; the
// last two arrived after he had stopped.
//
// Re-run design/generate_anubis_spine.mjs and read its "chestbeat" line if the
// animation is ever re-cut; these three numbers are the whole contract.
{
	const BEAT_START = 0.36;
	const BEAT_GAP = 0.42;
	const BEAT_COUNT = 4;
	const buf = buffer(2.44);
	// the low build while he squares up
	addAt(
		buf,
		syllable({
			// exactly the wind-up, so it has stopped by the time the first fist
			// lands: measured at 0.5 it was still going through the first strike
			// and the loudest hit of the four came out muddy
			dur: 0.34,
			f0: 105,
			f0End: 88,
			f1: 480,
			f2: 1150,
			breath: 0.12,
			rasp: 0.35,
			shape: (p) => Math.min(1, p * 3) * Math.min(1, (1 - p) * 4),
		}),
		// ends as the first strike lands: the wind-up is 0.22s of the animation
		// and the build has to finish inside it, not run over the first hit
		Math.max(0, BEAT_START - 0.34),
		0.85,
	);
	// a grunt forced out on every strike, alternating slightly in pitch so four of
	// them do not read as one sample repeated
	for (let i = 0; i < BEAT_COUNT; i++) {
		const low = i % 2 === 0;
		addAt(
			buf,
			syllable({
				dur: 0.17,
				f0: low ? 128 : 116,
				f0End: low ? 96 : 88,
				f1: low ? 520 : 470,
				f2: 1220,
				breath: 0.16,
				rasp: 0.4,
				shape: (p) => Math.min(1, p * 26) * Math.pow(1 - p, 1.1),
			}),
			BEAT_START + i * BEAT_GAP - 0.01,
			1,
		);
	}
	write('voice_roar.wav', buf, 0.9);
}

// ── effort: the throw ──────────────────────────────────────────────────────
// A "hup" on the release. Short, closed, and mostly breath — the sound of air
// being pushed out, which is what an effort noise is.
{
	const buf = buffer(0.4);
	addAt(
		buf,
		syllable({
			dur: 0.22,
			f0: 260,
			f0End: 150,
			f1: 620,
			f2: 1150,
			breath: 0.22,
			rasp: 0.2,
			shape: (p) => Math.min(1, p * 30) * Math.pow(1 - p, 1.6),
		}),
		0.01,
	);
	write('voice_effort.wav', buf, 0.72);
}

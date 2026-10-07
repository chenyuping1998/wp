// GoBananas jungle-commando audio generator — pure-Node synthesis, 16-bit WAV.
// Instruments: marimba, bongo/conga membranes, shaker, snare roll, cartoon
// horn, whoosh and monkey hoots. Same file names as the old cn/ set so the
// Sound.svelte mapping only changes its directory. No external dependencies.
// Usage: node design/generate_audio_jungle.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/audio/jungle');
fs.mkdirSync(OUT, { recursive: true });

const SR_SFX = 44100;
const SR_BGM = 22050;

// ─── plumbing (deterministic PRNG so regeneration is reproducible) ───────────
let seed = 20260703;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const rand2 = () => rand() * 2 - 1;

const buffer = (dur, sr) => new Float32Array(Math.ceil(dur * sr));

const addAt = (dst, src, offsetSec, gain, sr) => {
	const start = Math.round(offsetSec * sr);
	for (let i = 0; i < src.length && start + i < dst.length; i++) {
		dst[start + i] += src[i] * gain;
	}
};

const normalize = (buf, peak = 0.85) => {
	let max = 1e-9;
	for (const v of buf) max = Math.max(max, Math.abs(v));
	const g = peak / max;
	for (let i = 0; i < buf.length; i++) buf[i] *= g;
	return buf;
};

const fadeEnds = (buf, sr, ms = 6) => {
	const n = Math.min(buf.length, Math.round((ms / 1000) * sr));
	for (let i = 0; i < n; i++) {
		const g = i / n;
		buf[i] *= g;
		buf[buf.length - 1 - i] *= g;
	}
	return buf;
};

const writeWav = (name, buf, sr) => {
	const n = buf.length;
	const data = Buffer.alloc(44 + n * 2);
	data.write('RIFF', 0);
	data.writeUInt32LE(36 + n * 2, 4);
	data.write('WAVE', 8);
	data.write('fmt ', 12);
	data.writeUInt32LE(16, 16);
	data.writeUInt16LE(1, 20);
	data.writeUInt16LE(1, 22);
	data.writeUInt32LE(sr, 24);
	data.writeUInt32LE(sr * 2, 28);
	data.writeUInt16LE(2, 32);
	data.writeUInt16LE(16, 34);
	data.write('data', 36);
	data.writeUInt32LE(n * 2, 40);
	for (let i = 0; i < n; i++) {
		const v = Math.max(-1, Math.min(1, buf[i]));
		data.writeInt16LE((v * 32767) | 0, 44 + i * 2);
	}
	fs.writeFileSync(path.join(OUT, name), data);
	console.log('wrote', name, `${(data.length / 1024).toFixed(0)}KB`);
};

// ─── instruments ─────────────────────────────────────────────────────────────
// marimba — hollow wooden bar: fundamental + 3.9x/9.2x partials, mallet click
const marimba = (freq, dur, sr, soft = 0) => {
	const out = buffer(dur, sr);
	const partials = [
		[1, 1, 5.5],
		[3.9, 0.4 - soft * 0.2, 14],
		[9.2, 0.12 - soft * 0.08, 30],
	];
	for (const [ratio, amp, k] of partials) {
		if (amp <= 0) continue;
		const phase = rand() * Math.PI * 2;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			out[i] += amp * Math.exp(-k * t) * Math.sin(2 * Math.PI * freq * ratio * t + phase);
		}
	}
	for (let i = 0; i < Math.min(out.length, sr * 0.004); i++) out[i] += rand2() * 0.25;
	return fadeEnds(out, sr);
};

// bongo / conga — pitched membrane, tight and woody
const bongo = (sr, { from = 420, to = 300, dur = 0.16, punch = 1 } = {}) => {
	const out = buffer(dur, sr);
	let phase = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const p = Math.min(1, t / (dur * 0.6));
		const f = from * Math.pow(to / from, p);
		phase += (2 * Math.PI * f) / sr;
		out[i] = Math.sin(phase) * Math.exp(-22 * t) * punch;
	}
	for (let i = 0; i < Math.min(out.length, sr * 0.006); i++) {
		out[i] += rand2() * 0.45 * Math.exp((-320 * i) / sr);
	}
	return fadeEnds(out, sr);
};

const conga = (sr, punch = 1) => bongo(sr, { from: 230, to: 150, dur: 0.32, punch });
const tom = (sr, punch = 1) => bongo(sr, { from: 150, to: 70, dur: 0.5, punch });

// shaker — short highpassed noise chick
const shaker = (sr, dur = 0.09, tone = 0.55) => {
	const out = buffer(dur, sr);
	let lp = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const n = rand2();
		lp += tone * (n - lp);
		out[i] = (n - lp) * Math.exp(-38 * t);
	}
	return fadeEnds(out, sr, 3);
};

// snare — noise burst + 190Hz body, for rolls
const snare = (sr, punch = 1) => {
	const dur = 0.14;
	const out = buffer(dur, sr);
	let lp = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const n = rand2();
		lp += 0.4 * (n - lp);
		out[i] = ((n - lp) * 0.8 + Math.sin(2 * Math.PI * 190 * t) * 0.5) * Math.exp(-30 * t) * punch;
	}
	return fadeEnds(out, sr, 3);
};

// cartoon horn — detuned saw stack with attack bend and vibrato
const horn = (freq, dur, sr, bend = 0.12) => {
	const out = buffer(dur, sr);
	for (const det of [0.996, 1.0, 1.005]) {
		let phase = rand() * Math.PI * 2;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			const glide = 1 - bend * Math.exp(-14 * t);
			const vib = 1 + 0.008 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t * 3);
			phase += (2 * Math.PI * freq * det * glide * vib) / sr;
			// odd-harmonic-ish square-saw hybrid, gently lowpassed by tanh
			const raw = Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.28 * Math.sin(3 * phase) + 0.15 * Math.sin(4 * phase);
			const env = Math.min(1, t * 28) * Math.exp(-2.4 * Math.max(0, t - dur * 0.55));
			out[i] += Math.tanh(raw * 1.3) * env * 0.33;
		}
	}
	return fadeEnds(out, sr);
};

// cymbal — metallic partial cloud (kept from the old set, explosions need it)
const cymbal = (dur, sr) => {
	const out = buffer(dur, sr);
	for (let p = 0; p < 14; p++) {
		const f = 1900 + rand() * 7200;
		const a = 0.12 + rand() * 0.1;
		const k = 2.6 + rand() * 3.4;
		const phase = rand() * Math.PI * 2;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			out[i] += a * Math.exp(-k * t) * Math.sin(2 * Math.PI * f * t + phase);
		}
	}
	let lp = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const n = rand2();
		lp += 0.35 * (n - lp);
		out[i] += (n - lp) * 0.5 * Math.exp(-5.5 * t);
	}
	return fadeEnds(out, sr);
};

// whoosh — noise humps through a wobbling lowpass (banana twirl)
const whoosh = (dur, sr, centers, width = 0.09) => {
	const out = buffer(dur, sr);
	let lp = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		let env = 0.02;
		for (const c of centers) {
			const d = (t - c) / width;
			env += Math.exp(-d * d);
		}
		const cutoff = 0.08 + 0.3 * Math.min(1, env);
		lp += cutoff * (rand2() - lp);
		out[i] = lp * env;
	}
	return fadeEnds(out, sr);
};

// cartoon spring boing — pitch-rising wobble
const boing = (sr, { from = 180, to = 620, dur = 0.55 } = {}) => {
	const out = buffer(dur, sr);
	let phase = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const p = Math.min(1, t / (dur * 0.8));
		const f = from * Math.pow(to / from, p) * (1 + 0.06 * Math.sin(2 * Math.PI * 26 * t) * (1 - p));
		phase += (2 * Math.PI * f) / sr;
		out[i] = Math.tanh(Math.sin(phase) * 1.4) * Math.exp(-3.2 * t) * Math.min(1, t * 60);
	}
	return fadeEnds(out, sr);
};

// cheeky monkey hoot — formant-ish sine sweep "oo"
const hoot = (sr, { from = 540, to = 860, dur = 0.22 } = {}) => {
	const out = buffer(dur, sr);
	let phase = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const p = Math.sin((Math.PI * Math.min(1, t / dur)) / 1.15);
		const f = from + (to - from) * p;
		phase += (2 * Math.PI * f) / sr;
		const env = Math.sin(Math.PI * Math.min(1, t / dur));
		out[i] = (Math.sin(phase) + 0.35 * Math.sin(2 * phase)) * env;
	}
	return fadeEnds(out, sr, 4);
};

// ─── notes: C major pentatonic ───────────────────────────────────────────────
const P = { C3: 130.8, D3: 146.8, E3: 164.8, G3: 196, A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5 };

// ─── SFX ─────────────────────────────────────────────────────────────────────
// reel stop — bongo tok
writeWav('reel_stop.wav', normalize(bongo(SR_SFX), 0.7), SR_SFX);

// button tick — tighter, higher bongo
writeWav('btn.wav', normalize(bongo(SR_SFX, { from: 640, to: 520, dur: 0.08 }), 0.4), SR_SFX);

// spin press — conga slap + shaker
{
	const buf = buffer(0.5, SR_SFX);
	addAt(buf, conga(SR_SFX), 0, 1, SR_SFX);
	addAt(buf, shaker(SR_SFX), 0, 0.5, SR_SFX);
	writeWav('spin.wav', normalize(buf, 0.75), SR_SFX);
}

// scatter stops 1..5 — rising marimba
[['scatter_1', P.A4], ['scatter_2', P.C5], ['scatter_3', P.D5], ['scatter_4', P.E5], ['scatter_5', P.G5]].forEach(
	([name, f]) => {
		const buf = buffer(1.0, SR_SFX);
		addAt(buf, marimba(f, 0.9, SR_SFX), 0, 1, SR_SFX);
		addAt(buf, marimba(f * 2, 0.6, SR_SFX), 0.03, 0.3, SR_SFX);
		writeWav(`${name}.wav`, normalize(buf, 0.72), SR_SFX);
	},
);

// low thunk — wild lands in base game
{
	const buf = buffer(0.9, SR_SFX);
	addAt(buf, marimba(P.C4, 0.8, SR_SFX), 0, 1, SR_SFX);
	addAt(buf, tom(SR_SFX, 0.8), 0.01, 0.7, SR_SFX);
	writeWav('pluck_low.wav', normalize(buf, 0.7), SR_SFX);
}

// small win — quick ascending marimba run
{
	const buf = buffer(1.3, SR_SFX);
	[P.C4, P.D4, P.E4, P.G4, P.A4, P.C5, P.D5, P.E5].forEach((f, i) => {
		addAt(buf, marimba(f, 0.6, SR_SFX), i * 0.05, 0.8 - i * 0.03, SR_SFX);
	});
	addAt(buf, shaker(SR_SFX, 0.3, 0.4), 0.35, 0.3, SR_SFX);
	writeWav('win_gliss.wav', normalize(buf, 0.72), SR_SFX);
}

// big scatter win / feature payoff — two-octave run + horn + hoots
{
	const buf = buffer(3.0, SR_SFX);
	[P.C4, P.D4, P.E4, P.G4, P.A4, P.C5, P.D5, P.E5, P.G5, P.A5, P.C6].forEach((f, i) => {
		addAt(buf, marimba(f, 0.7, SR_SFX), i * 0.055, 0.7, SR_SFX);
	});
	addAt(buf, horn(P.C5, 0.9, SR_SFX), 0.62, 0.55, SR_SFX);
	addAt(buf, hoot(SR_SFX), 1.5, 0.28, SR_SFX);
	addAt(buf, hoot(SR_SFX, { from: 600, to: 940, dur: 0.2 }), 1.75, 0.24, SR_SFX);
	addAt(buf, cymbal(1.2, SR_SFX), 0.6, 0.25, SR_SFX);
	writeWav('win_gliss_big.wav', normalize(buf, 0.8), SR_SFX);
}

// free-game trigger — jungle alarm: tom roll, horn blast, excited hoots
{
	const buf = buffer(3.0, SR_SFX);
	for (let i = 0; i < 8; i++) {
		addAt(buf, tom(SR_SFX, 0.5 + i * 0.06), i * 0.075, 0.8, SR_SFX);
	}
	addAt(buf, horn(P.G4, 1.4, SR_SFX, 0.2), 0.6, 0.9, SR_SFX);
	addAt(buf, horn(P.C5, 1.6, SR_SFX, 0.16), 1.15, 0.85, SR_SFX);
	addAt(buf, cymbal(1.4, SR_SFX), 0.62, 0.4, SR_SFX);
	addAt(buf, hoot(SR_SFX), 1.9, 0.3, SR_SFX);
	addAt(buf, hoot(SR_SFX, { from: 620, to: 980, dur: 0.24 }), 2.18, 0.28, SR_SFX);
	addAt(buf, hoot(SR_SFX, { from: 700, to: 1050, dur: 0.2 }), 2.46, 0.24, SR_SFX);
	writeWav('gong_feature.wav', normalize(buf, 0.85), SR_SFX);
}

// free-spin intro jingle — snare roll into horn fanfare
{
	const buf = buffer(2.4, SR_SFX);
	for (let i = 0; i < 14; i++) {
		addAt(buf, snare(SR_SFX, 0.4 + i * 0.04), i * 0.06, 0.7, SR_SFX);
	}
	addAt(buf, horn(P.C5, 0.7, SR_SFX), 0.95, 0.8, SR_SFX);
	addAt(buf, horn(P.E5, 0.9, SR_SFX), 1.3, 0.8, SR_SFX);
	addAt(buf, horn(P.G5, 1.0, SR_SFX), 1.65, 0.7, SR_SFX);
	addAt(buf, cymbal(1.0, SR_SFX), 0.95, 0.3, SR_SFX);
	writeWav('fs_intro.wav', normalize(buf, 0.82), SR_SFX);
}

// big-win blast — boom + cymbal + triumphant horn chord
{
	const buf = buffer(2.4, SR_SFX);
	addAt(buf, tom(SR_SFX, 1.4), 0, 1, SR_SFX);
	addAt(buf, bongo(SR_SFX, { from: 90, to: 40, dur: 0.7, punch: 1.2 }), 0.02, 1, SR_SFX);
	addAt(buf, cymbal(1.8, SR_SFX), 0, 0.5, SR_SFX);
	addAt(buf, horn(P.C4, 1.3, SR_SFX), 0.15, 0.6, SR_SFX);
	addAt(buf, horn(P.G4, 1.3, SR_SFX), 0.18, 0.5, SR_SFX);
	[P.G4, P.A4, P.C5, P.E5, P.G5].forEach((f, i) => addAt(buf, marimba(f, 0.6, SR_SFX), 0.3 + i * 0.07, 0.45, SR_SFX));
	writeWav('bigwin_blast.wav', normalize(buf, 0.85), SR_SFX);
}

// coin shimmer loop (big-win count-up) — cascading marimba + shaker, loopable
{
	const dur = 2.4;
	const buf = buffer(dur, SR_SFX);
	const notes = [P.C6, P.A5, P.G5, P.E5, P.C6, P.G5, P.A5, P.E5, P.C6, P.G5];
	notes.forEach((f, i) => addAt(buf, marimba(f, 0.4, SR_SFX, 0.4), (i * dur) / notes.length, 0.5 + 0.2 * rand(), SR_SFX));
	for (let i = 0; i < 12; i++) addAt(buf, shaker(SR_SFX, 0.07, 0.5), (i * dur) / 12, 0.22, SR_SFX);
	writeWav('coin_shimmer.wav', normalize(buf, 0.55), SR_SFX);
}

// anticipation / reel tension — military snare roll + heartbeat toms, loopable
{
	const dur = 2.0;
	const buf = buffer(dur, SR_SFX);
	for (let i = 0; i < 32; i++) {
		addAt(buf, snare(SR_SFX, 0.3 + 0.12 * Math.sin((i / 32) * Math.PI * 2)), (i * dur) / 32, 0.5, SR_SFX);
	}
	addAt(buf, tom(SR_SFX, 0.9), 0, 0.7, SR_SFX);
	addAt(buf, tom(SR_SFX, 0.7), 0.62, 0.55, SR_SFX);
	addAt(buf, tom(SR_SFX, 0.9), 1.0, 0.7, SR_SFX);
	addAt(buf, tom(SR_SFX, 0.7), 1.62, 0.55, SR_SFX);
	writeWav('reel_tension.wav', normalize(buf, 0.6), SR_SFX);
}

// banana bite crunch — crispy noise snap over a fruity thump; weight scales
// the thump pitch down so each successive bite sounds bigger
const crunch = (sr, weight = 1) => {
	const dur = 0.18;
	const out = buffer(dur, sr);
	let lp = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const n = rand2();
		lp += 0.55 * (n - lp);
		// two-stage decay: snappy transient, short fibrous tail
		const env = Math.exp(-46 * t) + 0.35 * Math.exp(-16 * t);
		out[i] = (n * 0.55 + (n - lp) * 0.7) * env;
	}
	addAt(out, bongo(sr, { from: 300 / weight, to: 130 / weight, dur: 0.12, punch: 1 }), 0.004, 0.85, sr);
	return fadeEnds(out, sr, 3);
};

// expanding wild — the sergeant EATS the banana (timed to the spine grow
// animation: banana to mouth 0.04–0.3, chomps at 0.52/0.84/1.16, gulp 1.44,
// burst into the full-reel wx at 1.5)
{
	const buf = buffer(2.6, SR_SFX);
	addAt(buf, bongo(SR_SFX), 0.02, 0.45, SR_SFX); // banana pops out of the paw
	addAt(buf, whoosh(0.4, SR_SFX, [0.18], 0.07), 0, 0.9, SR_SFX); // …and flies to the mouth
	addAt(buf, crunch(SR_SFX, 1), 0.52, 0.8, SR_SFX);
	addAt(buf, crunch(SR_SFX, 1.25), 0.84, 0.92, SR_SFX);
	addAt(buf, crunch(SR_SFX, 1.55), 1.16, 1.05, SR_SFX);
	addAt(buf, boing(SR_SFX, { from: 620, to: 150, dur: 0.28 }), 1.38, 0.5, SR_SFX); // gulp down
	addAt(buf, horn(P.C5, 0.9, SR_SFX, 0.18), 1.48, 0.85, SR_SFX); // burst!
	addAt(buf, cymbal(0.8, SR_SFX), 1.48, 0.3, SR_SFX);
	addAt(buf, hoot(SR_SFX, { from: 640, to: 1000, dur: 0.22 }), 1.68, 0.26, SR_SFX); // satisfied sergeant
	writeWav('wild_expand.wav', normalize(buf, 0.85), SR_SFX);
}

// multiplier re-roll on sticky wilds — quick marimba ding-ding
{
	const buf = buffer(0.7, SR_SFX);
	addAt(buf, marimba(P.A5, 0.4, SR_SFX), 0, 0.8, SR_SFX);
	addAt(buf, marimba(P.C6, 0.4, SR_SFX), 0.1, 0.8, SR_SFX);
	writeWav('mult_update.wav', normalize(buf, 0.6), SR_SFX);
}

// ─── BGM ─────────────────────────────────────────────────────────────────────
const scheduleMelody = (buf, notes, startBeat, beatSec, sr, gain = 0.8) => {
	let at = startBeat;
	for (const [freq, beats] of notes) {
		if (freq > 0) addAt(buf, marimba(freq, Math.min(1.2, beats * beatSec + 0.3), sr), at * beatSec, gain, sr);
		at += beats;
	}
	return at;
};

// jungle percussion groove for one bar (4 beats)
const grooveBar = (buf, t0, beat, sr, energy = 1) => {
	addAt(buf, conga(sr, 0.9), t0 * beat, 0.5 * energy, sr);
	addAt(buf, bongo(sr), (t0 + 0.5) * beat, 0.2 * energy, sr);
	addAt(buf, bongo(sr, { from: 520, to: 400, dur: 0.12 }), (t0 + 1) * beat, 0.3 * energy, sr);
	addAt(buf, conga(sr, 0.7), (t0 + 1.75) * beat, 0.35 * energy, sr);
	addAt(buf, conga(sr, 0.95), (t0 + 2) * beat, 0.5 * energy, sr);
	addAt(buf, bongo(sr), (t0 + 2.5) * beat, 0.2 * energy, sr);
	addAt(buf, bongo(sr, { from: 520, to: 400, dur: 0.12 }), (t0 + 3) * beat, 0.3 * energy, sr);
	addAt(buf, bongo(sr, { from: 640, to: 500, dur: 0.1 }), (t0 + 3.5) * beat, 0.24 * energy, sr);
	for (let s = 0; s < 8; s++) addAt(buf, shaker(sr, 0.07, 0.5), (t0 + s * 0.5) * beat, 0.14 * energy, sr);
};

// base BGM — sunny jungle groove, 104 BPM, 16 bars (~37s), loopable
{
	const BPM = 104;
	const beat = 60 / BPM;
	const bars = 16;
	const buf = buffer(bars * 4 * beat + 0.5, SR_BGM);

	const phraseA = [
		[P.C5, 0.5], [P.D5, 0.5], [P.E5, 1], [P.G4, 0.5], [P.A4, 0.5], [P.C5, 1],
		[P.D5, 0.5], [P.C5, 0.5], [P.A4, 0.5], [P.G4, 0.5], [P.A4, 2],
		[P.E4, 0.5], [P.G4, 0.5], [P.A4, 1], [P.C5, 0.5], [P.D5, 0.5], [P.E5, 1],
		[P.D5, 0.5], [P.C5, 0.5], [P.D5, 0.5], [P.A4, 0.5], [P.C5, 2],
	];
	const phraseB = [
		[P.G5, 0.5], [P.E5, 0.5], [P.G5, 1], [P.A5, 0.5], [P.G5, 0.5], [P.E5, 1],
		[P.D5, 0.5], [P.E5, 0.5], [P.C5, 0.5], [P.A4, 0.5], [P.C5, 2],
		[P.A4, 0.5], [P.C5, 0.5], [P.D5, 1], [P.E5, 0.5], [P.D5, 0.5], [P.C5, 1],
		[P.A4, 0.5], [P.G4, 0.5], [P.A4, 0.5], [P.E4, 0.5], [P.G4, 2],
	];
	let cursor = 0;
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.6);
	cursor = scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.62);
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.6);
	scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.62);

	for (let bar = 0; bar < bars; bar++) {
		grooveBar(buf, bar * 4, beat, SR_BGM, 0.9);
		const root = bar % 4 === 3 ? P.G3 : P.C3;
		addAt(buf, marimba(root, 1.2, SR_BGM, 0.5), bar * 4 * beat, 0.45, SR_BGM);
		addAt(buf, marimba(root * 1.5, 1.0, SR_BGM, 0.5), (bar * 4 + 2) * beat, 0.32, SR_BGM);
	}
	writeWav('bgm_main.wav', normalize(buf, 0.55), SR_BGM);
}

// free-spin BGM — action mode, rebuilt more intense than the base groove: faster
// tempo, a driving eighth-note bass under every bar, a heavier kick/perc bed,
// horn stabs on the downbeats, a snare fill rolling into every fourth bar, and
// louder in the mix — so the feature reads as a clear step up in energy the
// moment it starts. 136 BPM, 16 bars (~28s), loopable.
{
	const BPM = 136;
	const beat = 60 / BPM;
	const bars = 16;
	const buf = buffer(bars * 4 * beat + 0.5, SR_BGM);

	const phraseA = [
		[P.C5, 0.5], [P.C5, 0.5], [P.E5, 0.5], [P.G5, 0.5], [P.E5, 0.5], [P.D5, 0.5], [P.C5, 1],
		[P.A4, 0.5], [P.C5, 0.5], [P.D5, 0.5], [P.E5, 0.5], [P.D5, 1], [P.C5, 1],
		[P.G4, 0.5], [P.A4, 0.5], [P.C5, 0.5], [P.D5, 0.5], [P.E5, 0.5], [P.G5, 0.5], [P.A5, 1],
		[P.G5, 0.5], [P.E5, 0.5], [P.D5, 0.5], [P.C5, 0.5], [P.D5, 2],
	];
	const phraseB = [
		[P.A5, 0.5], [P.G5, 0.5], [P.A5, 0.5], [P.C6, 0.5], [P.A5, 0.5], [P.G5, 0.5], [P.E5, 1],
		[P.G5, 0.5], [P.E5, 0.5], [P.D5, 0.5], [P.C5, 0.5], [P.D5, 1], [P.E5, 1],
		[P.G5, 0.5], [P.A5, 0.5], [P.G5, 0.5], [P.E5, 0.5], [P.D5, 0.5], [P.E5, 0.5], [P.C5, 1],
		[P.D5, 0.5], [P.E5, 0.5], [P.G5, 0.5], [P.E5, 0.5], [P.C5, 2],
	];
	let cursor = 0;
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.62);
	cursor = scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.66);
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.62);
	scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.66);

	// driving eighth-note bass under the whole track — the root drops to the
	// dominant on the fourth bar of each phrase. This pulse is what pushes it.
	for (let bar = 0; bar < bars; bar++) {
		const root = bar % 4 === 3 ? P.G3 : P.C3;
		for (let e = 0; e < 8; e++) {
			addAt(buf, marimba(root, 0.28, SR_BGM, 0.7), (bar * 4 + e * 0.5) * beat, 0.24, SR_BGM);
		}
	}

	// heavier bed: fuller groove, a kick on beats 1 and 3, and a snare fill
	// rolling into every fourth bar
	for (let bar = 0; bar < bars; bar++) {
		grooveBar(buf, bar * 4, beat, SR_BGM, 1.35);
		addAt(buf, tom(SR_BGM, 1.0), bar * 4 * beat, 0.6, SR_BGM);
		addAt(buf, tom(SR_BGM, 0.75), (bar * 4 + 2) * beat, 0.4, SR_BGM);
		if (bar % 4 === 3) {
			for (let s = 0; s < 6; s++) {
				addAt(buf, snare(SR_BGM, 0.55 + s * 0.07), (bar * 4 + 2 + s * 0.33) * beat, 0.28, SR_BGM);
			}
		}
	}

	// horn stabs on the downbeat of every other bar, alternating tonic / dominant
	for (let bar = 0; bar < bars; bar += 2) {
		addAt(buf, horn(bar % 8 < 4 ? P.C5 : P.G4, 0.5, SR_BGM), bar * 4 * beat, 0.32, SR_BGM);
	}
	writeWav('bgm_freespin.wav', normalize(buf, 0.68), SR_BGM);
}

// grenade blast — the transition explosion (opening + free-game entry). A
// low-frequency body sweep for the thud you feel in the chest, a lowpassed noise
// burst for the debris, and a short bright crack on the leading edge. This is NOT
// bigwin_blast: that is a musical flourish reserved for real max wins, and using
// it on every transition was why the grenade never sounded like an explosion.
{
	const dur = 0.72;
	const buf = buffer(dur, SR_SFX);
	const n = buf.length;
	// body: 92Hz → ~28Hz sweep under a fast exponential decay — the "thud"
	let ph = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR_SFX;
		const f = 92 * Math.exp(-6 * t) + 28;
		ph += (2 * Math.PI * f) / SR_SFX;
		buf[i] += Math.sin(ph) * Math.exp(-7 * t) * 0.9;
	}
	// debris: white noise through a one-pole lowpass so it reads as a muffled
	// roar rather than a hiss, medium decay
	let lp = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR_SFX;
		lp += (rand2() - lp) * 0.35;
		buf[i] += lp * Math.exp(-9 * t) * 0.7;
	}
	// crack: a very short bright transient on the leading edge, for the snap
	for (let i = 0; i < SR_SFX * 0.012; i++) {
		buf[i] += rand2() * Math.exp((-260 * i) / SR_SFX) * 0.6;
	}
	writeWav('grenade_blast.wav', fadeEnds(normalize(buf, 0.95), SR_SFX, 4), SR_SFX);
}

// canvas — heavy wet tarpaulin being dragged off something.
//
// THIS IS NOT A WHOOSH, AND THAT IS THE WHOLE POINT.
//
// The first tarp_pull was built out of a bright noise transient plus the generic
// `whoosh` helper, and it came back described as "peeling a sticker". That is
// exactly right and the reason is in the numbers: the transient was broadband
// with a 320/s decay, so nearly all of its energy sat above 4kHz, and `whoosh`
// opens its filter as the envelope peaks, which brightens on the loudest part.
// Bright, smooth and fast is adhesive tape. Cloth is none of those.
//
// What canvas actually is, and what each part below is for:
//
//   · LOW. A heavy tarp has almost nothing above about 2kHz. The noise runs
//     through TWO one-pole lowpasses in series rather than one, because a single
//     pole falls at only 6dB/octave and leaves a hiss on top that reads as paper.
//   · IRREGULAR. Fabric does not slide smoothly, it catches and releases. The
//     amplitude is modulated by three incommensurable rates plus a random grain,
//     so no part of it repeats — a smooth envelope is what makes noise sound
//     synthetic.
//   · HEAVY. A low thump of displaced air under it, because something with mass
//     just moved. Without this it is a rustle rather than a haul.
const canvas = (sr, dur = 0.38, brightness = 1) => {
	const out = buffer(dur, sr);
	let lp1 = 0;
	let lp2 = 0;
	let grain = 0;
	let grainLeft = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const p = t / dur;
		// The cutoff CLOSES as the tarp comes away and the fold gets bigger and
		// slower - the opposite of the whoosh helper, which opens on its peak.
		const cutoff = (0.16 - 0.09 * p) * brightness;
		lp1 += cutoff * (rand2() - lp1);
		lp2 += cutoff * (lp1 - lp2);
		// catch-and-release: three slow rates that never line up, and a grain that
		// re-rolls its own length
		if (grainLeft <= 0) {
			grain = 0.45 + rand() * 0.55;
			grainLeft = Math.floor(sr * (0.012 + rand() * 0.05));
		}
		grainLeft--;
		const flutter =
			0.55 +
			0.2 * Math.sin(t * 41) +
			0.15 * Math.sin(t * 97 + 1.3) +
			0.1 * Math.sin(t * 173 + 2.7);
		// a body that swells and goes, not a click
		const env = Math.min(1, t / 0.05) * Math.exp(-3.4 * t);
		out[i] = lp2 * flutter * grain * env * 3.2;
	}
	// the air it displaces
	let ph = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const f = 74 * Math.exp(-5 * t) + 38;
		ph += (2 * Math.PI * f) / sr;
		out[i] += Math.sin(ph) * Math.exp(-11 * t) * 0.28;
	}
	return fadeEnds(out, sr, 4);
};

// wood_knock — a lid dropping onto a wooden crate. Two transients close
// together, because a lid that is let go bounces once; one alone is a click.
//
// Wood rings INHARMONICALLY and briefly — the partials are not whole multiples
// of anything, which is why a wooden knock does not read as a pitch even though
// it plainly has one. That is the whole difference from `bongo`, which is a
// stretched membrane and therefore a drum: the lid was a bongo until now, and a
// hand drum under a cargo cue is the single most tropical thing left in this
// game's sound.
const woodKnock = (sr, f = 190) => {
	const dur = 0.2;
	const out = buffer(dur, sr);
	const hit = (at, gain, pitch) => {
		const start = Math.round(at * sr);
		for (let i = 0; start + i < out.length; i++) {
			const t = i / sr;
			// inharmonic, and each partial dies at its own rate — the high ones first,
			// which is what makes a knock sound like it happened rather than like it
			// is being held
			const v =
				Math.sin(2 * Math.PI * pitch * t) * Math.exp(-30 * t) +
				Math.sin(2 * Math.PI * pitch * 2.41 * t) * 0.45 * Math.exp(-52 * t) +
				Math.sin(2 * Math.PI * pitch * 4.17 * t) * 0.22 * Math.exp(-80 * t);
			// the contact itself: a few milliseconds of dry noise
			const tap = rand2() * Math.exp(-260 * t) * 0.5;
			out[start + i] += (v * 0.55 + tap) * gain;
		}
	};
	hit(0, 1, f);
	hit(0.062, 0.34, f * 1.06); // the bounce, fractionally higher and much smaller
	return fadeEnds(out, sr, 3);
};

// brass_ring — the hasp on the crate. Bell partials (1 : 2.76 : 5.40 : 8.93,
// the classic inharmonic set), struck hard and gone quickly.
//
// This replaces the MARIMBA that used to end tarp_pull, and the marimba is what
// made the reveal "not fit": it is a tuned tropical mallet instrument out of the
// gen-1 jungle kit, so the moment the cargo was named landed on a wooden xylophone
// note. It arrived, which was the job — but it arrived in a different game.
// Brass is what this board's housing is made of and what the ship's horn is made
// of, and it can carry a pitch without being a melody instrument, so the cue
// still RESOLVES rather than just stopping.
const brassRing = (sr, f = 620, dur = 0.5) => {
	const out = buffer(dur, sr);
	// The FUNDAMENTAL IS NOT THE LOUDEST PARTIAL, and that is deliberate. A small
	// piece of struck metal puts most of its energy into the partials above the
	// fundamental — leading on the fundamental is what turns a bell into a tone,
	// and a tone is what made the marimba read as a menu confirming something.
	const partials = [
		[1, 0.55, 7],
		[2.76, 1, 11],
		[5.4, 0.42, 17],
		[8.93, 0.18, 26],
	];
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		let v = 0;
		for (const [ratio, gain, decay] of partials) {
			v += Math.sin(2 * Math.PI * f * ratio * t) * gain * Math.exp(-decay * t);
		}
		// the striker — metal on metal, very short and not pitched
		v += rand2() * Math.exp(-190 * t) * 0.35;
		out[i] = v * 0.4;
	}
	return fadeEnds(out, sr, 3);
};

// swipe - one stroke of cloth dragged off something. The whole of "刷".
//
// WHY THIS REPLACED A FIVE-PART CUE. tarp_pull used to be a rope release, two
// canvas hauls, a lid knock and a pair of brass rings — built to ARRIVE
// somewhere, on the theory that the reveal is a payoff and should resolve. It
// came back as "sounding like a broken speaker", and the measurement says why:
// 65% of its energy sat in forty FFT bins, i.e. it was largely a set of low
// tones, and a low tone with an abrupt envelope is exactly the noise a blown
// driver makes. The sub sine inside canvas() and the low sawtooth rope release
// were most of it.
//
// A swipe is not a chord and does not resolve. It is one gesture that starts
// instantly, moves, and stops — so this is noise and nothing but noise.
//
//   · NOTHING BELOW ~400Hz. The band is taken out by subtracting a slow
//     follower from the filtered noise, which is a one-pole highpass. That is
//     the single change that removes the broken-speaker quality: there is no
//     low-frequency content left to flap.
//   · THE BAND SWEEPS DOWNWARD. Fabric moving away from you loses its highs.
//     A static band reads as a burst of hiss; a falling one reads as travel.
//   · GRAIN. Fibres catch and release, so the amplitude is broken up by a grain
//     that re-rolls its own length. A smooth noise envelope is a synthesiser.
//
// Bright, but not tape-bright: the first version of this cue put 79% of its
// energy above 4kHz and came back as "peeling a sticker". Cloth lives between
// about 400Hz and 4kHz and this stays there.
const swipe = (sr, dur = 0.24, top = 0.6, bottom = 0.15, decay = 16) => {
	const out = buffer(dur, sr);
	let lp1 = 0;
	let lp2 = 0;
	let hp = 0;
	let grain = 0;
	let grainLeft = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const p = t / dur;
		const cut = top + (bottom - top) * p;
		lp1 += cut * (rand2() - lp1);
		lp2 += cut * (lp1 - lp2);
		// the follower IS the low end; subtracting it leaves the band
		hp += 0.055 * (lp2 - hp);
		const band = lp2 - hp;
		if (grainLeft <= 0) {
			grain = 0.6 + rand() * 0.4;
			grainLeft = Math.floor(sr * (0.004 + rand() * 0.016));
		}
		grainLeft--;
		const flutter = 0.7 + 0.18 * Math.sin(t * 310) + 0.12 * Math.sin(t * 173 + 1.1);
		// 2.5ms attack: fast enough to be a strike, slow enough not to click
		const env = Math.min(1, t / 0.0025) * Math.exp(-decay * t);
		out[i] = band * grain * flutter * env * 3;
	}
	return fadeEnds(out, sr, 2);
};

// ─── the crate reveal ────────────────────────────────────────────────────────
//
// The mechanic the game is named after had no sound of its own: it borrowed
// `mult_update` (a marimba ding, written for a multiplier re-roll) for the
// batch and `pluck_low` for each crate. Both are pitched musical notes, so the
// moment the cargo was named sounded like a menu confirming something.
//
// What it should sound like is rope and canvas, and it should ARRIVE somewhere:
// the reveal is the payoff, so it ends on a note rather than on noise.

// rope_strain — once at the top of the batch, before any crate opens. The line
// coming taut.
//
// THE SAWTOOTH IS GONE. This was a raw low saw sweeping 58Hz upward with a
// stick-slip tremolo on it, and measured, 67% of its energy sat below 120Hz with
// three quarters of the total concentrated in forty bins. That is a loud, nearly
// tonal, very low buzz — and since it plays immediately before the tarps move,
// it was carrying most of the "broken speaker" the reveal was described as.
//
// Rope is fibre under tension, not a bass oscillator. So the creak is now
// FILTERED NOISE gated by stick-slip: the same stutter, made out of the right
// material. The low end is removed the same way as in `swipe`, by subtracting a
// follower, and the only weight left in the cue is one wooden shift of the crate
// on the deck, kept well down in the mix.
{
	const dur = 0.36;
	const buf = buffer(dur, SR_SFX);
	let lp1 = 0;
	let lp2 = 0;
	let hp = 0;
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		// the grip wanders rather than beating at a fixed rate — a rope that
		// stutters on the beat is a machine, which is what a plain tremolo gave
		const grip = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 112 + 5 * Math.sin(t * 19)));
		lp1 += 0.22 * (rand2() - lp1);
		lp2 += 0.22 * (lp1 - lp2);
		hp += 0.05 * (lp2 - hp);
		buf[i] += (lp2 - hp) * grip * Math.exp(-4.2 * t) * 3.2;
	}
	// the crate shifts on the deck. Low, but brief and quiet — this is the only
	// weight in the cue and it is there to seat it, not to be heard as a hit.
	addAt(buf, woodKnock(SR_SFX, 148), 0.015, 0.3, SR_SFX);
	writeWav('rope_strain.wav', normalize(buf, 0.55), SR_SFX);
}

// tarp_pull — once per crate, on its own beat. One swipe of canvas: 刷.
//
// Everything that used to follow the cloth — the lid knock and the brass hasp it
// resolved on — is gone. See `swipe` for the measurement that killed them; the
// short version is that they were the tonal part, and the tonal part was the
// problem. What is left is the gesture and nothing else, which is also what the
// cue was asked for: a swipe, not a phrase.
//
// Played back at a rising rate per column (see Sound.svelte), so a board of four
// is four progressively lighter, quicker swipes rather than the same one four
// times — and on pure noise a rate change shifts the whole band, which reads as
// a smaller piece of cloth rather than as a pitch going up.
{
	const dur = 0.3;
	const buf = buffer(dur, SR_SFX);
	// the cover coming off
	// The top of the sweep is MEASURED, not chosen. At 0.62 the clip put 27% of
	// its energy above 4kHz, which is the band that made the very first version of
	// this cue read as sticky tape; at 0.46 that falls to about 15% and the swipe
	// still starts bright enough to be a strike rather than a rumble.
	addAt(buf, swipe(SR_SFX, 0.26, 0.46, 0.13, 16), 0, 1, SR_SFX);
	// and the last corner of it clearing the lid a beat later: shorter, quieter,
	// and darker, so the cue tails off rather than stopping on a cut
	addAt(buf, swipe(SR_SFX, 0.12, 0.32, 0.14, 30), 0.1, 0.3, SR_SFX);
	writeWav('tarp_pull.wav', normalize(buf, 0.8), SR_SFX);
}

// ship_horn - the full shipment. The whole hold comes up at once and the board
// goes to a single cargo; this is the beat before the tarps move.
//
// A ship's horn and not a fanfare, for the same reason the reveal is rope and
// canvas and not a marimba: the loudest thing this game owns should still be
// part of the boat. Two stacked low tones a fifth apart, which is what makes a
// horn read as a HORN rather than as a bass note - a single frequency down
// there is a rumble.
{
	const dur = 1.5;
	const buf = buffer(dur, SR_SFX);
	const n = buf.length;
	// The two voices, and a third an octave up at low level: the octave is what
	// carries on a phone speaker, which cannot reproduce either of the others.
	const voices = [
		{ f: 62, gain: 1.0 },
		{ f: 93, gain: 0.7 },
		{ f: 124, gain: 0.32 },
	];
	for (const v of voices) {
		let ph = 0;
		for (let i = 0; i < n; i++) {
			const t = i / SR_SFX;
			// A horn does not start in tune: the pressure takes a moment, so the
			// pitch comes up about a semitone over the first fifth of a second.
			const f = v.f * (1 - 0.06 * Math.exp(-9 * t));
			ph += (2 * Math.PI * f) / SR_SFX;
			// A little odd harmonic rather than a pure sine, which is the brass.
			const tone = Math.sin(ph) + 0.28 * Math.sin(ph * 3) + 0.1 * Math.sin(ph * 5);
			// slow attack, long plateau, slow release
			const env =
				t < 0.18 ? t / 0.18 : t > dur - 0.45 ? Math.max(0, (dur - t) / 0.45) : 1;
			buf[i] += tone * env * v.gain * 0.3;
		}
	}
	// Air. A horn is a column of air being pushed, and without a breath of noise
	// under it this is an organ.
	let lp = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR_SFX;
		lp += (rand2() - lp) * 0.06;
		const env = t < 0.2 ? t / 0.2 : t > dur - 0.5 ? Math.max(0, (dur - t) / 0.5) : 1;
		buf[i] += lp * env * 0.5;
	}
	writeWav('ship_horn.wav', fadeEnds(normalize(buf, 0.9), SR_SFX, 8), SR_SFX);
}

// cargo_roll - the manifest reel TURNING. Looped for as long as it runs, and
// the only sustained mechanical sound in the game.
//
// Before this, the reel's whole three-second spin had one 0.42s rope_strain at
// the top of it and then silence until the last cell. A reel that makes no noise
// while it turns is a picture of a reel; the sound is most of why a spinning
// thing feels like it has weight and is going somewhere.
//
// What it is, physically: a chain hoist running. A motor rumble underneath, and
// the chain itself clicking over the drum. The clicks are the important half —
// they are what a listener uses to hear SPEED, which is why this is played back
// at a falling playbackRate as the reel slows (see Sound.svelte / CargoPick)
// rather than merely getting quieter. The clicks slow down, and that is the
// sound of something coming to rest.
//
// LOOPING IT SEAMLESSLY. Every part is periodic over `dur` by construction —
// the rumble partials are integer multiples of 1/dur and the detents sit at
// exact multiples of dur/DETENTS — except the noise bed, which cannot be. So the
// buffer is rendered LONGER than it is used and the overhang is crossfaded back
// over the head (`loopify`). Because the detent pattern is periodic and dur is a
// whole number of detent spacings, a detent in the overhang lands exactly on top
// of its counterpart at the head and survives the crossfade; only the noise is
// actually blended. Without this the wrap is an audible click every half second,
// which on a three-second spin is six of them.
{
	const dur = 0.5;
	const DETENTS = 8; // 16 links a second at rate 1
	const XFADE = 0.05;
	const n = Math.round(dur * SR_SFX);
	const x = Math.round(XFADE * SR_SFX);
	const raw = buffer(dur + XFADE, SR_SFX);

	// the drum motor: 60Hz and its octave, both whole cycle counts in 0.5s, plus
	// a slow wobble so it is a machine under load rather than a test tone
	for (let i = 0; i < raw.length; i++) {
		const t = i / SR_SFX;
		const wobble = 1 + 0.06 * Math.sin(2 * Math.PI * 4 * t); // 2 cycles in dur
		raw[i] +=
			(Math.sin(2 * Math.PI * 60 * t) * 0.3 + Math.sin(2 * Math.PI * 120 * t) * 0.12) * wobble;
	}

	// the hold around it - broadband, heavily damped, so the space has a floor
	{
		let lp1 = 0;
		let lp2 = 0;
		for (let i = 0; i < raw.length; i++) {
			lp1 += 0.08 * (rand2() - lp1);
			lp2 += 0.08 * (lp1 - lp2);
			raw[i] += lp2 * 1.6;
		}
	}

	// the chain over the drum. Alternating weight per link, because a chain has
	// two orientations and they do not sound the same - four identical clicks a
	// beat is a metronome, which is the machine sound everybody has learned to
	// stop hearing.
	for (let k = 0; k * (n / DETENTS) < raw.length; k++) {
		const at = (k * (n / DETENTS)) / SR_SFX;
		const heavy = k % 2 === 0;
		addAt(
			raw,
			bongo(SR_SFX, {
				from: heavy ? 420 : 620,
				to: heavy ? 170 : 260,
				dur: 0.05,
				punch: 1.3,
			}),
			at,
			heavy ? 0.5 : 0.3,
			SR_SFX,
		);
	}

	// wrap the overhang back over the head
	const out = buffer(dur, SR_SFX);
	for (let i = 0; i < n; i++) out[i] = raw[i];
	for (let i = 0; i < x; i++) {
		const f = i / x;
		out[i] = raw[i] * f + raw[n + i] * (1 - f);
	}
	// NOT fadeEnds: this loops, and fading its ends is putting the gap back in.
	writeWav('cargo_roll.wav', normalize(out, 0.8), SR_SFX);
}

// cargo_lock - the manifest reel STOPPING on its cargo.
//
// The landing used to borrow tarp_pull, which is a cue about a cover coming OFF
// something. Nothing is being uncovered when the reel stops; a mechanism is
// arriving at its stop and locking there, and it should be the heaviest single
// hit in the round short of the ship's horn, because it is the moment that
// decides every crate in the free games.
//
// Three parts, in the order they happen:
//   · the pin driving home - a short, very low iron impact
//   · the drum taking the whole weight - a sub drop, which is the part that is
//     FELT rather than heard, and what the screen shake is standing on
//   · the hasp ringing off it, same brass as the reveal, so the two cues are
//     plainly the same machine
{
	const dur = 1.3;
	const buf = buffer(dur, SR_SFX);

	// the pin: dense low noise, gone in 80ms
	{
		let lp1 = 0;
		let lp2 = 0;
		for (let i = 0; i < SR_SFX * 0.12; i++) {
			const t = i / SR_SFX;
			lp1 += 0.1 * (rand2() - lp1);
			lp2 += 0.1 * (lp1 - lp2);
			buf[i] += lp2 * Math.exp(-42 * t) * 5.5;
		}
	}

	// the weight arriving. 96Hz down to 34 - low enough to be a body blow on a
	// phone speaker's harmonics and on a desktop's actual bass.
	{
		let ph = 0;
		for (let i = 0; i < SR_SFX * 0.75; i++) {
			const t = i / SR_SFX;
			const f = 34 + 62 * Math.exp(-7 * t);
			ph += (2 * Math.PI * f) / SR_SFX;
			buf[i] += Math.sin(ph) * Math.exp(-4.4 * t) * 0.95;
		}
	}

	// the iron frame ringing after the hit, and the hasp on top of it
	addAt(buf, woodKnock(SR_SFX, 132), 0.012, 0.8, SR_SFX);
	addAt(buf, brassRing(SR_SFX, 330, 0.9), 0.03, 0.55, SR_SFX);
	addAt(buf, brassRing(SR_SFX, 660, 0.7), 0.045, 0.3, SR_SFX);

	// ...and the hold answering, so the hit has a room around it rather than
	// stopping dead. A slow noise swell under an exponential tail is the cheapest
	// honest reverb there is and it does not need an impulse response.
	{
		let lp = 0;
		for (let i = 0; i < buf.length; i++) {
			const t = i / SR_SFX;
			lp += 0.035 * (rand2() - lp);
			buf[i] += lp * Math.min(1, t / 0.06) * Math.exp(-2.6 * t) * 1.5;
		}
	}

	writeWav('cargo_lock.wav', fadeEnds(normalize(buf, 0.95), SR_SFX, 6), SR_SFX);
}

// dock_splash - the harbour answering the chest beat on a feature trigger.
// Timed to game/dockSplash.svelte.ts: six strikes at 0.48s + i*0.30s.
//
// Go Boomana's cave_quake is the same idea in a mine: rumble and falling grit.
// Water sounds nothing like that, and the difference is the whole cue:
//
//   · A SLOSH on every strike, not a thud. Water hit hard is broadband noise
//     with the top and the bottom taken off and a fast swell — plus, under it,
//     one short low knock: the pier's timber taking the blow the water is
//     answering. Each strike a little bigger than the last, as the picture is.
//   · PLIPS after every strike — the drops coming back down. A water drop's
//     sound is a bubble ringing as it forms, which is why it RISES in pitch: a
//     sine sweeping up about an octave in 30ms and gone in 60. That rising
//     'plip' is the most recognisable water sound there is, and it is also what
//     makes the cue fun rather than merely wet.
//   · SPRAY on the three hardest strikes, where the picture throws water up
//     from below: a short bright burst — brief, because a long one is tape hiss.
//   · A dripping tail after the last strike, thinning out, so the water keeps
//     running off after the captain has stopped.
{
	const dur = 3.6;
	const buf = buffer(dur, SR_SFX);
	const strike = (i) => 0.48 + i * 0.3;

	const slosh = (sr, weight) => {
		const d = 0.34;
		const out = buffer(d, sr);
		let lp1 = 0;
		let lp2 = 0;
		let hp = 0;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			lp1 += 0.28 * (rand2() - lp1);
			lp2 += 0.28 * (lp1 - lp2);
			hp += 0.03 * (lp2 - hp);
			// the water moving: a wobble in the level, not a smooth decay
			const churn = 0.7 + 0.3 * Math.sin(t * 70 + Math.sin(t * 23) * 2);
			const env = Math.min(1, t / 0.012) * Math.exp(-9 * t);
			out[i] = (lp2 - hp) * churn * env * 4 * weight;
		}
		// the pier taking the hit
		let ph = 0;
		for (let i = 0; i < sr * 0.12; i++) {
			const t = i / sr;
			const f = 55 + 45 * Math.exp(-30 * t);
			ph += (2 * Math.PI * f) / sr;
			out[i] += Math.sin(ph) * Math.exp(-26 * t) * 0.5 * weight;
		}
		return out;
	};

	const plip = (sr, f0) => {
		const d = 0.09;
		const out = buffer(d, sr);
		let ph = 0;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			// rising: the bubble ringing up as it closes
			const f = f0 * (1 + 0.95 * Math.min(1, t / 0.03));
			ph += (2 * Math.PI * f) / sr;
			out[i] = Math.sin(ph) * Math.min(1, t / 0.002) * Math.exp(-55 * t);
		}
		return out;
	};

	const spray = (sr) => {
		const d = 0.22;
		const out = buffer(d, sr);
		let lp = 0;
		let hp = 0;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			lp += 0.55 * (rand2() - lp);
			hp += 0.2 * (lp - hp);
			out[i] = (lp - hp) * Math.min(1, t / 0.02) * Math.exp(-16 * t) * 1.4;
		}
		return out;
	};

	for (let i = 0; i < 6; i++) {
		const at = strike(i);
		addAt(buf, slosh(SR_SFX, 0.62 + i * 0.09), at, 1, SR_SFX);
		// the drops coming back down, a beat after the hit
		const n = 2 + Math.floor(i / 2);
		for (let k = 0; k < n; k++) {
			addAt(buf, plip(SR_SFX, 720 + rand() * 620), at + 0.09 + rand() * 0.2, 0.28 + rand() * 0.16, SR_SFX);
		}
		if (i % 2 === 1) addAt(buf, spray(SR_SFX), at + 0.03, 0.55 + i * 0.05, SR_SFX);
	}
	// the tail: water still running off the edge, thinning out
	for (let k = 0; k < 14; k++) {
		const at = strike(5) + 0.35 + k * 0.08 + rand() * 0.06;
		const fade = 1 - k / 14;
		addAt(buf, plip(SR_SFX, 800 + rand() * 700), at, 0.24 * fade + 0.04, SR_SFX);
	}
	writeWav('dock_splash.wav', fadeEnds(normalize(buf, 0.82), SR_SFX, 10), SR_SFX);
}

console.log('done');

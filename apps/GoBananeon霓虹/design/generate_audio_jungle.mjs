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

// ─── space and dynamics ──────────────────────────────────────────────────────
// WHY THIS EXISTS. The first version of the blast set was synthesized dry:
// sine bodies, one-pole-filtered white noise, exponential decays, straight to
// disk. Measured, the envelopes were right; heard, they were obviously not
// recordings — and the reason is that nothing in them said WHERE the explosion
// was. A real bang in a mine tunnel arrives three times: the direct sound, a
// handful of hard early reflections off the rock a few metres away, and a long
// diffuse tail that loses its highs as it goes, because air absorbs treble
// faster than bass. None of that is decoration; it is most of what makes a
// sound read as real rather than as a synth patch.
//
// These helpers are ordinary, well-understood DSP, written out because the
// generator has no dependencies and must stay deterministic.

// One-pole lowpass held as state, so a filter can be swept over time.
const onePole = () => {
	let z = 0;
	return (x, coeff) => (z += coeff * (x - z));
};

// State-variable filter — a real 2-pole resonant bandpass, which a one-pole
// cannot be. Rock and metal debris ring at frequencies; broadband hiss does
// not, and that difference is audible immediately on the rubble.
const svfBandpass = (sr, freq, q) => {
	const f = 2 * Math.sin((Math.PI * Math.min(freq, sr * 0.45)) / sr);
	const damp = 1 / Math.max(0.5, q);
	let low = 0;
	let band = 0;
	return (x) => {
		low += f * band;
		const high = x - low - damp * band;
		band += f * high;
		return band;
	};
};

// Schroeder–Moorer reverb: parallel damped combs into series allpasses.
//
// A convolution against a real impulse response would be more faithful, but a
// 1-second IR against a 2-second signal is ~4e9 multiply-adds in plain JS —
// minutes per cue. This is O(n), runs instantly, and is the algorithm most
// hardware reverbs actually used for decades.
//
// `damp` is the one that matters most here: it lowpasses inside each comb's
// feedback path, so every trip round the loop loses more treble. That is air
// absorption, and without it a tail sounds like a metallic ring rather than a
// space.
const reverb = (src, sr, { rt60 = 1.1, mix = 0.3, damp = 0.4, predelay = 0.012, size = 1 } = {}) => {
	const n = src.length;
	const tail = Math.round(rt60 * sr);
	const out = new Float32Array(n + tail);

	// Early reflections: discrete taps off nearby rock. These carry the sense of
	// enclosure — the tail alone reads as "somewhere big", not "in a tunnel".
	const taps = [
		[0.0071, 0.62],
		[0.0113, 0.5],
		[0.0169, 0.44],
		[0.0231, 0.36],
		[0.0298, 0.28],
		[0.0411, 0.2],
	];
	const wet = new Float32Array(n + tail);
	const pre = Math.round(predelay * sr);
	for (const [t, g] of taps) {
		const d = pre + Math.round(t * size * sr);
		for (let i = 0; i < n; i++) wet[i + d] += src[i] * g;
	}

	// Late tail. Delays are the classic mutually-prime Freeverb lengths, scaled
	// by the room size; prime-ish lengths stop the combs re-enforcing each other
	// into an audible pitch.
	const combLens = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116];
	const combs = combLens.map((L) => {
		const len = Math.max(8, Math.round((L * size * sr) / 44100));
		// feedback for the requested RT60 at this delay length
		const g = Math.pow(10, (-3 * len) / (rt60 * sr));
		return { buf: new Float32Array(len), len, g, idx: 0, lp: 0 };
	});
	const apLens = [225, 556, 441, 341];
	const aps = apLens.map((L) => {
		const len = Math.max(4, Math.round((L * size * sr) / 44100));
		return { buf: new Float32Array(len), len, idx: 0 };
	});

	for (let i = 0; i < n + tail; i++) {
		const x = (i < n ? src[i] : 0) + wet[i] * 0.35;
		let acc = 0;
		for (const c of combs) {
			const y = c.buf[c.idx];
			// damping inside the feedback loop = treble loss per round trip
			c.lp += (1 - damp) * (y - c.lp);
			c.buf[c.idx] = x + c.lp * c.g;
			c.idx = (c.idx + 1) % c.len;
			acc += y;
		}
		acc /= combs.length;
		// allpasses diffuse the comb output so individual echoes stop being
		// countable — this is what turns flutter into a smooth tail
		for (const a of aps) {
			const y = a.buf[a.idx];
			const v = acc + y * 0.5;
			a.buf[a.idx] = v;
			a.idx = (a.idx + 1) % a.len;
			acc = y - v * 0.5;
		}
		out[i] = (i < n ? src[i] : 0) + (acc + wet[i]) * mix;
	}
	return out;
};

// Peak compressor. Real recorded explosions are heavily compressed — it is what
// keeps the tail audible under the transient instead of the crack eating the
// whole envelope. Without it the debris disappears the moment the bang lands.
const compress = (buf, sr, { thresh = 0.45, ratio = 4, attack = 0.003, release = 0.14 } = {}) => {
	const aC = Math.exp(-1 / (attack * sr));
	const rC = Math.exp(-1 / (release * sr));
	let env = 0;
	for (let i = 0; i < buf.length; i++) {
		const a = Math.abs(buf[i]);
		env = a > env ? aC * env + (1 - aC) * a : rC * env + (1 - rC) * a;
		if (env > thresh) buf[i] *= (thresh + (env - thresh) / ratio) / env;
	}
	return buf;
};

// Gentle saturation. Adds the low-order harmonics that any real transducer
// chain adds, and stops the peak limiter from having to work at all.
const saturate = (buf, drive = 1.4) => {
	const norm = Math.tanh(drive);
	for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * drive) / norm;
	return buf;
};

// Trim a buffer that reverb has lengthened, fading the very end so the tail
// does not stop dead at the file boundary.
//
// Fades the END ONLY. fadeEnds would have been the obvious call and is wrong
// here: it ramps the first samples too, and on an explosion the first 14ms IS
// the crack. Using it cost 0.32 of peak and dropped the crest factor from 6.2
// to 4.0 — the transient was being faded out of the file that exists to deliver
// it. Anything with a hard attack must never be faded in.
const fadeOut = (buf, sr, ms) => {
	const n = Math.min(buf.length, Math.round((ms / 1000) * sr));
	for (let i = 0; i < n; i++) buf[buf.length - 1 - i] *= i / n;
	return buf;
};

const takeTail = (buf, sr, dur) => {
	const n = Math.min(buf.length, Math.round(dur * sr));
	return fadeOut(buf.slice(0, n), sr, 30);
};

// ─── dynamite blast set ──────────────────────────────────────────────────────
// Five cues timed to ReelBlast.svelte's five beats:
//   CHARGE   380ms  fuse_sizzle     the fuse burns down under the covered reels
//   SHATTER  340ms  dynamite_blast  the bang, and symbol_shatter under it
//   PUFF     240ms  (the blast tail carries through the smoke)
//   HOLD     200ms  (silent — the swap happens unseen)
//   DISPERSE 700ms  symbol_reveal   the cloud thins, the new symbols appear
//   SETTLE   420ms  (silent — the new board is simply held)
//
// These are CARTOON explosions, not ordnance. The rest of this file is marimba,
// bongo and comic horn; a realistic military boom dropped into that set sounds
// like a bug. The playfulness lives in three deliberate choices: a horn stab
// riding on top of the body, a descending boing for the debris, and a rattle of
// pitched rubble hits scattered through the tail.
//
// Cartoon is not the same as fake, though, and the first version confused the
// two. Everything below is now built dry and then put in a place — see the
// reverb note above. The mine is a hard, narrow, reflective space, so the cues
// share one room (MINE) and differ only in how much of it they get: the fuse is
// close to the player and nearly dry, the full-board blast is the furthest away
// and the wettest.
const MINE = { rt60: 1.05, damp: 0.42, predelay: 0.009, size: 0.86 };

// rubble — a scatter of small pitched knocks, as if rock is raining back down.
// Deterministic through the shared PRNG, so regeneration is reproducible.
//
// Each knock is now noise through a resonant bandpass rather than a sine: a
// chip of rock has a broad, fast-decaying resonance, not a pitch. The sine
// version read as a marimba being played very quietly, which is exactly the
// "synthesized" quality this pass exists to remove.
const rubble = (sr, { dur = 0.7, count = 14, spread = 0.55, from = 0.12 } = {}) => {
	const out = buffer(dur, sr);
	for (let i = 0; i < count; i++) {
		const t = from + rand() * spread;
		const freq = 320 + rand() * 1900;
		const q = 3 + rand() * 7;
		const decay = 60 + rand() * 90;
		const len = Math.min(out.length, Math.round(sr * 0.09));
		const bp = svfBandpass(sr, freq, q);
		const hit = buffer(0.09, sr);
		for (let k = 0; k < len; k++) {
			const tt = k / sr;
			hit[k] = bp(rand2() * Math.exp(-decay * tt)) * 1.6;
		}
		// later debris is quieter — it is falling further away
		const fall = 0.5 * (1 - (t - from) / (spread + 1e-6)) + 0.12;
		addAt(out, hit, t, fall, sr);
	}
	return out;
};

// fuse — sputtering spark. Bandpassed noise whose cutoff climbs as it burns
// down, plus discrete spark grains so it crackles rather than hisses flatly.
{
	// 0.38s because ReelBlast's CHARGE beat is 380ms: the fuse must run out ON
	// the bang, not before it. If these two ever diverge the anticipation ends in
	// a gap of silence, which reads as the effect having failed.
	const dur = 0.38;
	const buf = buffer(dur, SR_SFX);
	const lp = onePole();
	const hp = onePole();
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const p = t / dur;
		const n = rand2();
		// cutoff rises through the burn: the spark gets brighter and closer
		const v = lp(n, 0.18 + 0.34 * p);
		const b = v - hp(v, 0.06);
		// irregular sputter, not a steady hiss
		const sputter = 0.55 + 0.45 * Math.sin(2 * Math.PI * 17 * t + 3 * Math.sin(2 * Math.PI * 6.3 * t));
		buf[i] = b * sputter * (0.35 + 0.65 * p);
	}
	// spark grains. Amplitudes are squared so most are small and a few are loud,
	// which is how an actual sputter is distributed — uniform grains sound like
	// a machine, and that was audible on the first version.
	for (let k = 0; k < 25; k++) {
		const at = rand() * (dur - 0.02);
		const g = buffer(0.014, SR_SFX);
		const bp = svfBandpass(SR_SFX, 2200 + rand() * 3600, 2.5);
		for (let i = 0; i < g.length; i++) g[i] = bp(rand2() * Math.exp((-300 * i) / SR_SFX));
		const amp = rand();
		addAt(buf, g, at, 0.25 + 1.1 * amp * amp, SR_SFX);
	}
	// a rising whistle underneath, so the CHARGE beat reads as "something is coming"
	addAt(buf, boing(SR_SFX, { from: 260, to: 720, dur: 0.34 }), 0.02, 0.13, SR_SFX);
	// barely any room: the fuse is right next to the player, and a wet fuse
	// would put it at the far end of the tunnel where its detail is lost
	const wet = reverb(buf, SR_SFX, { ...MINE, mix: 0.12 });
	writeWav('fuse_sizzle.wav', takeTail(normalize(wet, 0.55), SR_SFX, 0.38), SR_SFX);
}

// the bang. Body + crack + debris are what make it an explosion; the horn stab
// and the boing are what make it THIS game's explosion.
// THE BLAST CUES ARE NOT SYNTHESIZED. Do not add them back here.
//
// dynamite_blast.wav and dynamite_blast_big.wav are built from a licensed
// recording by design/import_blast_sample.py, because review called the
// synthesized versions generic and was right — a better sine-and-noise model is
// still a sine-and-noise model. The synthesis that used to live at this spot
// (body sweep, resonant debris bands, mine reverb, compression) was deleted
// rather than left commented out, because a generator that still knows how to
// write those two filenames will eventually overwrite the sample with them.
//
// Everything around it — the fuse, the shatter and the reveal — is still
// synthesized, and still uses the reverb and filter helpers above.

// the symbols breaking. Plays alongside the bang, but its own weight arrives
// LATE and inside the file rather than on a separate timer: the crack is
// simultaneous with the detonation, the crumble trails it by ~90ms as the
// pieces come apart and fall. Keeping that offset in the WAV means ReelBlast
// needs no extra await, and so no extra cancellation window.
{
	const dur = 0.62;
	const dry = buffer(dur, SR_SFX);

	// the crack — brittle and high, so it sits ABOVE the blast's low body rather
	// than fighting it. Resonant bursts at stone-like frequencies: rock splitting
	// rings briefly at a pitch, which broadband noise cannot imitate.
	for (let k = 0; k < 6; k++) {
		const at = rand() * 0.05;
		const g = buffer(0.09, SR_SFX);
		const bp = svfBandpass(SR_SFX, 1400 + rand() * 3200, 4 + rand() * 6);
		for (let i = 0; i < g.length; i++) {
			const t = i / SR_SFX;
			g[i] = bp(rand2() * Math.exp(-70 * t)) * 1.8;
		}
		addAt(dry, g, at, 0.55 + rand() * 0.4, SR_SFX);
	}
	// a couple of pitched "chink"s — the ring a chip of stone makes as it splits
	for (const [at, f] of [[0.01, 1450], [0.035, 990], [0.06, 1820]]) {
		addAt(dry, bongo(SR_SFX, { from: f, to: f * 0.62, dur: 0.08, punch: 0.5 }), at, 0.4, SR_SFX);
	}

	// the crumble — the pieces landing, scattered across the tail
	addAt(dry, rubble(SR_SFX, { dur, count: 18, spread: 0.34, from: 0.09 }), 0, 0.62, SR_SFX);
	// gravelly wash under the rubble so the individual hits do not sound sparse.
	// Bandpassed and swept down, for the same air-absorption reason as the blast.
	let bp = svfBandpass(SR_SFX, 1800, 0.9);
	let lastF = 1800;
	for (let i = 0; i < dry.length; i++) {
		const t = i / SR_SFX;
		if (t < 0.07) continue;
		const f = 1800 * (0.4 + 0.6 * Math.exp(-4 * (t - 0.07)));
		if (Math.abs(f - lastF) > 110) {
			bp = svfBandpass(SR_SFX, f, 0.9);
			lastF = f;
		}
		dry[i] += bp(rand2()) * 0.34 * Math.exp(-5.5 * (t - 0.07)) * Math.min(1, (t - 0.07) * 30);
	}
	const wet = reverb(dry, SR_SFX, { ...MINE, mix: 0.26 });
	compress(wet, SR_SFX, { thresh: 0.5, ratio: 3.5 });
	writeWav('symbol_shatter.wav', takeTail(normalize(wet, 0.7), SR_SFX, 1.0), SR_SFX);
}

// the reveal — plays as the cloud thins and the new symbols come out from
// behind it. Rising pentatonic marimba: the board just got better, and the ear
// should be told so before the win evaluation catches up.
{
	const dry = buffer(0.8, SR_SFX);
	for (const [i, note] of [P.C5, P.D5, P.E5, P.G5, P.C6].entries()) {
		addAt(dry, marimba(note, 0.55, SR_SFX, 0.3), i * 0.055, 0.75 + i * 0.05, SR_SFX);
	}
	addAt(dry, shaker(SR_SFX, 0.16, 0.7), 0.0, 0.35, SR_SFX);
	addAt(dry, shaker(SR_SFX, 0.2, 0.75), 0.13, 0.28, SR_SFX);
	addAt(dry, cymbal(0.7, SR_SFX), 0.22, 0.12, SR_SFX); // shimmer as it clears
	// the same tunnel the blast happened in, a moment later — a dry reveal after
	// a wet blast would sound like the player had been moved somewhere else
	const wet = reverb(dry, SR_SFX, { ...MINE, mix: 0.24 });
	writeWav('symbol_reveal.wav', takeTail(normalize(wet, 0.62), SR_SFX, 1.25), SR_SFX);
}

// the smoke - a soft "fwoomp" as the cloud bursts out over the reel.
//
// PUFF used to be silent: the bang rode through it, and when the bang moved
// back to the moment the stone breaks, the cloud arrived with no sound of its
// own. This is deliberately small - it is the air the explosion pushed, heard
// under the tail of the bang, not a second event competing with it.
//
// Appended at the END of this file on purpose: every cue above shares one PRNG,
// and anything inserted earlier would shift the random stream and quietly
// change every sound generated after it.
{
	const dur = 0.8;
	const buf = buffer(dur, SR_SFX);
	const lp = onePole();
	const lp2 = onePole();
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		// a quick swell rather than a click: smoke has no hard edge
		const env = Math.min(1, t / 0.035) * Math.exp(-5.2 * t);
		// the cutoff falls as the cloud spreads out and slows
		const cut = 0.045 + 0.2 * Math.exp(-7 * t);
		const n = rand2();
		const body = lp2(lp(n, cut), cut);
		buf[i] = body * env * 2.6;
	}
	// a little weight at the start: the cloud is pushed, not blown
	let ph = 0;
	for (let i = 0; i < SR_SFX * 0.3; i++) {
		const t = i / SR_SFX;
		const f = 55 + 60 * Math.exp(-14 * t);
		ph += (2 * Math.PI * f) / SR_SFX;
		buf[i] += Math.sin(ph) * Math.min(1, t / 0.02) * Math.exp(-11 * t) * 0.3;
	}
	// and the thin hiss of it dispersing, trailing off
	const hp = onePole();
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const n = rand2();
		const h = n - hp(n, 0.2);
		buf[i] += h * 0.05 * Math.min(1, t / 0.08) * Math.exp(-3.6 * t);
	}
	const wet = reverb(buf, SR_SFX, { ...MINE, mix: 0.22 });
	writeWav('smoke_puff.wav', takeTail(normalize(wet, 0.6), SR_SFX, 1.1), SR_SFX);
}

// pressing BUY BONUS - a small charge going off.
//
// Not the blast sample quietened: that is 1.29s of licensed recording with a
// long tail, and a UI press needs to be over before the menu has finished
// opening. This is the same event at a fraction of the size - a short body, a
// clipped crack, a handful of chips - so the button sounds like what it sells
// without competing with the real thing when the feature actually runs.
//
// LEVEL IS SET AGAINST THE CLICK IT REPLACES, not by ear. Measured, the first
// version came out 5.9dB quieter than btn.wav overall and 13.1dB quieter above
// 300Hz - because nearly all of it was the 48-138Hz body, which a laptop or
// phone speaker does not reproduce. So the crack and the debris band carry more
// of it and the band sits higher, rather than just turning the gain up on bass
// nobody hears.
//
// Appended at the END of this file on purpose: every cue above shares one PRNG,
// and anything inserted earlier would shift the random stream and quietly
// change every sound generated after it.
{
	const dur = 0.5;
	const buf = buffer(dur, SR_SFX);
	// the body: shallower and much faster than the real blast's
	let ph = 0;
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const f = 48 + 90 * Math.exp(-13 * t);
		ph += (2 * Math.PI * f) / SR_SFX;
		buf[i] += Math.tanh(Math.sin(ph) * 1.3) * Math.exp(-13 * t) * 0.7;
	}
	// The crack, kept short - a UI press must not have a tail of its own - but
	// LOUD, because it is most of what a laptop speaker will actually reproduce.
	for (let i = 0; i < SR_SFX * 0.014; i++) {
		buf[i] += rand2() * Math.exp((-300 * i) / SR_SFX) * 0.9;
	}
	// debris, through a falling band so it reads as dust rather than hiss
	let bp = svfBandpass(SR_SFX, 1900, 1.1);
	let lastF = 1900;
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const f = 1900 * (0.38 + 0.62 * Math.exp(-9 * t));
		if (Math.abs(f - lastF) > 90) {
			bp = svfBandpass(SR_SFX, f, 1.1);
			lastF = f;
		}
		buf[i] += bp(rand2()) * Math.exp(-11 * t) * 0.95;
	}
	// a few chips landing
	addAt(buf, rubble(SR_SFX, { dur, count: 6, spread: 0.18, from: 0.04 }), 0, 0.55, SR_SFX);

	const wet = reverb(buf, SR_SFX, { ...MINE, mix: 0.18 });
	writeWav('press_blast.wav', takeTail(normalize(wet, 0.9), SR_SFX, 0.7), SR_SFX);
}

// ── the big-win tiers, and the two win-screen cues ──────────────────────────
//
// FIVE TIERS THAT USED TO SOUND IDENTICAL. The game has five big-win levels —
// big, super, mega, epic, max — and all of them played the same thing: the
// running music bed, one blast, and the coin shimmer. A 20x big win and the
// 10,000x cap were indistinguishable by ear.
//
// Per-tier MUSIC (bgm_winlevel_*) was the obvious fix and was deliberately
// turned off: switching the bed paused the running music and cleared the
// bgm dedupe, which left a silent plaque and a restart from the top. So these
// are FANFARES laid OVER the bed rather than music replacing it. Nothing about
// the bed is touched, which is what made the old attempt fail.
//
// They are written in the bed's own key — C major pentatonic, the P table
// above — so they sit on top of it instead of clashing with it.
//
// ESCALATION IS STRUCTURAL, not a volume knob. Each tier is longer, uses more
// horn voices, runs the marimba further and higher, and has denser percussion
// than the one below; max alone gets a low boom under the hit and a held final
// chord. Loudness rises only a little — a bigger win should be MORE, not just
// louder.
//
// Appended at the END of this file on purpose: every cue above shares one PRNG,
// and anything inserted earlier would shift the random stream and quietly
// change every sound generated after it.
const fanfare = (level) => {
	const dur = 1.6 + level * 0.6;
	const buf = buffer(dur, SR_SFX);

	// max only: the ground drops out first
	if (level >= 5) {
		let ph = 0;
		for (let i = 0; i < SR_SFX * 1.1; i++) {
			const t = i / SR_SFX;
			const f = 38 + 70 * Math.exp(-5 * t);
			ph += (2 * Math.PI * f) / SR_SFX;
			buf[i] += Math.tanh(Math.sin(ph) * 1.4) * Math.exp(-3.4 * t) * 0.7;
		}
		addAt(buf, tom(SR_SFX, 1), 0.0, 0.9, SR_SFX);
	}

	// the hit: a horn chord, one more voice per tier
	const chord = [P.C4, P.G4, P.E4, P.C5, P.G5].slice(0, 1 + Math.min(level, 4));
	chord.forEach((f, i) => {
		addAt(buf, horn(f, 0.8 + level * 0.18, SR_SFX, 0.14), 0.02 + i * 0.014, 0.5 / Math.sqrt(chord.length), SR_SFX);
	});
	addAt(buf, tom(SR_SFX, 0.8), 0.01, 0.55, SR_SFX);

	// the run: further and higher per tier
	const run = [P.C5, P.D5, P.E5, P.G5, P.A5, P.C6];
	const steps = 3 + level;
	for (let i = 0; i < steps; i++) {
		const octave = i >= run.length ? 2 : 1;
		const note = run[i % run.length] * octave;
		addAt(buf, marimba(note, 0.5, SR_SFX, 0.2), 0.2 + i * 0.068, 0.62, SR_SFX);
	}
	const runEnd = 0.2 + steps * 0.068;

	// percussion density
	addAt(buf, conga(SR_SFX, 0.8), 0.14, 0.4 * Math.min(1, level / 2), SR_SFX);
	if (level >= 3) {
		// a tom roll into the top of the run
		for (let i = 0; i < 3; i++) addAt(buf, tom(SR_SFX, 0.7), runEnd - 0.24 + i * 0.08, 0.45, SR_SFX);
	}
	if (level >= 4) {
		// a snare roll, crescendo
		const hits = 6 + level * 2;
		for (let i = 0; i < hits; i++) {
			addAt(buf, snare(SR_SFX, 0.3 + 0.7 * (i / hits)), runEnd - 0.5 + i * (0.5 / hits), 0.35, SR_SFX);
		}
	}

	// the crash at the top of the run, bigger per tier
	addAt(buf, cymbal(0.7 + level * 0.25, SR_SFX), runEnd, 0.14 + level * 0.05, SR_SFX);

	// the landing: a restated chord, held on the top two tiers
	const landing = [P.C4, P.E4, P.G4, P.C5].slice(0, 2 + Math.min(level, 2));
	landing.forEach((f, i) => {
		addAt(buf, horn(f, level >= 4 ? 1.4 : 0.7, SR_SFX, 0.08), runEnd + 0.04 + i * 0.01, 0.42 / Math.sqrt(landing.length), SR_SFX);
	});
	if (level >= 2) addAt(buf, shaker(SR_SFX, 0.3, 0.75), runEnd, 0.2, SR_SFX);

	const wet = reverb(buf, SR_SFX, { ...MINE, rt60: 1.1 + level * 0.06, mix: 0.24 + level * 0.03 });
	compress(wet, SR_SFX, { thresh: 0.5, ratio: 3.5 });
	return takeTail(normalize(wet, 0.78 + level * 0.035), SR_SFX, dur + 0.5);
};

[
	['win_big.wav', 1],
	['win_super.wav', 2],
	['win_mega.wav', 3],
	['win_epic.wav', 4],
	['win_max.wav', 5],
].forEach(([name, level]) => writeWav(name, fanfare(level), SR_SFX));

// THE TOTAL-WIN PLAQUE ARRIVING (was the template's sfx_youwon_panel). A slab
// of stone set down, then a chord rising off it: the plaque is a result being
// presented, so it is warm rather than loud.
{
	const dur = 1.7;
	const buf = buffer(dur, SR_SFX);
	addAt(buf, tom(SR_SFX, 0.9), 0, 0.7, SR_SFX);
	addAt(buf, rubble(SR_SFX, { dur, count: 5, spread: 0.12, from: 0.03 }), 0, 0.3, SR_SFX);
	[P.C5, P.E5, P.G5, P.C6].forEach((f, i) => addAt(buf, marimba(f, 0.9, SR_SFX, 0.3), 0.12 + i * 0.09, 0.6, SR_SFX));
	addAt(buf, cymbal(0.9, SR_SFX), 0.46, 0.12, SR_SFX);
	const wet = reverb(buf, SR_SFX, { ...MINE, mix: 0.26 });
	writeWav('win_panel.wav', takeTail(normalize(wet, 0.66), SR_SFX, 2.1), SR_SFX);
}

// THE 10,000x CAP (was the template's sfx_winlevel_end, which only ever played
// on wincap - so the single largest moment in the game ended on stock audio).
// The whole seam coming down: a long, deep boom that keeps rumbling, and one
// held chord over it.
{
	const dur = 3.2;
	const buf = buffer(dur, SR_SFX);
	let ph = 0;
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const f = 32 + 90 * Math.exp(-3.5 * t);
		ph += (2 * Math.PI * f) / SR_SFX;
		buf[i] += Math.tanh(Math.sin(ph) * 1.6) * Math.exp(-1.6 * t) * 0.8;
	}
	addAt(buf, rubble(SR_SFX, { dur, count: 26, spread: 1.6, from: 0.1 }), 0, 0.5, SR_SFX);
	addAt(buf, cymbal(2.4, SR_SFX), 0.02, 0.26, SR_SFX);
	[P.C3, P.G3, P.C4, P.E4, P.G4].forEach((f, i) => addAt(buf, horn(f, 2.2, SR_SFX, 0.06), 0.3 + i * 0.02, 0.2, SR_SFX));
	const wet = reverb(buf, SR_SFX, { ...MINE, rt60: 1.5, mix: 0.36 });
	compress(wet, SR_SFX, { thresh: 0.45, ratio: 4 });
	writeWav('win_cap.wav', takeTail(normalize(wet, 0.95), SR_SFX, 3.8), SR_SFX);
}

console.log('done');

// ── THE FULL BOARD: the chain of fuses, and the stamp ───────────────────────
//
// Five reels of one symbol is what the whole feature climbs towards, and it
// used to arrive as the ordinary blast played a little longer. These two cues
// belong to FullBoard.svelte, which puts a beat BEFORE that blast and one
// AFTER it, and they are timed to its constants — change one, change both.
//
// fullboard_chain   1.3s  a fuse catches on each reel, left to right, every
//                         190ms, each one a step higher; the sizzle thickens as
//                         more of them burn, and the last 0.35s is a swell that
//                         sucks the air out ahead of the bang
// fullboard_stamp   2.2s  the "BOOM!" landing: a sub drop, a horn stab, and a
//                         glittering run falling out of it
//
// Appended at the END of this file on purpose: every cue above shares one PRNG,
// and anything inserted earlier would shift the random stream and quietly
// change every sound generated after it.
{
	const dur = 1.3;
	const IGNITE_EVERY = 0.19;
	const buf = buffer(dur, SR_SFX);
	const notes = [P.C5, P.D5, P.E5, P.G5, P.A5];
	notes.forEach((f, k) => {
		const at = k * IGNITE_EVERY;
		// the match strike: a bright, very short scrape
		const strike = buffer(0.05, SR_SFX);
		const bp = svfBandpass(SR_SFX, 3200 + k * 400, 1.6);
		for (let i = 0; i < strike.length; i++) strike[i] = bp(rand2()) * Math.exp((-90 * i) / SR_SFX);
		addAt(buf, strike, at, 0.9, SR_SFX);
		// and a step up the scale, so the chain is heard CLIMBING
		addAt(buf, marimba(f, 0.4, SR_SFX, 0.15), at + 0.005, 0.55, SR_SFX);
		addAt(buf, bongo(SR_SFX, { from: 300 + k * 40, to: 200 + k * 30, dur: 0.12 }), at, 0.35, SR_SFX);
	});
	// the sizzle: one voice per fuse alight, so it thickens as they catch
	const lp = onePole();
	const hp = onePole();
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const alight = Math.min(5, Math.floor(t / IGNITE_EVERY) + 1);
		const n = rand2();
		const v = lp(n, 0.22 + 0.05 * alight);
		const b = v - hp(v, 0.06);
		const sputter = 0.6 + 0.4 * Math.sin(2 * Math.PI * 19 * t + 2.5 * Math.sin(2 * Math.PI * 5.1 * t));
		buf[i] += b * sputter * 0.12 * alight * Math.min(1, (dur - t) / 0.05);
	}
	// the intake: a rising swell that stops dead, so the bang lands in a hole
	for (let i = 0; i < SR_SFX * 0.35; i++) {
		const t = i / SR_SFX;
		const at = Math.floor((dur - 0.36) * SR_SFX) + i;
		const env = Math.pow(t / 0.35, 2.4);
		buf[at] += rand2() * env * 0.35;
	}
	addAt(buf, boing(SR_SFX, { from: 180, to: 900, dur: 0.5 }), dur - 0.52, 0.22, SR_SFX);
	const wet = reverb(buf, SR_SFX, { ...MINE, mix: 0.18 });
	writeWav('fullboard_chain.wav', takeTail(normalize(wet, 0.7), SR_SFX, dur), SR_SFX);
}
{
	const dur = 2.2;
	const buf = buffer(dur, SR_SFX);
	// the drop
	let ph = 0;
	for (let i = 0; i < SR_SFX * 1.2; i++) {
		const t = i / SR_SFX;
		const f = 34 + 80 * Math.exp(-6 * t);
		ph += (2 * Math.PI * f) / SR_SFX;
		buf[i] += Math.tanh(Math.sin(ph) * 1.5) * Math.exp(-3 * t) * 0.75;
	}
	addAt(buf, tom(SR_SFX, 1), 0, 0.8, SR_SFX);
	addAt(buf, snare(SR_SFX, 1), 0, 0.5, SR_SFX);
	// the stab, full major chord
	[P.C4, P.E4, P.G4, P.C5].forEach((f, i) => addAt(buf, horn(f, 0.6, SR_SFX, 0.1), 0.01 + i * 0.008, 0.26, SR_SFX));
	addAt(buf, cymbal(1.6, SR_SFX), 0.01, 0.3, SR_SFX);
	// glitter falling out of it: a fast run down from the top
	const run = [P.C6 * 2, P.A5 * 2, P.G5 * 2, P.E5 * 2, P.D5 * 2, P.C6, P.A5, P.G5, P.E5, P.C5];
	run.forEach((f, i) => addAt(buf, marimba(f, 0.35, SR_SFX, 0.1), 0.16 + i * 0.045, 0.34, SR_SFX));
	addAt(buf, shaker(SR_SFX, 0.5, 0.8), 0.16, 0.18, SR_SFX);
	const wet = reverb(buf, SR_SFX, { ...MINE, rt60: 1.4, mix: 0.3 });
	compress(wet, SR_SFX, { thresh: 0.5, ratio: 3.5 });
	writeWav('fullboard_stamp.wav', takeTail(normalize(wet, 0.9), SR_SFX, dur), SR_SFX);
}

// ── THE CAVE QUAKE: the roof answering the chest beat on a trigger ───────────
//
// Timed to game/caveQuake.svelte.ts: six strikes from 0.48s, 0.30s apart, and
// 3.3s in all. Two layers. Under everything, a low rumble that comes up with
// the first strike and settles after the last - the room itself moving. Over
// it, on each strike, a short crumble of stone coming off the roof, heavier on
// the later strikes as more of the roof lets go. No thump of its own on the
// strikes: the chest beat already has one, and doubling it would put the hit
// in two places.
//
// Appended at the END of this file on purpose: every cue above shares one PRNG,
// and anything inserted earlier would shift the random stream and quietly
// change every sound generated after it.
{
	const dur = 3.3;
	const START = 0.48;
	const GAP = 0.3;
	const buf = buffer(dur, SR_SFX);
	const lp = onePole();
	const lp2 = onePole();
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const env =
			t < START ? (t / START) * 0.4 : t < START + 5 * GAP + 0.4 ? 1 : Math.max(0, 1 - (t - (START + 5 * GAP + 0.4)) / 1.0);
		// low, grinding: noise through two poles, then a slow wobble so it rolls
		const n = lp2(lp(rand2(), 0.02), 0.03);
		buf[i] = n * env * 9 * (0.75 + 0.25 * Math.sin(2 * Math.PI * 3.1 * t));
	}
	for (let s = 1; s < 6; s++) {
		addAt(buf, rubble(SR_SFX, { dur: 0.9, count: 4 + s * 2, spread: 0.45, from: 0.03 }), START + s * GAP, 0.22 + s * 0.05, SR_SFX);
	}
	// and a last patter of grit as it settles
	addAt(buf, rubble(SR_SFX, { dur: 1.1, count: 10, spread: 0.9, from: 0.05 }), START + 5 * GAP + 0.35, 0.18, SR_SFX);
	const wet = reverb(buf, SR_SFX, { ...MINE, rt60: 1.3, mix: 0.3 });
	writeWav('cave_quake.wav', takeTail(normalize(wet, 0.8), SR_SFX, dur), SR_SFX);
}

// ── A RUNG OF THE BLAST LADDER ───────────────────────────────────────────────
//
// Heard when the feature's ladder climbs one step (see soundLadderUp), as the
// mine warms and the dust picks up. Stone settling, then one low note that
// rises a fifth and holds: the sound of something deeper down answering. It is
// short and dark on purpose - it sits under the reveal's marimba, not on top.
//
// Appended at the END of this file on purpose: every cue above shares one PRNG,
// and anything inserted earlier would shift the random stream and quietly
// change every sound generated after it.
{
	const dur = 1.1;
	const buf = buffer(dur, SR_SFX);
	addAt(buf, rubble(SR_SFX, { dur: 0.5, count: 6, spread: 0.2, from: 0.02 }), 0, 0.5, SR_SFX);
	addAt(buf, tom(SR_SFX, 0.9), 0.02, 0.6, SR_SFX);
	// the note: P.C3 rising to P.G3 over 0.5s, with a slow tremble
	let ph = 0;
	for (let i = 0; i < SR_SFX * 1.0; i++) {
		const t = i / SR_SFX;
		const f = P.C3 * Math.pow(P.G3 / P.C3, Math.min(1, t / 0.5));
		ph += (2 * Math.PI * f) / SR_SFX;
		const env = Math.min(1, t / 0.03) * Math.exp(-2.6 * t);
		buf[i] += (Math.sin(ph) + 0.35 * Math.sin(2 * ph)) * env * (0.85 + 0.15 * Math.sin(2 * Math.PI * 6 * t)) * 0.45;
	}
	const wet = reverb(buf, SR_SFX, { ...MINE, rt60: 1.2, mix: 0.28 });
	writeWav('ladder_up.wav', takeTail(normalize(wet, 0.75), SR_SFX, dur), SR_SFX);
}

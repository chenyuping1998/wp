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

// ─── the tablet reveal ───────────────────────────────────────────────────────
//
// The mechanic had no sound of its own: it borrowed `mult_update` (a marimba
// ding written for a multiplier re-roll) for the batch and `pluck_low` for each
// tablet, so the moment the symbol was named sounded like a menu confirming
// something.
//
// Written against the ANIMATION, which is stone: the tablets strain, the seal
// gives, the halves fall and gold sand pours out of the break. So this is grit
// and stone where Go Bananas Boat's crate reveal is rope and canvas — the two
// games' reveals share their timing and share nothing else, which is most of
// what stops them feeling like one game in two costumes.

// seal_strain — once at the top of the batch, under the shudder. Stone grinding
// on stone: low, rough, and going nowhere until it gives.
{
	const dur = 0.42;
	const buf = buffer(dur, SR_SFX);
	const n = buf.length;
	let lp = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR_SFX;
		// heavily lowpassed noise, amplitude-stuttered: grinding, not hissing
		lp += (rand2() - lp) * 0.12;
		const grind = 0.5 + 0.5 * Math.sin(t * 88 + Math.sin(t * 23) * 2);
		buf[i] += lp * grind * (0.35 + 0.65 * t) * 1.4;
	}
	addAt(buf, tom(SR_SFX, 0.6), 0, 0.55, SR_SFX); // the slab settles in its frame
	writeWav('seal_strain.wav', normalize(buf, 0.6), SR_SFX);
}

// stone_crack — once per tablet, on its own beat. The seal snaps, the two halves
// grind apart, sand pours from the break, and a marimba note lands on the symbol
// underneath.
//
// Played back at a rising rate per tablet (see Sound.svelte), so several on one
// board are an ascending run rather than the same crack repeated — the same
// trick the five reel stops use, and the reason this is one file and not four.
{
	const dur = 0.55;
	const buf = buffer(dur, SR_SFX);
	// the snap: short, hard, and dry
	for (let i = 0; i < SR_SFX * 0.014; i++) {
		buf[i] += rand2() * Math.exp((-240 * i) / SR_SFX) * 0.9;
	}
	addAt(buf, bongo(SR_SFX, { from: 200, to: 90, dur: 0.16 }), 0, 0.7, SR_SFX); // the weight of it
	// the halves grind apart — a short downward noise band, opposite direction to
	// the Boat tarp's upward whoosh, because these pieces fall
	addAt(buf, whoosh(0.26, SR_SFX, [0.2, 0.12, 0.07], 0.05), 0.03, 0.6, SR_SFX);
	// sand out of the break: fine, dry, and lasting past the crack
	addAt(buf, shaker(SR_SFX, 0.26, 0.8), 0.07, 0.5, SR_SFX);
	addAt(buf, shaker(SR_SFX, 0.2, 0.7), 0.16, 0.3, SR_SFX);
	// ...and the symbol is there. This note is the whole point of the cue.
	addAt(buf, marimba(P.E5, 0.36, SR_SFX, 0.25), 0.18, 0.9, SR_SFX);
	addAt(buf, marimba(P.C6, 0.3, SR_SFX, 0.5), 0.21, 0.4, SR_SFX);
	writeWav('stone_crack.wav', normalize(buf, 0.75), SR_SFX);
}

// sand_pour — the opening (EntryReveal): the board rising out of the tomb floor
// and the sand running off it. SAND ONLY — no note, no snap, nothing that could
// be heard as a win: stone_crack carries a marimba note for a revealed symbol,
// and played on the opening it sounded like scoring before the first spin.
//
// Timed to the rise (0.72s up, ~0.2s to seat, sand off the sides for ~1.3s):
//   a dry rush of falling grains that swells as the board comes up, a soft low
//   "fwump" of sand settling as it seats at 0.92s, then a thinning trickle.
{
	const dur = 2.3;
	const buf = buffer(dur, SR_SFX);
	const n = buf.length;
	const SEAT = 0.92;
	let lp = 0, hp = 0, body = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR_SFX;
		// the rush: band-limited hiss, swelling with the rise, thinning after
		const swell = t < SEAT ? 0.25 + 0.75 * (t / SEAT) ** 1.5 : Math.exp(-(t - SEAT) / 0.55);
		const x = rand2();
		lp += 0.45 * (x - lp);
		hp += 0.06 * (lp - hp);
		const hiss = lp - hp;
		// grain flutter: the stream is not steady
		const flutter = 0.7 + 0.3 * Math.sin(t * 37 + Math.sin(t * 11) * 3);
		buf[i] += hiss * swell * flutter * 0.55;
		// the settle: a short, soft, low noise thump (no pitch)
		if (t >= SEAT && t < SEAT + 0.25) {
			body += 0.03 * (rand2() - body);
			buf[i] += body * Math.exp(-(t - SEAT) / 0.06) * 3.2;
		}
	}
	// single grains ticking off the edges: sparse, many, fading out at the end
	for (let k = 0; k < 520; k++) {
		const at = rand() * (dur - 0.05);
		const density = at < SEAT ? 0.4 + 0.6 * (at / SEAT) : Math.exp(-(at - SEAT) / 0.6);
		if (rand() > density) continue;
		addAt(buf, shaker(SR_SFX, 0.012, 0.9), at, 0.18 + 0.25 * rand(), SR_SFX);
	}
	writeWav('sand_pour.wav', fadeEnds(normalize(buf, 0.6), SR_SFX, 20), SR_SFX);
}

console.log('done');

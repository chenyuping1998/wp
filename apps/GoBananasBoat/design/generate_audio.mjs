// GoBananas 中國風 audio generator — pure-Node synthesis, writes 16-bit WAV.
// Instruments: guzheng pluck (Karplus-Strong), gong, woodblock, membrane drum,
// cymbal, and a spinning-cudgel whoosh. No external dependencies.
// Usage: node design/generate_audio.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/audio/cn');
fs.mkdirSync(OUT, { recursive: true });

const SR_SFX = 44100;
const SR_BGM = 22050; // BGM loops stay small as 22 kHz mono WAV

// ─── plumbing ────────────────────────────────────────────────────────────────
// deterministic PRNG so regeneration is reproducible
let seed = 20260702;
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

// short fade at both ends against clicks
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
	data.writeUInt16LE(1, 20); // PCM
	data.writeUInt16LE(1, 22); // mono
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
// 古箏 pluck — Karplus-Strong with bright attack and gentle vibrato-ish shimmer
const pluck = (freq, dur, sr, { decay = 0.9965, bright = 0.9 } = {}) => {
	const out = buffer(dur, sr);
	const N = Math.max(2, Math.round(sr / freq));
	const delay = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		// mildly lowpassed initial noise = softer fingernail attack
		delay[i] = i > 0 ? bright * rand2() + (1 - bright) * delay[i - 1] : rand2();
	}
	let idx = 0;
	for (let i = 0; i < out.length; i++) {
		const cur = delay[idx];
		const nxt = delay[(idx + 1) % N];
		const y = decay * 0.5 * (cur + nxt);
		delay[idx] = y;
		idx = (idx + 1) % N;
		out[i] = cur;
	}
	// overall exponential envelope so long buffers tail off smoothly
	const k = 3.2 / dur;
	for (let i = 0; i < out.length; i++) out[i] *= Math.exp((-k * i) / sr);
	return fadeEnds(out, sr);
};

// 鑼 gong — inharmonic partial stack with slow shimmer and strike noise
const gong = (dur, sr, base = 105, bigness = 1) => {
	const out = buffer(dur, sr);
	const partials = [
		[1, 1],
		[1.52, 0.66],
		[2.31, 0.5],
		[2.99, 0.34],
		[3.76, 0.26],
		[4.63, 0.18],
		[5.52, 0.12],
		[6.84, 0.08],
	];
	for (const [ratio, amp] of partials) {
		const f = base * ratio * (1 + rand2() * 0.004);
		const dk = (0.55 + ratio * 0.5) / bigness;
		const phase = rand() * Math.PI * 2;
		const beat = 2.2 + rand() * 2.4;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			const env = Math.exp(-dk * t) * (1 - Math.exp(-40 * t));
			const shimmer = 1 + 0.16 * Math.sin(2 * Math.PI * beat * t);
			out[i] += amp * env * shimmer * Math.sin(2 * Math.PI * f * t + phase);
		}
	}
	// mallet thud
	for (let i = 0; i < Math.min(out.length, sr * 0.03); i++) {
		out[i] += rand2() * 0.4 * Math.exp((-90 * i) / sr);
	}
	return fadeEnds(out, sr);
};

// 木魚 woodblock — two bright resonances + click
const woodblock = (sr, pitch = 1) => {
	const dur = 0.14;
	const out = buffer(dur, sr);
	for (const [f, a, k] of [
		[845 * pitch, 1, 52],
		[1330 * pitch, 0.6, 70],
	]) {
		const phase = rand() * Math.PI * 2;
		for (let i = 0; i < out.length; i++) {
			const t = i / sr;
			out[i] += a * Math.exp(-k * t) * Math.sin(2 * Math.PI * f * t + phase);
		}
	}
	for (let i = 0; i < Math.min(out.length, sr * 0.005); i++) out[i] += rand2() * 0.5;
	return fadeEnds(out, sr);
};

// 大鼓 membrane drum — descending pitch sweep with body
const drum = (sr, { from = 160, to = 56, dur = 0.42, punch = 1 } = {}) => {
	const out = buffer(dur, sr);
	let phase = 0;
	for (let i = 0; i < out.length; i++) {
		const t = i / sr;
		const p = Math.min(1, t / (dur * 0.7));
		const f = from * Math.pow(to / from, p);
		phase += (2 * Math.PI * f) / sr;
		out[i] = Math.sin(phase) * Math.exp(-9 * t) * punch;
	}
	for (let i = 0; i < Math.min(out.length, sr * 0.012); i++) {
		out[i] += rand2() * 0.5 * Math.exp((-260 * i) / sr);
	}
	return fadeEnds(out, sr);
};

// 鈸 cymbal — metallic detuned partial cloud + noise burst
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
		out[i] += (n - lp) * 0.5 * Math.exp(-5.5 * t); // highpassed noise
	}
	return fadeEnds(out, sr);
};

// spinning-cudgel whoosh — noise humps through a wobbling lowpass
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

// ─── notes ───────────────────────────────────────────────────────────────────
// C pentatonic (宮調式): C D E G A
const P = { C3: 130.8, D3: 146.8, E3: 164.8, G3: 196, A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5 };

// ─── SFX ─────────────────────────────────────────────────────────────────────
// reel stop — woodblock tok
writeWav('reel_stop.wav', normalize(woodblock(SR_SFX), 0.7), SR_SFX);

// button tick — softer, higher woodblock
writeWav('btn.wav', normalize(woodblock(SR_SFX, 1.6), 0.4), SR_SFX);

// spin press — drum hit
writeWav('spin.wav', normalize(drum(SR_SFX), 0.75), SR_SFX);

// scatter stops 1..5 — rising guzheng plucks
[['scatter_1', P.A4], ['scatter_2', P.C5], ['scatter_3', P.D5], ['scatter_4', P.E5], ['scatter_5', P.G5]].forEach(
	([name, f]) => {
		const buf = buffer(1.1, SR_SFX);
		addAt(buf, pluck(f, 1.0, SR_SFX), 0, 1, SR_SFX);
		addAt(buf, pluck(f * 2, 0.7, SR_SFX), 0.02, 0.3, SR_SFX);
		writeWav(`${name}.wav`, normalize(buf, 0.72), SR_SFX);
	},
);

// low pluck — wild lands in base game
{
	const buf = buffer(1.0, SR_SFX);
	addAt(buf, pluck(P.C4, 0.9, SR_SFX), 0, 1, SR_SFX);
	addAt(buf, pluck(P.G3, 0.9, SR_SFX), 0.03, 0.7, SR_SFX);
	writeWav('pluck_low.wav', normalize(buf, 0.7), SR_SFX);
}

// small win — quick ascending pentatonic gliss
{
	const buf = buffer(1.4, SR_SFX);
	[P.C4, P.D4, P.E4, P.G4, P.A4, P.C5, P.D5, P.E5].forEach((f, i) => {
		addAt(buf, pluck(f, 0.7, SR_SFX), i * 0.055, 0.8 - i * 0.03, SR_SFX);
	});
	writeWav('win_gliss.wav', normalize(buf, 0.72), SR_SFX);
}

// big scatter win / feature payoff — full two-octave gliss + gong
{
	const buf = buffer(3.2, SR_SFX);
	[P.C4, P.D4, P.E4, P.G4, P.A4, P.C5, P.D5, P.E5, P.G5, P.A5, P.C6].forEach((f, i) => {
		addAt(buf, pluck(f, 0.8, SR_SFX), i * 0.06, 0.7, SR_SFX);
	});
	addAt(buf, gong(2.4, SR_SFX, 130, 1.2), 0.66, 0.9, SR_SFX);
	writeWav('win_gliss_big.wav', normalize(buf, 0.8), SR_SFX);
}

// free-game trigger — the big gong moment
{
	const buf = buffer(3.0, SR_SFX);
	addAt(buf, gong(3.0, SR_SFX, 96, 1.6), 0, 1, SR_SFX);
	addAt(buf, cymbal(1.6, SR_SFX), 0.02, 0.35, SR_SFX);
	writeWav('gong_feature.wav', normalize(buf, 0.85), SR_SFX);
}

// free-spin intro jingle — drum roll into gong
{
	const buf = buffer(2.4, SR_SFX);
	for (let i = 0; i < 10; i++) {
		addAt(buf, drum(SR_SFX, { from: 140, to: 80, dur: 0.16, punch: 0.5 + i * 0.05 }), i * 0.09, 0.8, SR_SFX);
	}
	addAt(buf, gong(1.6, SR_SFX, 120, 1.1), 0.95, 0.95, SR_SFX);
	addAt(buf, cymbal(1.2, SR_SFX), 0.95, 0.3, SR_SFX);
	writeWav('fs_intro.wav', normalize(buf, 0.82), SR_SFX);
}

// big-win blast — gong + cymbal + celebratory run
{
	const buf = buffer(2.6, SR_SFX);
	addAt(buf, gong(2.4, SR_SFX, 88, 1.5), 0, 1, SR_SFX);
	addAt(buf, cymbal(1.8, SR_SFX), 0, 0.5, SR_SFX);
	[P.G4, P.A4, P.C5, P.E5, P.G5].forEach((f, i) => addAt(buf, pluck(f, 0.7, SR_SFX), 0.18 + i * 0.07, 0.5, SR_SFX));
	writeWav('bigwin_blast.wav', normalize(buf, 0.85), SR_SFX);
}

// coin shimmer loop (big-win count-up) — cascading high plucks, loopable
{
	const dur = 2.4;
	const buf = buffer(dur, SR_SFX);
	const notes = [P.C6, P.A5, P.G5, P.E5, P.C6, P.G5, P.A5, P.E5, P.C6, P.G5];
	notes.forEach((f, i) => addAt(buf, pluck(f, 0.5, SR_SFX, { decay: 0.994 }), (i * dur) / notes.length, 0.5 + 0.2 * rand(), SR_SFX));
	writeWav('coin_shimmer.wav', normalize(buf, 0.55), SR_SFX);
}

// anticipation / reel tension — nervous tremolo on low strings, loopable
{
	const dur = 2.0;
	const buf = buffer(dur, SR_SFX);
	for (let i = 0; i < 16; i++) {
		const f = i % 2 === 0 ? P.A3 : P.C4;
		addAt(buf, pluck(f, 0.3, SR_SFX, { bright: 0.5 }), (i * dur) / 16, 0.55 + 0.1 * Math.sin(i), SR_SFX);
	}
	addAt(buf, woodblock(SR_SFX, 0.8), 0.5, 0.4, SR_SFX);
	addAt(buf, woodblock(SR_SFX, 0.8), 1.5, 0.4, SR_SFX);
	writeWav('reel_tension.wav', normalize(buf, 0.6), SR_SFX);
}

// expanding wild — 金箍棒 twirl: three accelerating whooshes into a gong,
// timed to the spine grow animation (twirl 0.35–1.45s, flash at 1.45s)
{
	const buf = buffer(2.6, SR_SFX);
	addAt(buf, whoosh(1.7, SR_SFX, [0.45, 0.8, 1.1, 1.32], 0.075), 0, 1.4, SR_SFX);
	addAt(buf, pluck(P.C4, 0.4, SR_SFX), 0.02, 0.5, SR_SFX);
	addAt(buf, gong(1.15, SR_SFX, 132, 1.1), 1.42, 0.95, SR_SFX);
	addAt(buf, cymbal(0.9, SR_SFX), 1.42, 0.3, SR_SFX);
	writeWav('wild_expand.wav', normalize(buf, 0.85), SR_SFX);
}

// multiplier re-roll on sticky wilds — quick ding-ding
{
	const buf = buffer(0.8, SR_SFX);
	addAt(buf, pluck(P.A5, 0.5, SR_SFX), 0, 0.8, SR_SFX);
	addAt(buf, pluck(P.C6, 0.5, SR_SFX), 0.11, 0.8, SR_SFX);
	writeWav('mult_update.wav', normalize(buf, 0.6), SR_SFX);
}

// ─── BGM ─────────────────────────────────────────────────────────────────────
// helper: schedule [degree, beats] melody as plucks
const scheduleMelody = (buf, notes, startBeat, beatSec, sr, gain = 0.8, octave = 1) => {
	let at = startBeat;
	for (const [freq, beats] of notes) {
		if (freq > 0) addAt(buf, pluck(freq * octave, Math.min(1.6, beats * beatSec + 0.5), sr), at * beatSec, gain, sr);
		at += beats;
	}
	return at;
};

// base BGM — 山水 serenity, 96 BPM, 16 bars of 4/4 (~40s), loopable
{
	const BPM = 96;
	const beat = 60 / BPM;
	const bars = 16;
	const dur = bars * 4 * beat;
	const buf = buffer(dur + 0.6, SR_BGM);

	// melody: original folk-style pentatonic phrases (A A' B A')
	const phraseA = [
		[P.G4, 1], [P.A4, 0.5], [P.C5, 0.5], [P.A4, 1], [P.G4, 1],
		[P.E4, 1], [P.D4, 0.5], [P.E4, 0.5], [P.G4, 2],
		[P.A4, 1], [P.C5, 0.5], [P.D5, 0.5], [P.E5, 1], [P.D5, 1],
		[P.C5, 1], [P.A4, 0.5], [P.G4, 0.5], [P.A4, 2],
	];
	const phraseB = [
		[P.E5, 1], [P.D5, 0.5], [P.C5, 0.5], [P.D5, 1], [P.C5, 1],
		[P.A4, 1], [P.G4, 0.5], [P.A4, 0.5], [P.C5, 2],
		[P.D5, 1], [P.C5, 0.5], [P.A4, 0.5], [P.G4, 1], [P.E4, 1],
		[P.D4, 1], [P.E4, 0.5], [P.G4, 0.5], [P.G4, 2],
	];
	let cursor = 0;
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.7);
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.72);
	cursor = scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.75);
	scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.7);

	// accompaniment: low fifth drone plucks + soft woodblock ticks
	for (let bar = 0; bar < bars; bar++) {
		const t0 = bar * 4;
		const root = bar % 4 === 3 ? P.G3 : P.C3;
		addAt(buf, pluck(root, 1.8, SR_BGM, { bright: 0.55 }), t0 * beat, 0.5, SR_BGM);
		addAt(buf, pluck(root * 1.5, 1.6, SR_BGM, { bright: 0.55 }), (t0 + 2) * beat, 0.38, SR_BGM);
		addAt(buf, woodblock(SR_BGM), (t0 + 1) * beat, 0.16, SR_BGM);
		addAt(buf, woodblock(SR_BGM), (t0 + 3) * beat, 0.16, SR_BGM);
	}
	writeWav('bgm_main.wav', normalize(buf, 0.55), SR_BGM);
}

// free-spin BGM — 慶典 energy, 126 BPM, 16 bars (~30s), loopable
{
	const BPM = 126;
	const beat = 60 / BPM;
	const bars = 16;
	const dur = bars * 4 * beat;
	const buf = buffer(dur + 0.6, SR_BGM);

	const phraseA = [
		[P.C5, 0.5], [P.D5, 0.5], [P.E5, 0.5], [P.G5, 0.5], [P.E5, 0.5], [P.D5, 0.5], [P.C5, 1],
		[P.A4, 0.5], [P.C5, 0.5], [P.D5, 0.5], [P.E5, 0.5], [P.D5, 1], [P.C5, 1],
		[P.G4, 0.5], [P.A4, 0.5], [P.C5, 0.5], [P.D5, 0.5], [P.E5, 0.5], [P.G5, 0.5], [P.A5, 1],
		[P.G5, 0.5], [P.E5, 0.5], [P.D5, 0.5], [P.C5, 0.5], [P.D5, 2],
	];
	const phraseB = [
		[P.G5, 0.5], [P.E5, 0.5], [P.G5, 0.5], [P.A5, 0.5], [P.G5, 0.5], [P.E5, 0.5], [P.D5, 1],
		[P.E5, 0.5], [P.D5, 0.5], [P.C5, 0.5], [P.A4, 0.5], [P.C5, 1], [P.D5, 1],
		[P.E5, 0.5], [P.G5, 0.5], [P.A5, 0.5], [P.C6, 0.5], [P.A5, 0.5], [P.G5, 0.5], [P.E5, 1],
		[P.D5, 0.5], [P.E5, 0.5], [P.G5, 0.5], [P.E5, 0.5], [P.C5, 2],
	];
	let cursor = 0;
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.62);
	cursor = scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.66);
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.62);
	scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.66);

	for (let bar = 0; bar < bars; bar++) {
		const t0 = bar * 4;
		// festive drum + woodblock groove
		addAt(buf, drum(SR_BGM, { punch: 0.9 }), t0 * beat, 0.5, SR_BGM);
		addAt(buf, woodblock(SR_BGM), (t0 + 1) * beat, 0.2, SR_BGM);
		addAt(buf, drum(SR_BGM, { from: 130, to: 70, dur: 0.3, punch: 0.7 }), (t0 + 2) * beat, 0.4, SR_BGM);
		addAt(buf, woodblock(SR_BGM), (t0 + 3) * beat, 0.2, SR_BGM);
		addAt(buf, woodblock(SR_BGM, 1.4), (t0 + 3.5) * beat, 0.14, SR_BGM);
		// low pulse
		const root = bar % 4 === 3 ? P.G3 : P.C3;
		addAt(buf, pluck(root, 1.2, SR_BGM, { bright: 0.5 }), (t0 + 0) * beat, 0.4, SR_BGM);
		addAt(buf, pluck(root, 1.2, SR_BGM, { bright: 0.5 }), (t0 + 2) * beat, 0.34, SR_BGM);
	}
	// gong accents at the two halves
	addAt(buf, gong(2.2, SR_BGM, 105, 1.2), 0, 0.5, SR_BGM);
	addAt(buf, gong(2.2, SR_BGM, 105, 1.2), 8 * 4 * beat, 0.42, SR_BGM);
	writeWav('bgm_freespin.wav', normalize(buf, 0.58), SR_BGM);
}

console.log('done');

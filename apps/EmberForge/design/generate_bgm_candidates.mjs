// Free-game bed candidates, for choosing between by ear.
//
// Two rounds of feedback bracket the target. The original was a 138 BPM loop
// whose eight-note phrase repeated once per bar, eight bars to the loop —
// "一直重複一段音效". Replacing it with a continuous fire bed removed the
// repetition but introduced the opposite problem: broadband noise is a hiss, and
// a hiss under a feature you sit in for a minute is fatiguing — "沙沙聲".
//
// So the brief for all three: rhythm back, faster than 138, and NO broadband
// noise anywhere. Every voice here is tonal or a struck bar. The only filtered
// noise permitted is below 120Hz, where it is felt rather than heard as hiss,
// and candidate A does not even use that.
//
// Not shipped. These write to design/bgm_candidates/ for listening; whichever
// wins gets folded into generate_audio_forge.mjs and these are deleted.
//
// Usage: node design/generate_bgm_candidates.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'design/bgm_candidates');
fs.mkdirSync(OUT, { recursive: true });

const SR = 22050;

let seed = 20260807;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const rand2 = () => rand() * 2 - 1;

const buffer = (dur) => new Float32Array(Math.ceil(dur * SR));
const addAt = (dst, src, offsetSec, gain) => {
	const start = Math.round(offsetSec * SR);
	for (let i = 0; i < src.length && start + i < dst.length; i++) {
		if (start + i >= 0) dst[start + i] += src[i] * gain;
	}
};
const lowpass = (buf, cutoff) => {
	const dt = 1 / SR;
	const rc = 1 / (2 * Math.PI * cutoff);
	const a = dt / (rc + dt);
	let prev = 0;
	for (let i = 0; i < buf.length; i++) {
		prev += a * (buf[i] - prev);
		buf[i] = prev;
	}
	return buf;
};
const rmsNormalize = (buf, target = 0.15) => {
	let sum = 0;
	for (const v of buf) sum += v * v;
	const gain = target / (Math.sqrt(sum / buf.length) || 1e-9);
	for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * gain);
	return buf;
};
const writeWav = (name, buf) => {
	const n = buf.length;
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
		const v = Math.max(-1, Math.min(1, buf[i]));
		data.writeInt16LE((v * 32767) | 0, 44 + i * 2);
	}
	fs.writeFileSync(path.join(OUT, name), data);
	return data.length;
};

// Inharmonic ratios measured off struck steel: what makes this an anvil and not
// a bell. Carried over from the shipping generator unchanged.
const METAL_RATIOS = [1, 2.76, 5.4, 8.93, 13.34, 18.64];
const strike = ({ freq = 320, dur = 1.1, bright = 1, decay = 1 }) => {
	const buf = buffer(dur);
	METAL_RATIOS.forEach((ratio, index) => {
		const partialFreq = freq * ratio;
		if (partialFreq > SR / 2) return;
		const life = (dur * decay) / (1 + index * 1.35);
		const amp = (1 / (1 + index * 1.6)) * (index === 0 ? 1 : bright);
		for (let i = 0; i < buf.length; i++) {
			const t = i / SR;
			buf[i] += Math.sin(2 * Math.PI * partialFreq * t) * amp * Math.exp(-t / life);
		}
	});
	// NO contact-noise click here. In the shipping strike that burst of noise is
	// what gives a single hit its attack; multiplied by a few hundred hits in a
	// loop it is precisely the sandy layer being complained about.
	return buf;
};

/** A sine with a percussive envelope — the low end, with no noise in it. */
const pedal = (freq, dur, decay = 0.55) => {
	const buf = buffer(dur);
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR;
		buf[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / (dur * decay));
	}
	return buf;
};

const scaleFrom = (root, steps) => steps.map((s) => root * Math.pow(2, s / 12));

/** Wrap the tail back over the head so the loop has no seam. */
const seal = (buf, loopSec, xfSec) => {
	const xf = Math.round(xfSec * SR);
	const loop = Math.round(loopSec * SR);
	for (let i = 0; i < xf; i++) {
		const t = i / xf;
		buf[i] = buf[i] * t + buf[loop + i] * (1 - t);
	}
	return buf.slice(0, loop);
};

// ─────────────────────────────────────────────────────────────────────────────
// A — dry forge. Rhythm only, not one grain of noise in the file.
//     16 bars at 152 BPM with four rotating phrases, so nothing repeats until
//     the loop does.
// ─────────────────────────────────────────────────────────────────────────────
{
	const bpm = 152;
	const beat = 60 / bpm;
	const bars = 16;
	const loopSec = beat * 4 * bars;
	const XF = beat * 2;
	const buf = buffer(loopSec + XF);

	for (let b = 0; b < (bars + 2) * 8; b++) {
		const at = b * beat * 0.5;
		const inBar = b % 8;
		const accent = inBar === 0;
		const heavy = inBar === 4;
		addAt(
			buf,
			strike({
				freq: accent ? 186 : heavy ? 244 : 348,
				dur: accent ? 0.5 : heavy ? 0.36 : 0.18,
				bright: accent ? 0.55 : heavy ? 0.42 : 0.26,
				decay: accent ? 0.45 : heavy ? 0.32 : 0.15,
			}),
			at,
			accent ? 0.72 : heavy ? 0.46 : 0.22,
		);
	}
	for (let bar = 0; bar < bars + 2; bar++) {
		for (const off of [0, 2]) addAt(buf, pedal(49, beat * 1.5), bar * beat * 4 + off * beat, 0.55);
	}
	const notes = scaleFrom(392, [0, 3, 5, 7, 10, 12]);
	const phrases = [
		[0, 3, 5, 4, 2, 5, 3, 1],
		[5, 4, 2, 0, 3, 2, 5, 3],
		[2, 5, 3, 5, 4, 2, 0, 2],
		[0, 2, 3, 5, 3, 2, 4, 0],
	];
	for (let bar = 0; bar < bars + 2; bar++) {
		const figure = phrases[bar % phrases.length];
		for (let i = 0; i < figure.length; i++) {
			const push = i % 2 === 1 ? beat * 0.25 : 0;
			addAt(
				buf,
				strike({ freq: notes[figure[i]], dur: 0.62, bright: 0.3, decay: 0.85 }),
				bar * beat * 4 + i * beat * 0.5 + push,
				0.3,
			);
		}
	}
	const out = rmsNormalize(seal(buf, loopSec, XF), 0.15);
	console.log('A_dry_forge.wav       ', (loopSec).toFixed(1) + 's', bpm + ' BPM', (writeWav('A_dry_forge.wav', out) / 1024 / 1024).toFixed(2) + ' MB');
}

// ─────────────────────────────────────────────────────────────────────────────
// B — same drive, plus a furnace felt rather than heard: rumble hard-filtered
//     at 110Hz. Nothing above that, so there is no hiss to hear.
// ─────────────────────────────────────────────────────────────────────────────
{
	const bpm = 152;
	const beat = 60 / bpm;
	const bars = 16;
	const loopSec = beat * 4 * bars;
	const XF = beat * 2;
	const buf = buffer(loopSec + XF);

	const rumble = buffer(loopSec + XF);
	for (let i = 0; i < rumble.length; i++) rumble[i] = rand2();
	lowpass(rumble, 110);
	lowpass(rumble, 90);
	lowpass(rumble, 90);
	for (let i = 0; i < rumble.length; i++) {
		const t = i / SR;
		rumble[i] *= 0.9 * (0.75 + 0.25 * Math.sin((2 * Math.PI * 3 * t) / loopSec));
	}
	addAt(buf, rumble, 0, 1);

	for (let b = 0; b < (bars + 2) * 8; b++) {
		const at = b * beat * 0.5;
		const inBar = b % 8;
		const accent = inBar === 0;
		const heavy = inBar === 4;
		addAt(
			buf,
			strike({
				freq: accent ? 186 : heavy ? 244 : 348,
				dur: accent ? 0.5 : heavy ? 0.36 : 0.18,
				bright: accent ? 0.55 : heavy ? 0.42 : 0.26,
				decay: accent ? 0.45 : heavy ? 0.32 : 0.15,
			}),
			at,
			accent ? 0.7 : heavy ? 0.44 : 0.21,
		);
	}
	for (let bar = 0; bar < bars + 2; bar++) {
		for (const off of [0, 2]) addAt(buf, pedal(49, beat * 1.5), bar * beat * 4 + off * beat, 0.5);
	}
	const notes = scaleFrom(392, [0, 3, 5, 7, 10, 12]);
	const phrases = [
		[0, 3, 5, 4, 2, 5, 3, 1],
		[5, 4, 2, 0, 3, 2, 5, 3],
		[2, 5, 3, 5, 4, 2, 0, 2],
		[0, 2, 3, 5, 3, 2, 4, 0],
	];
	for (let bar = 0; bar < bars + 2; bar++) {
		const figure = phrases[bar % phrases.length];
		for (let i = 0; i < figure.length; i++) {
			const push = i % 2 === 1 ? beat * 0.25 : 0;
			addAt(buf, strike({ freq: notes[figure[i]], dur: 0.62, bright: 0.3, decay: 0.85 }), bar * beat * 4 + i * beat * 0.5 + push, 0.28);
		}
	}
	const out = rmsNormalize(seal(buf, loopSec, XF), 0.15);
	console.log('B_forge_with_rumble.wav', (loopSec).toFixed(1) + 's', bpm + ' BPM', (writeWav('B_forge_with_rumble.wav', out) / 1024 / 1024).toFixed(2) + ' MB');
}

// ─────────────────────────────────────────────────────────────────────────────
// C — the fastest of the three. 168 BPM, a sixteenth-note pulse on a tonal bass
//     instead of any bed, sparser metal so the drive is the low end.
// ─────────────────────────────────────────────────────────────────────────────
{
	const bpm = 168;
	const beat = 60 / bpm;
	const bars = 16;
	const loopSec = beat * 4 * bars;
	const XF = beat * 2;
	const buf = buffer(loopSec + XF);

	// sixteenth pulse: short tonal blips, the engine of the whole thing
	for (let s = 0; s < (bars + 2) * 16; s++) {
		const at = s * beat * 0.25;
		const inBar = s % 16;
		const strong = inBar % 4 === 0;
		addAt(buf, pedal(strong ? 49 : 98, beat * (strong ? 0.9 : 0.4), 0.4), at, strong ? 0.6 : 0.22);
	}
	// metal only on the backbeat, so it punctuates rather than fills
	for (let bar = 0; bar < bars + 2; bar++) {
		for (const off of [1, 3]) {
			addAt(buf, strike({ freq: 262, dur: 0.42, bright: 0.5, decay: 0.34 }), bar * beat * 4 + off * beat, 0.5);
		}
		if (bar % 4 === 3) {
			addAt(buf, strike({ freq: 175, dur: 0.8, bright: 0.6, decay: 0.7 }), bar * beat * 4 + 3.5 * beat, 0.55);
		}
	}
	const notes = scaleFrom(523, [0, 3, 5, 7, 10, 12]);
	const phrases = [
		[0, 2, 3, 2, 5, 3, 2, 0],
		[3, 5, 4, 2, 0, 2, 3, 5],
		[5, 3, 2, 4, 5, 2, 3, 0],
		[2, 0, 3, 5, 2, 4, 3, 2],
	];
	for (let bar = 0; bar < bars + 2; bar++) {
		const figure = phrases[bar % phrases.length];
		for (let i = 0; i < figure.length; i++) {
			addAt(buf, strike({ freq: notes[figure[i]], dur: 0.5, bright: 0.26, decay: 0.7 }), bar * beat * 4 + i * beat * 0.5 + beat * 0.25, 0.24);
		}
	}
	const out = rmsNormalize(seal(buf, loopSec, XF), 0.15);
	console.log('C_fast_pulse.wav      ', (loopSec).toFixed(1) + 's', bpm + ' BPM', (writeWav('C_fast_pulse.wav', out) / 1024 / 1024).toFixed(2) + ' MB');
}

console.log('\ncandidates in', path.relative(appRoot, OUT));

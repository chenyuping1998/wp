// Frostline ice audio — pure-Node synthesis, 16-bit WAV, no dependencies.
//
//   node design/generate_audio_frost.mjs
//
// Three cues for the freeze takeover (ExpandingWilds.svelte, TAKEOVER 'freeze'),
// which until now borrowed the jungle set's multiplier tick and wild explosion —
// the right shapes made of the wrong material.
//
//   frost_creep   a cell starts icing over. Fires up to four times per takeover,
//                 so it has to be quiet and short or it becomes a drum pattern.
//   ice_freeze    the bed under the whole frost beat: a hiss that tightens and
//                 darkens as the reel cools.
//   ice_crack     the slab setting. One snap, a body, a glassy ring, and a few
//                 settling crackles after it.
//   reel_stop     the ordinary reel-landing knock, which is not a takeover cue
//                 at all but had to be rebuilt here — see section 4.
//
// ── How these are built ──────────────────────────────────────────────────────
//
// Ice is almost entirely NOISE plus a few INHARMONIC high partials. That second
// part is what separates it from a cymbal or a shaker: struck ice rings at
// frequencies with no common fundamental, which is why the partial sets below
// are deliberately not multiples of anything. Pitching them harmonically was the
// first thing tried and it came out as a triangle.
//
// Everything is deterministic — same seed, same bytes — so regenerating does not
// silently change what shipped.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/audio/frost');
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;

let seed = 20260913;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const rand2 = () => rand() * 2 - 1;

const buffer = (dur) => new Float32Array(Math.ceil(dur * SR));

const addAt = (dst, src, offsetSec, gain) => {
	const start = Math.round(offsetSec * SR);
	for (let i = 0; i < src.length && start + i < dst.length; i++) dst[start + i] += src[i] * gain;
};

const normalize = (buf, peak) => {
	let max = 1e-9;
	for (const v of buf) max = Math.max(max, Math.abs(v));
	const g = peak / max;
	for (let i = 0; i < buf.length; i++) buf[i] *= g;
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

// ── filters ─────────────────────────────────────────────────────────────────
//
// A state-variable filter, one sample at a time, because the cutoff has to move
// WITHIN a sound — the creep sweeps up as the crystal forms and the bed sweeps
// down as the reel cools. A fixed-coefficient biquad cannot do that without
// being recomputed per sample anyway, and this is shorter.
const svf = (input, cutoffAt, q = 1.2, mode = 'band') => {
	const out = new Float32Array(input.length);
	let low = 0;
	let band = 0;
	for (let i = 0; i < input.length; i++) {
		const fc = Math.max(20, Math.min(SR * 0.45, cutoffAt(i / input.length)));
		const f = 2 * Math.sin((Math.PI * fc) / SR);
		const damp = 1 / q;
		const high = input[i] - low - damp * band;
		band += f * high;
		low += f * band;
		out[i] = mode === 'band' ? band : mode === 'low' ? low : high;
	}
	return out;
};

const noise = (dur) => {
	const b = buffer(dur);
	for (let i = 0; i < b.length; i++) b[i] = rand2();
	return b;
};

/** Inharmonic ring: a handful of partials with no common fundamental. */
const glassRing = (dur, partials, decay) => {
	const b = buffer(dur);
	for (const [freq, gain, det] of partials) {
		let phase = 0;
		// a second voice a few cents off gives the slow beating real ice has
		let phase2 = 0;
		for (let i = 0; i < b.length; i++) {
			const t = i / SR;
			phase += (2 * Math.PI * freq) / SR;
			phase2 += (2 * Math.PI * freq * (1 + det)) / SR;
			const env = Math.exp(-decay * t);
			b[i] += (Math.sin(phase) + 0.7 * Math.sin(phase2)) * env * gain;
		}
	}
	return b;
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
	console.log('wrote', name, `${(data.length / 1024).toFixed(0)}KB`, `${(n / SR).toFixed(2)}s`);
};

// ── 1. frost_creep ──────────────────────────────────────────────────────────
//
// A cell icing over: a short breathy "tss" whose band climbs as it goes, with
// two tiny crystal pings on top. Quiet on purpose — it fires once per cell.
{
	const DUR = 0.26;
	const out = buffer(DUR);

	// the hiss: noise through a band that sweeps 2.6k -> 6.5k
	const hiss = svf(noise(DUR), (u) => 2600 + 3900 * u, 1.5, 'band');
	for (let i = 0; i < hiss.length; i++) {
		const t = i / SR;
		// fast in, long tail — frost arrives and then keeps spreading
		const env = Math.min(1, t / 0.008) * Math.exp(-11 * t);
		out[i] += hiss[i] * env * 0.9;
	}

	// two pings, slightly apart, so it reads as crystal rather than as air
	addAt(
		out,
		glassRing(0.2, [[5240, 0.5, 0.004], [7130, 0.3, 0.006]], 26),
		0.006,
		0.5,
	);
	addAt(out, glassRing(0.16, [[6310, 0.4, 0.005]], 34), 0.045, 0.32);

	writeWav('frost_creep.wav', fadeEnds(normalize(out, 0.42), 4));
}

// ── 2. ice_freeze ───────────────────────────────────────────────────────────
//
// The bed under the frost beat, matched to FROST_TIMING.frostMs (1150ms) with a
// little tail. Its band falls 5.2k -> 900Hz: the sound of something getting
// denser, which is what the picture is doing.
{
	const DUR = 1.35;
	const out = buffer(DUR);

	const bed = svf(noise(DUR), (u) => 5200 - 4300 * u ** 0.75, 0.9, 'band');
	for (let i = 0; i < bed.length; i++) {
		const t = i / SR;
		// swells in over the first third, holds, then settles as the ice sets
		const swell = Math.min(1, t / 0.42);
		const settle = t < 1.05 ? 1 : Math.exp(-6 * (t - 1.05));
		out[i] += bed[i] * swell * settle * 0.8;
	}

	// a shimmer of high partials drifting down with it, very quiet
	const shimmer = glassRing(DUR, [[4700, 0.25, 0.003], [6150, 0.18, 0.004], [8020, 0.12, 0.005]], 1.6);
	for (let i = 0; i < shimmer.length; i++) {
		const t = i / SR;
		out[i] += shimmer[i] * Math.min(1, t / 0.5) * 0.35;
	}

	writeWav('ice_freeze.wav', fadeEnds(normalize(out, 0.36), 10));
}

// ── 3. ice_crack ────────────────────────────────────────────────────────────
//
// The slab setting. Four parts, and the order matters more than any of them:
// the snap has to be first and everything else has to be clearly after it, or
// it reads as a bang rather than as something breaking.
{
	const DUR = 0.95;
	const out = buffer(DUR);

	// (a) the snap — 4ms of broadband, highpassed so it is a crack and not a thud
	const snap = svf(noise(0.02), () => 1800, 0.7, 'high');
	for (let i = 0; i < snap.length; i++) {
		const t = i / SR;
		snap[i] *= Math.exp(-260 * t);
	}
	addAt(out, snap, 0, 1);

	// (b) the body — the mass of ice behind the crack. Pitch drops fast; without
	//     this the snap has no size and could be a twig.
	{
		const body = buffer(0.4);
		let phase = 0;
		for (let i = 0; i < body.length; i++) {
			const t = i / SR;
			const f = 150 * Math.exp(-9 * t) + 62;
			phase += (2 * Math.PI * f) / SR;
			body[i] = Math.sin(phase) * Math.exp(-9.5 * t);
		}
		addAt(out, body, 0.001, 0.75);
	}

	// (c) the ring — inharmonic, and the longest-lived part. This is the one that
	//     says ICE: a struck sheet keeps singing after it has split.
	addAt(
		out,
		glassRing(
			0.8,
			[
				[1870, 0.34, 0.0022],
				[2740, 0.26, 0.0031],
				[3910, 0.2, 0.0027],
				[5480, 0.12, 0.0035],
			],
			5.2,
		),
		0.004,
		0.9,
	);

	// (d) the settling — six small fractures scattered after the main one, each a
	//     few ms of high noise. Deterministic offsets, so the cue is the same
	//     every spin; a crack that lands somewhere new each time reads as a glitch
	//     by the fifteenth free spin.
	for (let k = 0; k < 6; k++) {
		const at = 0.07 + k * 0.055 + rand() * 0.035;
		const dur = 0.012 + rand() * 0.02;
		const tick = svf(noise(dur), () => 2600 + rand() * 2400, 1.1, 'band');
		for (let i = 0; i < tick.length; i++) tick[i] *= Math.exp(-((i / SR) / (dur * 0.3)));
		addAt(out, tick, at, 0.3 - k * 0.035);
	}

	writeWav('ice_crack.wav', fadeEnds(normalize(out, 0.9), 8));
}

// ── 4. reel_stop ────────────────────────────────────────────────────────────
//
// NOT CURRENTLY WIRED TO ANYTHING. Sound.svelte points `reel_stop` back at
// jungle/reel_stop.wav — Go Bananas 100's pitched drum — because that is what was
// wanted in the end. Kept because the analysis below is the reason the first
// attempt at this failed, and because re-enabling it is one line in CN_SFX_FILES.
// The written file is deleted after generating unless it is being used.
//
// A flat, low roller impact. This was to replace jungle/reel_stop.wav, and the reason
// it had to be replaced rather than re-pitched is worth writing down.
//
// The jungle sample is bongo(): a sine whose frequency GLIDES from 420 Hz down
// to 300 Hz. It is a tuned drum with a pitch bend baked into it. So when the
// five reel stops were collapsed onto the single lowest variant, the rise
// between reels went away but each individual stop still swooped — the "low to
// high" was inside the sample, not in the choice of sample. Changing which one
// played could never have fixed it.
//
// What a detent actually sounds like: a contact transient, then a very short
// low body, then nothing. So:
//
//   (a) the contact   3ms of band noise around 1.6kHz — the mechanical click
//   (b) the body      a FIXED 78Hz, decayed so hard only about three cycles
//                     survive. Fixed frequency and few cycles is what makes it
//                     read as a thump instead of a note; a glide of any size
//                     reads as pitch, which is the thing being removed.
//   (c) the knock     a fixed 190Hz with an even faster decay, for the housing
//                     the roller hits
//
// Short on purpose (0.15s): five of these land inside about a second, and
// anything with a tail turns that into mud.
{
	const DUR = 0.15;
	const out = buffer(DUR);

	// (a) the contact
	const click = svf(noise(0.012), () => 1600, 0.9, 'band');
	for (let i = 0; i < click.length; i++) click[i] *= Math.exp(-((i / SR) / 0.0016));
	addAt(out, click, 0, 0.5);

	// (b) the body — no glide
	{
		const body = buffer(0.12);
		let phase = 0;
		for (let i = 0; i < body.length; i++) {
			const t = i / SR;
			phase += (2 * Math.PI * 78) / SR;
			body[i] = Math.sin(phase) * Math.exp(-34 * t);
		}
		addAt(out, body, 0.0008, 1);
	}

	// (c) the knock
	{
		const knock = buffer(0.06);
		let phase = 0;
		for (let i = 0; i < knock.length; i++) {
			const t = i / SR;
			phase += (2 * Math.PI * 190) / SR;
			knock[i] = Math.sin(phase) * Math.exp(-70 * t);
		}
		addAt(out, knock, 0.0008, 0.45);
	}

	writeWav('reel_stop.wav', fadeEnds(normalize(out, 0.72), 3));
}

console.log('frost audio written to', path.relative(appRoot, OUT));

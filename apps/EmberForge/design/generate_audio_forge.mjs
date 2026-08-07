// Ember Forge audio — pure-Node synthesis, 16-bit WAV, no dependencies.
//
// The palette is a working smithy: struck anvil and bar stock, hammer taps,
// quench hiss, bellows swell, and a low furnace roar under the music. Metal is
// what makes this set sound like a forge rather than generic casino brass, and
// metal means INHARMONIC partials — a struck bar's overtones are not integer
// multiples of its fundamental. Using a harmonic stack here would produce a
// bell-like church tone, which is the wrong room entirely.
//
// File names are deliberately identical to the set Sound.svelte already maps,
// so switching themes is a directory change and nothing else.
//
// Usage: node design/generate_audio_forge.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/audio/forge');
fs.mkdirSync(OUT, { recursive: true });

const SR_SFX = 44100;
const SR_BGM = 22050;

// ─── plumbing (deterministic PRNG so regeneration is reproducible) ───────────
let seed = 20260802;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const rand2 = () => rand() * 2 - 1;

const buffer = (dur, sr) => new Float32Array(Math.ceil(dur * sr));

const addAt = (dst, src, offsetSec, gain, sr) => {
	const start = Math.round(offsetSec * sr);
	for (let i = 0; i < src.length && start + i < dst.length; i++) {
		if (start + i >= 0) dst[start + i] += src[i] * gain;
	}
};

const normalize = (buf, peak = 0.85) => {
	let max = 1e-9;
	for (const v of buf) max = Math.max(max, Math.abs(v));
	const g = peak / max;
	for (let i = 0; i < buf.length; i++) buf[i] *= g;
	return buf;
};

/**
 * Normalise by LOUDNESS, not by peak.
 *
 * Peak normalisation is right for a one-shot, where the peak IS the event. It is
 * wrong for a sustained bed with transients on top: the crackle sets the peak and
 * the bed it is riding on ends up far below it. The fire bed came out at -27dB
 * RMS with a 0.92 peak that way — thirteen decibels under the sfx that play over
 * it, which is the same "where is the music" problem in a new costume.
 *
 * Soft-clips rather than hard-limits so the transients survive the gain.
 */
const rmsNormalize = (buf, target = 0.14) => {
	let sum = 0;
	for (const v of buf) sum += v * v;
	const rms = Math.sqrt(sum / buf.length) || 1e-9;
	const gain = target / rms;
	for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * gain);
	return buf;
};

const fadeEnds = (buf, sr, ms = 6) => {
	const n = Math.min(buf.length >> 1, Math.round((ms / 1000) * sr));
	for (let i = 0; i < n; i++) {
		const g = i / n;
		buf[i] *= g;
		buf[buf.length - 1 - i] *= g;
	}
	return buf;
};

/** One-pole low-pass. Cheap, and the only filter this set needs. */
const lowpass = (buf, sr, cutoff) => {
	const dt = 1 / sr;
	const rc = 1 / (2 * Math.PI * cutoff);
	const a = dt / (rc + dt);
	let prev = 0;
	for (let i = 0; i < buf.length; i++) {
		prev += a * (buf[i] - prev);
		buf[i] = prev;
	}
	return buf;
};

/** One-pole high-pass, for taking body out of hiss. */
const highpass = (buf, sr, cutoff) => {
	const dt = 1 / sr;
	const rc = 1 / (2 * Math.PI * cutoff);
	const a = rc / (rc + dt);
	let prevIn = 0;
	let prevOut = 0;
	for (let i = 0; i < buf.length; i++) {
		const x = buf[i];
		prevOut = a * (prevOut + x - prevIn);
		prevIn = x;
		buf[i] = prevOut;
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
	console.log('wrote', name, (data.length / 1024).toFixed(1) + ' KB');
};

// ─── instruments ────────────────────────────────────────────────────────────

// Inharmonic ratios measured off struck steel bar stock. Not integers: that is
// the whole point, and swapping them for a harmonic series turns the anvil into
// a church bell.
const METAL_RATIOS = [1, 2.76, 5.4, 8.93, 13.34, 18.64];

/**
 * A struck metal bar. `bright` controls how much of the upper inharmonic content
 * survives — a light tap keeps little, a full anvil strike keeps a lot.
 */
const strike = (sr, { freq = 320, dur = 1.1, bright = 1, decay = 1, click = true } = {}) => {
	const buf = buffer(dur, sr);
	METAL_RATIOS.forEach((ratio, index) => {
		const partialFreq = freq * ratio;
		if (partialFreq > sr / 2) return;
		// Higher partials die faster; that difference over time is what makes a
		// strike sound struck rather than sustained.
		const life = (dur * decay) / (1 + index * 1.35);
		const amp = (1 / (1 + index * 1.6)) * (index === 0 ? 1 : bright);
		const detune = 1 + rand2() * 0.004;
		for (let i = 0; i < buf.length; i++) {
			const t = i / sr;
			buf[i] += Math.sin(2 * Math.PI * partialFreq * detune * t) * amp * Math.exp(-t / life);
		}
	});
	// Contact noise: the instant of impact, before the bar starts ringing.
	//
	// Switchable, because it does not survive repetition. One hit needs it — it is
	// the attack, and without it the strike sounds synthesised. A music bed plays
	// several hundred of them per loop, and several hundred 6ms noise bursts add
	// up to a continuous sandy layer under the whole feature. `click: false` is
	// what the beds use.
	if (click) {
		const clickLen = Math.round(sr * 0.006);
		for (let i = 0; i < clickLen && i < buf.length; i++) {
			buf[i] += rand2() * 0.5 * (1 - i / clickLen);
		}
	}
	return buf;
};

/** A sine under a percussive envelope: low end with no noise anywhere in it. */
const pedal = (sr, freq, dur, decay = 0.55) => {
	const buf = buffer(dur, sr);
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		buf[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / (dur * decay));
	}
	return buf;
};

/**
 * Make a loop seamless by wrapping its tail back over its head.
 *
 * Generate `loopSec + xfSec` of material and hand it here. Because index 0 ends
 * up holding what index `loopSec` held, the join plays two samples that were
 * already adjacent in the source — continuous by construction rather than by
 * fading, which is what `fadeEnds` on a loop does and why that pumps.
 */
const sealLoop = (buf, sr, loopSec, xfSec) => {
	const xf = Math.round(xfSec * sr);
	const loop = Math.round(loopSec * sr);
	for (let i = 0; i < xf; i++) {
		const t = i / xf;
		buf[i] = buf[i] * t + buf[loop + i] * (1 - t);
	}
	return buf.slice(0, loop);
};

/** Quench hiss — hot metal into water. Filtered noise with a fast attack. */
const quench = (sr, { dur = 0.7, cutoff = 5200 } = {}) => {
	const buf = buffer(dur, sr);
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const env = Math.min(1, t / 0.012) * Math.exp(-t / (dur * 0.32));
		buf[i] = rand2() * env;
	}
	highpass(buf, sr, 900);
	lowpass(buf, sr, cutoff);
	return buf;
};

/** Bellows / forge draught — a slow noise swell with a low body. */
const bellows = (sr, { dur = 1.4, peak = 0.55 } = {}) => {
	const buf = buffer(dur, sr);
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const p = t / dur;
		// asymmetric: draws in quickly, releases slowly
		const env = Math.sin(Math.PI * Math.pow(p, 0.7)) * peak;
		buf[i] = rand2() * env;
	}
	lowpass(buf, sr, 1400);
	lowpass(buf, sr, 900);
	return buf;
};

/**
 * Fire. Three layers, because a single noise band reads as static hiss:
 *   · a low roaring body that swells and falls
 *   · a mid whoosh whose filter opens as the flame front passes
 *   · sparse high crackle transients riding on top
 * The crackle is what actually makes it read as FIRE rather than as wind.
 */
const fireBurst = (sr, { dur = 1.6, intensity = 1, shape = 'burst' } = {}) => {
	const buf = buffer(dur, sr);
	const swell = shape === 'swell';

	// body: low roar.
	//
	// 'burst' hits at once and decays — the furnace door giving way. 'swell'
	// builds and falls, which is what the opening needs: there the flame front
	// climbs for two thirds of the shot, and a front-loaded blast peaks while the
	// screen is still dark and is already dying when the fire fills it.
	const body = buffer(dur, sr);
	for (let i = 0; i < body.length; i++) {
		const t = i / sr;
		const p = t / dur;
		body[i] =
			rand2() *
			(swell
				? Math.sin(Math.PI * Math.pow(p, 0.8))
				: Math.min(1, t / 0.05) * Math.exp(-p * 2.2));
	}
	lowpass(body, sr, 420);
	addAt(buf, body, 0, 0.9 * intensity, sr);

	// whoosh: the flame front arriving, brightening as it comes
	const whoosh = buffer(dur * 0.7, sr);
	for (let i = 0; i < whoosh.length; i++) {
		const t = i / sr;
		const p = t / (dur * 0.7);
		whoosh[i] = rand2() * Math.sin(Math.PI * Math.pow(p, 0.6));
	}
	lowpass(whoosh, sr, 2600);
	highpass(whoosh, sr, 300);
	addAt(buf, whoosh, 0.02, 0.75 * intensity, sr);

	// crackle: short bright ticks, denser at the peak — which moves with the shape
	for (let n = 0; n < Math.round(60 * intensity); n++) {
		const at = swell ? dur * (0.12 + 0.76 * rand()) : Math.pow(rand(), 0.7) * dur * 0.8;
		const len = Math.round(sr * (0.004 + rand() * 0.012));
		const tick = new Float32Array(len);
		for (let i = 0; i < len; i++) tick[i] = rand2() * Math.exp(-(i / len) * 6);
		highpass(tick, sr, 2200);
		addAt(buf, tick, at, 0.35 * intensity * (0.4 + rand()), sr);
	}

	return buf;
};

/** Low furnace roar for the music beds. */
const roar = (sr, dur, level = 0.3) => {
	const buf = buffer(dur, sr);
	for (let i = 0; i < buf.length; i++) buf[i] = rand2();
	lowpass(buf, sr, 220);
	lowpass(buf, sr, 160);
	for (let i = 0; i < buf.length; i++) {
		// slow breathing so the bed is never perfectly static
		const t = i / sr;
		buf[i] *= level * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.13 * t));
	}
	return buf;
};

/** Struck bar note for melodies — same metal, gentler. */
const barNote = (sr, freq, dur) => strike(sr, { freq, dur, bright: 0.35, decay: 0.9 });

// ─── one-shots ──────────────────────────────────────────────────────────────

// reel_stop — a hammer tap on the anvil face. Short, dry, no ring-out: this
// fires up to seven times in half a second and any tail would smear into mush.
writeWav(
	'reel_stop.wav',
	fadeEnds(normalize(strike(SR_SFX, { freq: 430, dur: 0.19, bright: 0.5, decay: 0.35 }), 0.62), SR_SFX),
	SR_SFX,
);

// btn — a very light tap, pitched up and even shorter
writeWav(
	'btn.wav',
	fadeEnds(normalize(strike(SR_SFX, { freq: 720, dur: 0.1, bright: 0.35, decay: 0.25 }), 0.4), SR_SFX),
	SR_SFX,
);

// spin — the bellows drawing breath as a new board drops
writeWav('spin.wav', fadeEnds(normalize(bellows(SR_SFX, { dur: 0.62 }), 0.7), SR_SFX), SR_SFX);

// scatter_1..5 — a heavy forge mark being set. Each one a step up the scale, so
// counting scatters stays audible without looking.
//
// Deliberately LOW and dark. These used to ring at 300-566Hz with bright 0.85,
// which is the same register as the tumble strike — and the tumble strike was
// literally playing scatter_1.wav, so a scatter landing and a cluster paying
// were the identical sound. A scatter is the rarest thing on the board and the
// only symbol that opens the feature; it should land like something heavy being
// dropped on the anvil, not like another win chiming.
//
// Base drops an octave to 150Hz, the partials are pulled well back (bright 0.3
// leaves the fundamental dominant instead of the inharmonic shimmer), decay runs
// longer so it tolls rather than clicks, and a sub thump sits underneath. The
// quench hiss is cut right down — that was most of the brightness.
[0, 2, 4, 7, 11].forEach((semitones, index) => {
	const freq = 150 * Math.pow(2, semitones / 12);
	const buf = strike(SR_SFX, { freq, dur: 1.9, bright: 0.3, decay: 1.6 });
	// sub thump under the strike: the weight of the thing landing
	addAt(buf, strike(SR_SFX, { freq: freq * 0.5, dur: 0.9, bright: 0.12, decay: 0.8 }), 0, 0.5, SR_SFX);
	addAt(buf, quench(SR_SFX, { dur: 0.22, cutoff: 2600 }), 0, 0.1, SR_SFX);
	lowpass(buf, SR_SFX, 3200);
	writeWav(`scatter_${index + 1}.wav`, fadeEnds(normalize(buf, 0.78), SR_SFX), SR_SFX);
});

// chain_hit — one link of a tumble chain paying.
//
// Its own file now. It used to borrow scatter_1.wav, which is why the scatter
// and the win sounded the same; Sound.svelte pitches this up a semitone per link
// so a long chain climbs, and that ladder needs a short bright sample with no
// tail to smear into the next link.
{
	const buf = strike(SR_SFX, { freq: 420, dur: 0.55, bright: 1, decay: 0.5 });
	addAt(buf, quench(SR_SFX, { dur: 0.16, cutoff: 8000 }), 0, 0.28, SR_SFX);
	writeWav('chain_hit.wav', fadeEnds(normalize(buf, 0.7), SR_SFX), SR_SFX);
}

// pluck_low — a dull thud on cold stock
writeWav(
	'pluck_low.wav',
	fadeEnds(normalize(strike(SR_SFX, { freq: 160, dur: 0.7, bright: 0.25, decay: 0.6 }), 0.68), SR_SFX),
	SR_SFX,
);

// win_gliss — a run up the bar stock, small win
{
	const buf = buffer(1.0, SR_SFX);
	[0, 3, 5, 8, 12].forEach((st, i) => {
		addAt(buf, barNote(SR_SFX, 340 * Math.pow(2, st / 12), 0.75), i * 0.07, 0.7, SR_SFX);
	});
	writeWav('win_gliss.wav', fadeEnds(normalize(buf, 0.72), SR_SFX), SR_SFX);
}

// win_gliss_big — longer run, ending on a full anvil strike
{
	const buf = buffer(2.0, SR_SFX);
	[0, 3, 5, 8, 12, 15, 17, 20].forEach((st, i) => {
		addAt(buf, barNote(SR_SFX, 300 * Math.pow(2, st / 12), 1.1), i * 0.075, 0.62, SR_SFX);
	});
	addAt(buf, strike(SR_SFX, { freq: 300, dur: 1.4, bright: 1, decay: 1.3 }), 0.66, 0.9, SR_SFX);
	writeWav('win_gliss_big.wav', fadeEnds(normalize(buf, 0.82), SR_SFX), SR_SFX);
}

// gong_feature — the feature opening. The single biggest moment in the game.
//
// This was one anvil strike left to ring: the event fired, and then nothing
// happened for the remaining three seconds the handler holds. Landing the
// feature is the thing every spin is for, and it sounded like a doorbell.
//
// Built as an EVENT with three parts instead, over the 3s the handler holds:
//   0.00-1.15  the forge winds up — hammer blows accelerating up the scale, a
//              draught rising underneath. The accelerando is what makes it read
//              as building rather than as a countdown.
//   1.15       the hit: three detuned strikes an octave down from the old one,
//              so it is felt rather than heard, plus the furnace letting go
//   1.15-3.4   the ring, with the fire still roaring under it
{
	const dur = 3.4;
	const HIT = 1.15;
	const buf = buffer(dur, SR_SFX);

	// ── wind-up: blows accelerating and climbing ──
	// Spacing shrinks geometrically toward the hit, which is what an accelerando
	// is; spacing them evenly and just raising the pitch reads as a countdown,
	// and a countdown tells the player how long they have to wait.
	{
		const blows = 11;
		let at = 0.04;
		let gap = 0.2;
		for (let i = 0; i < blows; i++) {
			const p = i / (blows - 1);
			addAt(
				buf,
				strike(SR_SFX, {
					freq: 300 * Math.pow(2, p * 0.9),
					dur: 0.34,
					bright: 0.5 + 0.4 * p,
					decay: 0.3,
				}),
				at,
				0.16 + 0.3 * p,
				SR_SFX,
			);
			at += gap;
			gap *= 0.82;
		}
	}
	// draught pulling in behind the blows, peaking at the hit
	addAt(buf, bellows(SR_SFX, { dur: HIT + 0.15, peak: 0.95 }), 0, 0.6, SR_SFX);

	// ── the hit ──
	// An octave below the old 128Hz. Three partials slightly detuned against each
	// other so the strike beats rather than sitting on one dead pitch.
	addAt(buf, strike(SR_SFX, { freq: 64, dur: 2.3, bright: 0.9, decay: 2.2 }), HIT, 1, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 96.6, dur: 2.1, bright: 1, decay: 2 }), HIT + 0.008, 0.75, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 129.4, dur: 1.8, bright: 0.85, decay: 1.7 }), HIT + 0.016, 0.5, SR_SFX);
	// the furnace letting go at the same instant
	addAt(buf, fireBurst(SR_SFX, { dur: 2.0, intensity: 1 }), HIT - 0.03, 0.85, SR_SFX);
	addAt(buf, quench(SR_SFX, { dur: 1.1, cutoff: 5200 }), HIT + 0.02, 0.35, SR_SFX);

	// ── aftermath: the room still roaring under the ring ──
	{
		const tail = buffer(dur - HIT, SR_SFX);
		for (let i = 0; i < tail.length; i++) tail[i] = rand2();
		lowpass(tail, SR_SFX, 340);
		for (let i = 0; i < tail.length; i++) {
			const t = i / SR_SFX;
			tail[i] *= Math.exp(-t / 1.1);
		}
		addAt(buf, tail, HIT, 0.5, SR_SFX);
	}

	writeWav('gong_feature.wav', fadeEnds(normalize(buf, 0.95), SR_SFX), SR_SFX);
}

// fs_intro — furnace door opening: bellows swell into a struck chord
{
	const buf = buffer(2.6, SR_SFX);
	addAt(buf, bellows(SR_SFX, { dur: 1.3, peak: 0.8 }), 0, 0.8, SR_SFX);
	[0, 7, 12].forEach((st, i) => {
		addAt(buf, strike(SR_SFX, { freq: 220 * Math.pow(2, st / 12), dur: 1.6, bright: 0.7, decay: 1.4 }), 0.9 + i * 0.05, 0.7, SR_SFX);
	});
	writeWav('fs_intro.wav', fadeEnds(normalize(buf, 0.84), SR_SFX), SR_SFX);
}

// bigwin_blast — a flame jet opening up under the plaque.
//
// Was a hammer blow: draught, impact, ring, done in under a second of useful
// sound. An impact is the wrong gesture for a plaque that SITS there — it fires
// once at the top and leaves the rest of the presentation in silence.
//
// This is a jet instead, and its shape is the whole point: it starts as a thin
// pilot hiss, the valve opens, and it arrives heavy. Three things move together
// over the ramp, because opening a valve does all three at once:
//   · level, on a curve rather than a line, so it reads as accelerating
//   · brightness — the jet band widens as the flow rises
//   · body, which only appears once there is enough flow to carry it
//
// 3.0s, with the heavy part landing at ~1.4s: inside even the shortest big-win
// plaque (1.6s), so every tier gets the arrival and the longer ones get the
// tail as well.
{
	const dur = 3.0;
	const PEAK = 1.4; // where the jet is fully open
	const buf = buffer(dur, SR_SFX);

	// ── the jet: two noise bands cross-faded as the valve opens ──
	const thin = buffer(dur, SR_SFX);
	const wide = buffer(dur, SR_SFX);
	for (let i = 0; i < thin.length; i++) {
		const n = rand2();
		thin[i] = n;
		wide[i] = n;
	}
	// thin = the pilot: narrow, hissy, no body
	highpass(thin, SR_SFX, 2600);
	// wide = full flow: everything from the low roar up
	lowpass(wide, SR_SFX, 3200);
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		// ramp accelerates into the peak, then holds and falls away
		const ramp = t < PEAK ? Math.pow(t / PEAK, 1.8) : 1 - 0.55 * ((t - PEAK) / (dur - PEAK)) ** 1.4;
		const open = Math.min(1, t / PEAK);
		const level = 0.1 + 0.9 * ramp;
		buf[i] += (thin[i] * (1 - open) + wide[i] * open) * level * 0.85;
	}

	// ── low body: only once there is flow behind it ──
	const body = buffer(dur, SR_SFX);
	for (let i = 0; i < body.length; i++) body[i] = rand2();
	lowpass(body, SR_SFX, 260);
	lowpass(body, SR_SFX, 180);
	for (let i = 0; i < body.length; i++) {
		const t = i / SR_SFX;
		const arrive = Math.min(1, Math.max(0, (t - PEAK * 0.45) / (PEAK * 0.55)));
		body[i] *= arrive * (t < PEAK ? 1 : 1 - 0.5 * ((t - PEAK) / (dur - PEAK)));
	}
	addAt(buf, body, 0, 0.9, SR_SFX);

	// ── ignition at the moment it opens, and crackle that thickens with the flow ──
	addAt(buf, fireBurst(SR_SFX, { dur: 1.6, intensity: 1 }), PEAK - 0.12, 0.7, SR_SFX);
	for (let n = 0; n < 90; n++) {
		// biased late: a bigger flame throws more sparks
		const at = Math.pow(rand(), 0.55) * (dur - 0.2);
		const len = Math.round(SR_SFX * (0.004 + rand() * 0.014));
		const tick = new Float32Array(len);
		for (let i = 0; i < len; i++) tick[i] = rand2() * Math.exp(-(i / len) * 6);
		highpass(tick, SR_SFX, 2200);
		addAt(buf, tick, at, 0.16 + 0.3 * Math.min(1, at / PEAK), SR_SFX);
	}

	// the anvil still rings underneath, so the flame belongs to THIS forge
	addAt(buf, strike(SR_SFX, { freq: 110, dur: 1.8, bright: 0.7, decay: 1.6 }), PEAK - 0.06, 0.5, SR_SFX);

	writeWav('bigwin_blast.wav', fadeEnds(normalize(buf, 0.94), SR_SFX, 6), SR_SFX);
}

// coin_shimmer — the loop under a big win and under the free-game total.
//
// Was 26 taps per 2.4s at 1500-3100Hz: a bright, fast sparkle. Wrong instrument
// for this game twice over. The pitch put it in the same register as a wind
// chime, and the rate made it busy — under the free-game total, which is the
// slowest, heaviest moment in the round, it sounded like something being
// scattered rather than poured.
//
// Now it is bullion landing: low, dull, and slow. Three changes, all pulling the
// same way — an octave and a half down (200-560Hz), bright dropped to 0.28 so
// the inharmonic partials stay quiet and each hit thuds instead of rings, and
// the rate roughly halved with the spacing made uneven so it pours rather than
// ticks. A low furnace bed underneath replaces the bellows hiss.
{
	const dur = 3.4;
	const XF = 0.6;
	const total = dur + XF;
	const buf = buffer(total, SR_SFX);

	// low bed: the weight the coins are landing into
	const bed = buffer(total, SR_SFX);
	for (let i = 0; i < bed.length; i++) bed[i] = rand2();
	lowpass(bed, SR_SFX, 260);
	lowpass(bed, SR_SFX, 190);
	addAt(buf, bed, 0, 0.4, SR_SFX);

	// coins: uneven spacing, so it pours instead of ticking
	let at = 0.02;
	while (at < total) {
		const freq = 200 + rand() * 360;
		addAt(
			buf,
			strike(SR_SFX, { freq, dur: 0.5, bright: 0.28, decay: 0.34 }),
			at,
			0.3 + rand() * 0.25,
			SR_SFX,
		);
		// heavier pieces land now and then and take a beat longer to settle
		if (rand() < 0.22) {
			addAt(
				buf,
				strike(SR_SFX, { freq: freq * 0.55, dur: 0.8, bright: 0.18, decay: 0.6 }),
				at + 0.01,
				0.28,
				SR_SFX,
			);
		}
		at += 0.13 + rand() * 0.16;
	}

	lowpass(buf, SR_SFX, 3200);

	// Seamless loop by wrap-around crossfade, the same way the free-game bed is
	// built. fadeEnds was used here before, which on a LOOP is a dip to silence
	// on every cycle — audible as a pulse once it has gone round three times.
	const xf = Math.round(XF * SR_SFX);
	const loop = Math.round(dur * SR_SFX);
	for (let i = 0; i < xf; i++) {
		const t = i / xf;
		buf[i] = buf[i] * t + buf[loop + i] * (1 - t);
	}
	writeWav('coin_shimmer.wav', rmsNormalize(buf.slice(0, loop), 0.16), SR_SFX);
}

// reel_tension — anticipation loop: rising draught with a tremolo edge
{
	const dur = 1.6;
	const buf = buffer(dur, SR_SFX);
	for (let i = 0; i < buf.length; i++) {
		const t = i / SR_SFX;
		const trem = 0.6 + 0.4 * Math.sin(2 * Math.PI * 11 * t);
		buf[i] = rand2() * trem;
	}
	lowpass(buf, SR_SFX, 2600);
	highpass(buf, SR_SFX, 300);
	writeWav('reel_tension.wav', fadeEnds(normalize(buf, 0.6), SR_SFX, 12), SR_SFX);
}

// wild_expand — kept under its old name; here it is the molten wild landing:
// a heavy quench followed by a low ring.
{
	const buf = buffer(1.6, SR_SFX);
	addAt(buf, quench(SR_SFX, { dur: 0.9, cutoff: 5600 }), 0, 0.9, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 150, dur: 1.4, bright: 0.6, decay: 1.1 }), 0.05, 0.7, SR_SFX);
	writeWav('wild_expand.wav', fadeEnds(normalize(buf, 0.82), SR_SFX), SR_SFX);
}

// mult_update — a grid position gaining heat. Tiny, bright, and used often
// enough that anything longer would clutter a tumble chain.
{
	const buf = buffer(0.34, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 980, dur: 0.3, bright: 0.6, decay: 0.24 }), 0, 0.8, SR_SFX);
	addAt(buf, quench(SR_SFX, { dur: 0.18, cutoff: 8000 }), 0, 0.35, SR_SFX);
	writeWav('mult_update.wav', fadeEnds(normalize(buf, 0.58), SR_SFX), SR_SFX);
}

// grenade_blast — kept under its old name (Sound.svelte maps soundTransitionBlast
// to it); this is the free-game transition. The picture is the furnace being
// opened and its fire taking the screen, so the sound is FIRE with a single
// impact under it to give the flame front something to launch off — a bare
// hammer blow, which is what this used to be, described the old transition and
// no longer matches anything on screen.
{
	const buf = buffer(2.2, SR_SFX);
	// the door gives
	addAt(buf, strike(SR_SFX, { freq: 92, dur: 1.1, bright: 0.8, decay: 0.9 }), 0, 0.55, SR_SFX);
	// draught pulling in before the release
	addAt(buf, bellows(SR_SFX, { dur: 0.5, peak: 0.8 }), 0, 0.5, SR_SFX);
	// the fire itself, arriving just after the impact
	addAt(buf, fireBurst(SR_SFX, { dur: 1.9, intensity: 1 }), 0.1, 1, SR_SFX);
	writeWav('grenade_blast.wav', fadeEnds(normalize(buf, 0.95), SR_SFX, 4), SR_SFX);
}

// fire_sweep — the opening.
//
// Separate from grenade_blast because the two shots are not the same event. The
// transition is a door giving way and fire covering the screen; the opening has
// no door at all any more, it is a flare that CLEARS to reveal the board. Firing
// the transition's cue there put a 92Hz impact against nothing on screen and ran
// 2.2s of tail past a 1.5s picture, which is the mismatch this fixes.
//
// Length is EntryReveal's TOTAL_MS exactly, and the swell peaks with the flame
// front rather than ahead of it.
{
	const buf = buffer(1.5, SR_SFX);
	// draught first: the fire is being drawn, not detonated
	addAt(buf, bellows(SR_SFX, { dur: 0.45, peak: 0.7 }), 0, 0.45, SR_SFX);
	addAt(buf, fireBurst(SR_SFX, { dur: 1.45, intensity: 0.85, shape: 'swell' }), 0.03, 1, SR_SFX);
	writeWav('fire_sweep.wav', fadeEnds(normalize(buf, 0.82), SR_SFX, 8), SR_SFX);
}

// ─── music beds ─────────────────────────────────────────────────────────────
//
// Both are built from the same material as the sound effects — struck bar and
// furnace roar — so the music and the game never sound like two different
// products. Written at 22.05kHz: these are long files and the content is almost
// entirely below 8kHz anyway.

const scale = (root, degrees) => degrees.map((d) => root * Math.pow(2, d / 12));

// bgm_main — 84 BPM working rhythm. A steady hammer on the beat, a low drone,
// and a sparse minor-key figure over the top.
{
	const bpm = 84;
	const beat = 60 / bpm;
	const bars = 8;
	const dur = beat * 4 * bars;
	const buf = buffer(dur, SR_BGM);

	addAt(buf, roar(SR_BGM, dur, 0.34), 0, 1, SR_BGM);

	// the hammer: on 1 and 3, with a lighter tap on the offbeat
	for (let b = 0; b < bars * 4; b++) {
		const at = b * beat;
		if (b % 2 === 0) {
			addAt(buf, strike(SR_BGM, { freq: 240, dur: 0.5, bright: 0.4, decay: 0.35 }), at, 0.5, SR_BGM);
		} else {
			addAt(buf, strike(SR_BGM, { freq: 300, dur: 0.28, bright: 0.3, decay: 0.2 }), at + beat * 0.5, 0.22, SR_BGM);
		}
	}

	// figure: natural minor, sparse, deliberately unhurried
	const notes = scale(196, [0, 3, 5, 7, 10, 12]);
	const figure = [0, 2, 3, 2, 4, 3, 1, 0];
	for (let bar = 0; bar < bars; bar++) {
		for (let i = 0; i < figure.length; i++) {
			if ((bar + i) % 3 === 0) continue; // leave holes so it breathes
			const at = bar * beat * 4 + i * beat * 0.5;
			addAt(buf, barNote(SR_BGM, notes[figure[i]], 1.0), at, 0.3, SR_BGM);
		}
	}

	writeWav('bgm_main.wav', fadeEnds(normalize(buf, 0.55), SR_BGM, 40), SR_BGM);
}

// bgm_freespin — 168 BPM. The forge driven hard.
//
// Third attempt, and the two failures bracket why this one is shaped as it is.
//
// The first was 138 BPM with an eight-note phrase repeated once per bar, eight
// bars to the loop: the phrase came round eight times before the loop even did,
// and with the tumble sfx putting a hammer on every clear it read as one short
// sample stuck on repeat.
//
// The second replaced it with a continuous fire bed. That killed the repetition
// and introduced the opposite fault: broadband noise is a hiss, and a hiss under
// a feature the player sits in for a minute is fatiguing long before it is
// noticeable. Filtering it back only made it a quieter hiss.
//
// So: rhythm, faster than either, and NO broadband noise anywhere. Every voice
// is a sine or a struck bar, and the strikes are built with `click: false` —
// that 6ms contact burst is right for one hit and is a continuous sand layer
// when a bed plays several hundred of them.
//
// The drive is a sixteenth-note pulse on a TONAL bass rather than a percussion
// bed, metal only on the backbeat so it punctuates instead of filling, and four
// rotating phrases over sixteen bars so nothing recurs before the loop does.
{
	const bpm = 168;
	const beat = 60 / bpm;
	const bars = 16;
	const loopSec = beat * 4 * bars;
	const XF = beat * 2;
	const buf = buffer(loopSec + XF, SR_BGM);

	// sixteenth pulse: the engine
	for (let s = 0; s < (bars + 2) * 16; s++) {
		const at = s * beat * 0.25;
		const strong = s % 16 % 4 === 0;
		addAt(buf, pedal(SR_BGM, strong ? 49 : 98, beat * (strong ? 0.9 : 0.4), 0.4), at, strong ? 0.6 : 0.22, SR_BGM);
	}

	// metal on the backbeat only, with a heavier turnaround every fourth bar
	for (let bar = 0; bar < bars + 2; bar++) {
		for (const off of [1, 3]) {
			addAt(
				buf,
				strike(SR_BGM, { freq: 262, dur: 0.42, bright: 0.5, decay: 0.34, click: false }),
				bar * beat * 4 + off * beat,
				0.5,
				SR_BGM,
			);
		}
		if (bar % 4 === 3) {
			addAt(
				buf,
				strike(SR_BGM, { freq: 175, dur: 0.8, bright: 0.6, decay: 0.7, click: false }),
				bar * beat * 4 + 3.5 * beat,
				0.55,
				SR_BGM,
			);
		}
	}

	// four phrases in rotation — the fix for the original's one-bar loop
	const notes = scale(523, [0, 3, 5, 7, 10, 12]);
	const phrases = [
		[0, 2, 3, 2, 5, 3, 2, 0],
		[3, 5, 4, 2, 0, 2, 3, 5],
		[5, 3, 2, 4, 5, 2, 3, 0],
		[2, 0, 3, 5, 2, 4, 3, 2],
	];
	for (let bar = 0; bar < bars + 2; bar++) {
		const figure = phrases[bar % phrases.length];
		for (let i = 0; i < figure.length; i++) {
			addAt(
				buf,
				strike(SR_BGM, { freq: notes[figure[i]], dur: 0.5, bright: 0.26, decay: 0.7, click: false }),
				bar * beat * 4 + i * beat * 0.5 + beat * 0.25,
				0.24,
				SR_BGM,
			);
		}
	}

	// No fadeEnds: this file is looped, and fading its ends is a dip to silence
	// on every cycle.
	writeWav('bgm_freespin.wav', rmsNormalize(sealLoop(buf, SR_BGM, loopSec, XF), 0.15), SR_BGM);
}

console.log('\nforge audio written to', OUT);

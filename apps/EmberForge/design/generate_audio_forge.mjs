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
const strike = (sr, { freq = 320, dur = 1.1, bright = 1, decay = 1 } = {}) => {
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
	const clickLen = Math.round(sr * 0.006);
	for (let i = 0; i < clickLen && i < buf.length; i++) {
		buf[i] += rand2() * 0.5 * (1 - i / clickLen);
	}
	return buf;
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
const fireBurst = (sr, { dur = 1.6, intensity = 1 } = {}) => {
	const buf = buffer(dur, sr);

	// body: low roar, fast attack and a long tail
	const body = buffer(dur, sr);
	for (let i = 0; i < body.length; i++) {
		const t = i / sr;
		const p = t / dur;
		body[i] = rand2() * Math.min(1, t / 0.05) * Math.exp(-p * 2.2);
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

	// crackle: short bright ticks, denser at the peak
	for (let n = 0; n < Math.round(60 * intensity); n++) {
		const at = Math.pow(rand(), 0.7) * dur * 0.8;
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

// scatter_1..5 — the forge mark ringing, each one a step up the scale. Pitch
// climbs so counting scatters is audible without looking.
[0, 2, 4, 7, 11].forEach((semitones, index) => {
	const freq = 300 * Math.pow(2, semitones / 12);
	const buf = strike(SR_SFX, { freq, dur: 1.5, bright: 0.85, decay: 1.15 });
	addAt(buf, quench(SR_SFX, { dur: 0.3, cutoff: 7000 }), 0, 0.22, SR_SFX);
	writeWav(`scatter_${index + 1}.wav`, fadeEnds(normalize(buf, 0.72), SR_SFX), SR_SFX);
});

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

// gong_feature — the big anvil, struck once and left to ring. This is the free
// game bell, and the handler holds three seconds on it.
{
	const buf = buffer(3.4, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 128, dur: 3.2, bright: 1, decay: 2.6 }), 0, 1, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 192, dur: 2.4, bright: 0.8, decay: 2 }), 0.012, 0.5, SR_SFX);
	addAt(buf, quench(SR_SFX, { dur: 0.9, cutoff: 4200 }), 0.02, 0.3, SR_SFX);
	writeWav('gong_feature.wav', fadeEnds(normalize(buf, 0.88), SR_SFX), SR_SFX);
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

// bigwin_blast — the forge going up: draught, impact, ring
{
	const buf = buffer(2.2, SR_SFX);
	addAt(buf, bellows(SR_SFX, { dur: 0.45, peak: 0.9 }), 0, 0.7, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 110, dur: 2, bright: 1, decay: 1.8 }), 0.36, 1, SR_SFX);
	addAt(buf, strike(SR_SFX, { freq: 330, dur: 1.4, bright: 0.9, decay: 1.1 }), 0.38, 0.6, SR_SFX);
	addAt(buf, quench(SR_SFX, { dur: 1.2, cutoff: 6000 }), 0.36, 0.4, SR_SFX);
	writeWav('bigwin_blast.wav', fadeEnds(normalize(buf, 0.9), SR_SFX, 4), SR_SFX);
}

// coin_shimmer — the big-win loop bed. Sparse high taps over a bellows hum, so
// it can cycle for several seconds without becoming irritating.
{
	const dur = 2.4;
	const buf = buffer(dur, SR_SFX);
	addAt(buf, bellows(SR_SFX, { dur, peak: 0.28 }), 0, 0.5, SR_SFX);
	for (let i = 0; i < 26; i++) {
		const at = (i / 26) * dur + rand() * 0.03;
		const freq = 1500 + rand() * 1600;
		addAt(buf, strike(SR_SFX, { freq, dur: 0.28, bright: 0.5, decay: 0.22 }), at, 0.32, SR_SFX);
	}
	// loop-safe: the ends must meet, so fade is short and symmetric
	writeWav('coin_shimmer.wav', fadeEnds(normalize(buf, 0.55), SR_SFX, 12), SR_SFX);
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

// bgm_freespin — 138 BPM. The forge at full tilt.
//
// Rebuilt harder and faster after play-testing: at 116, sharing the base game's
// figure, it sat too close to bgm_main, and the feature is where the tension is
// meant to be. Three things carry that, and none of them is just "louder":
//   · double-time hammer with an accent every bar, so there is a pulse to ride
//     rather than an even stream of hits
//   · a low pedal on the downbeats — the part the chest feels
//   · the melodic figure an octave up and pushed off the beat, so it drives
//     ahead instead of sitting on it
{
	const bpm = 138;
	const beat = 60 / bpm;
	const bars = 8;
	const dur = beat * 4 * bars;
	const buf = buffer(dur, SR_BGM);

	addAt(buf, roar(SR_BGM, dur, 0.46), 0, 1, SR_BGM);

	// hammer: every eighth, accented on the bar
	for (let b = 0; b < bars * 8; b++) {
		const at = b * beat * 0.5;
		const accent = b % 8 === 0;
		const heavy = b % 4 === 0;
		addAt(
			buf,
			strike(SR_BGM, {
				freq: accent ? 190 : heavy ? 240 : 340,
				dur: accent ? 0.6 : heavy ? 0.42 : 0.2,
				bright: accent ? 0.65 : heavy ? 0.5 : 0.3,
				decay: accent ? 0.5 : heavy ? 0.35 : 0.16,
			}),
			at,
			accent ? 0.75 : heavy ? 0.5 : 0.26,
			SR_BGM,
		);
	}

	// low pedal on the downbeats — the drive under everything else
	for (let bar = 0; bar < bars; bar++) {
		for (const off of [0, 2]) {
			const pedal = buffer(beat * 1.6, SR_BGM);
			for (let i = 0; i < pedal.length; i++) {
				const t = i / SR_BGM;
				pedal[i] = Math.sin(2 * Math.PI * 49 * t) * Math.exp(-t / (beat * 0.55));
			}
			addAt(buf, pedal, bar * beat * 4 + off * beat, 0.5, SR_BGM);
		}
	}

	// figure: minor, an octave above the base game, pushed off the beat
	const notes = scale(392, [0, 3, 5, 7, 10, 12]);
	const figure = [0, 3, 5, 4, 2, 5, 3, 1];
	for (let bar = 0; bar < bars; bar++) {
		for (let i = 0; i < figure.length; i++) {
			// every other note lands a sixteenth late, which is what makes it push
			const push = i % 2 === 1 ? beat * 0.25 : 0;
			addAt(buf, barNote(SR_BGM, notes[figure[i]], 0.7), bar * beat * 4 + i * beat * 0.5 + push, 0.3, SR_BGM);
		}
	}

	// a quench hit closing every other bar, as a turnaround
	for (let bar = 1; bar < bars; bar += 2) {
		addAt(buf, quench(SR_BGM, { dur: 0.5, cutoff: 5200 }), (bar + 1) * beat * 4 - beat, 0.45, SR_BGM);
	}

	writeWav('bgm_freespin.wav', fadeEnds(normalize(buf, 0.72), SR_BGM, 40), SR_BGM);
}

console.log('\nforge audio written to', OUT);

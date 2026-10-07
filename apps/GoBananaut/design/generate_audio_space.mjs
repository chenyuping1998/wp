// Go Bananaut space audio — pure-Node synthesis, 16-bit WAV, no dependencies.
//
// Replaces the jungle-commando set. Same 21 file names, written to a new
// directory, so Sound.svelte only changes the folder it points at — that is the
// contract the jungle generator was written to and it is kept here.
//
// WHAT MAKES IT SPACE RATHER THAN JUNGLE, and it is not the reverb:
//
//   TEMPO. 104 BPM to 76. The groove has to be walkable, not danceable — this is
//   a game about things drifting upward, and a fast pulse fights that.
//
//   THE PULSE MOVED TO THE BOTTOM. Jungle carried its groove in the mid range
//   with congas, bongos and a shaker on every eighth. Here it is a sub-bass
//   heartbeat and a sparse electronic tick. Clearing the mid range is what makes
//   room for a pad to sound like space instead of like a keyboard patch.
//
//   MINOR PENTATONIC, not major. C major pentatonic is the sunniest scale there
//   is, which is exactly right for a jungle and exactly wrong here. C minor
//   pentatonic floats and never resolves.
//
//   MARIMBA became an FM BELL. A struck wooden bar is a warm, dry, immediate
//   sound. A bell has inharmonic partials and a long tail, which is what reads as
//   distance.
//
// Usage: node design/generate_audio_space.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/audio/space');
fs.mkdirSync(OUT, { recursive: true });

const SR_SFX = 44100;
const SR_BGM = 22050;

// ─── plumbing (deterministic PRNG so regeneration is reproducible) ───────────
let seed = 20260905;
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

const fadeEnds = (buf, sr, ms = 4) => {
	const n = Math.round((ms / 1000) * sr);
	for (let i = 0; i < n && i < buf.length; i++) {
		buf[i] *= i / n;
		buf[buf.length - 1 - i] *= i / n;
	}
	return buf;
};

const writeWav = (name, buf, sr) => {
	const data = Buffer.alloc(44 + buf.length * 2);
	data.write('RIFF', 0);
	data.writeUInt32LE(36 + buf.length * 2, 4);
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
	data.writeUInt32LE(buf.length * 2, 40);
	for (let i = 0; i < buf.length; i++) {
		const v = Math.max(-1, Math.min(1, buf[i]));
		data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
	}
	fs.writeFileSync(path.join(OUT, name), data);
	console.log('  ', name, (data.length / 1024).toFixed(0) + ' KB');
};

// ─── a resonant low-pass, because a filter sweep is most of this palette ─────
// State-variable, one sample at a time. Cutoff is given per-sample so anything
// here can sweep without a second code path.
const svf = () => {
	let low = 0;
	let band = 0;
	return (x, cutoff, q, sr) => {
		const f = 2 * Math.sin((Math.PI * Math.min(cutoff, sr * 0.45)) / sr);
		const high = x - low - q * band;
		band += f * high;
		low += f * band;
		return low;
	};
};

// ─── instruments ─────────────────────────────────────────────────────────────

// The heartbeat. A sine with a soft attack so it swells rather than thumps, and
// a touch of saturation so it survives small speakers, which cannot reproduce
// the fundamental at all and rely on the harmonics it generates.
const subBass = (freq, dur, sr, drive = 1.6) => {
	const buf = buffer(dur, sr);
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const attack = Math.min(1, t / 0.02);
		const env = attack * Math.exp(-t * (2.2 / dur));
		const s = Math.sin(2 * Math.PI * freq * t);
		buf[i] = Math.tanh(s * drive) * env * 0.9;
	}
	return buf;
};

// Space itself. Three detuned saws through a filter that opens and closes again
// over the note — a static filter reads as a synth patch, a moving one reads as
// something breathing.
const pad = (freq, dur, sr, cutoffPeak = 1400) => {
	const buf = buffer(dur, sr);
	const f = svf();
	const detune = [0.995, 1, 1.006];
	const phase = [0, 0, 0];
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		let s = 0;
		for (let d = 0; d < 3; d++) {
			phase[d] += (freq * detune[d]) / sr;
			phase[d] %= 1;
			s += (phase[d] * 2 - 1) * 0.33; // saw
		}
		const p = t / dur;
		const cutoff = 220 + cutoffPeak * Math.sin(Math.PI * Math.min(1, p * 1.1));
		const env = Math.min(1, t / (dur * 0.35)) * Math.min(1, (dur - t) / (dur * 0.4));
		buf[i] = f(s, cutoff, 1.1, sr) * env;
	}
	return buf;
};

// The melodic voice. FM with an inharmonic ratio: the modulator decays fast so
// the strike is bright and metallic, the carrier rings on so the tail is long.
const glass = (freq, dur, sr, bright = 1) => {
	const buf = buffer(dur, sr);
	const ratio = 3.47; // deliberately not an integer — integers sound like organs
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const modEnv = Math.exp(-t * 18);
		const mod = Math.sin(2 * Math.PI * freq * ratio * t) * modEnv * 5.5 * bright;
		const env = Math.exp(-t * (3.4 / Math.max(0.25, dur)));
		buf[i] = Math.sin(2 * Math.PI * freq * t + mod) * env;
	}
	return buf;
};

// A short filtered-saw pluck, for arpeggios and UI. Dry and close, so it sits in
// front of the pad rather than in it.
const pluckSyn = (freq, dur, sr, cutoff = 2600) => {
	const buf = buffer(dur, sr);
	const f = svf();
	let phase = 0;
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		phase = (phase + freq / sr) % 1;
		const env = Math.exp(-t * (5.5 / Math.max(0.15, dur)));
		const c = 300 + (cutoff - 300) * Math.exp(-t * 9);
		buf[i] = f(phase * 2 - 1, c, 1.35, sr) * env;
	}
	return buf;
};

// Air. Replaces the shaker — the same job, keeping time, but as breath through a
// suit rather than seeds in a gourd.
const airSweep = (dur, sr, from = 900, to = 2600, q = 1.4) => {
	const buf = buffer(dur, sr);
	const f = svf();
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const p = t / dur;
		const env = Math.sin(Math.PI * p) ** 1.4;
		buf[i] = f(rand2(), from + (to - from) * p, q, sr) * env * 0.8;
	}
	return buf;
};

// A tight electronic tick. The whole percussion mid-range is this and nothing
// else, which is what leaves the pad room to be space.
const tick = (sr, { freq = 2400, dur = 0.045 } = {}) => {
	const buf = buffer(dur, sr);
	const f = svf();
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const env = Math.exp(-t * 140);
		buf[i] = (f(rand2(), 5200, 0.7, sr) * 0.7 + Math.sin(2 * Math.PI * freq * t) * 0.3) * env;
	}
	return buf;
};

// A sine dropping in pitch. Reads as weight arriving without any mid-range at
// all, which a membrane drum cannot do.
const kickSub = (sr, { from = 110, to = 42, dur = 0.34 } = {}) => {
	const buf = buffer(dur, sr);
	let phase = 0;
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const p = t / dur;
		const freq = to + (from - to) * Math.exp(-p * 5);
		phase += freq / sr;
		const env = Math.exp(-t * 7.5);
		buf[i] = Math.tanh(Math.sin(2 * Math.PI * phase) * 1.8) * env;
	}
	return buf;
};

const whoosh = (dur, sr, from, to, q = 1.2) => {
	const buf = buffer(dur, sr);
	const f = svf();
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const p = t / dur;
		const env = Math.sin(Math.PI * p) ** 1.2;
		buf[i] = f(rand2(), from + (to - from) * p, q, sr) * env;
	}
	return buf;
};

// A rising tone bed. Used where the jungle set used a snare roll.
const riser = (dur, sr, fromF = 180, toF = 900) => {
	const buf = buffer(dur, sr);
	let phase = 0;
	const f = svf();
	for (let i = 0; i < buf.length; i++) {
		const t = i / sr;
		const p = t / dur;
		const freq = fromF * Math.pow(toF / fromF, p);
		phase += freq / sr;
		const env = p ** 1.5;
		const s = Math.sin(2 * Math.PI * phase) * 0.6 + rand2() * 0.4;
		buf[i] = f(s, 400 + 3200 * p, 1.3, sr) * env;
	}
	return buf;
};

// ─── notes: C minor pentatonic ───────────────────────────────────────────────
// C  Eb  F  G  Bb — floating and unresolved, where the jungle set's C major
// pentatonic is the sunniest scale in common use.
const P = {
	C2: 65.41, G2: 98.0, Bb2: 116.54,
	C3: 130.81, Eb3: 155.56, F3: 174.61, G3: 196.0, Bb3: 233.08,
	C4: 261.63, Eb4: 311.13, F4: 349.23, G4: 392.0, Bb4: 466.16,
	C5: 523.25, Eb5: 622.25, F5: 698.46, G5: 784.0, Bb5: 932.33,
	C6: 1046.5,
};

console.log('space audio ->', OUT);

// ─── SFX ─────────────────────────────────────────────────────────────────────

writeWav('reel_stop.wav', normalize(tick(SR_SFX, { freq: 1900 }), 0.62), SR_SFX);
writeWav('btn.wav', normalize(pluckSyn(P.G4, 0.09, SR_SFX, 3200), 0.4), SR_SFX);

// the reels running — air moving, not a rattle
{
	const buf = buffer(0.7, SR_SFX);
	addAt(buf, whoosh(0.7, SR_SFX, 400, 1500, 1.0), 0, 0.7, SR_SFX);
	addAt(buf, subBass(P.C2, 0.5, SR_SFX), 0, 0.3, SR_SFX);
	writeWav('spin.wav', normalize(buf, 0.6), SR_SFX);
}

// scatter stops 1..5 — a rising bell, each one brighter and longer than the last
// so the fifth is unmistakably the one that matters.
//
// THE LADDER USED TO BE WRITTEN AND THEN THROWN AWAY. Every one of these ended
// `normalize(buf, 0.7)`, and normalize scales a buffer to a fixed peak — so the
// rising pitch and the growing brightness were composed, and then all five were
// levelled to the same loudness. Measured on the shipped files they came out
// within 0.5 dB of each other, and the THIRD was fractionally the loudest: a
// player landing their fifth scatter heard no more than they did on their first.
//
// Now the peak rises with the ladder, so the crescendo survives the last step of
// the pipeline. Roughly 8 dB from the first to the fifth, which is a real climb
// rather than a described one — the fifth has to be the loudest single sound in
// an ordinary spin, because it is the one that means the feature.
// The top of this ladder is against the ceiling — the fifth is normalised to
// 0.95 and cannot go higher — so the last step is made by lowering the FOURTH,
// not by raising the fifth. Adding brightness to a peak-limited buffer does not
// make it louder either: normalize sees the taller transient and scales the
// whole thing back down. Room underneath is the only lever left.
const SCATTER_PEAK = [0.24, 0.32, 0.43, 0.56, 0.95];
[['scatter_1', P.C4], ['scatter_2', P.Eb4], ['scatter_3', P.G4], ['scatter_4', P.Bb4], ['scatter_5', P.C5]].forEach(
	([name, f], i) => {
		const buf = buffer(1.6, SR_SFX);
		addAt(buf, glass(f, 1.2 + i * 0.1, SR_SFX, 1 + i * 0.12), 0, 1, SR_SFX);
		// The upper octave climbs STEEPLY, and it is the part that carries the
		// climb: peak is capped at 1.0, so past the fourth step the ladder cannot
		// get louder — it can only get brighter, and brightness is what the ear
		// is actually reading here.
		addAt(buf, glass(f * 2, 0.8, SR_SFX, 0.8 + i * 0.3), 0.02, 0.26 + i * 0.13, SR_SFX);
		addAt(buf, subBass(f / 4, 0.6, SR_SFX), 0, 0.25, SR_SFX);
		// The later ones also get a body the early ones do not have: pitch alone
		// climbing while the weight stays put reads as "higher", not as "bigger",
		// and the fifth scatter has to read as bigger.
		if (i >= 2) addAt(buf, kickSub(SR_SFX, { from: 150, to: 48, dur: 0.4 }), 0, 0.16 * (i - 1), SR_SFX);
		// the fifth gets a struck edge the others do not have, so the one that
		// means the feature does not merely continue the sequence
		if (i === 4) {
			addAt(buf, tick(SR_SFX, { freq: 3600, dur: 0.05 }), 0, 0.55, SR_SFX);
			addAt(buf, glass(f * 3, 0.6, SR_SFX, 1.6), 0.015, 0.3, SR_SFX);
		}
		writeWav(`${name}.wav`, normalize(buf, SCATTER_PEAK[i]), SR_SFX);
	},
);

// The marker landing. It measured as one of the loudest cues in the set by raw
// RMS and one of the QUIETEST once low frequencies are discounted — it was
// almost entirely a 65Hz sine, which fills a meter and is nearly inaudible on a
// laptop or a phone. Reading the raw number would have had this turned DOWN; it
// needed the opposite, and specifically it needed midrange rather than level.
{
	const buf = buffer(1.0, SR_SFX);
	addAt(buf, subBass(P.C2, 0.9, SR_SFX), 0, 0.75, SR_SFX);
	addAt(buf, pluckSyn(P.C3, 0.4, SR_SFX, 1200), 0, 0.5, SR_SFX);
	// an octave up, which is the part a small speaker can actually reproduce
	addAt(buf, pluckSyn(P.C4, 0.3, SR_SFX, 2600), 0, 0.34, SR_SFX);
	addAt(buf, tick(SR_SFX, { freq: 1500, dur: 0.05 }), 0, 0.3, SR_SFX);
	writeWav('pluck_low.wav', normalize(buf, 0.8), SR_SFX);
}

// win runs — an ascending arpeggio on the pentatonic, bells rather than mallets
{
	const buf = buffer(1.4, SR_SFX);
	[P.C4, P.Eb4, P.G4, P.Bb4, P.C5].forEach((f, i) => {
		addAt(buf, glass(f, 0.55, SR_SFX, 0.9), i * 0.075, 0.85 - i * 0.04, SR_SFX);
	});
	writeWav('win_gliss.wav', normalize(buf, 0.72), SR_SFX);
}
{
	const buf = buffer(2.4, SR_SFX);
	[P.C4, P.Eb4, P.G4, P.Bb4, P.C5, P.Eb5, P.G5, P.Bb5, P.C6].forEach((f, i) => {
		addAt(buf, glass(f, 0.8, SR_SFX, 1.1), i * 0.07, 0.9 - i * 0.03, SR_SFX);
	});
	addAt(buf, subBass(P.C2, 1.4, SR_SFX), 0, 0.5, SR_SFX);
	addAt(buf, pad(P.C4, 1.8, SR_SFX, 2200), 0.1, 0.3, SR_SFX);
	writeWav('win_gliss_big.wav', normalize(buf, 0.8), SR_SFX);
}

// the feature landing — where the jungle set struck a gong
{
	const buf = buffer(3.0, SR_SFX);
	addAt(buf, subBass(P.C2, 2.2, SR_SFX, 2.2), 0, 1, SR_SFX);
	addAt(buf, glass(P.C4, 2.6, SR_SFX, 1.4), 0.01, 0.7, SR_SFX);
	addAt(buf, glass(P.G4, 2.4, SR_SFX, 1.2), 0.04, 0.45, SR_SFX);
	addAt(buf, pad(P.C3, 2.8, SR_SFX, 2600), 0, 0.5, SR_SFX);
	addAt(buf, whoosh(1.2, SR_SFX, 3000, 300, 1.1), 0, 0.35, SR_SFX);
	writeWav('gong_feature.wav', normalize(buf, 0.85), SR_SFX);
}

// free-spin intro — a riser resolving onto the tonic
{
	const buf = buffer(3.2, SR_SFX);
	addAt(buf, riser(1.6, SR_SFX, 140, 1100), 0, 0.55, SR_SFX);
	addAt(buf, subBass(P.C2, 1.6, SR_SFX, 2), 1.55, 1, SR_SFX);
	[P.C4, P.G4, P.C5].forEach((f, i) => addAt(buf, glass(f, 1.4, SR_SFX, 1.2), 1.55 + i * 0.06, 0.7, SR_SFX));
	addAt(buf, pad(P.C3, 1.6, SR_SFX, 2400), 1.55, 0.45, SR_SFX);
	writeWav('fs_intro.wav', normalize(buf, 0.82), SR_SFX);
}

// big win — the one moment allowed to be loud
{
	const buf = buffer(2.6, SR_SFX);
	addAt(buf, kickSub(SR_SFX, { from: 160, to: 38, dur: 0.6 }), 0, 1, SR_SFX);
	addAt(buf, subBass(P.C2, 2.0, SR_SFX, 2.4), 0, 0.8, SR_SFX);
	addAt(buf, whoosh(1.6, SR_SFX, 5000, 200, 0.9), 0, 0.5, SR_SFX);
	[P.C5, P.G4, P.Eb5, P.C6].forEach((f, i) => addAt(buf, glass(f, 1.6, SR_SFX, 1.3), i * 0.05, 0.6, SR_SFX));
	addAt(buf, pad(P.C4, 2.2, SR_SFX, 3000), 0.05, 0.35, SR_SFX);
	writeWav('bigwin_blast.wav', normalize(buf, 0.85), SR_SFX);
}

// coins landing in hold-and-spin — glassy, not metallic
{
	const buf = buffer(1.1, SR_SFX);
	[P.C5, P.G5, P.C6].forEach((f, i) => addAt(buf, glass(f, 0.6, SR_SFX, 0.7), i * 0.035, 0.7 - i * 0.15, SR_SFX));
	addAt(buf, airSweep(0.35, SR_SFX, 2600, 6000, 1.6), 0, 0.2, SR_SFX);
	writeWav('coin_shimmer.wav', normalize(buf, 0.55), SR_SFX);
}

// anticipation — a held, slowly tightening drone
{
	const buf = buffer(2.0, SR_SFX);
	addAt(buf, riser(2.0, SR_SFX, 90, 420), 0, 0.5, SR_SFX);
	addAt(buf, pad(P.G2, 2.0, SR_SFX, 900), 0, 0.55, SR_SFX);
	addAt(buf, subBass(P.C2, 2.0, SR_SFX, 1.4), 0, 0.4, SR_SFX);
	writeWav('reel_tension.wav', normalize(buf, 0.6), SR_SFX);
}

// the wild opening out
{
	const buf = buffer(1.8, SR_SFX);
	addAt(buf, whoosh(0.9, SR_SFX, 600, 4200, 1.0), 0, 0.6, SR_SFX);
	addAt(buf, glass(P.G4, 1.5, SR_SFX, 1.3), 0.06, 0.8, SR_SFX);
	addAt(buf, glass(P.C5, 1.3, SR_SFX, 1.1), 0.1, 0.5, SR_SFX);
	addAt(buf, subBass(P.G2, 1.0, SR_SFX), 0.05, 0.5, SR_SFX);
	writeWav('wild_expand.wav', normalize(buf, 0.85), SR_SFX);
}

// THE EXPANSION IS TWO SOUNDS, and it used to be one.
//
// A row growing has a release and an arrival — the field lets go of the reel,
// then the shutter locks up a notch and the new cell is there. One cue on the
// release was putting the only sound at the START of a 530ms move, so the thing
// the player was watching happen made no noise when it happened. And that cue
// was `mult_update`, which measured as the second-quietest sound in the whole
// game: the signature mechanic was mixed below the spin whoosh.
//
// So: mult_update stays, softer and drier, as the release. The weight moves to
// grow_lock, on the arrival, which is the emphasis.

// THE RELEASE — the latch letting go, not a synth pluck.
//
// Both of these cues were written for a telescoping pneumatic piston, and the
// shutter above the reels is no longer one: it is a blast door of cell-height
// slats rolling up into the housing. A piston and a roller door do not sound
// alike, and the sound was still describing the old object.
//
// So the upbeat is now a latch disengaging — two dry clicks a few milliseconds
// apart, high then low, which is a catch lifting and a plate going slack. Still
// quiet: the weight is on the arrival below.
{
	const buf = buffer(0.3, SR_SFX);
	addAt(buf, tick(SR_SFX, { freq: 3400, dur: 0.02 }), 0, 0.7, SR_SFX);
	addAt(buf, tick(SR_SFX, { freq: 1600, dur: 0.03 }), 0.014, 0.5, SR_SFX);
	// 0.55, not 0.4. Two 20ms clicks carry very little energy, and at 0.4 this
	// measured -27.6 weighted — quieter than the button, and the quietest thing
	// in the game. An upbeat that cannot be heard is not an upbeat.
	writeWav('mult_update.wav', normalize(buf, 0.55), SR_SFX);
}

// THE ARRIVAL — one slat rolling up into the housing and the door seating.
//
// Three things in that order, because that is the order they happen in and the
// cue lands as the cover opens on the last of the travel:
//
//   · the tail of the ROLL, a short falling swish. Short is the constraint, not
//     a preference: the shutter's travel window is 315ms at full pace and about
//     130ms once a ten-row run compresses it, so anything longer is still
//     playing while the next slat is already going.
//   · the RAIL, two quick catches as the slat passes the guides. Two, not one —
//     a single click is a switch, a pair is a thing moving through something.
//   · the DOOR SEATING on the reel below: the low thump and the metal-on-metal
//     that used to be the whole cue.
//
// The hiss is kept but cut right back. A pressurised capsule does bleed at the
// seal, so it belongs; it just is not the headline any more, because a rolling
// door is not a pneumatic ram.
//
// The mix stays deliberately light on sub. An earlier version led with kickSub
// at 0.95 and measured -14.4 once low frequencies are discounted — mid-pack, for
// the cue that is supposed to be the mechanic's emphasis. Peak was already at
// the ceiling, so the level could not come up; the weight had to move out of the
// bottom octave and into the range a laptop can reproduce.
//
// Sound.svelte plays this at a rising playbackRate, one step per row, so ten of
// them climb instead of hammering the same note ten times.
{
	const buf = buffer(0.7, SR_SFX);
	// the slat still travelling — falling, because it is arriving
	// Kept UNDER the seat, deliberately. normalize() scales to the peak, so a
	// travel noise loud enough to set that peak pushes the seat — the part that
	// matters — down with everything else. It measured -14.7 that way, against
	// -12.8 for the cue it replaced. The roll is context; the door landing is the
	// event.
	addAt(buf, whoosh(0.11, SR_SFX, 3000, 900, 1.1), 0, 0.34, SR_SFX);
	// the guide rails catching it on the way past
	addAt(buf, tick(SR_SFX, { freq: 2300, dur: 0.025 }), 0.018, 0.4, SR_SFX);
	addAt(buf, tick(SR_SFX, { freq: 3100, dur: 0.02 }), 0.042, 0.28, SR_SFX);
	// and the door seating: the mass, then metal on metal
	addAt(buf, kickSub(SR_SFX, { from: 210, to: 62, dur: 0.18 }), 0.07, 0.5, SR_SFX);
	addAt(buf, tick(SR_SFX, { freq: 1250, dur: 0.07 }), 0.07, 1, SR_SFX);
	addAt(buf, tick(SR_SFX, { freq: 800, dur: 0.05 }), 0.074, 0.75, SR_SFX);
	addAt(buf, tick(SR_SFX, { freq: 2700, dur: 0.04 }), 0.078, 0.7, SR_SFX);
	// a short bleed at the seal, well under the seat
	addAt(buf, airSweep(0.2, SR_SFX, 1800, 4600, 1.6), 0.08, 0.22, SR_SFX);
	// and the note, so the climb is musical rather than just louder
	addAt(buf, glass(P.G4, 0.45, SR_SFX, 1.15), 0.08, 0.9, SR_SFX);
	writeWav('grow_lock.wav', fadeEnds(normalize(buf, 0.95), SR_SFX, 3), SR_SFX);
}

// THE CHARGE GOING OFF. Named grenade_blast because Sound.svelte's key is, and a
// rename would be a second change for no gain — what it plays is a pressurised
// canister rupturing in vacuum: a sub thump, a cyan-bright ring of air leaving,
// and no crack. Vacuum has no shockwave to hear, so the brief is a WHOOMPH that
// opens upward, not a bang.
{
	const buf = buffer(2.2, SR_SFX);
	addAt(buf, kickSub(SR_SFX, { from: 190, to: 34, dur: 0.7 }), 0, 1, SR_SFX);
	addAt(buf, whoosh(1.5, SR_SFX, 300, 5200, 0.85), 0.01, 0.75, SR_SFX);
	addAt(buf, airSweep(1.8, SR_SFX, 1200, 5600, 1.2), 0.05, 0.4, SR_SFX);
	addAt(buf, glass(P.C5, 1.6, SR_SFX, 1.5), 0.02, 0.4, SR_SFX);
	writeWav('grenade_blast.wav', fadeEnds(normalize(buf, 0.95), SR_SFX, 4), SR_SFX);
}

// ─── BGM ─────────────────────────────────────────────────────────────────────
//
// REVERTED to the original arrangement: mono, dry, no reverb, no stereo.
//
// A pass was made adding two reverb sends, an equal-power stereo image, an
// off-grid sonar ping and a slow filter breath, on the reasoning that "space" is
// carried by width and tail rather than by notes. It was measurable — L/R
// correlation 0.07, mono fold-down within 2.2dB, crest factor 16.9 — and it was
// not what the game wanted. Reverted on request. The measurements are kept in
// this note so the next person does not re-derive them to reach the same answer:
// the reason to go back was preference, not a defect.
//
// The cost of the revert is the loop seam. These files run one bar longer than
// the music and the extra is decay, so `loop = true` gives a short quiet stretch
// every fifty seconds. That was fixed by folding the tail onto the head, and the
// fold went back with everything else.

const scheduleMelody = (buf, notes, startBeat, beatSec, sr, gain = 0.8) => {
	let at = startBeat;
	for (const [freq, beats] of notes) {
		if (freq > 0) addAt(buf, glass(freq, Math.min(2.2, beats * beatSec + 0.7), sr, 0.85), at * beatSec, gain, sr);
		at += beats;
	}
	return at;
};

// One bar of the groove. Sparse on purpose: a kick on 1 and 3, a tick on the
// off-beats, and air on the half bar. The jungle set put something on every
// eighth note, which is what a jungle sounds like and the opposite of this.
const grooveBar = (buf, t0, beat, sr, energy = 1) => {
	addAt(buf, kickSub(sr), t0 * beat, 0.85 * energy, sr);
	addAt(buf, tick(sr), (t0 + 1.5) * beat, 0.3 * energy, sr);
	addAt(buf, kickSub(sr, { from: 100, to: 40, dur: 0.3 }), (t0 + 2) * beat, 0.6 * energy, sr);
	addAt(buf, tick(sr, { freq: 3000 }), (t0 + 2.5) * beat, 0.22 * energy, sr);
	addAt(buf, tick(sr), (t0 + 3.5) * beat, 0.28 * energy, sr);
	addAt(buf, airSweep(beat * 1.2, sr, 700, 2400, 1.3), (t0 + 2) * beat, 0.16 * energy, sr);
};

// base BGM — 76 BPM, 16 bars (~50s), loopable
{
	const BPM = 76;
	const beat = 60 / BPM;
	const bars = 16;
	const buf = buffer(bars * 4 * beat + 1.2, SR_BGM);

	// Long notes, and far fewer of them than the jungle phrases. At 76 BPM a
	// stream of eighths stops being a groove and becomes an alarm.
	const phraseA = [
		[P.C5, 2], [P.Eb5, 1], [P.G5, 1], [P.F5, 2], [P.Eb5, 2],
		[P.C5, 1], [P.Bb4, 1], [P.C5, 2], [0, 2], [P.G4, 2],
	];
	const phraseB = [
		[P.G5, 2], [P.F5, 1], [P.Eb5, 1], [P.C5, 2], [P.Bb4, 2],
		[P.Eb5, 1], [P.F5, 1], [P.G5, 2], [0, 2], [P.C5, 2],
	];

	let cursor = 0;
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.5);
	cursor = scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.52);
	cursor = scheduleMelody(buf, phraseA, cursor, beat, SR_BGM, 0.5);
	scheduleMelody(buf, phraseB, cursor, beat, SR_BGM, 0.52);

	for (let bar = 0; bar < bars; bar++) {
		grooveBar(buf, bar * 4, beat, SR_BGM, 0.85);
		// the harmony moves once every four bars: Cm - Ab - Eb - Bb, which never
		// resolves home and is why it can loop without a seam
		const root = [P.C3, P.Bb2, P.Eb3, P.G2][Math.floor(bar / 4) % 4];
		addAt(buf, subBass(root / 2, beat * 3.6, SR_BGM, 1.9), bar * 4 * beat, 0.5, SR_BGM);
		addAt(buf, pad(root, beat * 4.2, SR_BGM, 1200), bar * 4 * beat, 0.34, SR_BGM);
		addAt(buf, pad(root * 1.5, beat * 4.2, SR_BGM, 1000), bar * 4 * beat, 0.2, SR_BGM);
	}
	writeWav('bgm_main.wav', normalize(buf, 0.55), SR_BGM);
}

// free-spin BGM — the same room, more energy. 84 BPM, and the arpeggio is what
// carries the lift rather than a faster drum part.
{
	const BPM = 84;
	const beat = 60 / BPM;
	const bars = 16;
	const buf = buffer(bars * 4 * beat + 1.2, SR_BGM);

	const phrase = [
		[P.C5, 1], [P.Eb5, 1], [P.G5, 2], [P.Bb5, 1], [P.G5, 1], [P.F5, 2],
		[P.Eb5, 1], [P.F5, 1], [P.G5, 2], [P.C5, 2], [P.Eb5, 2],
	];
	let cursor = 0;
	for (let r = 0; r < 4; r++) cursor = scheduleMelody(buf, phrase, cursor, beat, SR_BGM, 0.5);

	const arp = [P.C4, P.Eb4, P.G4, P.Bb4, P.G4, P.Eb4];
	for (let bar = 0; bar < bars; bar++) {
		grooveBar(buf, bar * 4, beat, SR_BGM, 1);
		addAt(buf, kickSub(SR_BGM, { from: 100, to: 40, dur: 0.28 }), (bar * 4 + 3) * beat, 0.4, SR_BGM);
		const root = [P.C3, P.Bb2, P.Eb3, P.G2][Math.floor(bar / 4) % 4];
		addAt(buf, subBass(root / 2, beat * 3.6, SR_BGM, 2), bar * 4 * beat, 0.55, SR_BGM);
		addAt(buf, pad(root, beat * 4.2, SR_BGM, 1600), bar * 4 * beat, 0.3, SR_BGM);
		// a sixteenth-note arpeggio, quiet, running under everything — this is the
		// only fast thing in the set and it is what makes the feature feel lifted
		// without raising the tempo
		for (let s = 0; s < 16; s++) {
			const f = arp[s % arp.length] * (bar % 4 === 3 ? 1.5 : 1);
			addAt(buf, pluckSyn(f, 0.22, SR_BGM, 2200), (bar * 4 + s * 0.25) * beat, 0.13, SR_BGM);
		}
	}
	writeWav('bgm_freespin.wav', normalize(buf, 0.68), SR_BGM);
}

console.log('done');

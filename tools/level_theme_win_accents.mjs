// One-time mix pass for the six-game series. Work on PCM samples in place,
// retaining each cue's authored timbre and timing. Re-running is idempotent.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../apps');
const cues = [
	['JadeTeahouse', 'sushi', 'win_small.wav', -19, false],
	['JadeTeahouse', 'sushi', 'win_mid.wav', -19, false],
	['JadeTeahouse', 'sushi', 'reel_stop.wav', -21, false],
	['MardiMonkey嘉年華', 'mardi', 'fg_level_impact.wav', -18.5, true],
];

function pcmData(buffer) {
	if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') throw Error('Not WAV');
	let format = 0, depth = 0, start = 0, length = 0;
	for (let at = 12; at + 8 <= buffer.length;) {
		const tag = buffer.toString('ascii', at, at + 4), size = buffer.readUInt32LE(at + 4);
		if (tag === 'fmt ') { format = buffer.readUInt16LE(at + 8); depth = buffer.readUInt16LE(at + 22); }
		if (tag === 'data') { start = at + 8; length = size; }
		at += 8 + size + size % 2;
	}
	if (format !== 1 || depth !== 16 || !start || start + length > buffer.length) throw Error('Expected 16-bit PCM WAV');
	return { start, length };
}

function stats(samples) {
	let sum = 0, peak = 0;
	for (const v of samples) { sum += v * v; peak = Math.max(peak, Math.abs(v)); }
	return { rms: Math.sqrt(sum / samples.length), peak };
}

for (const [app, theme, name, targetDb, compress] of cues) {
	const file = path.join(root, app, 'static/assets/audio', theme, name);
	const wav = fs.readFileSync(file);
	const { start, length } = pcmData(wav);
	const input = Float64Array.from({ length: length / 2 }, (_, i) => wav.readInt16LE(start + i * 2) / 32768);
	const before = stats(input);
	const target = 10 ** (targetDb / 20);
	if (before.rms >= target * 0.98) { console.log(`${app}/${name}: already levelled`); continue; }
	let output;
	if (compress) {
		// Raise the body of the carnival hit without making its sharp attack clip.
		const driven = Float64Array.from(input, (v) => Math.tanh(v * 2.4));
		const peak = stats(driven).peak;
		output = Float64Array.from(driven, (v) => v * 0.63 / peak);
	} else {
		const gain = Math.min(target / before.rms, 0.66 / before.peak);
		output = Float64Array.from(input, (v) => v * gain);
	}
	for (let i = 0; i < output.length; i++) wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(output[i] * 32767))), start + i * 2);
	fs.writeFileSync(file, wav);
	const after = stats(output);
	const db = (x) => (20 * Math.log10(x)).toFixed(1);
	console.log(`${app}/${name}: ${db(before.rms)} → ${db(after.rms)} dB RMS; peak ${db(after.peak)} dB`);
}

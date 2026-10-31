// Additive authoring pass: keep the original action clips and skin bindings.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smooth = p => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };
for (const cast of ['sushiMaster', 'sushiApprentice']) {
	const file = path.join(root, 'static/assets/spines', cast, 'monkey.json');
	const data = JSON.parse(fs.readFileSync(file, 'utf8'));
	const available = new Set(data.bones.map(b => b.name));
	const rot = (duration, fn) => Array.from({ length: Math.round(duration * 60) + 1 }, (_, i) => {
		const time = Math.min(duration, i / 60);
		return { time: +time.toFixed(5), value: +fn(time).toFixed(4) };
	});
	const idle = structuredClone(data.animations.idle);
	const duration = cast === 'sushiMaster' ? 4.8 : 6;
	// Counter-motion above the hips: feet and the existing breathing stay intact.
	for (const [name, amplitude, phase] of [['armR', 3.8, 0], ['armR_fore', 2.6, -0.5], ['armR_hand', 3, -0.9], ['armL_hand', 2.3, 0.7]]) {
		if (!available.has(name)) continue;
		idle.bones[name] ??= {};
		idle.bones[name].rotate = rot(duration, t => amplitude * (Math.sin(t / duration * Math.PI * 4 + phase) - Math.sin(phase)));
	}
	data.animations.jazzIdle = idle;
	const phrase = { bones: {}, slots: structuredClone(data.animations.nod.slots ?? {}) };
	const env = t => smooth(t / 0.16) * smooth((1.44 - t) / 0.27);
	const beat = t => Math.sin(t * Math.PI * 2 / 0.58);
	// Keep the ordinary phrase's measured joint range; larger gestures have
	// their own clips and do not replace this everyday reaction.
	for (const [name, amplitude, delay] of [['torso', 2.2, 0], ['head', -4, 0.035], ['armR', 11, 0], ['armR_fore', -7, 0.045], ['armR_hand', 6, 0.075], ['armL', -4, 0.03], ['tail', 4, 0.09]]) {
		if (!available.has(name)) continue;
		phrase.bones[name] = { rotate: rot(1.44, t => amplitude * beat(t - delay) * env(t)) };
	}
	data.animations.jazzGroove = phrase;
	const act = (duration, motions, face = 'nod') => {
		const clip = { bones: {}, slots: structuredClone(data.animations[face].slots ?? {}) };
		for (const [name, amplitude, delay] of motions) {
			if (!available.has(name)) continue;
			clip.bones[name] = { rotate: rot(duration, t => {
				const p = Math.max(0, Math.min(1, (t - delay) / (duration - delay)));
				const envelope = smooth(p / 0.22) * smooth((1 - p) / 0.28);
				return amplitude * envelope * (0.78 + 0.22 * Math.sin(p * Math.PI * 3));
			}) };
		}
		return clip;
	};
	// Listen is a short reaction to an actual tease, not a prediction of a result.
	data.animations.jazzListen = act(1.12, [['head', 5, 0], ['torso', -1.3, 0], ['armR', -5, 0.05], ['armR_fore', 3, 0.09]], 'alert');
	// A distinct conductor's flourish for Super Win, with delayed head and wrist.
	data.animations.jazzFinale = act(1.8, [['torso', -2.4, 0], ['head', 4, 0.06], ['armR', 18, 0], ['armR_fore', -5, 0.06], ['armR_hand', 3.5, 0.11], ['armL', -9, 0.04], ['tail', -4, 0.08]]);
	fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
	console.log(`${cast}: jazzIdle ${duration}s / jazzGroove 1.44s / jazzListen 1.12s / jazzFinale 1.8s`);
}

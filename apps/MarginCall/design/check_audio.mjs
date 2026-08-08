// Audio path guard.
//
// check_assets.mjs validates game/assets.ts, but the sound set does not go
// through the pixi asset pipeline: Sound.svelte builds `${base}/assets/audio/…`
// at runtime from two plain string maps. A cue whose file is missing therefore
// fails the only way audio ever fails — silently, in front of the player, with
// nothing in the console except a rejected play() promise that is caught and
// dropped on purpose.
//
// This reads those two maps back out of the source and checks every file is on
// disk. It cannot catch a path assembled from a variable, so it is a backstop,
// not a proof.
//
// Usage: node design/check_audio.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOUND = path.join(appRoot, 'src/components/Sound.svelte');
const AUDIO_ROOT = path.join(appRoot, 'static/assets/audio');

const source = fs.readFileSync(SOUND, 'utf8');

// Both maps are `key: 'relative/path.wav',` entries inside a const object. The
// block boundaries are matched rather than the whole file so a stray quoted
// path in a comment cannot be mistaken for a cue.
const blocks = [
	{ name: 'SFX_FILES', re: /const SFX_FILES[^{]*\{([\s\S]*?)\n\t\};/ },
	{ name: 'BGM_FILES', re: /const BGM_FILES[^{]*\{([\s\S]*?)\n\t\}/ },
];

let problems = 0;
let checked = 0;

for (const block of blocks) {
	const match = source.match(block.re);
	if (!match) {
		console.log(`  !! ${block.name} not found in Sound.svelte — has it been renamed?`);
		problems++;
		continue;
	}
	const entries = [...match[1].matchAll(/^\s*(\w+):\s*'([^']+)'/gm)];
	if (entries.length === 0) {
		console.log(`  !! ${block.name} matched but contains no cues`);
		problems++;
		continue;
	}
	for (const [, cue, rel] of entries) {
		checked++;
		const file = path.join(AUDIO_ROOT, rel);
		if (!fs.existsSync(file)) {
			console.log(`  !! ${block.name}.${cue} → assets/audio/${rel} does not exist`);
			problems++;
		} else if (fs.statSync(file).size < 1024) {
			console.log(`  !! ${block.name}.${cue} → assets/audio/${rel} is suspiciously small`);
			problems++;
		}
	}
}

// The other half of the same mistake: files generated but never wired up. Not a
// failure — an unused cue costs download size, nothing more — so it only warns.
const generated = path.join(AUDIO_ROOT, 'terminal');
if (fs.existsSync(generated)) {
	const referenced = new Set([...source.matchAll(/'(terminal\/[^']+)'/g)].map((m) => m[1]));
	for (const file of fs.readdirSync(generated)) {
		if (!referenced.has(`terminal/${file}`)) {
			console.log(`  -- assets/audio/terminal/${file} is generated but never referenced`);
		}
	}
}

if (problems > 0) {
	console.log(`${problems} problem(s) found`);
	process.exit(1);
}
console.log(`OK: all ${checked} audio cues resolve`);

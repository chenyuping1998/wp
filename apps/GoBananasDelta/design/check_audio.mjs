// Audio path guard.
//
// check_assets.mjs validates game/assets.ts, but the sound set does not go
// through the pixi asset pipeline: Sound.svelte builds `${base}/assets/audio/…`
// at runtime from a plain string map. A cue whose file is missing therefore
// fails the only way audio ever fails — silently, in front of the player, with
// nothing in the console but a rejected play() promise that is caught and
// dropped on purpose.
//
// Which is exactly the report this was written for: "I can't hear the character
// at all". It turned out not to be a missing file that time, but there was no
// way to know that without checking by hand, and a silent failure mode with no
// guard on it will eventually be a real one.
//
// It reads the map back out of the source and checks two things:
//
//   1. every file the map points at is on disk;
//   2. every name the code passes to playCnSfx is a key of that map.
//
// (2) matters more than it looks. The lookup returns undefined for an unknown
// name, the URL becomes `assets/audio/undefined`, and the 404 fires every time
// that cue plays. TypeScript would reject it; `vite build` does not type-check.
//
// It cannot follow a name assembled from a variable — `voice_${name}` is
// deliberately built that way — so those are checked against the map's keys by
// prefix instead, and anything it cannot resolve is reported rather than
// ignored.
//
// Usage: node design/check_audio.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOUND = path.join(appRoot, 'src/components/Sound.svelte');
const AUDIO = path.join(appRoot, 'static/assets/audio');

const src = fs.readFileSync(SOUND, 'utf8');
const fail = (message) => {
	console.error(`check_audio: ${message}`);
	process.exitCode = 1;
};

// ── the map ─────────────────────────────────────────────────────────────────
const mapBody = src.match(/const CN_SFX_FILES: Record<CnSfxName, string> = \{([\s\S]*?)\n\t\};/);
if (!mapBody) {
	fail('could not find CN_SFX_FILES — has Sound.svelte been restructured?');
	process.exit(1);
}

const files = new Map();
for (const line of mapBody[1].split('\n')) {
	const m = line.match(/^\s*(\w+):\s*'([^']+)'/);
	if (m) files.set(m[1], m[2]);
}
if (files.size === 0) fail('CN_SFX_FILES parsed as empty');

let missing = 0;
for (const [name, file] of files) {
	if (!fs.existsSync(path.join(AUDIO, file))) {
		fail(`${name} -> assets/audio/${file} does not exist`);
		missing++;
	}
}

// ── the names the code actually plays ───────────────────────────────────────
const played = new Set();
const dynamic = new Set();
for (const call of src.matchAll(/play(?:CnSfx|CnLoop)\(\s*(`[^`]*`|'[^']*')/g)) {
	const raw = call[1];
	if (raw.startsWith('`') && raw.includes('${')) {
		// e.g. `voice_${name}` — keep the literal prefix and check that at least
		// one key uses it, which is as far as a text scan can honestly go
		dynamic.add(raw.slice(1, -1).split('${')[0]);
	} else {
		played.add(raw.slice(1, -1));
	}
}

for (const name of played) {
	if (!files.has(name)) fail(`playCnSfx('${name}') is not a key of CN_SFX_FILES`);
}
for (const prefix of dynamic) {
	const hits = [...files.keys()].filter((k) => k.startsWith(prefix));
	if (hits.length === 0) fail(`a name is built as \`${prefix}\${…}\` but no CN_SFX_FILES key starts with it`);
}

if (!process.exitCode) {
	const note = dynamic.size ? `, ${dynamic.size} built from a variable` : '';
	console.log(`OK: all ${files.size} audio cues resolve (${played.size} named directly${note})`);
} else {
	console.error(`check_audio: ${missing} missing file(s)`);
	process.exit(1);
}

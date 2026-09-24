// Gate: no sound name may reach the template's sprite.
//
// Sound.svelte routes broadcast sound names to the Miami set through
// SPRITE_TO_CN, and anything NOT in that map falls through to
// `sound.players.once.play({ name })` — the howler sprite in
// static/assets/audio/sounds.json, which is still the sibling jungle game's
// audio and still answers to 52 names. So an unmapped name does not go silent,
// which is what would have been noticed: it plays another game's sample, with
// full confidence, forever.
//
// That is exactly how it shipped. `sfx_youwon_panel` fires at the end of EVERY
// free game and `sfx_winlevel_end` at every max win, and neither was mapped —
// reported by the user as "FG 結束後有以前的範例音效". Both are real sounds now,
// and this gate is here so the next unmapped name is caught at build time
// rather than by ear, three months later.
//
// Usage: node design/check_sounds.mjs [--report]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const soundComponent = path.join(appRoot, 'src/components/Sound.svelte');
const source = fs.readFileSync(soundComponent, 'utf8');

// Names Sound.svelte handles itself, each with the branch that handles it.
// Anything here is deliberate; anything NOT here and not in SPRITE_TO_CN is the
// bug this gate exists for.
const HANDLED = {
	bgm_main: 'soundMusic -> playBgm("base")',
	bgm_freespin: 'soundMusic -> playBgm("freespin")',
	sfx_bigwin_coinloop: 'soundLoop -> playCnLoop("coin_shimmer")',
	sfx_anticipation: 'soundLoop/soundStop -> reel_tension loop',
	// winLevelMap carries these on levels big..max, but winLevelSoundsPlay
	// deliberately never broadcasts sound.bgm (see bookEventHandlerMap.ts:62).
	bgm_winlevel_big: 'declared in winLevelMap, deliberately never broadcast',
	bgm_winlevel_superwin: 'declared in winLevelMap, deliberately never broadcast',
	bgm_winlevel_mega: 'declared in winLevelMap, deliberately never broadcast',
	bgm_winlevel_epic: 'declared in winLevelMap, deliberately never broadcast',
	bgm_winlevel_max: 'declared in winLevelMap, deliberately never broadcast',
};

const problems = [];
const fail = (message) => problems.push(message);

// ── the map, and the files it points at ────────────────────────────────────
const mapBlock = source.match(/SPRITE_TO_CN[\s\S]*?\n\t\};/);
if (!mapBlock) fail('cannot find SPRITE_TO_CN in Sound.svelte');
const mapped = new Map();
for (const line of (mapBlock?.[0] ?? '').split('\n')) {
	const entry = line.match(/^\s*([a-z0-9_]+):\s*\{\s*name:\s*'([a-z0-9_]+)'/);
	if (entry) mapped.set(entry[1], entry[2]);
}

const filesBlock = source.match(/CN_SFX_FILES[\s\S]*?\n\t\};/);
const cnFiles = new Map();
for (const line of (filesBlock?.[0] ?? '').split('\n')) {
	const entry = line.match(/^\s*([a-z0-9_]+):\s*'([^']+)'/);
	if (entry) cnFiles.set(entry[1], entry[2]);
}

for (const [spriteName, cnName] of mapped) {
	const file = cnFiles.get(cnName);
	if (!file) {
		fail(`${spriteName} maps to '${cnName}', which is not in CN_SFX_FILES`);
		continue;
	}
	const onDisk = path.join(appRoot, 'static/assets/audio', file);
	if (!fs.existsSync(onDisk)) fail(`${spriteName} -> ${cnName} -> ${file} does not exist`);
}
for (const [cnName, file] of cnFiles) {
	const onDisk = path.join(appRoot, 'static/assets/audio', file);
	if (!fs.existsSync(onDisk)) fail(`CN_SFX_FILES.${cnName} points at missing ${file}`);
}

// ── every name the game can broadcast ──────────────────────────────────────
const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return /\.(ts|svelte)$/.test(entry.name) ? [full] : [];
	});

// sound.ts is the type union (it lists every name the sprite has, broadcast or
// not) and Sound.svelte is the router itself — neither is a broadcast site.
const skip = new Set([path.join(appRoot, 'src/game/sound.ts'), soundComponent]);
const used = new Map();
for (const file of walk(path.join(appRoot, 'src'))) {
	if (skip.has(file)) continue;
	const text = fs.readFileSync(file, 'utf8');
	for (const match of text.matchAll(/'((?:sfx|jng|bgm)_[a-z0-9_]+)'/g)) {
		if (!used.has(match[1])) used.set(match[1], path.relative(appRoot, file));
	}
}

const unmapped = [];
for (const [name, where] of used) {
	if (mapped.has(name) || name in HANDLED) continue;
	unmapped.push(`${name} (${where}) falls through to the template sprite`);
}
unmapped.sort().forEach(fail);

if (process.argv.includes('--report')) {
	console.log(`  sound names in use : ${used.size}`);
	console.log(`  mapped to Miami    : ${[...used.keys()].filter((n) => mapped.has(n)).length}`);
	console.log(`  handled elsewhere  : ${[...used.keys()].filter((n) => n in HANDLED).length}`);
	for (const [name, where] of [...used].sort()) {
		const how = mapped.get(name) ?? HANDLED[name] ?? 'UNMAPPED';
		console.log(`    ${name.padEnd(26)} ${String(how).padEnd(34)} ${where}`);
	}
}

if (problems.length) {
	console.error('FAIL: sound routing');
	problems.forEach((p) => console.error(`  - ${p}`));
	process.exit(1);
}
console.log(
	`OK: all ${used.size} broadcast sound names resolve to the Miami set ` +
		`(${mapped.size} mapped, ${Object.keys(HANDLED).length} handled directly)`,
);

// iOS Safari memory budget (2026-11-01).
//
// Live testing killed the game on load on an iPhone 12 ("A problem repeatedly
// occurred"): a tab that outgrows iOS's memory allowance is terminated and
// reloaded until Safari gives up. Three things fed it, and each is held here:
//
//   1. the renderer at the phone's full 3x — capped at 2 by game/renderBudget.ts,
//      which must be imported before the pixi App initialises;
//   2. the two full-scene lighting filters multisampling every pass — their
//      antialias must stay 'off';
//   3. decoded art: every preloaded image costs width x height x 4 bytes in
//      memory however small the file is, plus a third more for its mip chain.
//
// The art budget is set just above today's total so a regression shows up as
// a failed build, not as a phone that cannot open the game.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(app, f), 'utf8');
const fail = (msg) => {
	console.error(`FAIL: ${msg}`);
	process.exit(1);
};

const PRELOAD_BUDGET_MB = 185;
const MAX_SPRITE_SIDE = 2560; // the background plates; nothing else needs more

const dims = (file) => {
	const b = fs.readFileSync(file);
	if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
	if (b[0] === 0xff && b[1] === 0xd8) {
		for (let i = 2; i < b.length; ) {
			const marker = b[i + 1];
			const len = b.readUInt16BE(i + 2);
			if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
				return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
			i += 2 + len;
		}
	}
	if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
		const kind = b.toString('ascii', 12, 16);
		if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
		if (kind === 'VP8L') {
			const v = b.readUInt32LE(21);
			return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)];
		}
		if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
	}
	fail(`cannot read image size: ${file}`);
};

// 1. resolution cap, imported ahead of the App
const game = read('src/components/Game.svelte');
const budget = read('src/game/renderBudget.ts');
if (!/setMaxResolution\(2\)/.test(budget)) fail('renderBudget.ts no longer caps the renderer at 2x');
const iBudget = game.indexOf("import '../game/renderBudget'");
const iApp = game.indexOf("from 'pixi-svelte'");
if (iBudget < 0 || iBudget > iApp) fail('Game.svelte must import game/renderBudget before pixi-svelte');
const dist = fs.readFileSync(path.join(app, '../../packages/pixi-svelte/dist/components/InitialiseApplication.svelte'), 'utf8');
if (!dist.includes('getRenderResolution(')) fail('pixi-svelte dist does not apply the resolution cap (rebuild dist)');

// 2. no multisampled lighting filters
const lighting = read('src/game/sceneLighting.ts');
if (/antialias\s*=\s*'(inherit|on)'|antialias\s*=\s*true/.test(lighting))
	fail("sceneLighting.ts filters must keep antialias = 'off'");

// 3. decoded size of the preloaded art
const assets = read('src/game/assets.ts');
const entries = [...assets.matchAll(/\n\t(\w+): \{([\s\S]*?)\n\t\}/g)];
const seen = new Set();
let bytes = 0;
const big = [];
const staticPath = (rel) => path.join(app, 'static', rel.replace(/^(\.\.\/)+/, ''));
for (const [, key, body] of entries) {
	if (!/preload:\s*true/.test(body)) continue;
	const files = [...body.matchAll(/new URL\('([^']+\.(?:png|jpg|webp))'/g)].map((m) => staticPath(m[1]));
	for (const [, atlas] of body.matchAll(/new URL\('([^']+\.atlas)'/g)) {
		const a = staticPath(atlas);
		for (const line of fs.readFileSync(a, 'utf8').split(/\r?\n/))
			if (/\.(png|webp|jpg)$/.test(line.trim())) files.push(path.join(path.dirname(a), line.trim()));
	}
	for (const f of files) {
		if (seen.has(f)) continue;
		seen.add(f);
		const [w, h] = dims(f);
		bytes += w * h * 4;
		if (Math.max(w, h) > MAX_SPRITE_SIDE) big.push(`${key} ${w}x${h}`);
	}
}
if (big.length) fail(`preloaded art over ${MAX_SPRITE_SIDE}px: ${big.join(', ')}`);
const mb = bytes / 2 ** 20;
if (mb > PRELOAD_BUDGET_MB)
	fail(`preloaded art decodes to ${mb.toFixed(0)} MB, over the ${PRELOAD_BUDGET_MB} MB budget`);
console.log(
	`OK: renderer capped at 2x, lighting filters not multisampled, preloaded art ${mb.toFixed(0)} MB decoded (${seen.size} images, budget ${PRELOAD_BUDGET_MB})`,
);

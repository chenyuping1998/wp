// Gate: a rigged symbol's parts must be real, placed, and move DIFFERENTLY.
//
// Cutting a symbol into layers only buys anything if the layers do different
// things. A rig whose parts all pulse together is the flat sprite again with
// four times the draw calls — the same disease this whole animation pass exists
// to cure, one level further in. So the same measurement used on the twelve
// symbol motions is applied to the parts of each rigged symbol.
//
// It also checks the things that make rigged art fail silently in Pixi:
//
//   1. a declared part has no asset key in game/assets.ts (Pixi draws nothing
//      and logs one line nobody reads)
//   2. a declared part has no measured entry in partsManifest.ts, so its pivot
//      cannot be resolved and it would silently rotate about the cell centre
//   3. the pivot lands outside the part's own bounding box
//   4. two parts move identically, or a part never moves at all
//   5. a landing part has not returned to rest when the landing ends —
//      ReelSymbol flips the symbol to 'static' on that frame, so anything left
//      leaning snaps back in one frame
//   6. transforms out of sane bounds
//
// Usage: node design/check_symbol_parts.mjs [--report]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SYMBOL_RIGS, partFrame, resolvePivot, PART_WINDOWS } = await import(path.join(appRoot, 'src/game/symbolParts.ts'));
const { PARTS_MANIFEST } = await import(path.join(appRoot, 'src/game/partsManifest.ts'));
const { HOLD_MS } = await import(path.join(appRoot, 'src/game/symbolWinMotion.ts'));
const { LAND_MS } = await import(path.join(appRoot, 'src/game/symbolLandMotion.ts'));

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

const assets = fs.readFileSync(path.join(appRoot, 'src/game/assets.ts'), 'utf8');
const knownKeys = new Set([...assets.matchAll(/^\s{1,2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{/gm)].map((m) => m[1]));

// The rig restates the two animation windows instead of importing them (node
// ESM cannot resolve the extensionless import the app uses), so the first thing
// this does is prove the copies still match. A beat playing against a window it
// no longer shares is silent, invisible and completely wrong.
if (PART_WINDOWS.HOLD_MS !== HOLD_MS) fail(`symbolParts.ts has HOLD_MS ${PART_WINDOWS.HOLD_MS}, symbolWinMotion.ts has ${HOLD_MS}`);
if (PART_WINDOWS.LAND_MS !== LAND_MS) fail(`symbolParts.ts has LAND_MS ${PART_WINDOWS.LAND_MS}, symbolLandMotion.ts has ${LAND_MS}`);

const CHANNELS = ['dx', 'dy', 'rotation', 'scaleX', 'scaleY'];
const SAMPLES = 48;
// Parts of one object are allowed to rhyme more than two different symbols are:
// a cone and a case sharing a beat is the point of the rig, and a whole symbol
// has a wider vocabulary than a part of one. What must not happen is two parts
// tracing the same curve.
const MIN_PAIR_DISTANCE = 0.7;
const MIN_ENERGY = 0.02;

for (const [symbol, rig] of Object.entries(SYMBOL_RIGS)) {
	const metrics = PARTS_MANIFEST[symbol.toLowerCase()] ?? {};

	for (const part of rig.parts) {
		// ── 1, 2, 3 ──
		if (!knownKeys.has(part.key)) fail(`${symbol}/${part.name}: asset key "${part.key}" is not in src/game/assets.ts — Pixi would draw nothing`);
		const m = metrics[part.name];
		if (!m) {
			fail(`${symbol}/${part.name}: no entry in partsManifest.ts — run design/build_parts_manifest.py after installing the art`);
			continue;
		}
		const [px, py] = resolvePivot(m.bbox, part.pivot);
		const [x0, y0, x1, y1] = m.bbox;
		if (px < x0 - 0.02 || px > x1 + 0.02 || py < y0 - 0.02 || py > y1 + 0.02) {
			fail(`${symbol}/${part.name}: pivot (${px.toFixed(3)}, ${py.toFixed(3)}) is outside the part's own bbox`);
		}
		if (m.coverage < 0.004) fail(`${symbol}/${part.name}: the installed PNG is nearly empty (${(m.coverage * 100).toFixed(1)}% of canvas)`);
	}

	for (const mode of ['win', 'land']) {
		const window = mode === 'win' ? HOLD_MS : LAND_MS;
		const moving = rig.parts.filter((part) => part[mode]);
		if (moving.length === 0) {
			fail(`${symbol}: no part does anything on ${mode}`);
			continue;
		}

		const traces = {};
		for (const part of moving) {
			traces[part.name] = Array.from({ length: SAMPLES + 1 }, (_, i) => {
				const f = partFrame(part, mode, (i / SAMPLES) * window);
				// ── 6 ──
				if (Math.abs(f.dx) > 0.2 || Math.abs(f.dy) > 0.2) fail(`${symbol}/${part.name} ${mode}: offset (${f.dx.toFixed(3)}, ${f.dy.toFixed(3)}) leaves the cell`);
				if (Math.abs(f.rotation) > 0.5) fail(`${symbol}/${part.name} ${mode}: rotation ${f.rotation.toFixed(2)} rad tears the part off the body`);
				if (f.scaleX < 0.6 || f.scaleX > 1.5 || f.scaleY < 0.6 || f.scaleY > 1.5) fail(`${symbol}/${part.name} ${mode}: scale (${f.scaleX.toFixed(2)}, ${f.scaleY.toFixed(2)}) is outside 0.6-1.5`);
				return CHANNELS.map((c) => f[c]);
			});

			// ── 5 ──
			if (mode === 'land') {
				for (const t of [LAND_MS, LAND_MS * 1.25]) {
					const f = partFrame(part, 'land', t);
					const off = [
						['dx', f.dx, 0.005], ['dy', f.dy, 0.005], ['rotation', f.rotation, 0.02],
						['scaleX', f.scaleX - 1, 0.02], ['scaleY', f.scaleY - 1, 0.02],
					].filter(([, v, limit]) => Math.abs(v) > limit);
					if (off.length) fail(`${symbol}/${part.name} has not settled at t=${Math.round(t)}ms: ${off.map(([c, v]) => `${c}=${v.toFixed(3)}`).join(', ')}`);
				}
			}
		}

		// pooled z-score, then compare SHAPE — amplitude is deliberately invisible,
		// exactly as in check_symbol_motion.mjs, so "make one part bigger" cannot
		// pass this.
		const names = Object.keys(traces);
		const mean = [], stdev = [];
		for (let c = 0; c < CHANNELS.length; c++) {
			const values = names.flatMap((n) => traces[n].map((r) => r[c]));
			const mu = values.reduce((a, b) => a + b, 0) / values.length;
			mean.push(mu);
			stdev.push(Math.sqrt(values.reduce((a, b) => a + (b - mu) ** 2, 0) / values.length) || 1);
		}
		const unit = (name) => {
			const flat = [];
			for (let c = 0; c < CHANNELS.length; c++) {
				const col = traces[name].map((r) => (r[c] - mean[c]) / stdev[c]);
				const mu = col.reduce((a, b) => a + b, 0) / col.length;
				for (const v of col) flat.push(v - mu);
			}
			const norm = Math.sqrt(flat.reduce((a, b) => a + b * b, 0)) || 1;
			return { vec: flat.map((v) => v / norm), norm };
		};
		const shapes = {};
		for (const n of names) shapes[n] = unit(n);

		// ── 4 ──
		for (const n of names) {
			if (shapes[n].norm < MIN_ENERGY) fail(`${symbol}/${n} barely moves on ${mode} (${shapes[n].norm.toFixed(3)}) — it is a static layer`);
		}
		const pairs = [];
		for (let i = 0; i < names.length; i++) {
			for (let j = i + 1; j < names.length; j++) {
				const a = shapes[names[i]].vec, b = shapes[names[j]].vec;
				let sum = 0;
				for (let k = 0; k < a.length; k++) sum += (a[k] - b[k]) ** 2;
				const d = Math.sqrt(sum);
				pairs.push([d, names[i], names[j]]);
				if (d < MIN_PAIR_DISTANCE) fail(`${symbol}: ${names[i]} and ${names[j]} move the same way on ${mode} (${d.toFixed(2)} < ${MIN_PAIR_DISTANCE})`);
			}
		}
		pairs.sort((a, b) => a[0] - b[0]);
		if (process.argv.includes('--report')) {
			console.log(`\n  [${symbol} ${mode}] closest pairs:`);
			for (const [d, a, b] of pairs.slice(0, 4)) console.log(`    ${d.toFixed(2)}  ${a} / ${b}`);
		}
	}
}

const rigged = Object.keys(SYMBOL_RIGS);
console.log(
	problems.length === 0
		? `OK: ${rigged.length} rigged symbol(s) [${rigged.join(', ')}], parts placed and moving independently`
		: `${problems.length} rigged-part problem(s) found`,
);
process.exit(problems.length === 0 ? 0 : 1);

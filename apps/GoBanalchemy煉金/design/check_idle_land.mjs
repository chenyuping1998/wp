// The gate for the three motion tables ported from DeadwoodExpress
// (2026-09-28): game/idleBreathe.ts, game/landMotion.ts,
// game/anticipationFocus.ts. Each of them makes claims in its comments that a
// later tweak of one constant can silently make false — this holds them to it.
//
//   IDLE   neighbouring cells (diagonals too) breathe at least 0.5 rad apart,
//          and the twenty phases cover the circle — the board must never
//          pulse as one block
//   LAND   every landing is EXACTLY at rest by LAND_MS (the sprite goes static
//          on completion, and a residual offset would snap away), and no two
//          symbols land alike (the stone letters are one family by design and
//          are only compared with everything else)
//   TEASE  the pulse gets FASTER to the right and at tier 2, the focus is
//          bigger at tier 2 and never past 1.1 (it clips the next column), and
//          the beam runs faster at tier 2
//
// Usage: node design/check_idle_land.mjs
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (f) => import(pathToFileURL(path.join(appRoot, 'src/game', f)).href);
const idle = await load('idleBreathe.ts');
const land = await load('landMotion.ts');
const tease = await load('anticipationFocus.ts');

let failures = 0;
const fail = (m) => {
	failures++;
	console.log(`  !! ${m}`);
};
const ok = (m) => console.log(`  ok ${m}`);

// ── IDLE ──────────────────────────────────────────────────────────────────────
{
	const gap = (a, b) => {
		const d = Math.abs(a - b) % (2 * Math.PI);
		return Math.min(d, 2 * Math.PI - d);
	};
	let worst = Infinity;
	for (let r = 0; r < idle.VISIBLE_ROWS; r++)
		for (let c = 0; c < idle.VISIBLE_REELS; c++)
			for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
				const r2 = r + dr, c2 = c + dc;
				if (r2 >= idle.VISIBLE_ROWS || c2 < 0 || c2 >= idle.VISIBLE_REELS) continue;
				// rows are padded: visible row r is index r + 1
				worst = Math.min(worst, gap(idle.idlePhase(c, r + 1), idle.idlePhase(c2, r2 + 1)));
			}
	if (worst < 0.5) fail(`idle: neighbours only ${worst.toFixed(2)} rad apart — the board pulses as a block`);
	else ok(`idle: neighbours at least ${worst.toFixed(2)} rad apart`);
	const all = [];
	for (let r = 0; r < idle.VISIBLE_ROWS; r++) for (let c = 0; c < idle.VISIBLE_REELS; c++) all.push(idle.idlePhase(c, r + 1));
	all.sort((a, b) => a - b);
	let widest = 2 * Math.PI - all[all.length - 1] + all[0];
	for (let i = 1; i < all.length; i++) widest = Math.max(widest, all[i] - all[i - 1]);
	if (widest > ((2 * Math.PI) / all.length) * 1.6) fail(`idle: phases bunch (widest gap ${widest.toFixed(2)} rad)`);
	else ok(`idle: phases cover the circle (widest gap ${widest.toFixed(2)} rad)`);
	const amp = Math.max(...Array.from({ length: 100 }, (_, i) => Math.abs(idle.idleScale(i * 26, 0) - 1)));
	if (amp > 0.015) fail(`idle: breath ${(amp * 100).toFixed(1)}% — it should be about 1%`);
	else ok(`idle: breath ${(amp * 100).toFixed(2)}%`);
}

// ── LAND ──────────────────────────────────────────────────────────────────────
{
	const KEYS = ['sx', 'sy', 'rot', 'dx', 'dy'];
	const dev = (f) => [f.sx - 1, f.sy - 1, f.rot, f.dx, f.dy];
	for (const s of [...land.LAND_SYMBOLS, 'X']) {
		const end = land.landFrame(s, land.LAND_MS);
		const off = Math.max(...dev(end).map(Math.abs), end.bloom, end.dust);
		if (off > 1e-6) fail(`land ${s}: not at rest at ${land.LAND_MS}ms (${KEYS.map((k) => k + ' ' + end[k].toFixed(4)).join(' ')})`);
	}
	ok(`land: all ${land.LAND_SYMBOLS.length + 1} landings at rest by ${land.LAND_MS}ms`);
	// a landing's signature: its deviations over 24 samples
	const sig = (s) => Array.from({ length: 24 }, (_, i) => dev(land.landFrame(s, (land.LAND_MS * i) / 24))).flat();
	const dist = (a, b) => Math.sqrt(a.reduce((acc, v, i) => acc + (v - b[i]) ** 2, 0));
	const family = (s) => (/^L\d$/.test(s) ? 'L' : s);
	const syms = land.LAND_SYMBOLS;
	let closest = Infinity, pair = '';
	for (let i = 0; i < syms.length; i++)
		for (let j = i + 1; j < syms.length; j++) {
			if (family(syms[i]) === family(syms[j])) continue;
			const d = dist(sig(syms[i]), sig(syms[j]));
			if (d < closest) {
				closest = d;
				pair = `${syms[i]}/${syms[j]}`;
			}
		}
	if (closest < 0.15) fail(`land: ${pair} land almost alike (${closest.toFixed(3)})`);
	else ok(`land: every pair differs (closest ${pair} ${closest.toFixed(3)})`);
}

// ── TEASE ─────────────────────────────────────────────────────────────────────
{
	for (const tier of [1, 2]) {
		for (let r = 1; r < 5; r++)
			if (!(tease.pulseRateMs(r, tier) < tease.pulseRateMs(r - 1, tier)))
				fail(`tease: tier ${tier} reel ${r} pulses no faster than reel ${r - 1}`);
	}
	for (let r = 0; r < 5; r++)
		if (!(tease.pulseRateMs(r, 2) < tease.pulseRateMs(r, 1))) fail(`tease: reel ${r} tier 2 no faster than tier 1`);
	const f1 = tease.symbolFocus(1), f2 = tease.symbolFocus(2);
	if (!(f2.scale > f1.scale && f2.bloom > f1.bloom)) fail('tease: tier 2 focus not stronger than tier 1');
	if (f2.scale > 1.1) fail(`tease: focus ${f2.scale} clips into the next column (max 1.1)`);
	const period = (tier) => {
		// the beam's period: first t > 0 where it is back at the top
		for (let t = 10; t < 5000; t += 5) if (tease.beamAt(t, tier).y < tease.beamAt(t - 5, tier).y) return t;
		return Infinity;
	};
	if (!(period(2) < period(1))) fail('tease: beam no faster at tier 2');
	if (tease.tierIntensity(2) <= tease.tierIntensity(1)) fail('tease: tier 2 no brighter');
	ok(`tease: faster to the right and at tier 2 (reel 0..4 at tier 1: ${[0, 1, 2, 3, 4].map((r) => tease.pulseRateMs(r, 1)).join(' ')}ms), focus ${f1.scale}/${f2.scale}`);
}

console.log(failures ? `\ncheck_idle_land: FAILED (${failures})` : '\ncheck_idle_land: all checks passed');
if (failures) process.exitCode = 1;

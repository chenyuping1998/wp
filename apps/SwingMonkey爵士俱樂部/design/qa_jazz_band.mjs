// Offline QA for game/jazzBand.ts + musicClock.ts (2026-11-06): with a fake
// running AudioContext, every act's warp is monotonic, its hits land on the
// band's beat positions, and every note is pitched to a chord tone in range.
import assert from 'node:assert/strict';
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}`));
const mc = await import('../src/game/musicClock.ts');
const jb = await import('../src/game/jazzBand.ts');
const { JAZZ_HITS } = await import('../src/game/meshWin/phrase.ts');
const t0 = performance.now();
const ctx = { state: 'running', outputLatency: 0.02, baseLatency: 0.005, get currentTime() { return (performance.now() - t0) / 1000 + 3.217; } };
for (const [bpm, swing] of [[128, 0.64], [160, 0.6]]) {
	mc.setMusicClock({ ctx, start: 1.0, bpm, swing });
	const beat = 60 / bpm;
	for (const symbol of ['H1', 'H2', 'H3', 'H4', 'W', 'S']) {
		const started = performance.now();
		const plan = jb.planPhrase(symbol, 1440, 1, started);
		let prev = -1;
		for (let r = 0; r <= plan.totalMs; r += 5) { const t = plan.authored(r); assert.ok(t >= prev - 1e-9, `${symbol} warp not monotonic`); prev = t; }
		assert.ok(Math.abs(plan.authored(plan.totalMs) - 1440) < 1e-6, `${symbol} does not end on its last frame`);
		assert.ok(plan.totalMs < 1440 + 1.2 * beat * 1000 + 400, `${symbol} too long: ${plan.totalMs}`);
		const beats = jb.jazzBeats(symbol, swing);
		for (const n of plan.notes) {
			const pos = (n.at - 1.0) / beat;
			assert.ok(beats.some((b) => Math.abs(((pos - b) % 1 + 1) % 1) < 1e-6 || Math.abs(((pos - b) % 1 + 1) % 1 - 1) < 1e-6), `${symbol} note off the grid`);
			assert.ok(n.rate > 0.7 && n.rate < 2.3, `${symbol} rate ${n.rate}`);
		}
		const firstHitReal = (() => { let lo = 0, hi = plan.totalMs; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (plan.authored(m) < JAZZ_HITS[symbol][0]) lo = m; else hi = m; } return hi; })();
		console.log(`${bpm}bpm ${symbol}: total ${plan.totalMs.toFixed(0)}ms (authored 1440), first hit at ${firstHitReal.toFixed(0)}ms, notes ${plan.notes.map((n) => n.rate.toFixed(3)).join(' ')}`);
	}
	for (let i = 0; i < 5; i++) assert.ok(mc.chordToneRate(i) > 0.7 && mc.chordToneRate(i) < 2.6);
}
mc.setMusicClock(null);
const plain = jb.planPhrase('H2', 1440, 2, performance.now());
assert.equal(Math.round(plain.totalMs), 720);
assert.equal(plain.notes.length, 4);
jb.openPhrases(true); assert.ok(jb.claimPhrase('H1')); assert.ok(!jb.claimPhrase('H1'));
jb.openPhrases(false); assert.ok(!jb.claimPhrase('H2'));
console.log('jazz band QA passed');

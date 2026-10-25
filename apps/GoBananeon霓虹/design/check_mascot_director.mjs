// Behavioral tests for the pure director. No browser, wall clock or timers.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const moduleUrl = new URL('../src/game/mascotDirector.ts', import.meta.url);
const source = fs.readFileSync(moduleUrl, 'utf8');
const program = ts.createProgram([fileURLToPath(moduleUrl)], {
	target: ts.ScriptTarget.ES2022, strict: true, noEmit: true, skipLibCheck: true, types: [],
});
assert.deepEqual(ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), [], 'director must type-check independently');
const compiled = ts.transpileModule(source, {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const sandbox = { exports: {} };
vm.createContext(sandbox);
vm.runInContext(compiled, sandbox);
const { MascotIdleDirector } = sandbox.exports;
const READY = { enabled: true, visible: true, onStage: true, idle: true, boardSettled: true, winActive: false, modalOpen: false };
const make = (random = () => 0) => new MascotIdleDirector({ random });
const run = (director, start, end, step = 100, status = READY) => {
	const events = [];
	for (let now = start; now <= end; now += step) {
		const gesture = director.tick(now, typeof status === 'function' ? status(now) : status);
		if (gesture) events.push({ now, gesture });
	}
	return events;
};

// A frequently sampled idle must never re-enter one-shot playback. Small
// gestures preserve the separate 24s major deadline, even while idle=false.
const d = make();
let playing = null;
let until = 0;
const timeline = [];
for (let now = 0; now <= 72_000; now += 100) {
	if (now >= until) playing = null;
	const gesture = d.tick(now, { ...READY, idle: !playing, activeGesture: playing });
	if (gesture) {
		assert.equal(playing, null, 'gesture re-entered while a previous one is playing');
		playing = gesture;
		until = now + (gesture === 'dj_scratch' ? 3200 : 1400);
		timeline.push({ now, gesture });
	}
}
assert.deepEqual(timeline.filter(e => e.gesture === 'dj_scratch').map(e => e.now), [24_000, 48_000, 72_000]);
assert(timeline.some(e => e.gesture === 'glance'), 'small accents missing');
assert.equal(timeline.filter(e => e.now === 24_000).length, 1, 'both due accents emitted at once');

// Even if the caller has not yet changed its animation status, an emitted
// one-shot is internally leased and cannot re-enter on repeated/same timestamps.
const lease = make();
run(lease, 0, 7900);
assert.equal(lease.tick(8000, READY), 'glance');
for (let now = 8000; now < 9200; now += 10) assert.equal(lease.tick(now, READY), null);

// Every source of interruption clears both clocks; recovery earns a new quiet
// interval, with no idle time banked while the board is busy or invisible.
for (const blocked of [
	{ visible: false }, { onStage: false }, { enabled: false }, { boardSettled: false },
	{ winActive: true }, { modalOpen: true }, { idle: false, activeGesture: null },
]) {
	const director = make();
	run(director, 0, 7000);
	assert.equal(run(director, 7100, 31_000, 100, { ...READY, ...blocked }).length, 0);
	assert.equal(run(director, 31_100, 38_100).length, 0, 'recovery fired before 7s grace');
	const resumed = run(director, 38_200, 39_200);
	assert.equal(resumed[0]?.now, 39_100, 'resume must start a fresh 8s minor delay');
	assert(!resumed.some(e => e.gesture === 'dj_scratch'), 'hidden time banked a full DJ');
}

// Paused RAF, invalid clocks and clock reversal discard deadlines. The next
// sensible tick cannot fast-forward directly into a scratch performance.
for (const invalid of [NaN, Infinity, -1, Number.MAX_VALUE, Number.MAX_SAFE_INTEGER, 6000, 100_000]) {
	const director = make();
	run(director, 0, 7000);
	assert.equal(director.tick(invalid, READY), null);
	const next = invalid === 100_000 ? 100_100 : 7100;
	assert.equal(run(director, next, next + 7000).length, 0);
}

const lifecycle = make();
run(lifecycle, 0, 7000);
lifecycle.stop();
assert.equal(run(lifecycle, 7100, 35_000).length, 0);
lifecycle.reset();
assert.equal(run(lifecycle, 35_100, 42_100).length, 0);
assert.equal(run(lifecycle, 42_200, 43_200)[0]?.now, 43_100);

// Frame-rate-independent schedule: a seeded random source is sampled only for
// scheduled decisions, never once per frame. Events differ by at most one frame.
const seeded = () => { let state = 0x319ab; return () => { state = (Math.imul(state,1664525)+1013904223)>>>0; return state/2**32; }; };
function simulate(fps) {
	const director = make(seeded());
	const result = [];
	let gesture = null;
	let end = 0;
	for (let frame = 0; frame <= fps*120; frame++) {
		const now = frame*1000/fps;
		if (now >= end) gesture = null;
		const next = director.tick(now, { ...READY, idle: !gesture, activeGesture: gesture });
		if (next) { gesture = next; end = now+(next==='dj_scratch'?3200:1500); result.push({ now, gesture: next }); }
	}
	return result;
}
const fps30 = simulate(30);
const fps60 = simulate(60);
assert.deepEqual(fps30.map(e => e.gesture), fps60.map(e => e.gesture));
fps30.forEach((event, i) => assert(Math.abs(event.now-fps60[i].now) <= 1000/30 + 0.001, 'frame rate drift'));
const dj = fps60.filter(e => e.gesture === 'dj_scratch');
dj.forEach((event, i) => { const gap = event.now - (dj[i-1]?.now ?? 0); assert(gap >= 24_000 && gap <= 32_000+1000/60); });
for (const random of [() => NaN, () => Infinity, () => -8, () => 8, () => { throw Error('bad source'); }]) {
	const events = run(make(random), 0, 33_000);
	assert(events.length > 0 && events.length < 6, 'invalid random caused burst or starvation');
}
console.log('PASS: sparse 8–12s accents / 24–32s DJ, no reentry, independent major timer, interruptions/resume, lifecycle, invalid clock/random and 30/60fps timeline');

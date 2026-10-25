// Exercise the actual Sound.svelte script with a controllable Web Audio clock.
// These checks cover silent regressions: a loop arriving after stop, clipping
// through an unbounded parallel voice pool, and a stopped music fetch restarting.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const source = fs.readFileSync(new URL('../src/components/Sound.svelte', import.meta.url), 'utf8');
const script = source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
const js = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
	.replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
	.replace(/^export\s*\{\s*\};?\s*$/gm, '');

const param = () => ({ value: 1, setValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; }, cancelScheduledValues() {} });
const nodes = [];
const sources = [];
let pendingDecodes = [];
let deferDecode = false;
let mounted;
let subscriptions;
const timers = new Map();
const intervals = new Map();
const elements = [];
let timer = 0;
let clock = 0;
class AudioNode {
	constructor() { this.gain = param(); this.playbackRate = param(); this.connections = []; this.stopped = false; nodes.push(this); }
	connect(next) { this.connections.push(next); return next; }
	disconnect() { this.disconnected = true; }
	start() { this.started = true; sources.push(this); }
	stop() { this.stopped = true; this.onended?.(); }
}
class Context {
	constructor() { this.state = 'running'; this.currentTime = 0; this.destination = new AudioNode(); }
	createGain() { return new AudioNode(); }
	createBufferSource() { return new AudioNode(); }
	createDynamicsCompressor() { const n = new AudioNode(); for (const key of ['threshold','knee','ratio','attack','release']) n[key] = param(); return n; }
	decodeAudioData() { return deferDecode ? new Promise(resolve => pendingDecodes.push(() => resolve({ duration: 1 }))) : Promise.resolve({ duration: 1 }); }
	resume() { return Promise.resolve(); }
	close() { return Promise.resolve(); }
}
class Audio {
	constructor(src) { this.src = src; this.paused = true; this.ended = false; this.volume = 1; elements.push(this); }
	play() { this.paused = false; return Promise.resolve(); }
	pause() { this.paused = true; }
}
const sandbox = {
	Audio, window: { AudioContext: Context }, base: '',
	performance: { now: () => clock },
	fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }),
	$effect: callback => callback(), onMount: callback => { mounted = callback; },
	getContext: () => ({ eventEmitter: { subscribeOnMount: handlers => { subscriptions = handlers; } }, stateGame: { scatterCounter: 0 } }),
	stateSoundDerived: { volumeMusic: () => .7, volumeSoundEffect: () => .8 },
	stateBet: { activeBetModeKey: 'base' }, stateModal: {}, HOLD_AND_SPIN_MODE_KEY: 'feature',
	sound: { players: { music: { play() {} }, loop: { play() {} }, once: { play() {} } }, stop() {}, fade() {} },
	waitForTimeout: async () => {}, SECOND: 1000, queueMicrotask,
	setTimeout: callback => { timers.set(++timer, callback); return timer; }, clearTimeout: id => timers.delete(id),
	setInterval: callback => { intervals.set(++timer, callback); return timer; }, clearInterval: id => intervals.delete(id),
};
vm.createContext(sandbox);
vm.runInContext(js + '\nglobalThis.audioTest = { loadCueBuffer, playCnSfx, playCnLoop, stopCnLoop, playBgm, stopBgm, musicLevel };', sandbox);
const api = sandbox.audioTest;
assert(mounted && subscriptions, 'sound component did not register');

await api.loadCueBuffer('reel_stop');
for (let i = 0; i < 9; i++) api.playCnSfx('reel_stop', .7, 1.1);
const voices = sources.filter(s => s.started && !s.stopped && !s.loop);
assert.equal(voices.length, 4, 'rapid reels must have a bounded overlapping voice pool');
assert.equal(voices[0].playbackRate.value, 1.1);
const effectBus = voices[0].connections[0].connections[0];
assert.equal(effectBus.gain.value, .8, 'settings must apply once at the shared effect bus');
const compressor = effectBus.connections[0];
assert.equal(compressor.ratio.value, 4, 'all parallel effects must pass the shared dynamics bus');
assert.equal(compressor.connections[0].gain.value, .82, 'output must retain headroom');
const mixBus = compressor.connections[0].connections[0];
assert.equal(mixBus.connections[0].ratio.value, 16, 'the complete music/effects mix needs final safety protection');

deferDecode = true;
const lateLoop = api.playCnLoop('reel_tension');
for (let i = 0; i < 6; i++) await Promise.resolve();
api.stopCnLoop('reel_tension');
pendingDecodes.splice(0).forEach(resolve => resolve());
await lateLoop;
assert(!sources.some(s => s.loop && !s.stopped), 'a stopped tension request restarted after decoding');

const lateMusic = api.playBgm('base');
for (let i = 0; i < 6; i++) await Promise.resolve();
api.stopBgm();
pendingDecodes.splice(0).forEach(resolve => resolve());
await lateMusic;
assert(!sources.some(s => s.loop && !s.stopped), 'a stopped music request restarted after decoding');

deferDecode = false;
await api.playBgm('freespin');
let music = sources.find(s => s.loop && !s.stopped);
assert(music, 'BGM must use a gapless buffer source');
assert.equal(music.connections[0].connections[0], mixBus, 'music and effects must share final safety protection');
clock = 500;
for (const callback of [...intervals.values()]) callback();
assert(Math.abs(music.connections[0].gain.value - .7 * .72) < 1e-9, 'music settings/headroom');

// A DJ gesture can be interrupted before its decode finishes. It must cancel
// the immediate HTML fallback and must never schedule a late buffered play.
deferDecode = true;
subscriptions.soundDjScratch();
subscriptions.soundBlastFuse();
for (let i = 0; i < 6; i++) await Promise.resolve();
clock = 700;
for (const callback of [...intervals.values()]) callback();
assert(Math.abs(api.musicLevel() - .7 * .72 * .55 * .43) < 1e-9, 'light DJ must keep the groove audible while preserving the independent blast duck');
subscriptions.soundDjScratchStop();
clock = 1000;
for (const callback of [...intervals.values()]) callback();
assert(Math.abs(api.musicLevel() - .7 * .72 * .43) < 1e-9, 'stopping DJ must preserve an active blast duck');
const scratchFallbacks = elements.filter(a => a.src?.split('?')[0].endsWith('/dj_scratch.wav'));
assert(scratchFallbacks.length > 0, 'pending scratch decode must exercise the HTML fallback');
assert(scratchFallbacks.every(a => a.paused), 'interruption leaves an HTML scratch playing');
const sourcesBeforeDecode = sources.length;
pendingDecodes.splice(0).forEach(resolve => resolve());
for (let i = 0; i < 12; i++) await Promise.resolve();
assert.equal(sources.length, sourcesBeforeDecode, 'a scratch started late after interruption/decode');
deferDecode = false;
await api.loadCueBuffer('dj_scratch');
subscriptions.soundDjScratch();
const scratchSource = sources.at(-1);
assert(scratchSource.started && !scratchSource.stopped, 'decoded DJ scratch did not start');
assert.equal(scratchSource.connections[0].gain.value, .52, 'DJ accent must use the reduced mix level');
subscriptions.soundDjScratchStop();
assert(scratchSource.stopped, 'interruption did not stop the decoded scratch');
api.stopBgm();
assert(music.stopped, 'music must release its source on stop');
console.log('PASS: decoded one-shots, 4-voice overlap, safety buses, loop/music cancellation, gapless BGM, DJ interruption before/after decode and independent DJ/blast duck');

// Exercise actual component handlers with a controlled clock and scheduler.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

function load(name, extras = {}, suffix = '') {
	const text = fs.readFileSync(new URL(`../src/components/${name}.svelte`, import.meta.url), 'utf8');
	const script = text.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]
		.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];?/gm, '');
	const emitted = [];
	let handlers;
	const game = { gameType: 'basegame', board: [], splitCutReels: [] };
	const context = {
		stateGame: game,
		stateLayoutDerived: { mainLayout: () => ({ width: 2200, height: 1200 }) },
		stateGameDerived: { boardLayout: () => ({ x: 700, y: 500, width: 900, height: 800, scale: 1 }) },
		eventEmitter: { broadcast: e => emitted.push(e), subscribeOnMount: h => handlers = h },
	};
	const derived = v => v;
	derived.by = f => f();
	const sandbox = vm.createContext({
		$state: v => v, $derived: derived, $effect: () => {},
		onMount: () => {}, onDestroy: () => {}, getContext: () => context,
		stateBet: { isTurbo: false }, stateGame: game,
		performance: { now: () => 100 },
		window: { setTimeout: () => 1 }, clearTimeout: () => {},
		requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
		...extras,
	});
	vm.runInContext(ts.transpile(script + suffix, { target: ts.ScriptTarget.ES2022 }), sandbox);
	return { sandbox, context, game, emitted, get handlers() { return handlers; }, text };
}

// Read the Spine completion callback too: these are the same transitions used
// by the game, rather than a second implementation of the intended policy.
const mascotText = fs.readFileSync(new URL('../src/components/Mascot.svelte', import.meta.url), 'utf8');
const completion = mascotText.match(/complete: \(entry\) => \{([\s\S]*?)\n\t\t\t\t\},/)[1];
const m = load('Mascot', {}, `
globalThis.pose = () => ({ animationName, pendingCheer });
globalThis.complete = (entry) => { ${completion} };
`);
const done = name => m.sandbox.complete({ animation: { name } });
m.handlers.mascotSlash({ finale: false });
m.handlers.winUpdate({ winLevelData: { type: 'big', presentDuration: 2000 } });
assert.equal(m.sandbox.pose().animationName, 'slash', 'win must not interrupt the cut');
assert.equal(m.sandbox.pose().pendingCheer, true);
done('slash');
assert.equal(m.sandbox.pose().animationName, 'cheer');
done('cheer');
assert.equal(m.sandbox.pose().animationName, 'dance');
m.handlers.winHide();
assert.equal(m.sandbox.pose().animationName, 'idle', 'skip must stop celebration immediately');
m.handlers.mascotSlash({ finale: true });
m.handlers.winUpdate({ winLevelData: { type: 'big', presentDuration: 2000 } });
m.handlers.winHide();
done('split_finale');
assert.equal(m.sandbox.pose().animationName, 'idle', 'closed presentation must not replay a queued cheer');
m.handlers.mascotSlash({ finale: false });
m.handlers.mascotSlash({ finale: false });
assert.equal(m.sandbox.pose().animationName, 'slash_alt');
done('slash');
assert.equal(m.sandbox.pose().animationName, 'slash_alt', 'stale completion must not stop the next cut');
console.log('ok action priority, queued cheer, skip, repeated cuts and stale completion');

class Tween {
	constructor(value) { this.current = value; }
	set(value) { this.current = value; }
}
const waits = [];
const r = load('ReelSplits', {
	Tween, cubicOut: v => v, quintOut: v => v,
	waitForTimeout: () => new Promise(resolve => waits.push(resolve)),
	SYMBOL_SIZE: 100, REEL_PADDING: 0, BOARD_DIMENSIONS: { y: 3 },
});
let cut = r.handlers.reelSplit({ reel: 0, finale: false, lead: true });
if (!waits.length) await cut;
r.handlers.reelSplitClear();
waits.shift()();
await cut;
assert.equal(r.game.splitCutReels.length, 0, 'cancelled wind-up must not restore a cut');
cut = r.handlers.reelSplit({ reel: 1, finale: true, lead: true });
waits.shift()();
await new Promise(setImmediate);
r.handlers.reelSplitRestore({ reels: [2] });
waits.shift()();
await cut;
assert.deepEqual(Array.from(r.game.splitCutReels), [2], 'cancelled strike must not overwrite restored state');
assert.equal(r.emitted.filter(e => e.type === 'soundBladeHit').length, 0);
cut = r.handlers.reelSplit({ reel: 0, finale: false, lead: true });
waits.shift()();
await new Promise(setImmediate);
waits.shift()();
await new Promise(setImmediate);
assert.equal(r.emitted.filter(e => e.type === 'soundBladeHit').length, 1);
assert.ok(r.game.splitCutReels.includes(0));
waits.shift()();
await cut;
console.log('ok reset during wind-up/strike, restore isolation and single impact cue');

const swordSource = fs.readFileSync(new URL('../src/game/swordSlash.ts', import.meta.url), 'utf8');
const sword = await import(`data:text/javascript;base64,${Buffer.from(ts.transpile(swordSource, {
	target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022,
})).toString('base64')}`);
for (const width of [320, 700, 1400]) for (const finale of [false, true]) {
	for (let t = -20; t <= 800; t += 1000 / 120) {
		const frame = sword.swordSlashFrame(t, width, finale);
		assert.ok(frame.impact >= 0 && frame.impact <= 1);
		for (const ribbon of frame.ribbons) {
			assert.equal(ribbon.points.length % 2, 0);
			assert.ok(ribbon.points.every(Number.isFinite));
			assert.ok(ribbon.alpha >= 0 && ribbon.alpha <= 1);
		}
	}
}
assert.equal(sword.swordSlashFrame(320, 1000).impact, 1);
assert.equal(sword.swordSlashFrame(192 / .6, 1000).impact, 1);
assert.equal(sword.swordSlashFrame(740, 1000).ribbons.length, 0);
const callbacks = new Map();
let nextId = 0;
const s = load('SwordSlash', {
	...sword,
	requestAnimationFrame: fn => { callbacks.set(++nextId, fn); return nextId; },
	cancelAnimationFrame: id => callbacks.delete(id),
}, 'globalThis.age = () => elapsed;');
s.handlers.reelSplit({ lead: false, finale: false });
assert.equal(s.sandbox.age(), -1, 'only the batch lead may start a central slash');
s.handlers.reelSplit({ lead: true, finale: false });
assert.equal(callbacks.size, 1);
s.handlers.reelSplit({ lead: true, finale: true });
assert.equal(callbacks.size, 1, 'retrigger cancels previous RAF');
const tick = callbacks.values().next().value;
callbacks.clear(); tick(420);
assert.equal(s.sandbox.age(), 320);
s.handlers.reelSplitRestore({ reels: [0] });
assert.equal(s.sandbox.age(), -1);
assert.equal(callbacks.size, 0);
console.log('ok central blade geometry at 120fps, mobile/desktop sizes, exact hit beat and lifecycle');

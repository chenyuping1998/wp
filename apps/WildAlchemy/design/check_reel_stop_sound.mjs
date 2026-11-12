// Regression gate for the five-stop guarantee and tease-only pitch lift.
import fs from 'node:fs';

const state = fs.readFileSync('src/game/stateGame.svelte.ts', 'utf8');
const sound = fs.readFileSync('src/components/Sound.svelte', 'utf8');
const callback = state.match(/onReelStopping:\s*\(\) => \{([\s\S]*?)\n\t\t\},\n\t\tonSymbolLand/)?.[1] ?? '';

const failures = [];
if (!callback) failures.push('cannot find onReelStopping callback');
if (/stickyWildReels[\s\S]{0,80}return/.test(callback)) failures.push('sticky reel still skips its stop sound');
// Wild Alchemy (SPEC §2.2): a merged block lands as ONE wide reel — its first
// reel plays the raised stop, the reels it swallowed play nothing. Ordinary
// reels keep the unified stop; the tease pitch is for blocks (and teases).
if (!callback.includes("teasing || block ? 'sfx_reel_stop_tease' : 'sfx_reel_stop'")) failures.push('block/tease routing is missing');
if (!callback.includes('if (block && reelIndex !== block.reel) return;')) failures.push('a swallowed reel still plays its own stop');
if (!sound.includes('const REEL_STOP_MIN_GAP = 0.072')) failures.push('audio-clock stop scheduler is missing');
if (!sound.includes("sfx_reel_stop: { name: 'reel_stop', volume: 0.38, rate: 1 }")) failures.push('normal stop is not unified at rate 1');
// 2026-11-10: the block landing has its own heavier sound (reel_stop_block.wav,
// design/generate_wild_alchemy_audio.py) instead of the stop pitched up 1.18x.
// It still goes through the same 72ms audio-clock queue as the reel stops.
if (!sound.includes("sfx_reel_stop_tease: { name: 'reel_stop_block', volume: 0.6, rate: 1 }")) failures.push('block stop is not routed to reel_stop_block');
if (!sound.includes('playReelStop(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1)')) failures.push('block stop bypasses the reel-stop queue');

if (failures.length) {
	console.error('FAIL: reel-stop sound contract');
	failures.forEach((failure) => console.error(`  - ${failure}`));
	process.exit(1);
}
console.log('OK: unified reel stops, one block-landing sound per merged block; 72ms collision spacing');

// Regression gate for the five-stop guarantee and tease-only pitch lift.
import fs from 'node:fs';

const state = fs.readFileSync('src/game/stateGame.svelte.ts', 'utf8');
const sound = fs.readFileSync('src/components/Sound.svelte', 'utf8');
const callback = state.match(/onReelStopping:\s*\(\) => \{([\s\S]*?)\n\t\t\},\n\t\tonSymbolLand/)?.[1] ?? '';

const failures = [];
if (!callback) failures.push('cannot find onReelStopping callback');
if (/stickyWildReels[\s\S]{0,80}return/.test(callback)) failures.push('sticky reel still skips its stop sound');
if (!callback.includes("teasing ? 'sfx_reel_stop_tease' : 'sfx_reel_stop'")) failures.push('tease-only routing is missing');
if (!sound.includes('const REEL_STOP_MIN_GAP = 0.072')) failures.push('audio-clock stop scheduler is missing');
if (!sound.includes("sfx_reel_stop: { name: 'reel_stop', volume: 0.38, rate: 1 }")) failures.push('normal stop is not unified at rate 1');
if (!sound.includes("sfx_reel_stop_tease: { name: 'reel_stop', volume: 0.46, rate: 1.18 }")) failures.push('tease stop is not the single raised pitch');

if (failures.length) {
	console.error('FAIL: reel-stop sound contract');
	failures.forEach((failure) => console.error(`  - ${failure}`));
	process.exit(1);
}
console.log('OK: five unified reel stops; tease-only 1.18x pitch; 72ms collision spacing');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REEL_STOP_RATES,reelStopRate} from '../src/game/reelFeedback.ts';
const state=fs.readFileSync('src/game/stateGame.svelte.ts','utf8');
const sound=fs.readFileSync('src/components/Sound.svelte','utf8');
assert.equal(REEL_STOP_RATES.length,5);
for(let i=0;i<5;i++){
 assert.ok(reelStopRate(i)>0&&reelStopRate(i)<1.5);
 if(i)assert.ok(reelStopRate(i)>reelStopRate(i-1)*1.09,'each column has an audible pitch step');
 assert.ok(reelStopRate(i,true)>reelStopRate(i),'anticipation adds a lift');
}
assert.ok(state.includes("type: 'soundReelLand', reelIndex"),'all physical stops identify their reel');
assert.ok(sound.includes("soundReelLand:({reelIndex,teasing})=>playCnSfx('reel_stop'"),'physical stops play immediately, including simultaneous turbo stops');
console.log('OK: five distinct landing pitches, tease lift and immediate physical-stop routing');

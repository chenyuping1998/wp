// Pearl drop / collect timing (src/game/hypnoWatchTiming.ts drives the dragon pearls) and the
// mock-wallet book contract. The cast-side release window is checked in check_cast_transitions.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { tumbleTiming } from '../src/game/animationTimeline.ts';
import { fallDuration } from '../src/game/symbolMotion.ts';
const source=readFileSync(new URL('../src/game/hypnoWatchTiming.ts',import.meta.url),'utf8').replace("'./animationTimeline'",JSON.stringify(new URL('../src/game/animationTimeline.ts',import.meta.url).href));
const {watchDropTiming,watchCollectTiming}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'strip'})).toString('base64'));
let cases=0;
for(const freegame of [false,true])for(const turbo of [false,true])for(const chain of [1,4,8])for(let reel=0;reel<6;reel++)for(let rows=1;rows<=5;rows++){
 const tumble=tumbleTiming({chain,turbo});
 const drop=watchDropTiming({freegame,turbo,crumbleMs:tumble.clearMs,fallMs:fallDuration(rows,tumble.dropMs),columnDelayMs:reel*tumble.columnStaggerMs});
 assert.ok(drop.gapMs>=0);
 assert.ok(drop.firstLandMs+1e-6>=drop.releaseMs+drop.leadMs,'A pearl cannot land before the casting gesture plus its lead');
 if(drop.gapMs>0)assert.ok(Math.abs(drop.firstLandMs-drop.releaseMs-drop.leadMs)<1e-6);
 cases++;
}
for(const turbo of [false,true])for(const carriesTotal of [false,true])for(let count=1;count<=3;count++){
 const plan=watchCollectTiming({turbo,carriesTotal,watchCount:count});
 assert.equal(plan.totalFlyMs>0,carriesTotal);
 assert.ok(plan.holdMs>0&&plan.collapseMs>0&&plan.formulaMs>plan.totalFlyMs);
}
const books=JSON.parse(readFileSync(new URL('../src/dev/devBooks.json',import.meta.url),'utf8'));
let checked=0;
for(const list of Object.values(books))for(const book of list){
 const final=book.state.findLast(event=>event.type==='finalWin');
 assert.equal(final.amount,book.payoutMultiplier,'Mock wallet and visible final win must use the same book amount unit');checked++;
}
console.log(`Pearl timing passed: ${cases} refill timings (MG/FG, normal/turbo), collect plans, ${checked} book payout contracts.`);

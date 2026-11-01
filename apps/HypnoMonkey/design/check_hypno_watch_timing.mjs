import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { medusaAnimations, tumbleTiming } from '../src/game/animationTimeline.ts';
import { fallDuration } from '../src/game/symbolMotion.ts';
const source=readFileSync(new URL('../src/game/hypnoWatchTiming.ts',import.meta.url),'utf8').replace("'./animationTimeline'",JSON.stringify(new URL('../src/game/animationTimeline.ts',import.meta.url).href));
const js=stripTypeScriptTypes(source,{mode:'strip'});
const {watchDropTiming,watchCollectTiming,castReleaseRate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const rig=JSON.parse(readFileSync(new URL('../src/game/hypnoCastData.json',import.meta.url),'utf8'));
const release=rig.animations.gaze.events.find(event=>event.name==='throw').time*1000;
assert.equal(medusaAnimations.gaze.releaseAtMs,release,'MG presentation must match the actual Spine throw event');
const assistant=JSON.parse(readFileSync(new URL('../src/game/hypnoAssistantData.json',import.meta.url),'utf8'));
const assistantRelease=assistant.animations.gaze.events.find(event=>event.name==='throw').time*1000;
for(const name of ['gaze','gaze_turbo','fg_gaze','fg_gaze_turbo'])assert.ok(Math.abs((name.startsWith('fg_')?assistantRelease:release)/castReleaseRate(name)-medusaAnimations[name].releaseAtMs)<1e-6,'Actual cast throw event must match its MG/FG normal/turbo book beat');
let cases=0;
for(const freegame of [false,true])for(const turbo of [false,true])for(const chain of [1,4,8])for(let reel=0;reel<6;reel++)for(let rows=1;rows<=5;rows++){
 const tumble=tumbleTiming({chain,turbo});
 const input={freegame,turbo,crumbleMs:tumble.clearMs,fallMs:fallDuration(rows,tumble.dropMs),columnDelayMs:reel*tumble.columnStaggerMs};
 const drop=watchDropTiming(input);
 assert.ok(drop.gapMs>=0);
 assert.ok(drop.firstLandMs+1e-6>=drop.releaseMs+drop.leadMs,'A watch cannot land before the casting gesture plus its lead');
 if(drop.gapMs>0)assert.ok(Math.abs(drop.firstLandMs-drop.releaseMs-drop.leadMs)<1e-6);
 cases++;
}
for(const turbo of [false,true])for(const carriesTotal of [false,true])for(let watchCount=1;watchCount<=3;watchCount++){
 const plan=watchCollectTiming({turbo,carriesTotal,watchCount});
 assert.equal(plan.totalFlyMs>0,carriesTotal);
 assert.ok(plan.holdMs>0&&plan.collapseMs>0&&plan.formulaMs>plan.totalFlyMs);
}
const books=JSON.parse(readFileSync(new URL('../src/dev/devBooks.json',import.meta.url),'utf8'));
let checked=0;
for(const list of Object.values(books))for(const book of list){
 const final=book.state.findLast(event=>event.type==='finalWin');
 assert.equal(final.amount,book.payoutMultiplier,'Mock wallet and visible final win must use the same book amount unit');checked++;
}
console.log(`Hypno watch checks passed: Spine release ${release}ms, ${cases} refill timings, MG/FG normal/turbo, ${checked} book payout contracts.`);

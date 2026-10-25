import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FoleyGate,MusicDuckWindow,TREASURE_FOLEY} from '../src/game/treasureAudioDirection.ts';
import {lineTravel,linePose} from '../src/game/treasureLineMotion.ts';
const gate=new FoleyGate();
assert.equal(Array.from({length:20},()=>gate.admit('plaque_flip',1000)).filter(Boolean).length,1,'one accent for simultaneous grid flips');
assert.equal(gate.admit('plaque_flip',1069),false);assert.equal(gate.admit('plaque_flip',1070),true);
assert.equal(gate.admit('chest_open',1070),true,'distinct physical events remain audible');
const duck=new MusicDuckWindow();
assert.deepEqual(duck.request(10,4,.45),{until:14,level:.45});
assert.deepEqual(duck.request(11,.2,.72),{until:14,level:.45},'short foley cannot release a long flourish');
assert.deepEqual(duck.request(15,.6,.72),{until:15.6,level:.72});duck.reset();assert.equal(duck.level,1);
for(const [name,detail] of Object.entries(TREASURE_FOLEY)){
 assert.ok(detail.volume>0&&detail.volume<.6);assert.ok(detail.gap>=70);
 assert.ok(fs.existsSync(`static/assets/audio/treasure/sfx/${name}.wav`));
}
const book=fs.readFileSync('src/game/bookEventHandlerMap.ts','utf8');assert.ok(!book.includes("name: 'jng_intro_fs'"),'opening animation owns the FG jingle');
const runner=fs.readFileSync('src/components/WinLineRunner.svelte','utf8');assert.ok(runner.includes('subscribePresentationFrame')&&!runner.includes('key="fxStar"'),'actual payline runner uses the beach style and shared clock');
const points=[{x:59,y:177},{x:177,y:177},{x:295,y:295},{x:413,y:177},{x:531,y:177}];
for(const step of [8,16,90,720]){
 let last=-1,previous=0;const reported=[];
 for(let time=0;time<=1520;time+=step){
  const p=lineTravel(time,80,540),pose=linePose(points,p);assert.ok(p>=previous-1e-10&&p>=0&&p<=1);previous=p;
  assert.ok(Object.values(pose).every(Number.isFinite));
  if(time>=80)for(let reel=last+1;reel<=pose.reel;reel++){reported.push(reel);last=reel;}
 }
 assert.deepEqual(reported,[0,1,2,3,4],'dropped frames still report all five reels once');
}
assert.equal(lineTravel(80,80,540),0);assert.equal(lineTravel(620,80,540),1);
assert.equal(linePose(points,1).x,531);assert.equal(linePose(points,0).x,59);
console.log('OK: foley collision budget, music hold/release, single FG jingle owner and themed runner');

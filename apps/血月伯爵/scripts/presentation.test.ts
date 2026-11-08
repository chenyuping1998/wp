import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BOARD,tileRect} from '../src/game/geometry.ts';
import {timingFor,outcomeAt,reelMotion,revealAudioCues,CueCursor,characterSpec,WILD_LOOP_AT,WILD_LOOP_MS,phaseAudioCues,winDuration,winTier,scoreAt,backgroundMix,collectionVisual,celebrationStages,FREE_START_MS,FREE_END_MS} from '../src/game/presentation.ts';
const data=JSON.parse(fs.readFileSync(new URL('../static/data/demo-books.json',import.meta.url),'utf8'));
const books=[...Object.values(data.modes).flat(),...Object.values(data.scenarios)] as any[];
const assets=JSON.parse(fs.readFileSync(new URL('../static/bloodmoon/manifest.json',import.meta.url),'utf8'));

test('every recorded WILD result and merge finishes before the presentation resolves',()=>{
 let reveals=0;
 for(const book of books)for(const reveal of book.events.filter((e:any)=>e.type==='reveal')){
  for(const turbo of [false,true]){
   const t=timingFor(reveal,turbo);
   for(const step of reveal.mergePlan)assert.ok(t.stopAt>=1500+step.delayMs+step.durationMs);
   if(reveal.wildPlan.triggered){let previous=-1;for(let i=0;i<reveal.wildPlan.targets.length;i++){
    const at=outcomeAt(reveal,i,turbo);assert.ok(at>=previous);assert.ok(at+1000<=t.duration);previous=at;
   }assert.ok(t.backAt+1530<=t.duration);}
   for(const cue of revealAudioCues(reveal,turbo))assert.ok(cue.at>=0&&cue.at<=t.duration);
  }reveals++;
 }assert.ok(reveals>400);
});

test('the padded reel strip moves continuously and lands without a one-cell jump',()=>{
 for(const stop of [650,1300,1500,1700,1900,2100,2300,5200])for(const h of [100,108,200,216,300,324,600,648]){
  let previous=Infinity;
  for(let clock=0;clock<stop;clock++){
   const m=reelMotion(clock,stop,h);
   assert.ok(m.remaining<=previous);
   if(Number.isFinite(previous))assert.ok(previous-m.remaining<10,'physical strip translation jumped');
   assert.ok(m.offset<=0&&m.offset>=-h);previous=m.remaining;
  }
  assert.equal(reelMotion(stop,stop,h).offset,0);
  assert.ok(Math.abs(reelMotion(stop+280,stop,h).offset)<1e-10);
  assert.equal(reelMotion(stop+1000,stop,h).remaining,0);
 }
});

test('square tiles, large symbols and clipped heads cover every cell exactly once',()=>{
 assert.equal(BOARD.frameSide-BOARD.framePad*2,BOARD.side);
 for(const book of books)for(const reveal of book.events.filter((event:any)=>event.type==='reveal')){
  const rectangles=reveal.bars.flatMap((bar:any)=>bar.icons.map((_:number,i:number)=>tileRect(bar.col,i*bar.size-bar.head,bar.size)));
  for(const rect of rectangles)assert.equal(rect.width,rect.height,'a large symbol was stretched');
  for(let col=0;col<6;col++)for(let row=0;row<6;row++){
   const x=(col+.5)*BOARD.cell,y=(row+.5)*BOARD.cell;
   assert.equal(rectangles.filter((rect:any)=>x>=rect.x&&x<rect.x+rect.width&&y>=rect.y&&y<rect.y+rect.height).length,1,`hole/overlap at ${col},${row}`);
  }
 }
});

test('a second book with reveal index zero still gets its own audio cues',()=>{
 const cursor=new CueCursor(),cues=[{at:0,key:'ngStart'},{at:400,key:'CharaWild'}];
 assert.equal(cursor.take('round1/spin',0,cues).length,1);
 assert.equal(cursor.take('round1/spin',0,cues).length,0);
 assert.equal(cursor.take('round1/spin',200,cues).length,0);
 assert.equal(cursor.take('round1/spin',400,cues).length,1);
 assert.equal(cursor.take('round2/spin',0,cues).length,1);
 assert.deepEqual(cursor.take('round2/spin',5000,cues,true),[]);
 assert.deepEqual(cursor.take('round2/spin',5000,cues),[]);
});

test('returning from a hidden tab does not burst missed sounds',()=>{
 const cursor=new CueCursor(),cues=[{at:0,key:'ngStart'},{at:400,key:'CharaWild'},{at:900,key:'WildHuntWord'},{at:3000,key:'CharaBack'}];
 assert.equal(cursor.take('round/spin',0,cues).length,1);
 assert.deepEqual(cursor.take('round/spin',3050,cues),[{at:3000,key:'CharaBack'}]);
 assert.deepEqual(cursor.take('round/spin',3100,cues),[]);
});

test('normal/turbo keep the WILD phases and large-reel merge pauses intact',()=>{
 const reveal=data.scenarios.merge.events.find((e:any)=>e.type==='reveal');
 assert.equal(timingFor(reveal,false).stopAt,timingFor(reveal,true).stopAt);
 const wild=data.scenarios.wild.events.find((e:any)=>e.type==='reveal');
 assert.equal(timingFor(wild,false).attackAt,timingFor(wild,true).attackAt);
 assert.equal(timingFor(wild,false).backAt,timingFor(wild,true).backAt);
});

test('both vampire variants finish complete loops and enter Back at its first frame',()=>{
 for(const book of books)for(const reveal of book.events.filter((e:any)=>e.type==='reveal'&&e.wildPlan.triggered)){
  for(const turbo of [false,true])for(const variant of [1,2]){
   const r={...reveal,wildPlan:{...reveal.wildPlan,variant}},t=timingFor(r,turbo);
   assert.equal((t.attackAt-WILD_LOOP_AT)%WILD_LOOP_MS,0,'Out cuts a Loop mid-pose');
   assert.equal(characterSpec('spin',399,0,r,turbo).name,'Idle');
   assert.equal(characterSpec('spin',400,0,r,turbo).elapsed,0);
   assert.equal(characterSpec('spin',t.attackAt-1,0,r,turbo).name,`WildTrans_0${variant}_Loop`);
   assert.deepEqual(characterSpec('spin',t.attackAt,0,r,turbo),{name:`WildTrans_0${variant}_Out`,elapsed:0,loop:false});
   assert.deepEqual(characterSpec('spin',t.backAt,0,r,turbo),{name:'WildTrans_Back',elapsed:0,loop:false});
   assert.ok(t.duration-t.backAt>=1530,'Back gets cut before its last frame');
  }
 }
});

test('all recorded phase cues exist, stay inside their phase and match celebration stages',()=>{
 for(const book of books)for(const event of book.events)for(const turbo of [false,true]){
  const phase=event.type==='winInfo'?'win':event.type==='freeProgress'?'progress':event.type;
  const duration=phase==='win'?winDuration(event.payout,turbo):phase==='progress'?(event.addedSpins?2300:1050):phase==='freeStart'?FREE_START_MS:phase==='freeEnd'?FREE_END_MS:0;
  const cues=phase==='reveal'?revealAudioCues(event,turbo):phaseAudioCues(phase,duration,event.payout??0,event.multiplier??1,phase==='progress'?event:null);
  const limit=phase==='reveal'?timingFor(event,turbo).duration:duration;
  for(const cue of cues){assert.ok(assets.audio[cue.key],`missing sound ${cue.key}`);assert.ok(cue.at>=0&&cue.at<limit,`${cue.key} escaped ${phase}`);}
  if(phase==='win')for(const stage of celebrationStages(event.payout,duration))assert.ok(cues.some(c=>c.at===stage.at+240&&c.key.endsWith('_Start')));
 }
});

test('score counters reach the exact payout monotonically, including Turbo and multiplied wins',()=>{
 for(const payout of [0,5,80,1300,2000,5000,10000,20000,49600])for(const multiplier of [1,2,12])for(const turbo of [false,true]){
  const duration=winDuration(payout,turbo);let previous=0;
  for(let clock=0;clock<=duration;clock+=7){const amount=scoreAt(payout,payout/multiplier,multiplier,clock,duration);assert.ok(amount>=previous-1e-8&&amount<=payout+1e-8);previous=amount;}
  assert.equal(scoreAt(payout,payout/multiplier,multiplier,duration,duration),payout);
 }
 assert.equal(winTier(1999),null);assert.equal(winTier(2000),'big');assert.equal(winTier(20000),'epic');
 assert.equal(celebrationStages(49600,winDuration(49600)).at(-1)?.tier,'epic');
 assert.equal(characterSpec('win',1600,49600,null).name,'Idle','celebration must not freeze the final video frame');
});

test('FG background transitions meet the next phase without a cut',()=>{
 assert.equal(backgroundMix('freeStart',true,0),0);assert.equal(backgroundMix('freeStart',true,FREE_START_MS),1);
 assert.equal(backgroundMix('freeEnd',true,0),1);assert.equal(backgroundMix('freeEnd',true,FREE_END_MS),0);
 for(let clock=0;clock<=FREE_START_MS;clock+=13){assert.ok(backgroundMix('freeStart',true,clock)>=0&&backgroundMix('freeStart',true,clock)<=1);assert.ok(backgroundMix('freeEnd',true,clock)>=0&&backgroundMix('freeEnd',true,clock)<=1);}
 const before={points:10,stage:0,multiplier:1,spinsPlayed:0,spinsTotal:6},after={points:46,stage:3,multiplier:5,spinsPlayed:1,spinsTotal:15};
 let last=10;for(let clock=0;clock<=1000;clock+=10){const visual=collectionVisual(before,after,clock);assert.ok(visual.points>=last&&visual.fill>=0&&visual.fill<1);last=visual.points;}
 assert.equal(last,46);
});

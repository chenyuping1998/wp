import assert from 'node:assert/strict';
import {motionTrack,CastPerformer,castPose,castDuration,gridSymbolTime,symbolContact} from '../src/game/treasureMotion.ts';
import {PresentationClock} from '../src/game/presentationClock.ts';
// The old cubic joined positions/velocities but jumped acceleration at keys.
const keys=[[0,0],[100,1],[300,.5],[500,.5],[650,0]],h=.001;
for(const [t] of keys.slice(1,-1)){
 const p=motionTrack(t,keys),a=motionTrack(t-h,keys),b=motionTrack(t+h,keys);
 assert.ok(Math.abs((p-a)/h-(b-p)/h)<1e-6,'velocity joins');
 const left=(p-2*a+motionTrack(t-2*h,keys))/h**2,right=(motionTrack(t+2*h,keys)-2*b+p)/h**2;
 assert.ok(Math.abs(left-right)<2e-6,'acceleration joins');
}
for(const who of ['digger','lifeguard']){
 const performer=new CastPerformer();performer.trigger(0,'scan',who);
 for(const [time,cue] of [[420,'winBig'],[590,'scan'],[870,'welcome'],[1150,'win'],[1290,'idle']]){
  const before=performer.sample(time),past=performer.sample(time-.01);
  performer.trigger(time,cue,who);
  const after=performer.sample(time),next=performer.sample(time+.01);
  for(const key of ['body','head','left','right','tail','dy']){
   assert.ok(Math.abs(before[key]-after[key])<1e-9,'interrupted pose continuous');
   assert.ok(Math.abs((before[key]-past[key])/.01-(next[key]-after[key])/.01)<.00005,`interrupted velocity retained: ${who} ${time} ${key} ${((before[key]-past[key])-(next[key]-after[key]))/.01}`);
  }
 }
 for(const cue of ['scan','win','winBig','welcome']){
  const end=castDuration(cue),a=castPose(end-.001,cue,end-.001,false,who),b=castPose(end+.001,cue,end+.001,false,who);
  for(const key of ['body','head','tail','dy'])assert.ok(Math.abs(a[key]-b[key])<.0001,'no reaction-to-idle snap');
 }
 const rapid=new CastPerformer();rapid.trigger(0,'idle',who);
 for(const cue of ['scan','winBig','welcome','win','idle']){
  const before=rapid.sample(3000);rapid.trigger(3000,cue,who);const after=rapid.sample(3000),next=rapid.sample(3000+.01);
  for(const key of ['body','head','left','right','tail','dy']){assert.ok(Math.abs(before[key]-after[key])<1e-9);assert.ok(Math.abs(next[key]-after[key])<.001,'same-frame retriggers do not manufacture a velocity impulse');}
 }
}
for(let reel=0;reel<5;reel++)for(let row=1;row<=4;row++){
 const cell={reel,row};let previous=0;
 for(let t=0;t<=970;t++){const local=gridSymbolTime(t,cell);assert.ok(local>=previous&&local<=970);previous=local;}
 assert.equal(gridSymbolTime(970,cell),970,'stagger stays inside completion contract');
}
assert.equal(symbolContact('L1'),-.22);assert.equal(symbolContact('H1'),.30);
let now=0,hidden=false,id=0,visibility,requests=0;
const pending=new Map();
const clock=new PresentationClock({request:fn=>{pending.set(++id,fn);requests++;return id;},cancel:id=>pending.delete(id),now:()=>now,hidden:()=>hidden,visibility:fn=>{visibility=fn;return()=>visibility=undefined;}});
const advance=time=>{now=time;const jobs=[...pending.values()];pending.clear();jobs.forEach(fn=>fn(time));};
const frames=[];const stops=Array.from({length:20},()=>clock.subscribe(dt=>frames.push(dt)));
assert.equal(requests,1,'twenty cells share one pending frame');advance(16);assert.equal(frames.length,20);assert.ok(frames.every(dt=>dt===16));
hidden=true;now=20;visibility();advance(5000);hidden=false;now=6000;visibility();advance(6016);assert.equal(frames.at(-1),16,'hidden duration excluded');
stops.forEach(stop=>{stop();stop();});assert.equal(pending.size,0);assert.equal(visibility,undefined);
let stopFirst;stopFirst=clock.subscribe(()=>{stopFirst();clock.subscribe(()=>{});});advance(6032);assert.equal(pending.size,1,'resubscribe inside tick must not fork clocks');
console.log('OK: C2 pose tracks, continuous interrupted velocities, idle recovery, 20-cell timing and one shared visibility-safe clock');

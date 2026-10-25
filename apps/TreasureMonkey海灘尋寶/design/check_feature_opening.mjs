import assert from 'node:assert/strict';
import {FeatureOpeningTimeline,featureOpeningPose,OPENING} from '../src/game/featureOpening.ts';
import {chestHinge} from '../src/game/treasureChestMotion.ts';
assert.ok(chestHinge(OPENING.chestSound-OPENING.chestStart)>.98,'chest sound meets the actual hinge release within the 4ms baked sample interval');
assert.ok(chestHinge(OPENING.chestSound-OPENING.chestStart-60)<.5,'sound is not early in the anticipation');
for(const step of [8,16,33,80,OPENING.end]){
 const events=[];const timeline=new FeatureOpeningTimeline({sound:s=>events.push(s),cover:()=>events.push('cover'),complete:()=>events.push('complete')});
 for(let t=0;t<OPENING.end+step;t+=step)timeline.advance(step);
 timeline.advance(OPENING.end);timeline.skip();
 assert.deepEqual(events,['scan','find','chest','celebrate','wave','cover','complete'],'ordered once-only cues across frame rates');
 assert.equal(timeline.time,OPENING.end);
}
for(const age of [0,1500,3500,3800]){
 const events=[];const timeline=new FeatureOpeningTimeline({cover:()=>events.push('cover'),complete:()=>events.push('complete')});
 timeline.advance(age);timeline.skip();timeline.skip();timeline.advance(5000);
 assert.deepEqual(events,['cover','complete'],'skip reaches card exactly once, including reduced motion at zero');
}
const events=[],cancelled=new FeatureOpeningTimeline({sound:s=>events.push(s),cover:()=>events.push('cover'),complete:()=>events.push('complete')});
cancelled.cancel();cancelled.advance(5000);cancelled.skip();assert.deepEqual(events,[],'unmount cancels every pending cue');
for(let t=0;t<=OPENING.end;t+=8){
 const p=featureOpeningPose(t);for(const key of ['camera','light','chest','title','titleY','actorTime'])assert.ok(Number.isFinite(p[key]));
 assert.ok(p.camera>=1&&p.camera<=1.055);assert.ok(p.light>=0&&p.light<=1);assert.ok(p.chest>=0&&p.chest<=1);
 const reduced=featureOpeningPose(t,true);assert.equal(reduced.camera,1);assert.equal(reduced.titleY,0);
}
assert.equal(OPENING.cover-OPENING.wave,500,'swap only under completely opaque surf');
assert.equal(OPENING.end-OPENING.wave,1280,'preserve full cover/hold/reveal contract');
console.log('OK: FG cues, skip/reduced motion, cancellation, finite poses and covered card handoff');

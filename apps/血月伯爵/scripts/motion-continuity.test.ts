import test from 'node:test';import assert from 'node:assert/strict';
import {winMotion,WIN_IMPACT} from '../src/game/winMotion.ts';
import {reelMotion} from '../src/game/presentation.ts';
import {MotionClock} from '../src/game/motionClock.ts';

test('title contact and reel landing have continuous position and velocity',()=>{
 const h=.01,at=(age:number)=>winMotion(age,age+320,11800);
 const before=at(WIN_IMPACT-h),contact=at(WIN_IMPACT),after=at(WIN_IMPACT+h);
 for(const key of ['titleY','scaleX','scaleY','plateY','plateScale','shake'] as const){
  assert.ok(Math.abs(after[key]-before[key])<.01,`${key}: contact teleports`);
  assert.ok(Math.abs((contact[key]-before[key])/h-(after[key]-contact[key])/h)<.001,`${key}: contact velocity jumps`);
 }
 for(const stop of [650,2300,4000])for(const cell of [108,324,648]){
  const pre=reelMotion(stop-h,stop,cell),post=reelMotion(stop+h,stop,cell);
  assert.ok(Math.abs(pre.offset)<.001&&Math.abs(post.offset)<.001,'landing kicks at contact');
  assert.ok(Math.abs(reelMotion(stop+280-h,stop,cell).offset)<.001,'settle ends abruptly');
 }
});

test('hidden-tab time pauses motion and repeated visibility events do not double count',()=>{
 const clock=new MotionClock(1000);
 assert.equal(clock.read(1500),500);
 clock.setHidden(true,1600);clock.setHidden(true,1700);
 assert.equal(clock.read(60000),600);
 clock.setHidden(false,61000);clock.setHidden(false,61500);
 assert.equal(clock.read(62000),1600);
 assert.equal(clock.read(61990),1600,'an older rAF stamp must not reverse time');
 clock.setHidden(true,62500);clock.setHidden(false,63000);
 assert.equal(clock.read(63500),2600);
});

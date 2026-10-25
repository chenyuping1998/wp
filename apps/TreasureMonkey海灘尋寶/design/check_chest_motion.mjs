import assert from 'node:assert/strict';
import {chestHinge,chestCoin,chestLight} from '../src/game/treasureChestMotion.ts';
assert.equal(chestHinge(0),0);assert.equal(chestHinge(970),0);
assert.ok(chestHinge(155)<-.04,'hinge compresses before release');
assert.ok(chestHinge(330)>1,'release carries a small damped overshoot');
assert.ok(chestHinge(470)>.95,'open pose remains readable');
assert.ok(chestHinge(850)<chestHinge(650),'controlled recovery');
for(let t=0;t<=970;t++){
 assert.ok(Number.isFinite(chestHinge(t))&&Math.abs(chestHinge(t))<1.1,'bounded hinge');
 assert.ok(Math.abs(chestHinge(t,true)-chestHinge(t)*.25)<1e-10);
 assert.ok(chestLight(t)>=0&&chestLight(t)<=1);
 for(let i=0;i<5;i++){
  const p=chestCoin(i,t),r=chestCoin(i,t,true);
  assert.ok(Object.values(p).every(Number.isFinite),'finite coin');
  assert.ok(Math.abs(p.x)<.17&&p.y>=-.34&&p.y<=-.1,'arc fits cell');
  assert.ok(p.opacity>=0&&p.opacity<=1&&p.glint<=p.opacity,'local light only');
  assert.equal(r.opacity,0,'reduced omits flying coins');
 }
}
for(let i=0;i<5;i++)for(const t of [0,970])assert.equal(chestCoin(i,t).opacity,0,'no residual coins at either end');
const signatures=Array.from({length:5},(_,i)=>JSON.stringify(chestCoin(i,400)));
assert.equal(new Set(signatures).size,5,'five distinct flips and arcs');
console.log('OK: generator hinge, readable hold, five staggered coin flips, bounded local light, exact rest and reduced motion');

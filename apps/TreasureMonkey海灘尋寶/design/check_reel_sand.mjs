import assert from 'node:assert/strict';
import { ReelSand } from '../src/game/reelSand.ts';
const centers=[59,177,295,413,531], floor=469;
const advance=(sand, active, frames, turbo=false, reduced=false) => {
 for(let i=0;i<frames;i++) {
  sand.step(1/60,active,centers,floor,turbo,reduced);
  assert.ok(sand.grains.length<=180, 'bounded particle budget');
  assert.ok(sand.grains.every(g=>Number.isFinite(g.x+g.y+g.vx+g.vy)&&g.y<floor+5), 'finite particles remain above the sand floor');
 }
};
const spinning=centers.map(()=>true), stopped=centers.map(()=>false);
const normal=new ReelSand(), turbo=new ReelSand(), reduced=new ReelSand();
advance(normal,spinning,120); advance(turbo,spinning,120,true); advance(reduced,spinning,120,false,true);
assert.ok(normal.grains.length>0, 'spinning emits sand continuously');
assert.ok(turbo.grains.length<normal.grains.length, 'turbo has a lighter budget');
assert.ok(reduced.grains.length<turbo.grains.length, 'reduced motion is quieter');
const before=normal.grains.length;
normal.step(0,stopped,centers,floor);
assert.ok(normal.grains.length>before, 'five-reel stop emits an impact burst');
const after=normal.grains.length;
normal.step(0,stopped,centers,floor);
assert.equal(normal.grains.length,after,'stop transition bursts only once');
advance(normal,stopped,100);
assert.equal(normal.grains.length,0,'no sand remains after settling');
advance(normal,stopped,120);
assert.equal(normal.grains.length,0,'idle never emits');
normal.clear();
assert.equal(normal.grains.length,0);
console.log('OK: continuous reel sand / single stop bursts / normal, Turbo and reduced budgets / floor / settling / 180-particle cap');

import assert from 'node:assert/strict';
import {multiplierFlip,detectorHandoff,MULTIPLIER_FLIP_MS} from '../src/game/treasureMechanicMotion.ts';
const rest=multiplierFlip(-1);
assert.deepEqual(multiplierFlip(MULTIPLIER_FLIP_MS),rest,'number and plate settle completely');
assert.equal(multiplierFlip(0).oldAlpha,1);assert.equal(multiplierFlip(0).newAlpha,0);
for(let t=0;t<=MULTIPLIER_FLIP_MS;t++){
 const p=multiplierFlip(t);assert.ok(Object.values(p).every(Number.isFinite));
 assert.ok(p.oldAlpha>=0&&p.oldAlpha<=1&&p.newAlpha>=0&&p.newAlpha<=1);
 assert.ok(p.newScale>=.94&&p.newScale<=1.081&&p.plateY>=.95&&p.plateY<=1.036);
 assert.deepEqual(multiplierFlip(t,true),rest,'reduced motion reveals authoritative value without roll');
}
const before=detectorHandoff(1-1e-7,0),after=detectorHandoff(1,0);
assert.ok(Math.abs(before.acquisition-after.acquisition)<1e-6,'preparation cannot disappear at the handoff');
assert.equal(after.beam,0);assert.ok(detectorHandoff(1,.04).acquisition>0&&detectorHandoff(1,.04).beam>0,'acquisition and first beam overlap');
assert.equal(detectorHandoff(1,.15).acquisition,0);assert.equal(detectorHandoff(1,1).beam,1);
for(let p=0;p<=1;p+=.001){const f=detectorHandoff(1,p);assert.ok(Object.values(f).every(Number.isFinite));assert.ok(f.beam>=0&&f.beam<=1&&f.acquisition>=0&&f.acquisition<=.8);}
console.log('OK: readable multiplier handoff, bounded settle/reduced motion and continuous detector acquisition');

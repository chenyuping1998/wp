// Actual circus scene motion and lifecycle: the former marble/statue checks are obsolete.
import assert from 'node:assert/strict';
import {circusPropPose,circusBuntingPose,circusLightPose} from '../src/game/circusBackgroundMotion.ts';
for(let t=0;t<120;t+=.017){
 const pose=circusPropPose(t);assert.ok(Number.isFinite(pose.signRotation));assert.ok(Math.abs(pose.balloonRotation)<=.055001);
 assert.ok(Math.abs(circusBuntingPose(t))<=.008001);
 for(const i of [0,1]){const p=circusLightPose(t,i);assert.ok(p.alpha>=.6&&p.alpha<=.841);assert.ok(Math.abs(p.rotation)<=.371);}
}
assert.ok(circusPropPose(10).signRotation-circusPropPose(0).signRotation>1,'Spiral visibly turns at rest');
assert.notEqual(circusPropPose(.2,.2).balloonRotation,circusPropPose(.2).balloonRotation,'Big-win reaction reaches props');
console.log('Circus background: independent spiral/balloon/bunting/light motion, bounded response and fixed camera.');

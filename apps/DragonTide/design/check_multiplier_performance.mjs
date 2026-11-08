// @ts-nocheck -- Node replay of authored visual curves and effect lifecycle.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Texture } from 'pixi.js';
import { flightPose,impactPose,gazePose } from '../src/game/multiplierPerformance.ts';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/game/multiplierFxScene.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const source=compiled.outputFiles[0].text.replaceAll('"pixi.js"',JSON.stringify(import.meta.resolve('pixi.js')));
const {createMultiplierFxScene}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let samples=0;
for(const [from,to] of [[{x:760,y:160},{x:294,y:294}],[{x:760,y:160},{x:-90,y:264}],[{x:518,y:-90},{x:294,y:294}],[{x:518,y:-90},{x:124,y:-90}]]){
 assert.equal(flightPose(from,to,0).x,from.x);assert.equal(flightPose(from,to,1).x,to.x);assert.equal(flightPose(from,to,1).y,to.y);
 let prior=from.x;
 for(let i=0;i<=120;i++){const pose=flightPose(from,to,i/120);assert.ok([pose.x,pose.y,pose.angle,pose.scale,pose.sx,pose.sy].every(Number.isFinite));assert.ok(pose.x<=prior+.001);prior=pose.x;assert.ok(Math.abs(pose.sx*pose.sy-1)<1e-6);assert.equal(pose.trail.length,13);assert.ok(Math.abs(pose.trail[0].x-pose.x)<1e-6);samples++;}
}
assert.deepEqual(impactPose(0),impactPose(.15));assert.equal(impactPose(1).alpha,0);
assert.equal(gazePose(0).intensity,0);assert.ok(Math.abs(gazePose(1).intensity)<1e-12);assert.equal(gazePose(.5).reach,1);assert.ok(gazePose(.5).intensity>.95);
let reach=0,stone=0;for(let i=0;i<=100;i++){const p=gazePose(i/100);assert.ok(p.reach>=reach&&p.stone>=stone);assert.ok(Object.values(p).every(v=>Number.isFinite(v)&&v>=0&&v<=1));reach=p.reach;stone=p.stone;}
const scene=createMultiplierFxScene({green:Texture.EMPTY,purple:Texture.EMPTY,gold:Texture.EMPTY});
for(let i=0;i<=60;i++)scene.setState({orbs:[],eyes:[{x:760,y:160},{x:770,y:162}],gaze:gazePose(i/60).intensity,gazeProgress:i/60,target:{x:294,y:294},transfer:0,plate:{x:-90,y:264},score:{x:294,y:294}});
scene.impact({x:294,y:294},25,'score');scene.impact({x:-90,y:264},100,'plate');for(let i=0;i<24;i++)scene.update(1/60);
scene.shatter({x:300,y:200},100);const pieces=scene.root.children[3];assert.equal(pieces.children.length,8);assert.ok(pieces.children.every(p=>p.x>250&&p.y>150));
for(let i=0;i<25;i++)scene.update(1/60);assert.equal(pieces.children.length,0);scene.setReducedMotion(true);scene.shatter({x:300,y:200},5);assert.equal(pieces.children.length,0);scene.destroy();scene.destroy();
const result={version:3,flightSamples:samples,gazeSamples:101,gaze:'Two pupil-registered beams, monotonic travelling front, one focus and release, monotonic mineral growth',paths:'Desktop and portrait, score and cumulative plaque',impactHold:'First 22% of 120ms contact animation',paintedShards:8,lifecycle:'Expired shard geometry removed, reduced motion and repeated destroy safe',passed:true};
fs.writeFileSync(new URL('./multiplier-performance-validation.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));

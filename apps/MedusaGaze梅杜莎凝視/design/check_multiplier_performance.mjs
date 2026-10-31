// @ts-nocheck -- Node replay of authored visual curves and effect lifecycle.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Texture } from 'pixi.js';
import { flightPose,flightDistance,releaseAccent,orbChargePose,orbLaunchPoint,orbWakePoint,impactPose,gazePose,eyeRadianceRays } from '../src/game/multiplierPerformance.ts';
import {throwTiming,tumbleTiming,medusaAnimations,multiplierCountMs} from '../src/game/animationTimeline.ts';
import {multiplierCollisionPose} from '../src/game/multiplierCollision.ts';
import {orbPower} from '../src/game/orbPower.ts';
import {orbSoundVoices} from '../src/game/castingSoundDesign.ts';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/game/multiplierFxScene.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const source=compiled.outputFiles[0].text.replaceAll('"pixi.js"',JSON.stringify(import.meta.resolve('pixi.js')));
const {createMultiplierFxScene}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let samples=0;
const multiplierValues=[2,3,5,8,10,15,25,50,100,250,500];
const audioMeta=JSON.parse(fs.readFileSync(new URL('./source/medusagaze/audio/audio_metadata.json',import.meta.url),'utf8'));
let previousPower=-1,previousImpact=-1;
for(const value of multiplierValues){
 const power=orbPower(value);assert.ok(power.energy>previousPower&&power.impact>previousImpact,'Every published multiplier must increase visible power');previousPower=power.energy;previousImpact=power.impact;
 assert.ok(power.bodyScale<=1.24&&power.wakeStrands<=4&&power.motes<=20,'High-power effects stay bounded for three-orb volleys');
 for(const cue of ['charge','release','fly','hit','collision'])for(const v of orbSoundVoices(cue,value,3)){
  assert.ok(Number.isFinite(v.gain)&&v.gain>0&&v.rate===1,'Power must not stretch sound/animation clocks');assert.ok(audioMeta.files.some(f=>f.cue===v.cue),'Missing power sound '+v.cue);
 }
 for(const count of [1,2,3])assert.ok(Math.abs(count*orbSoundVoices('fly',value,count)[0].gain**2-orbSoundVoices('fly',value,1)[0].gain**2)<1e-10,'Power-aware flights retain their volley gain budget');
}
for(const boundary of [8,15,25,50,100,150,250]){
 const a=orbPower(boundary-.00001),b=orbPower(boundary+.00001);
 assert.ok(Math.abs(a.energy-b.energy)<1e-5&&Math.abs(a.bodyScale-b.bodyScale)<1e-5,'No intensity step at a colour boundary');
 for(const shift of [0,8,16])assert.ok(Math.abs(((a.color>>shift)&255)-((b.color>>shift)&255))<=1,'Colours must interpolate smoothly');
 const energy=v=>orbSoundVoices('hit',v).filter(s=>s.cue.startsWith('sfx_orb_hit_')).reduce((sum,s)=>sum+s.gain**2,0);
 assert.ok(Math.abs(energy(boundary-.001)-energy(boundary+.001))<.002,'Crystal weight must crossfade without an audible gain step');
}
assert.deepEqual(orbPower(Infinity),orbPower(2));assert.deepEqual(orbPower(15000),orbPower(500));
for(const [from,to] of [[{x:760,y:160},{x:294,y:294}],[{x:760,y:160},{x:-90,y:264}],[{x:518,y:-90},{x:294,y:294}],[{x:518,y:-90},{x:124,y:-90}]]){
 assert.equal(flightPose(from,to,0).x,from.x);assert.equal(flightPose(from,to,1).x,to.x);assert.equal(flightPose(from,to,1).y,to.y);
 let prior=from.x;
 for(let i=0;i<=120;i++){const pose=flightPose(from,to,i/120);assert.ok([pose.x,pose.y,pose.angle,pose.scale,pose.sx,pose.sy].every(Number.isFinite));assert.ok(pose.x<=prior+.001);prior=pose.x;assert.ok(Math.abs(pose.sx*pose.sy-1)<1e-6);assert.equal(pose.trail.length,13);assert.ok(Math.abs(pose.trail[0].x-pose.x)<1e-6);samples++;}
}
assert.ok(flightDistance(.02)>.012,'Release must already carry momentum in its first frame');
for(let i=0;i<=120;i++){const p=releaseAccent(i/120);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.alpha>=0&&p.alpha<=1);}
assert.equal(releaseAccent(.28).alpha,0);assert.equal(releaseAccent(1).flash,0);
assert.deepEqual(impactPose(0),impactPose(.15));assert.equal(impactPose(1).alpha,0);
const release=orbChargePose({x:760,y:160},{x:294,y:294},1),launch=flightPose(release,{x:294,y:294},0);
assert.equal(launch.x,release.x);assert.equal(launch.y,release.y);assert.ok(Math.abs(launch.scale-release.scale)<1e-10&&Math.abs(launch.sx-release.sx)<1e-10,'The compressed wind-up must join flight without a position or silhouette jump');
assert.ok(Math.abs(Math.atan2(Math.sin(launch.angle-release.angle),Math.cos(launch.angle-release.angle)))<1e-10,'Release must keep the same orientation as the charged silhouette');
assert.equal(impactPose(0,1.2).angle,1.2);assert.equal(impactPose(1,1.2).angle,1.2,'Impact must retain the incoming axis throughout its dissolve');
for(const target of [{x:294,y:294},{x:124,y:-90}]){
 const origin={x:760,y:160},fan=[0,1,2].map(index=>orbLaunchPoint(origin,target,index));
 assert.ok(Math.hypot(fan[1].x-fan[2].x,fan[1].y-fan[2].y)>100,'Later charging orbs must fan apart for readable labels');
 assert.ok(fan.every(point=>Object.values(point).every(Number.isFinite)));
}
for(let i=0;i<=100;i++){
 const charge=orbChargePose({x:760,y:160},{x:294,y:294},i/100);assert.ok(Object.values(charge).every(value=>typeof value==='boolean'||Number.isFinite(value)));assert.ok(Math.abs(charge.sx*charge.sy-1)<1e-10);
 const flight=flightPose(release,{x:294,y:294},i/100);
 for(let index=0;index<flight.trail.length;index++)for(const strand of [0,1]){const wake=orbWakePoint(flight.trail,index,i/100,strand);assert.ok(Object.values(wake).every(Number.isFinite));assert.ok(Math.hypot(wake.x-flight.trail[index].x,wake.y-flight.trail[index].y)<=16.001,'Helical wakes stay close to their actual path');}
}
assert.equal(gazePose(0).intensity,0);assert.ok(Math.abs(gazePose(1).intensity)<1e-12);assert.equal(gazePose(.5).reach,1);assert.ok(gazePose(.5).intensity>.95);
let reach=0,stone=0;for(let i=0;i<=100;i++){const p=gazePose(i/100);assert.ok(p.reach>=reach&&p.stone>=stone);assert.ok(Object.values(p).every(v=>Number.isFinite(v)&&v>=0&&v<=1));reach=p.reach;stone=p.stone;}
let tierComparisons=0;
for(const freegame of [false,true])for(const applied of [false,true])for(const orbCount of [1,3]){
 const baseline=throwTiming({freegame,applied,orbCount,mult:125,turbo:false,turboLevel:0});
 for(const turboLevel of [1,2]){assert.deepEqual(throwTiming({freegame,applied,orbCount,mult:125,turbo:true,turboLevel}),baseline);tierComparisons++;}
 assert.equal(baseline.chargeMs,350);assert.equal(baseline.flightMs,600);
}
assert.deepEqual(medusaAnimations.gaze,medusaAnimations.gaze_turbo);assert.deepEqual(medusaAnimations.fg_gaze,medusaAnimations.fg_gaze_turbo);
assert.equal(multiplierCountMs(125,false),multiplierCountMs(125,true));
for(const from of [{x:-90,y:264},{x:152,y:294},{x:120,y:-90}]){
 const center={x:294,y:294},start=multiplierCollisionPose(from,center,0),hit=multiplierCollisionPose(from,center,1);
 assert.equal(start.mult.x,from.x);assert.equal(start.mult.y,from.y);
 assert.deepEqual({x:hit.mult.x,y:hit.mult.y},center);assert.deepEqual({x:hit.score.x,y:hit.score.y},center);
 for(let i=0;i<=60;i++)for(const pose of Object.values(multiplierCollisionPose(from,center,i/60)))assert.ok(Object.values(pose).every(Number.isFinite));
}
assert.ok(tumbleTiming({turbo:false}).totalMs>tumbleTiming({turbo:true,turboLevel:1}).totalMs);
assert.ok(tumbleTiming({turbo:true,turboLevel:1}).totalMs>tumbleTiming({turbo:true,turboLevel:2}).totalMs);
const rays=eyeRadianceRays({x:760,y:160},{x:676,y:160},.45);assert.equal(rays.length,12);assert.ok(rays.every(r=>Math.hypot(r.to.x-760,r.to.y-160)<190));assert.ok(rays.some(r=>r.to.x>760)&&rays.some(r=>r.to.x<760)&&rays.some(r=>r.to.y<160)&&rays.some(r=>r.to.y>160));
const scene=createMultiplierFxScene({green:Texture.EMPTY,purple:Texture.EMPTY,gold:Texture.EMPTY,glow:Texture.EMPTY});
for(let i=0;i<=60;i++)scene.setState({orbs:[],eyes:[{x:760,y:160},{x:770,y:162}],gaze:gazePose(i/60).intensity,gazeProgress:i/60,target:{x:294,y:294},transfer:0,plate:{x:-90,y:264},score:{x:294,y:294}});
assert.equal(scene.root.children[4].children.length,3);assert.ok(scene.root.children[4].children.every(halo=>halo.alpha===0),'Eye and orb bloom must clear after the gaze');
const flyingState={orbs:[{id:7,value:25,...flightPose(release,{x:294,y:294},.5),alpha:1,stone:0,crack:0}],eyes:[],gaze:0,target:{x:294,y:294},transfer:0,plate:{x:0,y:0},score:{x:294,y:294}};
scene.setState(flyingState);assert.equal(scene.root.children[6].children.length,1);
scene.setState({...flyingState,orbs:[]});assert.equal(scene.root.children[6].children.length,0,'A completed orb must release its owned flight glow');
for(const value of multiplierValues){
 scene.setState({...flyingState,orbs:[{...flyingState.orbs[0],value}]});const b=scene.root.children[0].getLocalBounds();assert.ok([b.x,b.y,b.width,b.height].every(Number.isFinite));
 scene.impact({x:294,y:294},value,'score');scene.impact({x:-90,y:264},value,'plate');for(let i=0;i<36;i++)scene.update(1/60);
}
scene.setState({...flyingState,orbs:[]});
scene.impact({x:294,y:294},25,'score');scene.impact({x:-90,y:264},100,'plate');for(let i=0;i<24;i++)scene.update(1/60);
scene.shatter({x:300,y:200},100);const pieces=scene.root.children[3];assert.equal(pieces.children.length,8);assert.ok(pieces.children.every(p=>p.x>250&&p.y>150));
for(let i=0;i<25;i++)scene.update(1/60);assert.equal(pieces.children.length,0);scene.setReducedMotion(true);scene.shatter({x:300,y:200},5);assert.equal(pieces.children.length,0);scene.destroy();scene.destroy();
const result={version:10,powerGradient:{values:multiplierValues,continuousLogarithmicIntensity:true,colourStops:7,maxBodyScale:1.24,maxWakeStrands:4,highTier:"Golden flame crown, orbiting Greek key marks and up to three local pressure fronts",audio:"Equal-power crystal-body crossfades and graduated charge/release/flight; rate 1",volleyBudget:"Normalized one-to-three power-aware wind voices"},releaseAccent:"Flight-aligned pressure ring, four-to-twelve short light petals and release flash; fades in 168ms",charge:"Overshoot, pull back fourteen pixels and compress; continuous launch silhouette",flightWake:"One serpentine arc, two-to-four distinct wound strands, sparks, power-scaled crown and continuous palette corona",numberCollision:"Multiplier numeral flies from the left dock/total plaque and meets base score at the exact same centre point before counting",flightSamples:samples,gazeSamples:101,gaze:'Emerald eye fill, 12 short radiating rays per eye, curved gathering strands and 18 converging motes; no long eye-to-score beam',turboTierComparisons:tierComparisons,signatureTiming:'Identical character, charge, flight, impact, count and result hold at OFF / TURBO 1 / TURBO 2; only board tumble/drop timings differ',paths:'Desktop and portrait, score and cumulative plaque',impactHold:'First 22% of 140ms contact animation',paintedShards:8,lifecycle:'Expired shard geometry removed, reduced motion and repeated destroy safe',passed:true};
fs.writeFileSync(new URL('./multiplier-performance-validation.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));

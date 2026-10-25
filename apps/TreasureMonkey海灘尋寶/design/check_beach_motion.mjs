import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BEACH_LOOP_MS,BEACH_WATER_BOUNDS,beachWaterWeight,beachChannel,createBeachMesh,deformBeachMesh} from '../src/game/treasureBeachMotion.ts';
import {PresentationClock} from '../src/game/presentationClock.ts';

const data=JSON.parse(fs.readFileSync(new URL('../src/game/data/treasureBeachGenerator.json',import.meta.url),'utf8'));
assert.deepEqual(data.source.functions,['wave','sum'],'the local generator is the motion source');
assert.equal(BEACH_LOOP_MS,7200);
for(const channel of Object.keys(data.channels)){
 const values=data.channels[channel];
 assert.equal(values.length,data.steps+1);assert.equal(values[0],values.at(-1),'closed baked table');
 for(const time of [-7200,-810,0,285,3600,7199,8450])assert.ok(Math.abs(beachChannel(channel,time)-beachChannel(channel,time+BEACH_LOOP_MS))<1e-12,'periodic position');
 const h=.25,left=(beachChannel(channel,0)-beachChannel(channel,-h))/h,right=(beachChannel(channel,h)-beachChannel(channel,0))/h;
 assert.ok(Math.abs(left-right)<1e-6,'periodic velocity has no seam');
}
const {left,right,top,bottom}=BEACH_WATER_BOUNDS;
for(const [u,v] of [[0,0],[1,1],[.5,.26],[.5,.475],[.12,.36],[.91,.36],[left,.36],[right,.36],[.5,top],[.5,bottom]])assert.equal(beachWaterWeight(u,v),0,'horizon, land, foliage, lifeguard chair and shoreline are rigid');
assert.ok(beachWaterWeight(.5,.36)>.95,'the probe sees actual moving seawater');

const mesh=createBeachMesh(),output=new Float32Array(mesh.rest.length),movers=new Set(mesh.active.map(p=>p.index));
assert.ok(movers.size>200,'sea uses a fine local grid');
assert.deepEqual(deformBeachMesh(mesh,2300,true),mesh.rest,'reduced motion is the exact source image');
let minimumAreaRatio=1,maximumPixels=0,measuredMotion=0;
for(let time=0;time<BEACH_LOOP_MS;time+=60){
 deformBeachMesh(mesh,time,false,output);
 for(let i=0;i<output.length;i+=2){
  assert.ok(Number.isFinite(output[i])&&Number.isFinite(output[i+1]),'finite vertices');
  if(!movers.has(i/2))assert.deepEqual([output[i],output[i+1]],[mesh.rest[i],mesh.rest[i+1]],'all static vertices stay exactly fixed');
  const pixels=Math.hypot((output[i]-mesh.rest[i])*1920,(output[i+1]-mesh.rest[i+1])*1080);
  maximumPixels=Math.max(maximumPixels,pixels);measuredMotion+=pixels;
 }
 for(let i=0;i<mesh.indices.length;i+=3){
  const [a,b,c]=mesh.indices.subarray(i,i+3);
  const area=positions=>(positions[b*2]-positions[a*2])*(positions[c*2+1]-positions[a*2+1])-(positions[b*2+1]-positions[a*2+1])*(positions[c*2]-positions[a*2]);
  const ratio=area(output)/area(mesh.rest);
  minimumAreaRatio=Math.min(minimumAreaRatio,ratio);
  assert.ok(ratio>.75,'local water triangles never fold or pinch');
 }
}
assert.ok(measuredMotion>1,'not an accidentally frozen backdrop');
assert.ok(maximumPixels<3.5,'background motion remains below 3.5 source pixels');
assert.deepEqual(deformBeachMesh(mesh,0),deformBeachMesh(mesh,BEACH_LOOP_MS),'mesh loop closes exactly');
const component=fs.readFileSync(new URL('../src/components/TreasureBeachBackdrop.svelte',import.meta.url),'utf8');
assert.ok(component.includes('subscribePresentationFrame')&&!/requestAnimationFrame|setInterval|ticker\.add/.test(component),'one shared presentation clock, without a background timer fork');
assert.ok(component.includes('geometry.destroy()')&&!/texture\.destroy\(/.test(component),'own geometry is released while shared art remains cached');
assert.ok(component.includes('prefers-reduced-motion')&&component.includes("removeEventListener('change'"),'preference listener is cleaned up');
let wall=0,hidden=false,scheduled,visibility,elapsed=0,cancelled=0;
const clock=new PresentationClock({
 request:fn=>{scheduled=fn;return 1;},cancel:()=>cancelled++,now:()=>wall,hidden:()=>hidden,
 visibility:fn=>{visibility=fn;return()=>{visibility=undefined;};},
});
const release=clock.subscribe(delta=>elapsed+=delta);
wall=100;scheduled(wall);assert.equal(elapsed,100);
hidden=true;wall=4100;scheduled(wall);assert.equal(elapsed,100,'hidden page does not advance the shared water clock');
hidden=false;visibility();wall=4200;scheduled(wall);assert.equal(elapsed,200,'returning to the tab resumes without a four-second jump');
release();assert.equal(cancelled,1);assert.equal(visibility,undefined,'last shared-clock subscriber releases its listener');
console.log(`OK: offline generator wave/sum; rigid silhouettes/shoreline; 7.2s position+velocity loop; ${movers.size} moving vertices; peak ${maximumPixels.toFixed(2)}px; minimum triangle area ${(minimumAreaRatio*100).toFixed(1)}%; reduced rest and shared clock cleanup`);

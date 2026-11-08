// The beach's wind props (src/game/treasureBgProps.ts): at rest they are the
// plate, their borders and the rocks/chair/lighthouse they enclose never move,
// no triangle folds, and a gust is plainly visible on the palms.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BEACH_PROPS,windAt,GUST_EVERY} from '../src/game/treasureBgProps.ts';
import {skin} from '../src/game/bgMeshRig.ts';
import {drawBeachLife,GULL_EVERY} from '../src/game/treasureBeachLife.ts';
import {cloudOffset,CLOUD_SPEED,CLOUD_WIDTH} from '../src/game/treasureClouds.ts';
import {CLOUD_BAND} from '../src/game/treasureCloudBand.ts';

const area=(p,i,a,b,c)=>(p[b*2]-p[a*2])*(p[c*2+1]-p[a*2+1])-(p[b*2+1]-p[a*2+1])*(p[c*2]-p[a*2]);
const report=[];
for(const spec of BEACH_PROPS){
 const {rig,rect}=spec,out=new Float32Array(rig.rest.length);
 skin(rig,spec.drive(rig,{t:0,gustT:-1}),rect[3],out);
 for(let i=0;i<out.length;i++)assert.ok(Math.abs(out[i]-rig.rest[i])<1e-6,`${spec.name}: at rest the mesh is the plate`);
 let peak=0,minRatio=1,busy=0,frames=0;
 for(let t=0;t<=GUST_EVERY*3;t+=40){
  for(const gustT of [-1,t%3000]){
   skin(rig,spec.drive(rig,{t,gustT}),rect[3],out);
   let framePeak=0;
   for(let v=0;v<out.length/2;v++){
    const x=rig.rest[v*2],y=rig.rest[v*2+1],d=Math.hypot(out[v*2]-x,out[v*2+1]-y);
    framePeak=Math.max(framePeak,d);
    if(x<=rect[0]+.5||x>=rect[2]-.5||y<=rect[1]+.5||y>=rect[3]-.5)assert.ok(d<.05,`${spec.name}: border pinned to the plate`);
   }
   peak=Math.max(peak,framePeak);if(gustT<0){frames++;if(framePeak>3)busy++;}
   for(let i=0;i<rig.indices.length;i+=3){
    const [a,b,c]=rig.indices.subarray(i,i+3),r=area(out,i,a,b,c)/area(rig.rest,i,a,b,c);
    minRatio=Math.min(minRatio,r);assert.ok(r>.5,`${spec.name}: no folded or pinched triangle (${r.toFixed(2)})`);
   }
  }
 }
 report.push(`${spec.name} ${peak.toFixed(1)}px ${(busy/frames*100).toFixed(0)}% min ${(minRatio*100).toFixed(0)}%`);
 if(process.env.REPORT)console.log(report.at(-1));
 if(spec.name.startsWith('palm'))assert.ok(peak>6&&busy/frames>.2,`${spec.name}: the palm visibly sways (${peak.toFixed(1)}px, ${(busy/frames*100).toFixed(0)}%)`);
 assert.ok(peak<(spec.name.startsWith('cloud')?34:26),`${spec.name}: restrained (${peak.toFixed(1)}px)`);
}
// fixed things inside prop rectangles stay still (sampled at their centres)
const still={'umbrella':[[1830,300]],'palmTR':[[1840,150]],'cloudL':[[270,170]],'bushL':[[40,490]],'bushR2':[[1830,1000]],'tuftStar':[[1620,1030]]};
for(const spec of BEACH_PROPS)for(const [x,y] of still[spec.name]??[]){
 const {rig,rect}=spec,out=new Float32Array(rig.rest.length);let worst=0;
 for(let t=0;t<=GUST_EVERY*2;t+=80){
  skin(rig,spec.drive(rig,{t,gustT:-1}),rect[3],out);
  for(let v=0;v<out.length/2;v++)if(Math.hypot(rig.rest[v*2]-x,rig.rest[v*2+1]-y)<14)worst=Math.max(worst,Math.hypot(out[v*2]-rig.rest[v*2],out[v*2+1]-rig.rest[v*2+1]));
 }
 assert.ok(worst<1.5,`${spec.name}: rock/chair/lighthouse at ${x},${y} stays put (${worst.toFixed(2)}px)`);
}
// one wind: the left of the beach leans before the right in a gust
const lead=x=>{let best=0,at=0;for(let t=500;t<500+GUST_EVERY;t+=10){const w=windAt({t,gustT:-1},x,1e12,0);if(w>best){best=w;at=t;}}return at;};
assert.ok(lead(1800)-lead(100)>500,'gust crosses left to right');
// gulls are an event, not a constant
const calls=[];const g={clear(){calls.length=0;return g;},moveTo(){calls.push('m');return g;},quadraticCurveTo(){return g;},stroke(){return g;},circle(){calls.push('c');return g;},fill(){return g;}};
let gullFrames=0,total=0;for(let t=0;t<GULL_EVERY*2;t+=100){drawBeachLife(g,t);total++;if(calls.includes('m'))gullFrames++;}
assert.ok(gullFrames>0&&gullFrames/total<.85,'gulls cross now and then');
drawBeachLife(g,9000,true);assert.equal(calls.length,0,'reduced motion draws no life');
// clouds: a continuous drift that wraps, a few px/s, never jumps
assert.equal(cloudOffset({t:0,gustT:-1}),0,'clouds start where they are painted');
assert.equal(cloudOffset({t:50000,gustT:-1},true),0,'reduced motion: clouds stay painted');
let prevOff=0,travelled=0;
for(let t=16;t<=CLOUD_WIDTH/CLOUD_SPEED*1.2;t+=16){
 const o=cloudOffset({t,gustT:-1});let d=o-prevOff;if(d<-CLOUD_WIDTH/2)d+=CLOUD_WIDTH;
 assert.ok(d>-0.05&&d<1.2,`clouds drift smoothly downwind (${d.toFixed(3)}px in a frame at ${t}ms)`);travelled+=d;prevOff=o;
}
assert.ok(travelled>CLOUD_WIDTH,'the bank goes all the way round');
for(const f of ['bg_clean.jpg','bg_clouds.png','bg_horizon.png'])assert.ok(fs.existsSync(new URL('../static/assets/treasure/'+f,import.meta.url)),f+' built by design/build_bg_clouds.py');
assert.ok(BEACH_PROPS.every(p=>p.rect[2]<=CLOUD_BAND.x0+20||p.rect[0]>=CLOUD_BAND.x1-20||p.rect[3]<=CLOUD_BAND.y0||p.rect[1]>=CLOUD_BAND.y1),'no wind mesh paints the plate sky over the drifting clouds');
const component=fs.readFileSync(new URL('../src/components/TreasureBeachBackdrop.svelte',import.meta.url),'utf8');
assert.ok(!/requestAnimationFrame|setInterval|ticker\.add/.test(component)&&component.includes('p.geometry.destroy()')&&!/const props=/.test(component),'shared clock and released prop geometry');
console.log('OK: drifting cloud bank; beach wind props —',report.join('; '));

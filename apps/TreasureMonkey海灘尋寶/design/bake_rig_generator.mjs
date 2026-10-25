import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2]??path.join(root,'../../../spine-generator'));
const {strike,spring}=await import(pathToFileURL(path.join(source,'src/motions.ts')).href);
const durationMs=970,intervals=240;
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*v*(10+v*(-15+6*v));};
// Small local responses retain each painted joint's bind point and amplitude.
// Weight, leading delay and recovery are authored separately for every material.
const recipes={
 rope:{delayMs:0,anticipation:-.18,prepare:.10,release:.20,hold:.18,overshoot:.055,frequency:5.5,damping:.68},
 key:{delayMs:110,anticipation:-.20,prepare:.11,release:.16,hold:.18,overshoot:.10,frequency:4.2,damping:.52,recovery:{frequency:3.5,damping:.62}},
 shaft:{delayMs:0,anticipation:-.16,prepare:.10,release:.21,hold:.12,overshoot:.045,frequency:5.5,damping:.74},
 display:{delayMs:70,anticipation:-.17,prepare:.10,release:.19,hold:.16,overshoot:.08,frequency:6.6,damping:.60},
 coil:{delayMs:140,anticipation:-.18,prepare:.10,release:.20,hold:.13,overshoot:.12,frequency:4.1,damping:.49,recovery:{frequency:4.2,damping:.59}},
 'cloth-root':{delayMs:35,anticipation:-.20,prepare:.09,release:.18,hold:.10,overshoot:.075,frequency:5.6,damping:.56},
 'cloth-tip':{delayMs:140,anticipation:-.22,prepare:.10,release:.15,hold:.16,overshoot:.13,frequency:4.4,damping:.48,recovery:{frequency:3.7,damping:.56}},
 hat:{delayMs:85,anticipation:-.18,prepare:.12,release:.18,hold:.13,overshoot:.09,frequency:5.5,damping:.54,recovery:{frequency:4.6,damping:.64}},
 smile:{delayMs:55,anticipation:-.12,prepare:.11,release:.20,hold:.18,overshoot:.035,frequency:7.2,damping:.76},
};
const tracks={};
for(const [id,r] of Object.entries(recipes)){
 const duration=(durationMs-r.delayMs)/1000;
 const recover=duration-r.prepare-r.release-r.hold;
 const parameters={anticipation:{value:r.anticipation,time:r.prepare,ease:'sineInOut'},action:{value:1,time:r.release,ease:'quartIn'},overshoot:{amount:r.overshoot,frequency:r.frequency,damping:r.damping},hold:r.hold,recover:{time:recover,ease:'sineInOut'}};
 const motion=strike(parameters),settleAt=r.prepare+r.release+r.hold;
 const recovery=r.recovery?spring({from:motion.value(settleAt),to:0,...r.recovery,duration:recover}):null;
 const value=time=>{
  const age=(time-r.delayMs)/1000;
  if(age<=0||time>=durationMs)return 0;
  let p=motion.value(age);
  if(recovery&&age>settleAt){
   // Blend the analytic recovery in over 55ms; taper its tiny residual at rest.
   const blend=smooth((age-settleAt)/.055),tail=recovery.value(age-settleAt)*smooth((duration-age)/.12);
   p=p*(1-blend)+tail*blend;
  }
  return p;
 };
 const values=Array.from({length:intervals+1},(_,i)=>Number(value(i/intervals*durationMs).toFixed(8)));
 tracks[id]={delayMs:r.delayMs,parameters,recovery:r.recovery??null,values};
}
const output={source:'E:/stake/spine-generator/src/motions.ts#strike,spring',generator:'spine-motion-kit 0.1.0',durationMs,intervals,tracks};
const destination=path.join(root,'src/game/data/treasureRigGenerator.json');
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(output)+'\n');
console.log(`Baked ${Object.keys(tracks).length} local material responses, ${intervals+1} samples each; ${destination}`);

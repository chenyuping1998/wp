/** Gate the actual production pose functions, never a second JS model. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as motion from '../src/game/castMotion.ts';
const rig=JSON.parse(fs.readFileSync(new URL('../static/assets/deadwood/conductor.rig.json',import.meta.url)));
const report=JSON.parse(fs.readFileSync(new URL('./deadwood_rig_report.json',import.meta.url)));
assert.deepEqual(rig.size,[1024,1536]);
rig.weights.forEach(w=>assert(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-8));
assert(report.armOwnership.l>=.5&&report.armOwnership.r>=.5);
const rest=new Float32Array(rig.verts.flat());
const out=new Float32Array(rest.length);
const index=motion.buildWeightIndex(rig);
const matrices=rig.bones.map(()=>new Float32Array(6));
const chain=rig.bones.map(()=>new Float32Array(6));
function area(v,[a,b,c]){return (v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]);}
const results={};
const visualLimits={arm_l:5,fore_l:5,arm_r:4,fore_r:5};
for(const [name,limit] of Object.entries(visualLimits)){
  let idlePeak=0;
  for(let t=0;t<8000;t+=10)idlePeak=Math.max(idlePeak,Math.abs(motion.idleAngle(motion.IDLE[name],t)));
  for(const [tierName,tier] of Object.entries(motion.TIERS)) assert(idlePeak+Math.abs(tier.bones[name]?.[0]??0)<=limit,`${tierName} exceeds ${name} visual angle budget`);
}
for(const [name,tier] of Object.entries(motion.TIERS)){
  let min=1,max=1;
  for(let start=0;start<8000;start+=1000) for(let frame=0;frame<=48;frame++){
    const reactionAge=tier.durationMs*frame/48;
    motion.composeBoneMatrices(rig,{timeMs:start+reactionAge,tier,reactionAge,durationMs:tier.durationMs,speed:1,motionScale:motion.MOTION_SCALE.guy},matrices,chain);
    motion.skinVertices(rest,index,matrices,out);
    for(const tri of rig.tris){const ratio=area(out,tri)/area(rest,tri);min=Math.min(min,ratio);max=Math.max(max,ratio);}
  }
  results[name]={min,max};
  assert(min>=.5&&max<=1.6,`${name} mesh area ${min}..${max}`);
}
console.log('Production conductor mesh gate PASS',JSON.stringify(results));
const samples=JSON.parse(fs.readFileSync(new URL('./deadwood_rig_parity.json',import.meta.url)));
let error=0;
for(const sample of samples){
  const tier=motion.TIERS.trigger;
  motion.composeBoneMatrices(rig,{timeMs:sample.time,tier,reactionAge:sample.age,durationMs:tier.durationMs,speed:1,motionScale:1},matrices,chain);
  motion.skinVertices(rest,index,matrices,out);
  sample.vertices.flat().forEach((value,i)=>{error=Math.max(error,Math.abs(value-out[i]));});
}
assert(error<.001,`Production/Python vertex parity max error ${error}px`);
console.log('Production/Python parity PASS; max vertex error',error,'px');

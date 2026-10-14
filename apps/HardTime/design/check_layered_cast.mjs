import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { buildWeightIndex, composeBoneMatrices, skinVertices } from '../src/game/castMotion.ts';
import { LAYERED_TIERS, LAYERED_X_ENVELOPE } from '../src/game/layeredCastMotion.ts';
import { readAlpha } from './lib/pngAlpha.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'static/assets/castLayers/prisoner_crossed');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'layers.json')));
assert.deepEqual(manifest.size,[1024,2048]);
// 2026-09-27 crossed arms: arms + towel live in the body layer
assert.deepEqual([...manifest.order].sort(),['body','head']);
const matrices=manifest.layers[0].rig.bones.map(()=>new Float32Array(6));
const chain=manifest.layers[0].rig.bones.map(()=>new Float32Array(6));
const parts=manifest.layers.map(p=>{
 const rig=p.rig, tex=readAlpha(fs.readFileSync(path.join(dir,p.texture)));
 assert.deepEqual([tex.width,tex.height],manifest.size);
 assert.deepEqual(rig.bones,manifest.layers[0].rig.bones);
 assert.deepEqual(rig.figure_box,manifest.figure_box);
 for(const weights of rig.weights){assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-8);}
 const forbidden=p.name==='body'?['arm_l','fore_l','arm_r','fore_r']:p.name.startsWith('arm_')?rig.bones.map(b=>b.name).filter(n=>![p.name,'fore_'+p.name.at(-1)].includes(n)):['arm_l','fore_l','arm_r','fore_r'];
 for(const n of forbidden){let i=rig.bones.findIndex(b=>b.name===n);assert.ok(rig.weights.every(w=>w[i]===0),`${p.name} spills onto ${n}`)}
 const alphaAt=(x,y)=>tex.alpha[Math.min(2047,Math.max(0,Math.round(y)))*1024+Math.min(1023,Math.max(0,Math.round(x)))];
 const ink=rig.tris.map(tri=>{const v=tri.map(i=>rig.verts[i]);return [...v,...v.map((p,i)=>[(p[0]+v[(i+1)%3][0])/2,(p[1]+v[(i+1)%3][1])/2]),[v.reduce((a,b)=>a+b[0],0)/3,v.reduce((a,b)=>a+b[1],0)/3]].some(p=>alphaAt(...p)>16)});
 const rest=new Float32Array(rig.verts.flat());
 return {...p,rest,out:new Float32Array(rest),index:buildWeightIndex(rig),ink,inkVertices:rig.verts.map(p=>alphaAt(...p)>16)};
});
function area(v,a,b,c){return (v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]);}
let min=Infinity,max=0,flips=0,poses=0,minMargin=Infinity;const bounds=[Infinity,Infinity,-Infinity,-Infinity];const byPart={};
function pose(state,measure=true){composeBoneMatrices(parts[0].rig,state,matrices,chain);for(const p of parts){skinVertices(p.rest,p.index,matrices,p.out);if(!measure)continue;const row=byPart[p.name]??={min:Infinity,max:0,flips:0};for(let t=0;t<p.rig.tris.length;t++){if(!p.ink[t])continue;const tri=p.rig.tris[t];const ratio=area(p.out,...tri)/area(p.rest,...tri);min=Math.min(min,ratio);max=Math.max(max,ratio);row.min=Math.min(row.min,ratio);row.max=Math.max(row.max,ratio);if(ratio<=0){flips++;row.flips++}}
 for(let i=0;i<p.inkVertices.length;i++)if(p.inkVertices[i]){const x=p.out[i*2],y=p.out[i*2+1];minMargin=Math.min(minMargin,x,1024-x,y,2048-y);bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y)}
 }poses++;}
for(let timeMs=0;timeMs<32000;timeMs+=80)pose({timeMs,tier:LAYERED_TIERS.win,reactionAge:null,durationMs:720,speed:1,motionScale:1});
for(const tier of Object.values(LAYERED_TIERS))for(const speed of [1,2,4])for(let phase=0;phase<8;phase++)for(let age=0;age<=tier.durationMs+100;age+=25)pose({timeMs:phase*1000+age/speed,tier,reactionAge:age/speed,durationMs:tier.durationMs/speed,speed,motionScale:1});
assert.ok(flips===0,`flipped triangles ${flips}`);assert.ok(min>=.5,`min area ${min}`);assert.ok(max<=1.6,`max area ${max}`);assert.ok(minMargin>=40,`margin ${minMargin}`);
assert.ok(bounds[0]>=LAYERED_X_ENVELOPE[0] && bounds[2]<=LAYERED_X_ENVELOPE[1], 'stage placement envelope exceeded');
const report={poses,inkVertexBounds:bounds,minAreaRatio:min,maxAreaRatio:max,flips,minInkVertexMargin:minMargin,byPart,ownership:'body has zero arm weights; each arm uses only its two bones',speeds:[1,2,4]};
fs.writeFileSync(path.join(root,'design/cast_parts/crossed_arms/motion-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--frames')){
 const samples=[];
 // 4 sec: idle, trigger, return. Data uses the exact production math.
 for(let frame=0;frame<80;frame++){
  const timeMs=frame*50,age=timeMs-1000;const tier=LAYERED_TIERS.trigger;
  pose({timeMs,tier,reactionAge:age>=0&&age<1070?age:null,durationMs:1000,speed:1,motionScale:1},false);
  samples.push({timeMs,layers:parts.map(p=>({name:p.name,vertices:Array.from(p.out,v=>Math.round(v*1000)/1000)}))});
 }
 fs.writeFileSync(path.join(root,'design/cast_parts/crossed_arms/frames.json'),JSON.stringify(samples));
}

import fs from 'node:fs';
import {composeBoneMatrices,skinVertices,buildWeightIndex,TIERS} from './motion.mjs';
for(const role of ['mg','fg']){
 const manifest=JSON.parse(fs.readFileSync(new URL(`./${role}/layers.manifest.json`,import.meta.url)));
 const common=manifest.layers[0].rig,matrices=common.bones.map(()=>new Float32Array(6));
 const parts=manifest.layers.map(l=>({...l,rest:new Float32Array(l.rig.verts.flat()),index:buildWeightIndex(l.rig),out:new Float32Array(l.rig.verts.length*2)}));
 const requests=[];
 for(let i=0;i<20;i++)requests.push({label:'idle',timeMs:i*400,reactionAge:null,tier:TIERS.win,speed:1,durationMs:TIERS.win.durationMs,motionScale:1});
 for(const [label,tier] of Object.entries(TIERS))for(let i=0;i<16;i++)requests.push({label,timeMs:3000+i*90,reactionAge:i*90,tier,speed:1,durationMs:tier.durationMs,motionScale:1});
 const frames=requests.map(state=>{composeBoneMatrices(common,state,matrices);return{label:state.label,timeMs:state.timeMs,reactionAge:state.reactionAge,layers:parts.map(p=>{skinVertices(p.rest,p.index,matrices,p.out);return{name:p.name,vertices:Array.from(p.out,v=>+v.toFixed(3))}})}});
 fs.writeFileSync(new URL(`./${role}/frames.json`,import.meta.url),JSON.stringify(frames));console.log(role,frames.length);
}

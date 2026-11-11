// QA: worst ink-triangle area ratios per triangle over every clip and director reaction.
//   node design/cast_v6/tri_scan.mjs <rigDir>
import fs from 'node:fs'; import path from 'node:path'; import {spawnSync} from 'node:child_process';
import {AnimationState,AnimationStateData,Physics} from '@esotericsoftware/spine-core';
import {readCastSkeleton} from '../../src/game/spineCastData.ts';
import {CastDirector} from '../../src/game/castDirector.ts';
const [dir]=process.argv.slice(2); const json=JSON.parse(fs.readFileSync(path.join(dir,'cast.spine.json')));
const sk=readCastSkeleton(json); sk.setupPose(); sk.updateWorldTransform(Physics.none);
const vis=spawnSync('/Applications/anaconda3/envs/math-sdk/bin/python',['/Users/stone/stake-engine/wp/apps/TurfWar/design/lib/cast_visibility.py'],{encoding:'utf8',input:JSON.stringify(sk.slots.map(s=>{const a=s.getAppliedPose().attachment;return {name:s.data.name,path:path.join(dir,s.data.name+'.png'),uvs:Array.from(a.regionUVs),triangles:Array.from(a.triangles)}}))});
const visible=JSON.parse(vis.stdout);
const area=(p,a,b,c)=>(p[2*b]-p[2*a])*(p[2*c+1]-p[2*a+1])-(p[2*b+1]-p[2*a+1])*(p[2*c]-p[2*a]);
const rest={};for(const s of sk.slots){const a=s.getAppliedPose().attachment;const o=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(sk,s,0,o.length,o,0,2);rest[s.data.name]=o}
const lo=new Map(),hi=new Map();
const measure=(label)=>{for(const s of sk.slots){const a=s.getAppliedPose().attachment;const o=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(sk,s,0,o.length,o,0,2);for(const ti of visible[s.data.name]){const [x,y,z]=a.triangles.slice(ti*3,ti*3+3);const b=area(rest[s.data.name],x,y,z);if(Math.abs(b)<.001)continue;const r=area(o,x,y,z)/b;const k=s.data.name+'#'+ti;const l=lo.get(k);if(!l||r<l[0])lo.set(k,[r,label,s.data.name,ti]);const h=hi.get(k);if(!h||r>h[0])hi.set(k,[r,label,s.data.name,ti])}}};
for(const anim of sk.data.animations){sk.setupPose();const st=new AnimationState(new AnimationStateData(sk.data));st.setAnimation(0,anim.name,false);for(let f=0;f<=anim.duration*60;f++){st.update(f?1/60:0);st.apply(sk);sk.updateWorldTransform(Physics.none);measure(anim.name+':'+f)}}
for(const kind of Object.keys(json.turf.reactions)){sk.setupPose();const d=new CastDirector(sk,json.turf);for(let t=0;t<.7;t+=1/60)d.step(1/60);d.react(kind,1);for(let f=0;f<200;f++){d.step(1/60);measure('dir:'+kind+':'+f)}}
const fmt=w=>w.map(v=>typeof v==='number'?+v.toFixed(3):v).join(' ');
console.log('lowest',[...lo.values()].sort((a,b)=>a[0]-b[0]).slice(0,10).map(fmt).join('\n'));
console.log('highest',[...hi.values()].sort((a,b)=>b[0]-a[0]).slice(0,6).map(fmt).join('\n'));

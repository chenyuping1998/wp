// Check the exact installed Spine meshes, all clips, and interrupted runtime mixing.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {AnimationState,AnimationStateData,Physics,MeshAttachment} from '@esotericsoftware/spine-core';import {readCastSkeleton} from '../src/game/spineCastData.ts';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1]};
const component=fs.readFileSync(path.join(app,'src/components/CastFigureMesh.svelte'),'utf8');
const versions=[...component.matchAll(/assets\/castLayers\/turf\/(v\d+)\/(?:base|fg)\/cast\.spine\.json/g)].map(m=>m[1]);
assert(versions.length===2&&new Set(versions).size===1,'Cannot identify both actual runtime cast paths');
const root=arg('--root')??path.join(app,'static/assets/castLayers/turf',versions[0]);
const area=(p,a,b,c)=>(p[2*b]-p[2*a])*(p[2*c+1]-p[2*a+1])-(p[2*b+1]-p[2*a+1])*(p[2*c]-p[2*a]);const reports=[];
for(const variant of ['base','fg']){
 const dir=path.join(root,variant),json=JSON.parse(fs.readFileSync(path.join(dir,'cast.spine.json'))),skeleton=readCastSkeleton(json);skeleton.setupPose();skeleton.updateWorldTransform(Physics.none);
 const parts=skeleton.slots.map(slot=>{const attachment=slot.getAppliedPose().attachment;assert(attachment instanceof MeshAttachment,'Expected installed weighted mesh');const rest=new Float32Array(attachment.worldVerticesLength);attachment.computeWorldVertices(skeleton,slot,0,rest.length,rest,0,2);return {slot,attachment,rest,posed:new Float32Array(rest.length)}});
 const visibility=spawnSync('/Applications/anaconda3/envs/math-sdk/bin/python',[path.join(app,'design/lib/cast_visibility.py')],{encoding:'utf8',input:JSON.stringify(parts.map(p=>({name:p.slot.data.name,path:path.join(dir,p.slot.data.name+'.png'),uvs:Array.from(p.attachment.regionUVs),triangles:Array.from(p.attachment.triangles)})))});assert(visibility.status===0,visibility.stderr);const visible=JSON.parse(visibility.stdout);
 let poses=0,minArea=Infinity,maxArea=0;const clips=[];
 const measure=label=>{skeleton.updateWorldTransform(Physics.none);for(const {slot,attachment,rest,posed} of parts){attachment.computeWorldVertices(skeleton,slot,0,posed.length,posed,0,2);assert(posed.every(Number.isFinite),`${variant}/${label}: nonfinite vertex`);for(const ti of visible[slot.data.name]){const [a,b,c]=attachment.triangles.slice(ti*3,ti*3+3),before=area(rest,a,b,c);if(Math.abs(before)<.001)continue;const ratio=area(posed,a,b,c)/before;minArea=Math.min(minArea,ratio);maxArea=Math.max(maxArea,ratio);assert(ratio>.08&&ratio<6,`${variant}/${label}/${slot.data.name}: collapsed/flipped/stretched ink triangle ${ti}: ${ratio.toFixed(5)}`)}}poses++};
 const fresh=()=>{skeleton.setupPose();const data=new AnimationStateData(skeleton.data);data.defaultMix=.18;return new AnimationState(data)};
 for(const animation of skeleton.data.animations){const state=fresh();state.setAnimation(0,animation.name,false);const count=Math.ceil(animation.duration*60);for(let frame=0;frame<=count;frame++){state.update(frame?1/60:0);state.apply(skeleton);measure(animation.name+':'+frame)}clips.push({name:animation.name,frames:count+1})}
 const idle=json.turf.idle??'idle',reactions=[...new Set(Object.values(json.turf.reactions))];
 for(const phase of [0,.3,.7,1.2])for(const speed of [1,2])for(const reaction of reactions){const state=fresh();state.setAnimation(0,idle,true).trackTime=phase;state.apply(skeleton);const react=()=>{const e=state.setAnimation(0,reaction,false);e.timeScale=speed*(json.turf.speed?.[reaction]??1);e.mixDuration=.15;const b=state.addAnimation(0,idle,true,0);b.timeScale=json.turf.speed?.[idle]??1;b.mixDuration=.35};react();for(let frame=0;frame<180;frame++){if(frame===19)react();state.update(1/60);state.apply(skeleton);measure(`mix:${phase}/${speed}/${reaction}/${frame}`)}}
 reports.push({variant,root,poses,clips,inkTriangleAreaRatio:[minArea,maxArea],visualAcceptance:'Source layers and rendered clips/transitions must also be inspected'});console.log(`${variant}: ${poses} actual poses, ${clips.length} clips + interruptions, ink area ${minArea.toFixed(3)}..${maxArea.toFixed(3)}`);
}
if(arg('--write-report'))fs.writeFileSync(arg('--write-report'),JSON.stringify(reports,null,2));

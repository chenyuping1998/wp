import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
import {core42} from '../../../tools/mascot-rig/lib/kit.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'static/assets/spines/mummyCat');
const require=createRequire(import.meta.url),{PNG}=require('E:/stake/tools/gen/node_modules/pngjs'),c=await core42();
const atlas=new c.TextureAtlas(fs.readFileSync(path.join(dir,'mummyCat.atlas'),'utf8'));
const textures=new Map(atlas.pages.map(p=>[p.name,PNG.sync.read(fs.readFileSync(path.join(dir,p.name)))]));
function evaluate(j){
 const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(j),sk=new c.Skeleton(data),state=new c.AnimationState(new c.AnimationStateData(data));
 const mesh=name=>{const slot=sk.findSlot(name),a=slot.getAttachment(),v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,v.length,v,0,2);return{a,v,tex:textures.get(a.region.page.name)};};
 const cross=(v,a,b,c)=>(v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]);
 const alpha=(m,u,v)=>{const {tex}=m,x=Math.max(0,Math.min(tex.width-1,Math.round(u*tex.width))),y=Math.max(0,Math.min(tex.height-1,Math.round(v*tex.height)));return tex.data[(y*tex.width+x)*4+3];};
 sk.setToSetupPose();sk.updateWorldTransform(c.Physics.none);const rest={arm_l:mesh('arm_l'),arm_r:mesh('arm_r')},report={};
 for(const action of ['wave','cheer']){
  let inversions=0,minimum=Infinity,maximum=0,shoulderTravel=0,frames=0;
  sk.setToSetupPose();state.clearTracks();state.setAnimation(0,action,false);
  const sockets=Object.fromEntries(['L','R'].map(s=>{sk.setToSetupPose();sk.updateWorldTransform(c.Physics.none);const b=sk.findBone('upperArm'+s);return[s,[b.worldX,b.worldY]];}));
  const duration=data.findAnimation(action).duration;
  for(let f=0;f<=Math.ceil(duration*60);f++){
   sk.setToSetupPose();state.clearTracks();state.setAnimation(0,action,false);state.update(f/60);state.apply(sk);sk.updateWorldTransform(c.Physics.none);
   for(const [name,r]of Object.entries(rest)){
    const m=mesh(name),idx=m.a.triangles;
    for(let k=0;k<idx.length;k+=3){const a=idx[k],b=idx[k+1],cc=idx[k+2],u=(m.a.uvs[a*2]+m.a.uvs[b*2]+m.a.uvs[cc*2])/3,v=(m.a.uvs[a*2+1]+m.a.uvs[b*2+1]+m.a.uvs[cc*2+1])/3;if(alpha(m,u,v)<150)continue;
     const ratio=cross(m.v,a,b,cc)/cross(r.v,a,b,cc);if(ratio<=0)inversions++;minimum=Math.min(minimum,ratio);maximum=Math.max(maximum,ratio);
    }
   }
   // Shoulder displacement relative to chest removes the jump and torso lean.
   for(const side of ['L','R']){const b=sk.findBone('upperArm'+side),point={x:b.worldX,y:b.worldY};sk.findBone('chest').worldToLocal(point);
    const bone=j.bones.find(x=>x.name==='clav'+side),upper=j.bones.find(x=>x.name==='upperArm'+side),angle=(bone.rotation??0)*Math.PI/180;
    const x=(bone.x??0)+Math.cos(angle)*(upper.x??0),y=(bone.y??0)+Math.sin(angle)*(upper.x??0);
    shoulderTravel=Math.max(shoulderTravel,Math.hypot(point.x-x,point.y-y));
   }frames++;
  }
  report[action]={frames,inkedArmTriangleInversions:inversions,minAreaRatio:minimum,maxAreaRatio:maximum,maxShoulderSocketTravel:shoulderTravel};
 }return report;
}
const original=evaluate(JSON.parse(fs.readFileSync(path.join(root,'design/source/mummy_delivery/mascot_versions/before_seven_fixes/mummyCat.json'))));
const current=evaluate(JSON.parse(fs.readFileSync(path.join(dir,'mummyCat.json'))));
const passed=Object.keys(current).every(k=>current[k].inkedArmTriangleInversions===0&&current[k].maxShoulderSocketTravel<original[k].maxShoulderSocketTravel);
const report={passed,original,current};fs.writeFileSync(path.join(root,'design/source/mummy_delivery/mascot/arm_verification.json'),JSON.stringify(report,null,2));console.log(report);
if(!passed)throw new Error('Arm refinement failed geometry or shoulder socket check');

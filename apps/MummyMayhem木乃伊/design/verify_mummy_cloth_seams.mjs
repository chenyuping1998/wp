import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {core42} from '../../../tools/mascot-rig/lib/kit.ts';
const require=createRequire(import.meta.url),{PNG}=require('E:/stake/tools/gen/node_modules/pngjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'static/assets/spines/mummyCat');
const c=await core42(),atlas=new c.TextureAtlas(fs.readFileSync(path.join(dir,'mummyCat.atlas'),'utf8'));
const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(path.join(dir,'mummyCat.json'),'utf8')));
const sk=new c.Skeleton(data),state=new c.AnimationState(new c.AnimationStateData(data));
const textures=new Map(atlas.pages.map(p=>[p.name,PNG.sync.read(fs.readFileSync(path.join(dir,p.name)))]));
function mesh(slotName){const slot=sk.findSlot(slotName),a=slot.getAttachment(),v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,a.worldVerticesLength,v,0,2);return {a,v,tex:textures.get(a.region.page.name)};}
function opaque(m,x,y){
 const {a,v,tex}=m;
 for(let i=0;i<a.triangles.length;i+=3){
  const ia=a.triangles[i]*2,ib=a.triangles[i+1]*2,ic=a.triangles[i+2]*2;
  const ax=v[ia],ay=v[ia+1],bx=v[ib],by=v[ib+1],cx=v[ic],cy=v[ic+1];
  const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-8)continue;
  const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,w=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,z=1-u-w;
  if(u<0||w<0||z<0)continue;
  const tx=Math.max(0,Math.min(tex.width-1,Math.round((u*a.uvs[ia]+w*a.uvs[ib]+z*a.uvs[ic])*tex.width)));
  const ty=Math.max(0,Math.min(tex.height-1,Math.round((u*a.uvs[ia+1]+w*a.uvs[ib+1]+z*a.uvs[ic+1])*tex.height)));
  return tex.data[(ty*tex.width+tx)*4+3]>150;
 }
 return false;
}
const names=['flow_waist','flow_tail','flow_chest','flow_hip_r'];
let frames=0,minCoverage=Object.fromEntries(names.map(n=>[n,1])),worst={};
for(const action of data.animations.filter(a=>a.name!=='bandage_flow')){
 sk.setToSetupPose();state.clearTracks();state.setAnimation(0,action.name,true);state.setAnimation(1,'bandage_flow',true);
 for(let f=0;f<=192;f++){
  state.update(1/30);state.apply(sk);sk.updateWorldTransform(c.Physics.none);
  for(const name of names){
   const cloth=mesh(name),covers=(name==='flow_tail'?['tail']:['pelvis','torso','arm_l','arm_r']).map(mesh);
   let covered=0,total=0;
   for(let r=0;r<2;r++)for(let col=0;col<5;col++){const i=(r*5+col)*2;total++;if(covers.some(m=>opaque(m,cloth.v[i],cloth.v[i+1])))covered++;}
   const coverage=covered/total;if(coverage<minCoverage[name]){minCoverage[name]=coverage;worst[name]=action.name+'@'+(f/30).toFixed(3);}
  }frames++;
 }
}
const report={passed:Object.values(minCoverage).every(v=>v===1),frames,minCoverage,worst,method:'First two cloth vertex rows must remain fully under existing opaque body art'};
fs.writeFileSync(path.join(root,'design/source/mummy_delivery/mascot/flow/seams_verification.json'),JSON.stringify(report,null,2));console.log(report);
if(!report.passed)throw new Error('Visible cloth root');

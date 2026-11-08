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
const tailRoot=sk.bones.find(b=>b.data.name.startsWith('tail'));
if(!tailRoot)throw new Error('tail root missing');
let minOverlap=Infinity,worst='',frames=0;
for(const animation of data.animations){
 sk.setToSetupPose();state.clearTracks();state.setAnimation(0,animation.name,false);
 for(let t=0;t<=animation.duration;t+=1/30){
  state.update(1/30);state.apply(sk);sk.updateWorldTransform(c.Physics.update);
  const tail=mesh('tail'),pelvis=mesh('pelvis');let overlap=0;
  for(let yy=-8;yy<=8;yy+=2)for(let xx=-8;xx<=8;xx+=2){const x=tailRoot.worldX+xx,y=tailRoot.worldY+yy;if(opaque(tail,x,y)&&opaque(pelvis,x,y))overlap++;}
  if(overlap<minOverlap){minOverlap=overlap;worst=animation.name+'@'+t.toFixed(3);}frames++;
 }
}
const result={passed:minOverlap>=12,frames,minOpaqueOverlapSamples:minOverlap,patchSamples:81,worst,root:tailRoot.data.name};
fs.writeFileSync(path.join(root,'design/source/mummy_delivery/mascot/tail_v2_verification.json'),JSON.stringify(result,null,2));console.log(result);
if(!result.passed)throw new Error('tail root does not retain sufficient opaque overlap with pelvis');

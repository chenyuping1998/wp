/** Check the actual Spine 4.2 cloth meshes and export their world-space animation for offline QA. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {core42} from '../../../tools/mascot-rig/lib/kit.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'static/assets/spines/mummyCat'),out=path.join(root,'design/source/mummy_delivery/mascot/flow');
const c=await core42(),j=JSON.parse(fs.readFileSync(path.join(dir,'mummyCat.json'),'utf8'));
const atlas=new c.TextureAtlas(fs.readFileSync(path.join(dir,'mummyCat.atlas'),'utf8'));
const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(j);
const sk=new c.Skeleton(data),state=new c.AnimationState(new c.AnimationStateData(data));
const specs=JSON.parse(fs.readFileSync(path.join(out,'flow_spec.json'),'utf8')).specs;
const original=JSON.parse(fs.readFileSync(path.join(root,'design/source/mummy_delivery/mascot_versions/before_flow_runtime/mummyCat.json'),'utf8'));
for(const key of ['bones','slots'])if(JSON.stringify(j[key].filter(v=>!v.name.startsWith('flow_')&&!v.name.startsWith('face_')))!==JSON.stringify(original[key]))throw new Error(`Body ${key} changed`);
for(const [name,anim] of Object.entries(original.animations))if(!['wave','cheer'].includes(name)&&JSON.stringify(j.animations[name])!==JSON.stringify(anim))throw new Error(`Unexpected body animation changed:${name}`);
for(const skin of original.skins)for(const [slot,att] of Object.entries(skin.attachments))if(slot!=='head'&&JSON.stringify(j.skins.find(s=>s.name===skin.name).attachments[slot])!==JSON.stringify(att))throw new Error(`Body mesh changed:${slot}`);
function pose(action,t,held=false){sk.setToSetupPose();state.clearTracks();state.setAnimation(0,action,true);state.setAnimation(1,'bandage_flow',true);if(held){state.getCurrent(0).trackTime=.34;state.getCurrent(0).timeScale=0;}state.update(t);state.apply(sk);sk.updateWorldTransform(c.Physics.none);}
function mesh(name){const slot=sk.findSlot(name),a=slot.getAttachment(),v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,v.length,v,0,2);return{a,v};}
pose('idle',0);
const signs=new Map(specs.map(s=>{const{a,v}=mesh(s.name);return[s.name,Math.sign((v[2]-v[0])*(v[13]-v[1])-(v[3]-v[1])*(v[12]-v[0]))];}));
let frames=0,minArea=Infinity,maxAnchorError=0;
for(const action of original.animations?Object.keys(original.animations):[]){
 for(let f=0;f<=384;f++){
  pose(action,f/60);
  for(const s of specs){const{a,v}=mesh(s.name),bone=sk.findBone(`${s.name}_0`);
   maxAnchorError=Math.max(maxAnchorError,Math.hypot(v[4]-bone.worldX,v[5]-bone.worldY));
   if(!v.every(Number.isFinite))throw new Error('Nonfinite cloth mesh');
   for(let i=0;i<a.triangles.length;i+=3){const aa=a.triangles[i]*2,b=a.triangles[i+1]*2,cc=a.triangles[i+2]*2;
    const area=((v[b]-v[aa])*(v[cc+1]-v[aa+1])-(v[b+1]-v[aa+1])*(v[cc]-v[aa]))*signs.get(s.name);
    minArea=Math.min(minArea,area);if(area<=0)throw new Error(`Cloth triangle folded:${action}@${f/60}`);
   }
  }frames++;
 }
}
pose('idle',0);const start=specs.map(s=>mesh(s.name).v);pose('idle',6.4);let seam=0;
for(let k=0;k<specs.length;k++){const v=mesh(specs[k].name).v;for(let i=0;i<v.length;i++)seam=Math.max(seam,Math.abs(v[i]-start[k][i]));}
pose('point',0,true);const held0=mesh('flow_waist').v;pose('point',1.6,true);const held1=mesh('flow_waist').v;
let heldMotion=0;for(let i=0;i<held0.length;i++)heldMotion=Math.max(heldMotion,Math.abs(held1[i]-held0[i]));
if(maxAnchorError>.001||seam>.02||heldMotion<1)throw new Error(`Cloth anchor/seam/held failed:${maxAnchorError}/${seam}/${heldMotion}`);
const result={passed:true,bodyMeshesExceptFaceAndOtherActionsUnchanged:true,refinedActions:['wave','cheer'],clothStrips:specs.length,frames,minSignedTriangleArea:minArea,maxAnchorError,loopSeamMaxError:seam,pointHeldClothMotion:heldMotion};
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));console.log(result);
// Export actual runtime geometry, not an illustrative approximation.
pose('idle',0);const slots=sk.drawOrder.map(slot=>{const a=slot.getAttachment();return{name:slot.data.name,file:a.region.page.name,verts:Array.from({length:a.worldVerticesLength/2},(_,i)=>[a.uvs[i*2]*a.region.page.width,a.uvs[i*2+1]*a.region.page.height]),tris:Array.from(a.triangles)};});
const width=640,height=680,groundY=635,fps=12,labels=[],segments=[],all=[];
for(const action of ['idle','wave','throw','cheer','dance','point']){
 const n=action==='idle'?77:20,start=labels.length;
 segments.push({anim:action,start,n});
 for(let f=0;f<n;f++){
  const t=f/fps;pose(action,t,action==='point');labels.push(`${action} + flowing linen`);
  for(const slot of sk.drawOrder){const a=slot.getAttachment(),v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,v.length,v,0,2);for(let i=0;i<v.length;i+=2)all.push(v[i]*.75+width/2,groundY-v[i+1]*.75);}
 }
}
fs.writeFileSync(path.join(out,'meta.json'),JSON.stringify({width,height,fps,frames:labels.length,labels,segments,ground:[width/2,groundY],texScale:1,slots,footer:'Spine 4.2 runtime geometry - offline preview'}));
fs.writeFileSync(path.join(out,'frames.bin'),Buffer.from(new Float32Array(all).buffer));

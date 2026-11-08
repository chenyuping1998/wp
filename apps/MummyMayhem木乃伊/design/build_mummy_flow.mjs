/** Secondary cloth only: retain the current character, joint fixes, faces and eight body actions. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {core42} from '../../../tools/mascot-rig/lib/kit.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'static/assets/spines/mummyCat'),delivery=path.join(root,'design/source/mummy_delivery/mascot/flow');
fs.mkdirSync(delivery,{recursive:true});
const backup=path.join(root,'design/source/mummy_delivery/mascot_versions/before_flow_runtime');
if(!fs.existsSync(backup)){fs.mkdirSync(backup,{recursive:true});for(const f of fs.readdirSync(dir))if(f!=='flow_bandage.png')fs.copyFileSync(path.join(dir,f),path.join(backup,f));}
const jsonPath=path.join(dir,'mummyCat.json'),atlasPath=path.join(dir,'mummyCat.atlas');
const j=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
// Idempotent append: only strip this builder's own leaf bones/slots/animation.
const oldBoneNames=j.bones.map(b=>b.name);
j.bones=j.bones.filter(b=>!b.name.startsWith('flow_'));
j.slots=j.slots.filter(s=>!s.name.startsWith('flow_'));
for(const skin of j.skins)for(const name of Object.keys(skin.attachments??{}))if(name.startsWith('flow_'))delete skin.attachments[name];
const keptBones=new Map(j.bones.map((b,i)=>[b.name,i]));
for(const skin of j.skins)for(const atts of Object.values(skin.attachments))for(const a of Object.values(atts)){
 if(!a.vertices||a.vertices.length===a.uvs?.length)continue;
 for(let i=0;i<a.vertices.length;){const n=a.vertices[i++];for(let k=0;k<n;k++,i+=4){const b=keptBones.get(oldBoneNames[a.vertices[i]]);if(b===undefined)throw new Error('Missing retained weighted bone');a.vertices[i]=b;}}
}
delete j.animations.bandage_flow;
for(const anim of Object.values(j.animations))for(const name of Object.keys(anim.bones??{}))if(name.startsWith('flow_'))delete anim.bones[name];
let text=fs.readFileSync(atlasPath,'utf8').replace(/\nflow_bandage\.png\n[\s\S]*?(?=\n\n[^\n]+\.png\n|$)/g,'').trimEnd();
text+='\n\nflow_bandage.png\nsize:104,1032\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\npma:false\nflow_linen\nbounds:4,4,96,1024\n';
const c=await core42(),atlas=new c.TextureAtlas(text);
function skeleton(){const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(j);const sk=new c.Skeleton(data);sk.setToSetupPose();sk.updateWorldTransform(c.Physics.none);return sk;}
const rows=32,cols=4,count=6,period=6.4;
const specs=[
 {name:'flow_waist',parent:'hip',anchor:[410,1030],length:180,width:22,angle:-145,phase:0,amplitude:[.5,2,5,8,12,15]},
 {name:'flow_tail',parent:'tail2',anchor:[910,878],length:160,width:19,angle:-106,phase:1.3,amplitude:[.4,1.8,4,7,10,13]},
 {name:'flow_chest',parent:'chest',anchor:[408,734],length:185,width:18,angle:-154,phase:2.6,amplitude:[]},
 {name:'flow_hip_r',parent:'hip',anchor:[650,1000],length:162,width:16,angle:-61,phase:4.1,amplitude:[]},
];
const skin=j.skins.find(s=>s.name==='default')??j.skins[0];
for(const spec of specs){
 let sk=skeleton(),p=sk.findBone(spec.parent);if(!p)throw new Error(`cloth parent missing:${spec.parent}`);
 const local={x:(spec.anchor[0]-512)*.5,y:(1456-spec.anchor[1])*.5};p.worldToLocal(local);
 const angle=spec.angle-Math.atan2(p.c,p.a)*180/Math.PI;
 j.bones.push({name:`${spec.name}_anchor`,parent:spec.parent,x:local.x,y:local.y,rotation:angle});
 for(let i=0;i<count;i++)j.bones.push({name:`${spec.name}_${i}`,parent:i?`${spec.name}_${i-1}`:`${spec.name}_anchor`,x:i?spec.length/(count-1):0,y:0,rotation:0,length:spec.length/(count-1)});
 sk=skeleton();const base=sk.findBone(`${spec.name}_0`),uvs=[],vertices=[],triangles=[];
 for(let r=0;r<=rows;r++)for(let col=0;col<=cols;col++){
  const t=r/rows,u=col/cols;uvs.push(u,t);
  // A soft S silhouette in the fabric itself avoids a straight, rigid strip at rest.
  const bend=spec.width*.62*Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI/2);
  const edge=Math.min(1,t/.2),rootWidth=.58+.42*edge*edge*(3-2*edge);
  const taper=(1-.3*t*t)*rootWidth;
  const world={x:t*spec.length,y:bend+(.5-u)*spec.width*taper};base.localToWorld(world);
  const f=t*(count-1),b=Math.min(count-2,Math.floor(f)),mix=f-b;
  const influences=[[b,1-mix],[b+1,mix]].filter(([,w])=>w>1e-8);vertices.push(influences.length);
  for(const [idx,w] of influences){const bone=sk.findBone(`${spec.name}_${idx}`),point={...world};bone.worldToLocal(point);vertices.push(j.bones.findIndex(n=>n.name===bone.data.name),+point.x.toFixed(5),+point.y.toFixed(5),+w.toFixed(8));}
 }
 for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){const a=r*(cols+1)+col,b=a+1,d=a+cols+1,e=d+1;triangles.push(a,b,e,a,e,d);}
 j.slots.unshift({name:spec.name,bone:'root',attachment:spec.name});
 skin.attachments[spec.name]={[spec.name]:{type:'mesh',path:'flow_linen',uvs,vertices,triangles,hull:0,width:96,height:1024}};
}
const animation={bones:{}};
// Golf's cloth principle: a travelling transverse wave with an immovable sewn
// edge. Translate overlapping controls, rather than turning a chain of hinges.
function clothAt(spec,i,t){
 const s=i/(count-1),u=Math.max(0,(s-.16)/.84),w=2*Math.PI*t/period;
 const wave=Math.sin(w-2*Math.PI*s+spec.phase)+.26*Math.sin(2*w-3*Math.PI*s+spec.phase*1.7);
 return {x:-spec.length*.012*u*u*(.55+.45*Math.sin(w-2*Math.PI*s+spec.phase)**2),y:spec.width*.86*u**1.4*wave};
}
for(const spec of specs)for(let i=0;i<count;i++){
 const translate=[];
 for(let f=0;f<=96;f++){
  const t=f/96*period,a=clothAt(spec,i,t),b=i?clothAt(spec,i-1,t):{x:0,y:0};
  translate.push({time:+t.toFixed(6),x:+(a.x-b.x).toFixed(5),y:+(a.y-b.y).toFixed(5)});
 }
 animation.bones[`${spec.name}_${i}`]={translate};
}
j.animations.bandage_flow=animation;
// A jump drives an additional, slow root lag without overriding the free-end wave.
for(const spec of specs){
 const sign=Math.cos(spec.angle*Math.PI/180)<0?1:-1;
 j.animations.cheer.bones[`${spec.name}_anchor`]={rotate:[{time:0,value:0},{time:.2,value:-sign*.7},{time:.4,value:sign*3.2},{time:.65,value:sign*1.4},{time:.83,value:-sign*2},{time:1.08,value:sign*.6},{time:1.2,value:0}]};
}
fs.writeFileSync(jsonPath,JSON.stringify(j));fs.writeFileSync(atlasPath,text);
fs.writeFileSync(path.join(delivery,'flow_spec.json'),JSON.stringify({bodyScale:.5,period,lockedRootFraction:.16,method:'travelling wave, overlapping translated controls, no hinged rotation',segments:count,rows,cols,specs},null,2));
console.log('Four anchored weighted linen ribbons, action lag and 6.4s free-end wave');

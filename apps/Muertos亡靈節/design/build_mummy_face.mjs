/** New facial controls deform the same continuous head mesh, with no floating eye sprites. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {core42} from '../../../tools/mascot-rig/lib/kit.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'static/assets/spines/mummyCat');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'design/source/mummy_delivery/mascot_versions/before_living_face/mummyCat.json')));
const file=path.join(dir,'mummyCat.json'),j=JSON.parse(fs.readFileSync(file)),oldNames=j.bones.map(b=>b.name);
const skin=j.skins.find(s=>s.name==='default')??j.skins[0];
skin.attachments.head=structuredClone(baseline.skins[0].attachments.head);
j.bones=j.bones.filter(b=>!b.name.startsWith('face_'));for(const n of Object.keys(j.animations))if(n.startsWith('face_'))delete j.animations[n];
// Remap every retained weighted mesh by bone name; cloth may already be installed.
const byName=new Map(j.bones.map((b,i)=>[b.name,i]));
for(const s of j.skins)for(const [slot,atts]of Object.entries(s.attachments))for(const a of Object.values(atts)){
 if(!a.vertices||a.vertices.length===a.uvs?.length||slot==='head')continue;
 for(let i=0;i<a.vertices.length;){const n=a.vertices[i++];for(let k=0;k<n;k++,i+=4){const b=byName.get(oldNames[a.vertices[i]]);if(b===undefined)throw new Error('Missing retained bone');a.vertices[i]=b;}}
}
let atlasText=fs.readFileSync(path.join(dir,'mummyCat.atlas'),'utf8').replace(/\nhead_talk\.png\n[\s\S]*?(?=\n\n[^\n]+\.png\n|$)/g,'').trimEnd();
atlasText+='\n\nhead_talk.png\nsize:216,216\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\npma:false\nhead_talk\nbounds:0,0,216,216\n';
const c=await core42(),atlas=new c.TextureAtlas(atlasText);
function skeleton(){const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(j),s=new c.Skeleton(data);s.setToSetupPose();s.updateWorldTransform(c.Physics.none);return s;}
let sk=skeleton(),slot=sk.findSlot('head'),att=slot.getAttachment(),world=new Float32Array(att.worldVerticesLength);att.computeWorldVertices(slot,0,world.length,world,0,2);
const head=sk.findBone('head'),angle=-Math.atan2(head.c,head.a)*180/Math.PI;
j.bones.push({name:'face_frame',parent:'head',rotation:angle},{name:'face_gaze',parent:'face_frame'},{name:'face_pupil',parent:'face_gaze'},{name:'face_mouth',parent:'face_gaze'});
sk=skeleton();
// A muzzle pivot interpolated from the production mesh's UV coordinates.
let nearest=0,dist=Infinity;
for(let i=0;i<att.uvs.length;i+=2){const d=(att.uvs[i]*216-130)**2+(att.uvs[i+1]*216-145)**2;if(d<dist){dist=d;nearest=i;}}
const mouth={x:world[nearest],y:world[nearest+1]};sk.findBone('face_gaze').worldToLocal(mouth);
Object.assign(j.bones.find(b=>b.name==='face_mouth'),{x:mouth.x,y:mouth.y});sk=skeleton();
for(const [name,a]of Object.entries(skin.attachments.head)){
 const vertices=[],old=a.vertices;let at=0;
 for(let v=0;v<a.uvs.length/2;v++){
  const x=a.uvs[v*2]*216,y=a.uvs[v*2+1]*216;
  const pupil=.88*Math.exp(-(((x-84)/16)**2+((y-91)/19)**2));
  const jaw=.78*Math.exp(-(((x-130)/28)**2+((y-146)/22)**2));
  const gaze=.38*Math.exp(-(((x-109)/72)**2+((y-125)/65)**2));
  const wp=pupil,wm=(1-wp)*jaw,wg=(1-wp-wm)*gaze,remain=1-wp-wm-wg;
  const n=old[at++],parts=[];
  for(let k=0;k<n;k++){const bone=old[at++],px=old[at++],py=old[at++],w=old[at++]*remain;if(w>1e-7)parts.push([bone,px,py,w]);}
  for(const [boneName,w]of [['face_pupil',wp],['face_mouth',wm],['face_gaze',wg]])if(w>1e-7){const b=sk.findBone(boneName),p={x:world[v*2],y:world[v*2+1]};b.worldToLocal(p);parts.push([j.bones.findIndex(z=>z.name===boneName),p.x,p.y,w]);}
  vertices.push(parts.length,...parts.flat());
 }a.vertices=vertices;
}
skin.attachments.head.head_talk={...structuredClone(skin.attachments.head.head_idle),path:'head_talk'};
const events=['face_open','face_close'];for(const e of events)j.events[e]??={};
const translate=points=>points.map(([time,x,y=0])=>({time,x,y}));
const scale=points=>points.map(([time,y])=>({time,x:1,y}));
j.animations.face_scan={bones:{
 face_gaze:{translate:translate([[0,0],[1,0],[1.45,-2.5],[2.6,-2.3],[3.15,0],[5.1,0],[5.55,2.5],[6.8,2.3],[7.4,0],[12.8,0]])},
 face_pupil:{translate:translate([[0,0],[1.1,0],[1.24,-3],[2.65,-3],[2.84,0],[5.24,0],[5.38,3],[6.85,3],[7.04,0],[12.8,0]])},
 face_mouth:{scale:scale([[0,1],[9.9,1],[10.05,.58],[10.4,1],[10.95,1.05],[11.3,.58],[11.5,1],[12.8,1]])}},events:[{time:10.05,name:'face_open'},{time:11.35,name:'face_close'}]};
j.animations.face_greet={bones:{face_pupil:{translate:translate([[0,0],[.28,-1.5],[1.2,-1.5],[1.8,0]])},face_mouth:{scale:scale([[0,1],[.35,.65],[.55,1.05],[.78,.9],[.95,.65],[1.1,1],[1.8,1]])}},events:[{time:.35,name:'face_open'},{time:1,name:'face_close'}]};
j.animations.face_focus={bones:{face_gaze:{translate:translate([[0,0],[.3,-2.5],[1.4,-2.5]])},face_pupil:{translate:translate([[0,0],[.15,-3],[1.4,-3]])}}};
j.animations.face_react={bones:{face_mouth:{scale:scale([[0,1],[.32,1.08],[.52,.94],[.7,1.07],[.92,1],[1.2,1.06],[1.5,1],[1.6,1]])}}};
fs.writeFileSync(file,JSON.stringify(j));fs.writeFileSync(path.join(dir,'mummyCat.atlas'),atlasText);
console.log('Installed continuous-mesh gaze, pupil and mouth controls plus four face clips');

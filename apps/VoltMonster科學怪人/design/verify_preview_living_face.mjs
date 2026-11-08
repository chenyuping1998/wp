/** Validate actual weighted head controls, then export close-up performance frames. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {core42} from '../../../tools/mascot-rig/lib/kit.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'static/assets/spines/mummyCat'),out=path.join(root,'design/preview_mummy_20261107/living_scene');fs.mkdirSync(out,{recursive:true});
const c=await core42(),atlas=new c.TextureAtlas(fs.readFileSync(path.join(dir,'mummyCat.atlas'),'utf8')),j=JSON.parse(fs.readFileSync(path.join(dir,'mummyCat.json')));
function runtime(json){const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(json),sk=new c.Skeleton(data),state=new c.AnimationState(new c.AnimationStateData(data));sk.setToSetupPose();sk.updateWorldTransform(c.Physics.none);return{data,sk,state};}
const {data,sk,state}=runtime(j);
function mesh(skeleton=sk){const slot=skeleton.findSlot('head'),a=slot.getAttachment(),v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,v.length,v,0,2);return{a,v};}
const baseline=runtime(JSON.parse(fs.readFileSync(path.join(root,'design/source/mummy_delivery/mascot_versions/before_living_face/mummyCat.json'))));
const rest=mesh(),before=mesh(baseline.sk);let restError=0;
for(let i=0;i<rest.v.length;i++)restError=Math.max(restError,Math.abs(rest.v[i]-before.v[i]));
function pose(action,clip,t){sk.setToSetupPose();state.clearTracks();state.setAnimation(0,action,true);state.setAnimation(1,'bandage_flow',true);state.setAnimation(2,clip,clip==='face_scan'||clip==='face_react');state.update(t);state.apply(sk);sk.updateWorldTransform(c.Physics.none);}
function area(v,a,b,c){a*=2;b*=2;c*=2;return(v[b]-v[a])*(v[c+1]-v[a+1])-(v[b+1]-v[a+1])*(v[c]-v[a]);}
let min=Infinity,max=0,frames=0,flips=0;
for(const [action,clip]of [['idle','face_scan'],['wave','face_greet'],['cheer','face_react'],['laugh','face_react'],['point','face_focus']]){
 const duration=clip==='face_scan'?25.6:2;
 for(let f=0;f<=duration*60;f++){
  pose(action,clip,f/60);const {a,v}=mesh();if(!v.every(Number.isFinite))throw new Error('Invalid head vertices');
  for(let k=0;k<a.triangles.length;k+=3){const [aa,b,cc]=a.triangles.slice(k,k+3),ratio=area(v,aa,b,cc)/area(rest.v,aa,b,cc);min=Math.min(min,ratio);max=Math.max(max,ratio);if(ratio<=0)flips++;}frames++;
 }
}
let pupilIndex=0,d=Infinity;for(let i=0;i<rest.a.uvs.length;i+=2){const q=(rest.a.uvs[i]*216-84)**2+(rest.a.uvs[i+1]*216-91)**2;if(q<d){d=q;pupilIndex=i;}}
pose('idle','face_scan',1.8);const left=mesh().v;pose('idle','face_scan',5.9);const right=mesh().v;
const pupilTravel=Math.abs(right[pupilIndex]-left[pupilIndex]);
if(restError>.0001||flips||min<.35||max>1.8||pupilTravel<2)throw new Error(`Head check failed:${restError}/${flips}/${min}/${max}/${pupilTravel}`);
const report={passed:true,frames,restPoseMaxError:restError,triangleInversions:flips,minAreaRatio:min,maxAreaRatio:max,pupilHorizontalTravel:pupilTravel,clips:['face_scan','face_greet','face_focus','face_react']};
fs.writeFileSync(path.join(out,'face_verification.json'),JSON.stringify(report,null,2));console.log(report);
const fps=18,labels=[],floats=[];
for(const [action,clip,duration]of [['idle','face_scan',12.8],['wave','face_greet',1.8],['laugh','face_react',1.6],['point','face_focus',1.4]]){
 for(let f=0;f<Math.ceil(duration*fps);f++){
  const t=f/fps;pose(action,clip,t);let attachment='head_idle';
  if(clip==='face_scan'&&t>=10.05&&t<11.35||clip==='face_greet'&&t>=.35&&t<1)attachment='head_talk';
  if(clip==='face_react')attachment='head_laugh';
  if(clip==='face_scan'&&t>=4.1&&t<4.25)attachment='head_blink';
  sk.setAttachment('head',attachment);const {v}=mesh();for(let i=0;i<v.length;i+=2)floats.push(v[i]*1.9+240,1270-v[i+1]*1.9);
  labels.push({label:`${clip.replace('face_','')} / ${t.toFixed(2)}s`,attachment});
 }
}
fs.writeFileSync(path.join(out,'face.json'),JSON.stringify({fps,width:480,height:500,frames:labels,uvs:Array.from(rest.a.uvs),indices:Array.from(rest.a.triangles),verts:rest.v.length}));fs.writeFileSync(path.join(out,'face.bin'),Buffer.from(new Float32Array(floats).buffer));

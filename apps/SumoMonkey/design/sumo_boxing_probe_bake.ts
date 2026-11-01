/** Read-only evaluation of parent's staged Spine 4.3 skeleton for texture QA.
 * Uses full-canvas layer images, so crop-offset changes cannot falsify evidence.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {Skeleton,AnimationState,AnimationStateData,Physics} from '/Users/stone/tools/spine-generator/node_modules/@esotericsoftware/spine-core/dist/index.js';
import {parseSkeleton} from '/Users/stone/tools/spine-generator/src/spineJson.ts';
const root='/Users/stone/stake-engine';const cast=process.argv[2]??'mg';
const json=JSON.parse(readFileSync(`${root}/角色生圖_相撲猴/交件/${cast.toUpperCase()}/staged/${cast}_spine/${cast}.json`,'utf8'));
const data=parseSkeleton(json),sk=new Skeleton(data),skin=json.skins.find((s:any)=>s.name==='default').attachments;
const names=json.slots.map((s:any)=>s.attachment),clips:any={};
for(const anim of data.animations){
 const state=new AnimationState(new AnimationStateData(data));sk.setupPose();state.setAnimation(0,anim.name,false);const fps=30,frames:any=[];
 for(let i=0;i<=Math.ceil(anim.duration*fps);i++){
  if(i){state.update(1/fps);sk.update(1/fps);}sk.setupPose();state.apply(sk);sk.updateWorldTransform(Physics.update);
  frames.push(json.slots.map((slot:any)=>{
   const att=skin[slot.name][slot.attachment],p=sk.findBone(slot.bone)!.getAppliedPose();const rr=(att.rotation??0)*Math.PI/180,cr=Math.cos(rr),sr=Math.sin(rr);
   const a=(p.a*cr+p.b*sr)*(att.scaleX??1),c=(-p.a*sr+p.b*cr)*(att.scaleY??1),b=(p.c*cr+p.d*sr)*(att.scaleX??1),d=(-p.c*sr+p.d*cr)*(att.scaleY??1);
   const qx=p.worldX+p.a*(att.x??0)+p.b*(att.y??0),qy=p.worldY+p.c*(att.x??0)+p.d*(att.y??0);
   return [a,-b,-c,d,qx-a*att.width/2+c*att.height/2,-qy+b*att.width/2-d*att.height/2];
  }));
 }
 clips[anim.name]={duration:anim.duration,fps,frames};
}
writeFileSync(`${root}/dist/sumomonkey-boxing-evidence/${cast}-staged-real-bone-motion.json`,JSON.stringify({names,clips,source:'read-only staged Spine4.3 evaluation, full-canvas attachments'}));

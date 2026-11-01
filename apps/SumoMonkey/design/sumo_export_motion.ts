/** Bake Spine 4.3 evaluated regional transforms; the game shares a 4.2 runtime.
 * Baking keeps the new tool's IK/physics without changing sibling runtimes.
 * Run AFTER spine-motion character, using Node >=22.18.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Skeleton,AnimationState,AnimationStateData,Physics} from '/Users/stone/tools/spine-generator/node_modules/@esotericsoftware/spine-core/dist/index.js';
import {parseSkeleton} from '/Users/stone/tools/spine-generator/src/spineJson.ts';
const root=dirname(fileURLToPath(import.meta.url));
for(const cast of ['mg','fg']){
 const json=JSON.parse(readFileSync(join(root,'sumo_cast',cast,`${cast}_spine`,`${cast}.json`),'utf8'));
 const crops=JSON.parse(readFileSync(join(root,'sumo_cast',cast,'crops.json'),'utf8'));
 const data=parseSkeleton(json), sk=new Skeleton(data);
 const skin=json.skins.find((s:any)=>s.name==='default').attachments;
 const names=json.slots.map((s:any)=>s.attachment);
 const clips:any={};
 for(const anim of data.animations){
  const state=new AnimationState(new AnimationStateData(data));
  sk.setupPose(); state.setAnimation(0,anim.name,false);
  const frames:number[][][]=[], fps=30, count=Math.ceil(anim.duration*fps)+1;
  for(let i=0;i<count;i++){
   if(i){state.update(1/fps);sk.update(1/fps);}
   sk.setupPose();state.apply(sk);sk.updateWorldTransform(Physics.update);
   frames.push(json.slots.map((slot:any)=>{
    const att=skin[slot.name][slot.attachment], p=sk.findBone(slot.bone)!.getAppliedPose();
    const rr=(att.rotation??0)*Math.PI/180, cr=Math.cos(rr),sr=Math.sin(rr);
    const m00=(p.a*cr+p.b*sr)*(att.scaleX??1),m01=(-p.a*sr+p.b*cr)*(att.scaleY??1);
    const m10=(p.c*cr+p.d*sr)*(att.scaleX??1),m11=(-p.c*sr+p.d*cr)*(att.scaleY??1);
    const qx=p.worldX+p.a*(att.x??0)+p.b*(att.y??0),qy=p.worldY+p.c*(att.x??0)+p.d*(att.y??0);
    const ex=qx-m00*att.width/2+m01*att.height/2,ey=qy-m10*att.width/2+m11*att.height/2;
    const [x,y]=crops[slot.attachment];
    return [m00,-m10,-m01,m11,ex+m00*x-m01*y,-ey-m10*x+m11*y].map(n=>Math.round(n*10000)/10000);
   }));
  }
  clips[anim.name]={duration:anim.duration,fps,frames};
 }
 const out=join(root,'..','src','game',`sumoMotion_${cast}.json`);
 writeFileSync(out,JSON.stringify({source:`spine-motion-kit / Spine ${json.skeleton.spine}`,height:1400,names,clips}));
 console.log(out);
}

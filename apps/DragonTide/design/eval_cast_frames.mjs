// Sample the game's own rig JSON through the real Spine 4.3 runtime, same matrix as hypnoCastScene.ts.
import {readFileSync,writeFileSync} from 'node:fs';
import {AnimationState,AnimationStateData,Physics,Skeleton,SkeletonJson} from '/Users/stone/tools/spine-generator/node_modules/@esotericsoftware/spine-core/dist/index.js';
const [rigPath,out,step='0.12']=process.argv.slice(2);
const rig=JSON.parse(readFileSync(rigPath,'utf8'));
const loader={newRegionAttachment:()=>null,newMeshAttachment:()=>null,newBoundingBoxAttachment:()=>null,newPathAttachment:()=>null,newPointAttachment:()=>null,newClippingAttachment:()=>null};
const data=new SkeletonJson(loader).readSkeletonData(rig);
const skin=rig.skins[0].attachments,res=[];
for(const anim of data.animations){
 const sk=new Skeleton(data),st=new AnimationState(new AnimationStateData(data));
 st.setAnimation(0,anim.name,false);let prev=0;
 for(let t=0;t<=anim.duration+1e-6;t+=+step){
  const dt=t-prev;prev=t;st.update(dt);sk.update(dt);st.apply(sk);sk.updateWorldTransform(Physics.update);
  const keys=rig.animations[anim.name]?.slots??{},slots=[];
  for(const slot of rig.slots){
   let d=slot.attachment;for(const k of keys[slot.name]?.attachment??[])if((k.time??0)<=t+1e-6)d=k.name??null;
   if(!d||!skin[slot.name]?.[d])continue;
   const b=sk.findBone(slot.bone).getAppliedPose(),at=skin[slot.name][d],r=(at.rotation??0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
   const A=b.a*c+b.b*s,B=-b.a*s+b.b*c,C=b.c*c+b.d*s,D=-b.c*s+b.d*c;
   const qx=b.worldX+b.a*(at.x??0)+b.b*(at.y??0),qy=b.worldY+b.c*(at.x??0)+b.d*(at.y??0);
   const mx=qx-A*at.width/2+B*at.height/2,my=qy-C*at.width/2+D*at.height/2;
   // image (ix,iy) -> X=mx+A*ix-B*iy, Y=-(my+C*ix-D*iy)
   slots.push([d,[A,-B,-C,D,mx,-my]]);
  }
  res.push({label:anim.name,time:+t.toFixed(3),slots});
 }
}
writeFileSync(out,JSON.stringify({frames:res}));console.log(rigPath,res.length,[...new Set(res.map(f=>f.label))].join(','));

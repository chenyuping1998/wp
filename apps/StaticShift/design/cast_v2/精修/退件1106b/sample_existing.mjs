import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const P=path.dirname(fileURLToPath(import.meta.url));
const {parseSkeleton}=await import('/Users/stone/tools/spine-generator-ss/src/spineJson.ts');
const {Skeleton,AnimationState,AnimationStateData,Physics}=await import('/Users/stone/tools/spine-generator-ss/node_modules/@esotericsoftware/spine-core/dist/index.js');
for(const ch of ['dj','host']){
 const json=JSON.parse(fs.readFileSync(path.join(P,'../../spine_r5',ch+'_L',ch+'.json'),'utf8'));const data=parseSkeleton(json);const skin=json.skins.find(x=>x.name==='default').attachments;const frames=[];
 for(const anim of data.animations){
  const times=[];for(let t=0;t<anim.duration;t+=.1)times.push(+t.toFixed(5));if(anim.name==='win_big_end')times.push(.25);times.push(anim.duration);times.sort((a,b)=>a-b);
  const sk=new Skeleton(data),sd=new AnimationStateData(data),st=new AnimationState(sd);st.setAnimation(0,anim.name,false);let prev=0;
  for(const t of times){st.update(t-prev);sk.update(t-prev);prev=t;sk.setupPose();st.apply(sk);sk.updateWorldTransform(Physics.update);const slots=[];
   for(const slot of json.slots){let live=slot.attachment;for(const k of json.animations[anim.name]?.slots?.[slot.name]?.attachment??[])if((k.time??0)<=t+1e-6)live=k.name??null;if(!live)continue;const att=skin[slot.name]?.[live];if(!att)continue;const p=sk.findBone(slot.bone).getAppliedPose();const r=(att.rotation??0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r),sx=att.scaleX??1,sy=att.scaleY??1;const m00=(p.a*c+p.b*s)*sx,m01=(-p.a*s+p.b*c)*sy,m10=(p.c*c+p.d*s)*sx,m11=(-p.c*s+p.d*c)*sy;const qx=p.worldX+p.a*(att.x??0)+p.b*(att.y??0),qy=p.worldY+p.c*(att.x??0)+p.d*(att.y??0);const ex=qx-m00*att.width/2+m01*att.height/2,ey=qy-m10*att.width/2+m11*att.height/2;slots.push([live,[m00,-m01,-m10,m11,ex+900,1750-ey]]);}
   frames.push({anim:anim.name,time:t,slots});
  }
 }
 fs.writeFileSync(path.join(P,ch+'-actual-frames.json'),JSON.stringify({width:2200,height:2300,step:.1,source:'Unmodified r4 Spine 4.3 JSON, evaluated by spine-motion-kit 4.3.13 runtime',frames}));console.log(ch,frames.length,'actual frames',data.animations.map(x=>x.name));
}

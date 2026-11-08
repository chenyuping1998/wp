import assert from 'node:assert/strict';
import fs from 'node:fs';
import {waveWipePose,waveFrontOffset} from '../src/game/waveWipe.ts';
import {createReelBlur} from '../src/game/reelMotion.ts';
import {castArmPoint,castTorsoPoint,castForearmFrame,castArmJoints,castLegsPoint,createCastSkin,deformCastSkin} from '../src/game/treasureCastSkin.ts';
import {castPose,castDuration} from '../src/game/treasureMotion.ts';
const rig=JSON.parse(fs.readFileSync('src/game/treasureCastRig.json','utf8'));
for(const who of ['digger','lifeguard'])for(const cue of ['idle','scan','win','winBig','welcome']){
 for(let t=0;t<=Math.max(4000,castDuration(cue));t+=16){
  const pose=castPose(t,cue,t,false,who);
  for(const side of ['left','right']){
   const part=rig[who][side==='left'?'arm_l':'arm_r'];
   const shoulder=castTorsoPoint(part.x,part.y,pose.chest,pose.breathX,pose.breathY,pose.shoulderY);
   const elbow=pose[side+'Elbow'];
   const root=castArmPoint(part,part.ax,part.ay,pose[side],pose.chest,pose.breathX,pose.breathY,pose.shoulderY,elbow);
   assert.ok(Math.hypot(root.x-shoulder.x,root.y-shoulder.y)<1e-8,'sleeve cannot detach');
   const skin=createCastSkin(part,'arm'),out=new Float32Array(skin.rest.length);
   deformCastSkin(skin,pose[side],out,{chest:pose.chest,breathX:pose.breathX,breathY:pose.breathY,shoulderY:pose.shoulderY,elbow});
   for(let i=0;i<skin.indices.length;i+=3){
    const [a,b,c]=Array.from(skin.indices.slice(i,i+3),index=>index*2);
    assert.ok((out[b]-out[a])*(out[c+1]-out[a+1])-(out[c]-out[a])*(out[b+1]-out[a+1])>0,'arm cannot fold');
   }
   // The painted grip and every point past the elbow move with the forearm
   // frame that also carries the tool and detector light.
   const j=castArmJoints(part),frame=castForearmFrame(part,pose[side],elbow,pose.chest,pose.breathX,pose.breathY,pose.shoulderY);
   for(const [u,v] of [part.hand,[part.hand[0],Math.min(1,part.hand[1]+.3)]]){
    const p=castArmPoint(part,u,v,pose[side],pose.chest,pose.breathX,pose.breathY,pose.shoulderY,elbow);
    const dx=(u-part.ax)*part.w,dy=(v-part.ay)*part.h,c=Math.cos(frame.rotation),s=Math.sin(frame.rotation);
    assert.ok(Math.hypot(p.x-(frame.x+dx*c-dy*s),p.y-(frame.y+dx*s+dy*c))<1e-8,'hand and tool share rigid forearm motion');
   }
   // Both bones keep their painted length: the elbow cannot drift off the arm.
   const e=castArmPoint(part,part.elbow[0],part.elbow[1],pose[side],pose.chest,pose.breathX,pose.breathY,pose.shoulderY,elbow);
   assert.ok(Math.abs(Math.hypot(e.x-shoulder.x,e.y-shoulder.y)-Math.hypot(j.elbow.x-j.shoulder.x,j.elbow.y-j.shoulder.y))<1.5,'upper arm keeps its length');
   if(part.ik){
    // Hand on hip stays planted on the torso; reactions only lift it slightly.
    const hand=castArmPoint(part,part.hand[0],part.hand[1],pose[side],pose.chest,pose.breathX,pose.breathY,pose.shoulderY,elbow);
    const rest=castTorsoPoint(j.hand.x,j.hand.y,pose.chest,pose.breathX,pose.breathY,pose.shoulderY);
    assert.ok(Math.hypot(hand.x-rest.x,hand.y-rest.y)<=Math.abs(pose[side])*60+.5,`${who} planted hand stays on the hip`);
   }
  }
 }
 assert.ok(rig[who].legs.y+28<rig[who].body.y+rig[who].body.h,'waist retains overlap');
 for(const drop of [-7.5,0,6])assert.equal(castLegsPoint(rig[who].legs,1,drop)+0,0,'shoes stay planted while the knees take the crouch');
 for(const drop of [-7.5,6])assert.ok(Math.abs(castLegsPoint(rig[who].legs,0,drop)-drop)<1e-9,'shorts follow the waist drop');
 for(const arm of ['arm_l','arm_r'])assert.ok(rig[who][arm].elbow&&rig[who][arm].hand,'every arm has a painted elbow and hand');
}
for(const [width,height] of [[1920,1080],[375,812],[2560,1080]]){
 // Measured surf alpha: opaque for u .18-.75 on every row, nothing past u .96.
 const covers=(p,t)=>{
  // the fill covers [0,seam]; the surf's opaque band, with the foam ripple at
  // its worst, must reach past the right edge and overlap the fill
  let worst=Infinity;for(let v=0;v<=1;v+=1/36)worst=Math.min(worst,waveFrontOffset(.75,v,t,p).x);
  return p.imageLeft+p.textureWidth*.18<=Math.max(0,p.seam)&&p.imageLeft+p.textureWidth*.75+worst>=width;
 };
 const start=waveWipePose(0,width,height),end=waveWipePose(1280,width,height);
 assert.ok(start.imageLeft+start.textureWidth*.96<=0,'cover starts offscreen');
 for(let t=500;t<=680;t+=10)assert.ok(covers(waveWipePose(t,width,height),t),'board swaps only under opaque water: '+t);
 assert.ok(end.imageLeft+end.textureWidth*.96<=0&&end.seam<=0,'backwash finishes offscreen on the side it came from');
 let last=-Infinity;for(let t=0;t<=680;t+=10){const p=waveWipePose(t,width,height);assert.ok(p.imageLeft>=last-1e-9,'run-in and slosh only advance');last=p.imageLeft;}
 for(let t=690;t<=1280;t+=10){const p=waveWipePose(t,width,height);assert.ok(p.imageLeft<=last+1e-9,'backwash only retreats');last=p.imageLeft;}
 // The foam band (u .30-.75) stays in view for most of the run-in, not a
 // ~100ms flash between all-beach and all-water.
 const onScreen=[...Array(51).keys()].map(i=>waveWipePose(i*10,width,height)).filter(p=>p.imageLeft+p.textureWidth*.75>0&&p.imageLeft+p.textureWidth*.3<width).length;
 assert.ok(onScreen>=35,'foam stays on screen through the run-in');
}
const blur=createReelBlur(118);let amount=0;
for(let i=0;i<12;i++)amount=blur.sample({now:i*16,offset:i*10,key:1,motion:'spinning'});
assert.ok(amount>1&&amount<118*.14,'moving reels blur within bounds');
assert.equal(blur.sample({now:200,offset:120,key:1,motion:'stopped'}),0,'stopped reels immediately sharpen');
console.log('OK: sewn arm roots, two-bone elbows, planted hip hand, rigid grips, planted shoes, no folded limbs, waist overlap, one in-and-back wave with opaque swap in three aspect ratios and sharp stops');

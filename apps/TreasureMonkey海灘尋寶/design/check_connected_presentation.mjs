import assert from 'node:assert/strict';
import fs from 'node:fs';
import {waveWipePose} from '../src/game/waveWipe.ts';
import {createReelBlur} from '../src/game/reelMotion.ts';
import {castArmPoint,castTorsoPoint,createCastSkin,deformCastSkin} from '../src/game/treasureCastSkin.ts';
import {castPose,castDuration} from '../src/game/treasureMotion.ts';
const rig=JSON.parse(fs.readFileSync('src/game/treasureCastRig.json','utf8'));
for(const who of ['digger','lifeguard'])for(const cue of ['idle','scan','win','winBig','welcome']){
 for(let t=0;t<=Math.max(4000,castDuration(cue));t+=16){
  const pose=castPose(t,cue,t,false,who);
  for(const side of ['left','right']){
   const part=rig[who][side==='left'?'arm_l':'arm_r'];
   const shoulder=castTorsoPoint(part.x,part.y,pose.chest,pose.breathX,pose.breathY,pose.shoulderY);
   const root=castArmPoint(part,part.ax,part.ay,pose[side],pose.chest,pose.breathX,pose.breathY,pose.shoulderY);
   assert.ok(Math.hypot(root.x-shoulder.x,root.y-shoulder.y)<1e-8,'sleeve cannot detach');
   const skin=createCastSkin(part,'arm'),out=new Float32Array(skin.rest.length);
   deformCastSkin(skin,pose[side],out,{chest:pose.chest,breathX:pose.breathX,breathY:pose.breathY,shoulderY:pose.shoulderY});
   for(let i=0;i<skin.indices.length;i+=3){
    const [a,b,c]=Array.from(skin.indices.slice(i,i+3),index=>index*2);
    assert.ok((out[b]-out[a])*(out[c+1]-out[a+1])-(out[c]-out[a])*(out[b+1]-out[a+1])>0,'arm cannot fold');
   }
   const hand=castArmPoint(part,part.ax,part.ay+1,pose[side],pose.chest,pose.breathX,pose.breathY,pose.shoulderY);
   const angle=pose[side]+pose.chest;
   assert.ok(Math.hypot(hand.x-(shoulder.x-part.h*Math.sin(angle)),hand.y-(shoulder.y+part.h*Math.cos(angle)))<1e-8,'hand and tool share rigid motion');
  }
 }
 assert.ok(rig[who].legs.y+28<rig[who].body.y+rig[who].body.h,'waist retains overlap');
}
for(const [width,height] of [[1920,1080],[375,812],[2560,1080]]){
 const start=waveWipePose(0,width,height),covered=waveWipePose(500,width,height),reveal=waveWipePose(680,width,height),end=waveWipePose(1280,width,height);
 assert.ok(start.imageLeft+start.textureWidth<=0,'cover starts offscreen');
 assert.ok(covered.seam>=width&&covered.imageLeft>=width,'cover has no exposed board or foam');
 assert.ok(reveal.seam<=0&&reveal.imageLeft<=0,'reveal starts offscreen over full water');
 assert.ok(end.seam>=width&&end.imageLeft-end.textureWidth>=width,'reveal finishes offscreen');
}
const blur=createReelBlur(118);let amount=0;
for(let i=0;i<12;i++)amount=blur.sample({now:i*16,offset:i*10,key:1,motion:'spinning'});
assert.ok(amount>1&&amount<118*.14,'moving reels blur within bounds');
assert.equal(blur.sample({now:200,offset:120,key:1,motion:'stopped'}),0,'stopped reels immediately sharpen');
console.log('OK: sewn arm roots, rigid grips, no folded limbs, waist overlap, offscreen wave phases in three aspect ratios and sharp stops');

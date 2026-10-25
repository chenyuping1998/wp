// @ts-nocheck -- deterministic Node-only replay of the shipped Spine 4.3 files.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { MeshAttachment, Skeleton, Physics } from '@esotericsoftware/spine-core';
import { parseMedusaRig, createMedusaPlayer } from '../src/game/medusaRigCore.ts';
const asset=new URL('../static/assets/spines/medusa43/',import.meta.url),folder=new URL('./source/medusagaze/cast/',import.meta.url);
const json=JSON.parse(fs.readFileSync(new URL('medusa.json',asset),'utf8'));
const atlas=fs.readFileSync(new URL('medusa.atlas',asset),'utf8');
const report=JSON.parse(fs.readFileSync(new URL('spine43-build.json',folder),'utf8'));
const manifest=JSON.parse(fs.readFileSync(new URL('medusa_layers/layers.json',folder),'utf8'));
const {data}=parseMedusaRig(json,atlas);assert.equal(json.skeleton.spine,'4.3.13');
assert.deepEqual(JSON.parse(fs.readFileSync(new URL('../src/game/medusaRigData.json',import.meta.url),'utf8')),json);
assert.equal(fs.readFileSync(new URL('../src/game/medusaRigAtlas.txt',import.meta.url),'utf8'),atlas);
assert.equal(json.bones.filter(b=>/^snake_\d+_root$/.test(b.name)).length,9);
const rest=new Skeleton(data);rest.setupPose();rest.updateWorldTransform(Physics.none);
const baselines=new Map(),failures=[],clips=[];
function area(v,tri,k){const a=tri[k]*2,b=tri[k+1]*2,c=tri[k+2]*2;return (v[b]-v[a])*(v[c+1]-v[a+1])-(v[b+1]-v[a+1])*(v[c]-v[a]);}
function baseline(att,slot){let cached=baselines.get(att);if(cached)return cached;const v=new Float32Array(att.worldVerticesLength);att.computeWorldVertices(rest,rest.slots[slot.data.index],0,v.length,v,0,2);cached=Array.from({length:att.triangles.length/3},(_,i)=>area(v,att.triangles,i*3));baselines.set(att,cached);return cached;}
for(const animation of data.animations){
 const player=createMedusaPlayer(data);player.play(animation.name);const end=animation.duration;let minimum=1,folds=0;
 for(let i=0;i<=Math.ceil(end*60);i++){
  player.update(i===0?0:Math.min(1/60,end-(i-1)/60));
  for(const slot of player.skeleton.drawOrder.appliedPose){const att=slot.getAppliedPose().getAttachment();if(!(att instanceof MeshAttachment))continue;
   const v=new Float32Array(att.worldVerticesLength);att.computeWorldVertices(player.skeleton,slot,0,v.length,v,0,2);for(const n of v)assert.ok(Number.isFinite(n));
   const original=baseline(att,slot),ink=report.mesh[att.path]?.inkedTriangles;
   for(let k=0;k<att.triangles.length;k+=3){if(ink&&!ink[k/3])continue;const ratio=area(v,att.triangles,k)/original[k/3];minimum=Math.min(minimum,ratio);if(ratio<0){folds++;if(failures.length<12)failures.push({animation:animation.name,time:i/60,attachment:att.name,triangle:k/3,ratio});}}
  }
 }
 clips.push({animation:animation.name,seconds:end,foldedInkedTriangles:folds,minimumAreaRatio:minimum});player.destroy();
}
const contacts=[];
for(const time of [.35,.45,.60,.75,1.0]){
 const p=createMedusaPlayer(data);p.play('gaze');for(let t=0;t<time-1e-7;t+=1/120)p.update(Math.min(1/120,time-t));
 const hand=p.skeleton.findBone('hand_front').getAppliedPose(),glass=p.skeleton.findBone('glasses').getAppliedPose();
 const b=json.bones.find(b=>b.name==='hand_front');const wrist=manifest.joints.arm_front[2],elbow=manifest.joints.arm_front[1];const bind=Math.atan2(elbow[1]-wrist[1],wrist[0]-elbow[0]);
 const [dx,dy]=manifest.joints.pinchOffset,x=dx,y=-dy,lx=Math.cos(bind)*x+Math.sin(bind)*y,ly=-Math.sin(bind)*x+Math.cos(bind)*y;
 const hp={x:hand.a*lx+hand.b*ly+hand.worldX,y:hand.c*lx+hand.d*ly+hand.worldY};
 const gx=manifest.joints.grip[0]-manifest.joints.glasses[0],gy=manifest.joints.glasses[1]-manifest.joints.grip[1];
 const gp={x:glass.a*gx+glass.b*gy+glass.worldX,y:glass.c*gx+glass.d*gy+glass.worldY};
 contacts.push({time,distancePx:Math.hypot(hp.x-gp.x,hp.y-gp.y)});p.destroy();
}
const breaths=[];
for(const free of [false,true]){
 const p=createMedusaPlayer(data);p.setFreegame(free);
 const pose=()=>Object.fromEntries(['hips','chest','head'].map(name=>{const b=p.skeleton.findBone(name).getAppliedPose();return[name,{x:b.worldX,y:b.worldY}];}));
 const start=pose();for(let i=0;i<216;i++)p.update(1/120);const inhale=pose();for(let i=216;i<720;i++)p.update(1/120);const seam=pose();
 const lift=inhale.chest.y-start.chest.y;assert.ok(lift>6&&lift<25,'Breathing must visibly lift the ribcage, without moving the whole figure');
 assert.ok(Math.hypot(inhale.hips.x-start.hips.x,inhale.hips.y-start.hips.y)<.001,'Breathing keeps the grounded pelvis fixed');
 assert.ok(Math.hypot(seam.chest.x-start.chest.x,seam.chest.y-start.chest.y)<.01,'Breath loop must close without a jump');
 breaths.push({mode:free?'FG':'MG',ribcageLiftRigPixels:lift,pelvisFixed:true,loopSeamClosed:true});p.destroy();
}
let fidgets=0;const idle=createMedusaPlayer(data,()=>fidgets++);for(let i=0;i<3600;i++)idle.update(1/60);assert.ok(fidgets<=3&&fidgets>=2);idle.destroy();
const transition=createMedusaPlayer(data);transition.play('gaze',false,2);assert.equal(transition.state.tracks[0].timeScale,2);transition.setFreegame(true);assert.equal(transition.state.tracks[0].next.animation.name,'fg_idle');
for(let i=0;i<180;i++)transition.update(1/60);assert.equal(transition.state.tracks[0].animation.name,'fg_idle');transition.play('win_max',true);for(let i=0;i<240;i++)transition.update(1/60);assert.equal(transition.state.tracks[0].animation.name,'win_max_loop');
transition.setFreegame(false);assert.equal(transition.state.tracks[0].animation.name,'idle');transition.setFreegame(true);transition.play('fg_end',true);for(let i=0;i<120;i++)transition.update(1/60);transition.setFreegame(false);assert.equal(transition.state.tracks[0].animation.name,'idle');transition.setReducedMotion(true);assert.equal(transition.play('gaze'),false);transition.setReducedMotion(false);transition.reset();assert.equal(transition.state.tracks[0].animation.name,'idle');transition.destroy();
const result={spine:'4.3.13',scope:'Official 4.3 core replay of game JSON/atlas. Visual performance and hand-painted contact require browser review too.',bones:json.bones.length,independentSnakeChains:9,clips,meshFailures:failures,pinchContacts:contacts,breathing:breaths,idle60sSnakeActions:fidgets,modeTransitions:'passed: accelerated gaze, queued FG idle, max hold loop, FG end to MG, reduced motion reset',passed:failures.length===0&&contacts.every(c=>c.distancePx<3)};
fs.writeFileSync(new URL('spine43-validation.json',folder),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({clips:clips.length,failures,contacts,idle60sSnakeActions:fidgets},null,2));
assert.equal(failures.length,0,'Visible painted mesh must never fold');assert.ok(contacts.every(c=>c.distancePx<3),'Fingers must track the glasses rim during the held gaze pose');

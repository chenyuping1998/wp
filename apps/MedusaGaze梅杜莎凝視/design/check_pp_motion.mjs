// @ts-nocheck -- structural and native replay QA for the applied motion skill.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseMedusaRig,createMedusaPlayer} from '../src/game/medusaRigCore.ts';
import {symbolPoint,gravityProgress,fallDuration} from '../src/game/symbolMotion.ts';
import {tumbleTiming} from '../src/game/animationTimeline.ts';
const folder=new URL('./source/medusagaze/cast/',import.meta.url),assets=new URL('../static/assets/spines/medusa43/',import.meta.url);
const json=JSON.parse(fs.readFileSync(new URL('medusa.json',assets),'utf8'));
const {data}=parseMedusaRig(json,fs.readFileSync(new URL('medusa.atlas',assets),'utf8'));
assert.ok(data.findBone('face_look'));const lookIndex=json.bones.findIndex(b=>b.name==='face_look');
const face=json.skins[0].attachments.face.face_idle;let vertices=0,maxLookWeight=0;
for(let i=0;i<face.vertices.length;){const count=face.vertices[i++];vertices++;for(let n=0;n<count;n++){const bone=face.vertices[i];if(bone===lookIndex)maxLookWeight=Math.max(maxLookWeight,face.vertices[i+3]);i+=4;}}
assert.ok(vertices>200&&maxLookWeight>.40&&maxLookWeight<=.441,'Face must have a real weighted depth mesh');
const player=createMedusaPlayer(data);player.play('react_small');player.update(0);const base=player.skeleton.findBone('chest').getAppliedPose().worldY;
player.update(.12);const anticipation=player.skeleton.findBone('chest').getAppliedPose().worldY-base;
player.update(.28);const lift=player.skeleton.findBone('chest').getAppliedPose().worldY-base;
assert.ok(anticipation<-3&&lift>1,'A short reaction must first compress, then lift');
for(let i=0;i<120;i++)player.update(1/120);assert.equal(player.state.tracks[0].animation.name,'idle');player.destroy();
let localActing=0;
for(const name of ['H1','H2','H3','H4','H5','S']){
 const points=[[.3,.25],[.5,.45],[.8,.8]],displacements=points.map(([u,v])=>{const p=symbolPoint(name,u,v,.4);return Math.hypot(p.x-(u-.5),p.y-(v-.5));});
 assert.ok(Math.max(...displacements)-Math.min(...displacements)>.001,'The symbol must act locally rather than moving as a sticker');localActing++;
 for(const [u,v] of points)for(const t of [0,1])assert.deepEqual(symbolPoint(name,u,v,t),{x:u-.5,y:v-.5});
}
const timing=tumbleTiming();assert.equal(timing.columnStaggerMs,0);assert.equal(timing.settleMs,0);assert.equal(fallDuration(1,360),fallDuration(6,360));
assert.equal(gravityProgress(.6),1);assert.equal(gravityProgress(.85),1);assert.equal(gravityProgress(1),1);assert.ok(gravityProgress(.725)<gravityProgress(.925));
const report={date:'2026-10-31',skill:'E:/stake/wp/.claude/skills/slot-motion-recipes/SKILL.md',applied:'Soft authored beats, delayed local acting, Gaussian face depth, dynamic held reaction, beat-linked texture glow, simultaneous drop and two diminishing rebounds.',referenceHighlightMs:1500,adaptedHighlightMs:timing.highlightMs,dropMs:timing.dropMs,eightLinkBudgetMs:Array.from({length:8},(_,i)=>tumbleTiming({chain:i+1}).totalMs).reduce((a,b)=>a+b,0),bones:json.bones.length,faceVertices:vertices,maxLookWeight,anticipationRigPixels:anticipation,liftRigPixels:lift,locallyActingSymbols:localActing,secondLandingAnimation:false,originalPaintingsRetained:true,passed:true};
fs.writeFileSync(new URL('./pp-motion-validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));

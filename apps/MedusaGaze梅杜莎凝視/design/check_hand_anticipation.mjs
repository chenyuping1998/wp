// @ts-nocheck -- compare actual Spine hand positions around the release event.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseMedusaRig,createMedusaPlayer} from '../src/game/medusaRigCore.ts';
const asset=new URL('../static/assets/spines/medusa43/',import.meta.url),folder=new URL('./source/medusagaze/cast/',import.meta.url);
const {data}=parseMedusaRig(JSON.parse(fs.readFileSync(new URL('medusa.json',asset),'utf8')),fs.readFileSync(new URL('medusa.atlas',asset),'utf8'));
const scenarios=[];
for(const clip of ['gaze','gaze_turbo','fg_gaze','fg_gaze_turbo']){
 const release=clip.startsWith('fg_')?1.05:1.45,poses=[];
 for(const at of [release-.35,release-.11,release,release+.12]){
  const p=createMedusaPlayer(data);p.play(clip);for(let t=0;t<at-1e-8;t+=1/240)p.update(Math.min(1/240,at-t));
  const hand=p.skeleton.findBone('hand_back').getAppliedPose(),shoulder=p.skeleton.findBone('upper_back').getAppliedPose(),elbow=p.skeleton.findBone('fore_back').getPose();
  poses.push({at,x:hand.worldX-shoulder.worldX,y:hand.worldY-shoulder.worldY,elbowRotation:elbow.rotation});p.destroy();
 }
 const [gather,coil,releasePose,follow]=poses;
 scenarios.push({clip,poses,coilDistance:Math.hypot(coil.x-gather.x,coil.y-gather.y),releaseStroke:Math.hypot(releasePose.x-coil.x,releasePose.y-coil.y),elbowCurlDelta:Math.abs(coil.elbowRotation-gather.elbowRotation),forwardStroke:releasePose.x<coil.x&&releasePose.y>coil.y});
}
const baselineUrl=new URL('hand-anticipation-baseline-20261030.json',folder),report={scope:'240Hz official Spine core; wrist positions relative to its shoulder, in rig pixels.',scenarios};
if(process.argv.includes('--baseline'))fs.writeFileSync(baselineUrl,JSON.stringify(report,null,2)+'\n');
else{
 const baseline=JSON.parse(fs.readFileSync(baselineUrl,'utf8'));
 for(const [i,s] of scenarios.entries()){
  assert.ok(s.coilDistance>60&&s.coilDistance>baseline.scenarios[i].coilDistance*1.5,'Visible anticipation must pull the hand back before launch');
  assert.ok(s.releaseStroke>130&&s.forwardStroke,'Release must reverse the coil into an upward, forward stroke');
  assert.ok(s.elbowCurlDelta>12,'The elbow must curl rather than only rotating an open palm');
 }
 assert.deepEqual(scenarios[0].poses,scenarios[1].poses);assert.deepEqual(scenarios[2].poses,scenarios[3].poses);
 fs.writeFileSync(new URL('hand-anticipation-validation.json',folder),JSON.stringify({...report,baseline,passed:true},null,2)+'\n');
}
console.log(JSON.stringify({baseline:process.argv.includes('--baseline'),scenarios:scenarios.map(({clip,coilDistance,releaseStroke,elbowCurlDelta,forwardStroke})=>({clip,coilDistance,releaseStroke,elbowCurlDelta,forwardStroke})),passed:true},null,2));

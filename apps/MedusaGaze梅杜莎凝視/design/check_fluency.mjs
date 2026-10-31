// @ts-nocheck -- native replay measurements, outside frontend type checking.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseMedusaRig,createMedusaPlayer} from '../src/game/medusaRigCore.ts';
const assets=new URL('../static/assets/spines/medusa43/',import.meta.url);
const {data}=parseMedusaRig(JSON.parse(fs.readFileSync(new URL('medusa.json',assets),'utf8')),fs.readFileSync(new URL('medusa.atlas',assets),'utf8'));
const baselineUrl=new URL('./source/medusagaze/cast/fluency-baseline-20261029.json',import.meta.url);
const dt=1/240,scenarios=[];
for(const free of [false,true]){
 const player=createMedusaPlayer(data);player.setFreegame(free);for(let i=0;i<432;i++)player.update(dt);
 player.play(free?'fg_gaze':'gaze');player.update(0);
 const beam=free?.2:.6,release=free?1.05:1.45,duration=free?2.1:2.5;
 const hand=()=>{const q=player.skeleton.findBone('hand_back').getAppliedPose();return{x:q.worldX,y:q.worldY};};
 let previous=hand(),peakRecoverySpeed=0;const through=[];
 for(let i=1;i<=Math.ceil((duration+.5)/dt);i++){
  player.update(dt);const now=hand(),time=i*dt,speed=Math.hypot(now.x-previous.x,now.y-previous.y)/dt;
  assert.ok(Number.isFinite(speed));if(Math.abs(time-beam)<.018)through.push(speed);
  if(time>release+.12&&time<duration)peakRecoverySpeed=Math.max(peakRecoverySpeed,speed);previous=now;
 }
 scenarios.push({mode:free?'FG':'MG',throughGestureSpeed:through.reduce((a,b)=>a+b,0)/through.length,peakRecoverySpeed});player.destroy();
}
const transition=createMedusaPlayer(data);for(let i=0;i<1056;i++)transition.update(dt);
const points=()=>transition.skeleton.bones.map(b=>{const q=b.getAppliedPose();return{x:q.worldX,y:q.worldY};});
const before=points();transition.play('gaze');transition.update(0);const after=points();
const fidgetHandoffJump=Math.max(...after.map((point,i)=>Math.hypot(point.x-before[i].x,point.y-before[i].y)));transition.destroy();
const report={scope:'240Hz official Spine core replay; rig pixels/second. Visual review required separately.',scenarios,fidgetHandoffJump};
if(process.argv.includes('--baseline')){fs.writeFileSync(baselineUrl,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
else{
 const baseline=JSON.parse(fs.readFileSync(baselineUrl,'utf8'));
 scenarios.forEach((scenario,i)=>{assert.ok(scenario.throughGestureSpeed>baseline.scenarios[i].throughGestureSpeed*1.2,'The hand must carry momentum through the gathering waypoint');assert.ok(scenario.peakRecoverySpeed<baseline.scenarios[i].peakRecoverySpeed*.9,'Recovery must reduce peak wrist speed rather than merely add interpolation frames');});
 assert.ok(fidgetHandoffJump<.01,'Starting a cast must not snap the active snake fidget');
 fs.writeFileSync(new URL('./source/medusagaze/cast/fluency-validation.json',import.meta.url),JSON.stringify({...report,baseline,passed:true},null,2)+'\n');console.log(JSON.stringify({...report,passed:true},null,2));
}

// @ts-nocheck -- native, deterministic movement comparison of all nine heads.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseMedusaRig,createMedusaPlayer } from '../src/game/medusaRigCore.ts';
const assets=new URL('../static/assets/spines/medusa43/',import.meta.url);
const input=process.argv.find(value=>value.startsWith('--source='))?.slice(9)??new URL('medusa.json',assets);
const {data}=parseMedusaRig(JSON.parse(fs.readFileSync(input,'utf8')),fs.readFileSync(new URL('medusa.atlas',assets),'utf8'));
const folder=new URL('./source/medusagaze/cast/',import.meta.url),snakes=[];
for(let index=1;index<=9;index++){
 const modes=[];
 for(const clip of ['idle',`snake_fidget_${index}`,'gaze','fg_gaze']){
  const p=createMedusaPlayer(data);p.play(clip);p.update(0);
  const head=p.skeleton.findBone(`snake_${index}_head`),jaw=p.skeleton.findBone(`snake_${index}_jaw`);
  const snout=()=>{const h=head.getAppliedPose(),parent=p.skeleton.findBone('head').getAppliedPose(),dx=h.worldX+h.a*80-parent.worldX,dy=h.worldY+h.c*80-parent.worldY,det=parent.a*parent.d-parent.b*parent.c;return{x:(parent.d*dx-parent.b*dy)/det,y:(parent.a*dy-parent.c*dx)/det};};
  const origin=snout();
  const jawAngles=[];let excursion=0;
  for(let frame=0;frame<Math.round(data.findAnimation(clip).duration*120);frame++){
   p.update(1/120);const h=snout();excursion=Math.max(excursion,Math.hypot(h.x-origin.x,h.y-origin.y));jawAngles.push(jaw.getPose().rotation);
  }
  modes.push({clip,headExcursionRigPixels:excursion,jawRangeDegrees:Math.max(...jawAngles)-Math.min(...jawAngles)});p.destroy();
 }
 snakes.push({index,modes});
}
const baselineUrl=new URL('snake-presence-baseline-20261030.json',folder),report={scope:'120Hz official Spine core replay. Snout excursion is measured in the character head local space, excluding whole-character breathing; jaw range is local.',snakes};
if(process.argv.includes('--baseline'))fs.writeFileSync(baselineUrl,JSON.stringify(report,null,2)+'\n');
else{
 const baseline=JSON.parse(fs.readFileSync(baselineUrl,'utf8'));
 for(const snake of snakes)for(let mode=0;mode<snake.modes.length;mode++){
  const now=snake.modes[mode],before=baseline.snakes[snake.index-1].modes[mode];
  assert.ok(now.headExcursionRigPixels>before.headExcursionRigPixels*1.15,`Snake ${snake.index}: ${now.clip} must visibly increase head excursion`);
  const jawGain=mode<2?1.1:1.04; // Cast neck and jaws combine; rest needs a larger isolated jaw accent.
  assert.ok(now.jawRangeDegrees>=before.jawRangeDegrees*jawGain,`Snake ${snake.index}: ${now.clip} must increase bite articulation`);
 }
 fs.writeFileSync(new URL('snake-presence-validation.json',folder),JSON.stringify({...report,baseline,passed:true},null,2)+'\n');
}
console.log(JSON.stringify({snakes:snakes.length,modesPerSnake:4,baseline:process.argv.includes('--baseline'),passed:true}));

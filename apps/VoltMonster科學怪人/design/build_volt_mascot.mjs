/** Use the shared front-facing template, with this character's measured motion ranges. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const design=path.dirname(fileURLToPath(import.meta.url)),wp=path.resolve(design,'../../..');
let source=fs.readFileSync(path.join(wp,'tools/mascot-rig/mascot.ts'),'utf8');
source=source.replaceAll("'./lib/","'../../../tools/mascot-rig/lib/");
const anchor='const motions = mascotMotions(rig.measure, { reels });';
if(!source.includes(anchor))throw new Error('The template build entry changed');
source=source.replace(anchor,anchor+`
  // Broad jacket sleeves tolerate a smaller wind-up than the narrow mannequin.
  // Keep the shared timing and release events; fit only the joint amplitudes.
  for (const animation of motions.anims) for (const tr of animation.tracks ?? []) {
    const factor=animation.name==='wave'&&tr.bone==='foreArmR'?.82:
      animation.name==='throw'&&tr.bone==='upperArmL'?.78:
      animation.name==='throw'&&tr.bone==='foreArmL'?.84:1;
    if(factor===1)continue;
    for(const point of tr.points??[])point.value*=factor;
    if(tr.anticipation)tr.anticipation.value*=factor;
    if(tr.action)tr.action.value*=factor;
    if(tr.overshoot)tr.overshoot.amount*=factor;
  }
`);
const runner=path.join(design,'_volt_mascot_runner.ts');fs.writeFileSync(runner,source);
const result=spawnSync(process.execPath,[runner,'build',path.join(design,'source/volt_delivery/mascot'),'-o',path.join(design,'source/volt_delivery/mascot_built'),'--spine','4.2','--no-gif'],{cwd:wp,stdio:'inherit'});
fs.unlinkSync(runner);
process.exitCode=result.status??1;

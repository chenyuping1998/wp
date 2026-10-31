import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';import {pathToFileURL} from 'node:url';
const app=process.argv[2],temp=path.join(app,'design/.motion-player-check.mjs');
const code=fs.readFileSync(path.join(app,'src/game/characterRigCore.ts'),'utf8');fs.writeFileSync(temp,stripTypeScriptTypes(code));
try{
 const {parseCharacterRig,createCharacterPlayer}=await import(pathToFileURL(temp).href),raw=JSON.parse(fs.readFileSync(path.join(app,'src/game/characterRigData.json'),'utf8')),{data}=parseCharacterRig(raw,fs.readFileSync(path.join(app,'src/game/characterRigAtlas.txt'),'utf8'));
 const p=createCharacterPlayer(data),advance=t=>{for(let i=0;i<Math.ceil(t*60);i++)p.update(1/60);},current=()=>p.state.tracks[0]?.animation?.name;
 assert.equal(p.state.tracks[1]?.animation?.name,'breath');advance(1.5);const belly=p.skeleton.findBone('belly');assert(belly.pose.scaleX>1.001,'Independent breathing track must visibly deform the belly');
 p.setFreegame(true);assert.equal(current(),'fg_idle');p.play('fg_end');advance(2);assert.equal(current(),'fg_idle','Gesture completion must preserve feature mode');
 p.play('win_max',1,true);advance(3.4);assert.equal(current(),'win_max_loop');advance(3);assert.equal(current(),'win_max_loop','Celebration must hold until the panel closes');p.play('idle');assert.equal(current(),'fg_idle');
 const protectedName=app.includes('Purrfia')?'stamp':'encore_build';p.play(protectedName);assert.equal(p.play('react_small'),false,'Reactions may not interrupt a synced action');advance(2);assert.equal(current(),'fg_idle');
 p.setReducedMotion(true);assert.equal(p.play('react_good'),false);p.setReducedMotion(false);assert.equal(p.state.tracks[1]?.animation?.name,'breath');p.setFreegame(false);advance(26);assert(['idle_bored','idle_mimic'].includes(current()));p.setFidgetsEnabled(false);assert.equal(current(),'idle','A paid spin must end an idle fidget immediately');
 p.destroy();console.log('Motion v2: independent respiration, feature rest, protected actions, max-win hold, idle cancellation and reduced motion passed.');
}finally{fs.unlinkSync(temp);}

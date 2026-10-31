import {createHash} from 'node:crypto';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';import {pathToFileURL} from 'node:url';
const [app,out]=process.argv.slice(2),slug=app.includes('Purrfia')?'purrfia':'parrot',cast=path.join(app,'design/source',slug,'cast'),baseline=path.join(cast,'motion_v5_before');
async function load(folder,id){const file=path.join(app,`design/.flow-${id}.mjs`);fs.writeFileSync(file,stripTypeScriptTypes(fs.readFileSync(path.join(folder,'characterRigCore.ts'),'utf8')));try{const core=await import(pathToFileURL(file).href),raw=JSON.parse(fs.readFileSync(path.join(folder,'characterRigData.json'),'utf8')),{data}=core.parseCharacterRig(raw,fs.readFileSync(path.join(folder,'characterRigAtlas.txt'),'utf8'));return {core,data};}finally{fs.unlinkSync(file);}}
const before=await load(baseline,'before'),after=await load(path.join(app,'src/game'),'after');
const point=p=>{const b=p.skeleton.findBone('hand_front').getAppliedPose();return [b.worldX,b.worldY];};
function advance(p,seconds){for(let f=0;f<Math.ceil(seconds*120);f++)p.update(1/120);}
function measure(source,name,returning=false){
 const p=source.core.createCharacterPlayer(source.data);p.setFidgetsEnabled(false);advance(p,.8);p.play(name,1,returning);const duration=source.data.findAnimation(name).duration;
 if(returning){advance(p,duration+.5);p.play('idle');}
 let previous=point(p),peak=0,maxStep=0;const length=returning?.65:duration;
 for(let f=0;f<Math.ceil(length*120);f++){p.update(1/120);const next=point(p),d=Math.hypot(next[0]-previous[0],next[1]-previous[1]);peak=Math.max(peak,d*120);maxStep=Math.max(maxStep,d);previous=next;}
 p.destroy();return {peakWristSpeed:+peak.toFixed(2),maxStep120fps:+maxStep.toFixed(3)};
}
const returnBefore=measure(before,'win_big',true),returnAfter=measure(after,'win_big',true),critical=slug==='purrfia'?'claim_turf':'encore_call',criticalBefore=measure(before,critical),criticalAfter=measure(after,critical);
assert(returnAfter.peakWristSpeed<returnBefore.peakWristSpeed*.85,'Return from held pose must materially reduce wrist snap');
assert(criticalAfter.peakWristSpeed<criticalBefore.peakWristSpeed*.95,critical+' must reduce peak wrist speed');
const p=after.core.createCharacterPlayer(after.data);p.setFidgetsEnabled(false);p.play('react_good');advance(p,.15);assert.equal(p.play('react_good'),false,'Repeated reaction must not rewind the pose');assert.equal(p.play('react_small'),false,'A smaller reaction must not interrupt a larger one');advance(p,2);assert.equal(p.play('react_small'),true);
let loopMaxStep=0;
for(const name of ['win_big','win_max']){p.play('idle');advance(p,.6);p.play(name,1,true);let previous=point(p);for(let f=0;f<Math.ceil((after.data.findAnimation(name).duration+4.1)*120);f++){p.update(1/120);const next=point(p);loopMaxStep=Math.max(loopMaxStep,Math.hypot(next[0]-previous[0],next[1]-previous[1]));previous=next;}assert.equal(p.state.tracks[0].animation.name,name+'_loop');}
assert(loopMaxStep<60,'Held sequence contains a teleport');p.destroy();
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={slug,rigSha256:sha(path.join(app,'src/game/characterRigData.json')),playerSha256:sha(path.join(app,'src/game/characterRigCore.ts')),sampleFps:120,units:'source artwork pixels and pixels/second',heldReturn:{before:returnBefore,after:returnAfter,peakReductionPercent:+((1-returnAfter.peakWristSpeed/returnBefore.peakWristSpeed)*100).toFixed(1)},criticalAction:{name:critical,before:criticalBefore,after:criticalAfter,peakReductionPercent:+((1-criticalAfter.peakWristSpeed/criticalBefore.peakWristSpeed)*100).toFixed(1)},repeatReactionRestart:'prevented',heldLoopMaxStep120fps:+loopMaxStep.toFixed(3)};
if(out)fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

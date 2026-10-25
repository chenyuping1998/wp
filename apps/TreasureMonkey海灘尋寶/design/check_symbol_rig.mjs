import assert from 'node:assert/strict';
import {SYMBOL_RIGS,createSymbolSkin,skinSymbol,boneMotion,monkeyBlinkFrame,projectSymbolPoints} from '../src/game/treasureSymbolRig.ts';
import {rigGeneratorValue} from '../src/game/treasureRigMotion.ts';
import bake from '../src/game/data/treasureRigGenerator.json' with {type:'json'};
let smallest=1;
for(const [name,bones] of Object.entries(SYMBOL_RIGS)){
 const skin=createSymbolSkin(name,name==='W'?40:24),output=new Float32Array(skin.rest.length);
 for(const w of skin.weights)assert.ok(Math.abs(w.root+w.bones.reduce((a,b)=>a+b,0)-1)<1e-6,'weights partition unity');
 for(const time of [0,970]){
  skinSymbol(skin,name,time,false,output);
  output.forEach((n,i)=>assert.ok(Math.abs(n-(skin.rest[i]-.5))<1e-6,`${name} exact rest and no transition pop`));
 }
 const signatures=new Set();
 for(let time=0;time<=970;time+=4){
  skinSymbol(skin,name,time,false,output);
  assert.ok(output.every(n=>Number.isFinite(n)&&Math.abs(n)<.62),'bounded finite mesh');
  // Folded triangles produce jagged/self-intersecting art even with a valid build.
  for(let i=0;i<skin.indices.length;i+=3){
   const [a,b,c]=skin.indices.subarray(i,i+3),x=index=>output[index*2],y=index=>output[index*2+1];
   const area=(x(b)-x(a))*(y(c)-y(a))-(y(b)-y(a))*(x(c)-x(a));
   smallest=Math.min(smallest,area);assert.ok(area>0,`${name} triangle folds at ${time}ms`);
  }
  bones.forEach((bone,i)=>{
   const p=boneMotion(bone,time),r=boneMotion(bone,time,true);
   for(const key of ['angle','dx','dy'])assert.ok(Math.abs(r[key]-p[key]*.18)<1e-12,'all local motion respects reduced-motion gain');
   for(const key of ['sx','sy'])assert.ok(Math.abs((r[key]-1)-(p[key]-1)*.18)<1e-12,'all local deformation respects reduced-motion gain');
   if(time===400)signatures.add(JSON.stringify([i,p]));
  });
 }
 assert.equal(signatures.size,bones.length,'independent authored joints');
}
assert.equal(monkeyBlinkFrame(365),1,'closing in-between uses a painted half lid');
assert.equal(monkeyBlinkFrame(400),2,'bilateral closed attachment holds clearly');
assert.equal(monkeyBlinkFrame(450),1,'reopening uses the half lid without crossfade');
for(const t of [0,354,456,970])assert.equal(monkeyBlinkFrame(t),0,'returns to original open eyes');
assert.equal(monkeyBlinkFrame(400,true),0,'reduced motion omits blink');
for(let t=0;t<=970;t++)for(const b of SYMBOL_RIGS.W)assert.ok(boneMotion(b,t).sy>.98,'eye socket must never be squeezed');
// The shell breath has a readable release, followed by a delayed spiral reply.
// Check actual motion rather than merely requiring two distinct track arrays.
const [lip,tip]=SYMBOL_RIGS.H3;
const peakTime=b=>{
 let best=0;
 for(let t=1;t<=970;t++)if(Math.abs(boneMotion(b,t).angle)>Math.abs(boneMotion(b,best).angle))best=t;
 return best;
};
const lipPeak=peakTime(lip),tipPeak=peakTime(tip);
assert.ok(lipPeak>=300&&lipPeak<=330,'shell mouth leads the bubble release');
assert.ok(tipPeak-lipPeak>=90&&tipPeak-lipPeak<=120,'spiral answers the mouth with deliberate overlap');
assert.ok(boneMotion(lip,130).angle>0&&boneMotion(lip,340).angle<0,'mouth draws in before opening');
assert.ok(Math.abs(boneMotion(lip,380).angle)>Math.abs(boneMotion(lip,lipPeak).angle)*.94,'open pose stays readable');
assert.ok(boneMotion(lip,570).angle>0&&boneMotion(tip,670).angle<0,'mouth and spiral settle at different times');
const shell=createSymbolSkin('H3',24),shellOut=new Float32Array(shell.rest.length);
for(let t=0;t<=970;t+=4){
 skinSymbol(shell,'H3',t,false,shellOut);
 for(let i=0;i<shell.indices.length;i+=3){
  const [a,b,c]=shell.indices.subarray(i,i+3),x=j=>shellOut[j*2],y=j=>shellOut[j*2+1];
  assert.ok((x(b)-x(a))*(y(c)-y(a))-(y(b)-y(a))*(x(c)-x(a))>0,`shell breath folds at ${t}ms`);
 }
 for(const b of [lip,tip]){
  const p=boneMotion(b,t),r=boneMotion(b,t,true);
  for(const key of ['angle','dx','dy'])assert.ok(Math.abs(r[key]-p[key]*.18)<1e-12,'shell motion respects reduced-motion gain');
  for(const key of ['sx','sy'])assert.ok(Math.abs((r[key]-1)-(p[key]-1)*.18)<1e-12,'shell deformation respects reduced-motion gain');
 }
}
// Each material owns an actual baked response, not just a renamed common curve.
assert.equal(bake.durationMs,970);
assert.equal(Object.keys(bake.tracks).length,9);
const responses=new Set();
for(const [id,track] of Object.entries(bake.tracks)){
 assert.equal(track.values.length,241,'consistent offline sampling');
 assert.equal(rigGeneratorValue(id,-1),0);assert.equal(rigGeneratorValue(id,970),0);assert.equal(rigGeneratorValue(id,1200),0);
 assert.equal(rigGeneratorValue(id,track.delayMs),0,'leading attachment stays still until its cue');
 for(let t=0;t<=970;t++){
  const p=rigGeneratorValue(id,t);assert.ok(Number.isFinite(p)&&p>=-.34&&p<1.16,'bounded material response');
 }
 responses.add(JSON.stringify(track.values));
}
assert.equal(responses.size,9,'independent material responses');
for(const [leading,trailing] of [['rope','key'],['shaft','display'],['display','coil'],['cloth-root','cloth-tip']]){
 const bones=Object.values(SYMBOL_RIGS).flat(),a=bones.find(b=>b.id===leading),b=bones.find(b=>b.id===trailing);
 assert.ok(peakTime(b)-peakTime(a)>=35,`${trailing} follows ${leading}, without a simultaneous snap`);
}
assert.equal(rigGeneratorValue('shell-lip',400),undefined,'authored shell keys remain untouched');
assert.equal(rigGeneratorValue('face',400),undefined,'original face and eye geometry remain untouched');
// Metal glints and the mesh must use the same baked joint coordinates.
const keySkin=createSymbolSkin('H5',24),keyOut=new Float32Array(keySkin.rest.length),metalVertices=[[18,12],[20,18],[22,20]];
for(let t=0;t<=970;t+=8){
 skinSymbol(keySkin,'H5',t,false,keyOut);
 const projected=projectSymbolPoints('H5',metalVertices.map(([x,y])=>[x/24,y/24]),t);
 metalVertices.forEach(([x,y],i)=>{
  const index=(y*25+x)*2;
  assert.ok(Math.abs(projected[i][0]-.5-keyOut[index])<1e-7&&Math.abs(projected[i][1]-.5-keyOut[index+1])<1e-7,'key reflection follows the actual skinned metal');
 });
}
console.log(`OK: ${Object.keys(SYMBOL_RIGS).length} weighted symbol rigs, 9 baked material curves, delayed follow, exact rest, reduced motion, aligned metal glints and dense no-fold (min area ${smallest.toFixed(6)})`);

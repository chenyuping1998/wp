import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {castPose,castDuration,symbolPose,treasurePartPose,motionTrack} from '../src/game/treasureMotion.ts';
import {letterPose} from '../src/game/treasureObjectMotion.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const names=['H1','H2','H3','H4','H5','W','S','SW','L1','L2','L3','L4'];
const signatures=new Set();
for(const name of names){
 const frames=[];
 for(const mode of ['win','land']){
  const duration=mode==='win'?970:240;
  for(let t=0;t<=duration;t+=10){
   const f=symbolPose(name,t,mode);assert.ok(Object.values(f).filter(v=>typeof v==='number').every(Number.isFinite));
   assert.ok(Math.abs(f.rotation)<.25&&Math.abs(f.dx)<.1&&Math.abs(f.dy)<.12);
   assert.ok(f.scaleX>.8&&f.scaleX<1.2&&f.scaleY>.8&&f.scaleY<1.2);
   if(mode==='win')frames.push(name.startsWith('L')?Object.values(letterPose(name,t,'win')):[f.rotation,f.dx,f.dy,f.scaleX,f.scaleY]);
  }
  const end=symbolPose(name,duration,mode);assert.ok(Math.abs(end.dx)<1e-6&&Math.abs(end.dy)<1e-6&&Math.abs(end.rotation)<1e-6,'motion ends at rest');
 }
 signatures.add(JSON.stringify(frames));
}
assert.equal(signatures.size,12,'twelve distinct object performances');
for(const cue of ['scan','win','winBig','welcome'])for(let t=0;t<=castDuration(cue)+100;t+=16){
 const p=castPose(t,cue,t);assert.ok(Object.values(p).every(Number.isFinite));
 assert.ok(Math.abs(p.left)<.3&&Math.abs(p.right)<.3&&Math.abs(p.head)<.15,'joint limits');
}
const cueSignatures=new Set();
for(const cue of ['scan','win','winBig','welcome']){
 const duration=castDuration(cue),frames=[];
 for(let t=0;t<duration;t+=8){
  const p=castPose(0,cue,t),reduced=castPose(0,cue,t,true);frames.push(p);
  for(const key of ['body','head','left','right','tail','dy'])assert.ok(Math.abs(reduced[key])<=Math.abs(p[key])*.241+1e-9,'reduced motion attenuates every joint');
  if(t>0){const previous=castPose(0,cue,t-8);for(const key of ['body','head','left','right','tail'])assert.ok(Math.abs(p[key]-previous[key])<.04,'no angular discontinuity');}
 }
 const before=castPose(0,cue,duration-1),rest=castPose(0);
 for(const key of ['body','head','left','right','tail','dy'])assert.ok(Math.abs(before[key]-rest[key])<.001,'reaction settles before returning to idle');
 cueSignatures.add(JSON.stringify(frames));
}
assert.equal(cueSignatures.size,4,'four authored performances');
assert.notEqual(castPose(0,'scan',560,false,'digger').left,castPose(0,'scan',560,false,'lifeguard').left,'shovel and detector performances differ');
assert.equal(castPose(0,'scan',200).tail,0,'tail follows rather than leading the scan');
assert.ok(Math.abs(castPose(0,'scan',150).head)>Math.abs(castPose(0,'scan',150).body),'head acquires target first');
assert.equal(motionTrack(50,[[0,0],[100,0]]),0,'a held pose does not drift');
for(const name of ['H1','H2']){
 for(let t=0;t<=970;t+=8){const p=treasurePartPose(name,t,'win');assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.lid>=0&&p.lid<=1&&Math.abs(p.flag)<=1);}
 assert.equal(treasurePartPose(name,0,'win').lid,0);assert.equal(treasurePartPose(name,970,'win').lid,0);assert.equal(treasurePartPose(name,970,'win').flag,0);
}
const source=fs.readFileSync(path.join(root,'src/components/Game.svelte'),'utf8');
for(const component of ['TreasureCast','TreasureWildColumns','BeachBackground','TreasureBoardFrame'])assert.ok(source.includes(component),'game must use new presentation');
const sound=fs.readFileSync(path.join(root,'src/components/Sound.svelte'),'utf8');assert.ok(!/['"]capo\//.test(sound),'no donor sound routing');
const winSource=fs.readFileSync(path.join(root,'src/components/SymbolWinAnim.svelte'),'utf8');
assert.ok(!winSource.includes('1.45')&&!winSource.includes('new Tween'),'the actual win renderer must not add a second generic scale pop');
assert.ok(winSource.includes('finish()')&&winSource.includes('HOLD_MS'),'win callback contract retained');
const rig=JSON.parse(fs.readFileSync(path.join(root,'src/game/treasureCastRig.json'),'utf8'));
for(const who of ['digger','lifeguard'])for(const part of Object.values(rig[who]))assert.ok(fs.existsSync(path.join(root,'static/assets',part.path)));
for(const asset of ['digger_blink','lifeguard_blink','chest_body','chest_lid','castle_body','castle_flag'])assert.ok(fs.existsSync(path.join(root,'static/assets/treasure',asset+'.png')));
console.log('OK: 12 weighted symbol motions, four distinct continuous performances, head lead/tail follow, settled joints, reduced motion and six animation assets');

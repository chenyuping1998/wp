// Offline only. The source generator supplies spring / strike maths; its Spine
// runtime and whole-symbol presets are deliberately absent from the game data.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const generatorRoot=path.resolve(appRoot,'../../../spine-generator');
const {spring,strike}=await import(pathToFileURL(path.join(generatorRoot,'src/motions.ts')).href);
const durationMs=970,stepMs=5;
const recoil=(startMs,frequency,damping,attackMs=24,squared=false)=>({
 method:'spring',startMs,attackMs,fadeMs:140,squared,
 params:{from:1,to:0,frequency,damping,duration:(durationMs-startMs)/1000},
});
const flick=(startMs,anticipation,action,hold,frequency,damping)=>({
 method:'strike',startMs,attackMs:15,fadeMs:100,squared:false,
 params:{rest:0,anticipation:{value:-.18,time:anticipation,ease:'sineOut'},
  action:{value:0,time:action,ease:'quartIn'},
  overshoot:{amount:.75,frequency,damping},hold,
  recover:{time:Number(((durationMs-startMs)/1000-anticipation-action-hold).toFixed(6)),ease:'sineInOut'}},
});
// Different masses, contact times and channels preserve the individual stories.
const channels={
 letterAContact:recoil(520,5.8,.48,20),
 letterAStretch:flick(485,.045,.035,.24,6,.52),
 letterKLean:flick(245,.05,.045,.37,4.6,.42),
 letterKWeight:recoil(335,4,.45),
 letterQTurn:flick(310,.055,.065,.32,3.8,.4),
 letterQWeight:recoil(445,3.4,.42,30),
 letterJHook:recoil(390,3.8,.38,28),
 letterJContact:recoil(585,6.4,.55,18),
 paperRecoil:flick(300,.07,.045,.30,4.7,.44),
 rollRecoil:recoil(405,4.5,.43,30),
 strawBend:recoil(325,4.3,.38,26),
 strawFacing:recoil(365,5.1,.5,30,true),
};
const smooth=value=>{const u=Math.max(0,Math.min(1,value));return u*u*u*(10+u*(-15+6*u));};
const samples=Object.fromEntries(Object.entries(channels).map(([name,config])=>{
 const motion=(config.method==='spring'?spring:strike)(config.params);
 const values=Array.from({length:durationMs/stepMs+1},(_,i)=>{
  const time=i*stepMs,local=time-config.startMs;
  if(local<=0||time>=durationMs)return 0;
  const value=motion.value(local/1000),shape=config.squared?value*value:value;
  const envelope=smooth(local/config.attackMs)*smooth((durationMs-time)/config.fadeMs);
  return Number((shape*envelope).toFixed(7));
 });
 return [name,values];
}));
const output={version:1,durationMs,stepMs,
 source:{project:'spine-generator',module:'src/motions.ts',functions:['spring','strike'],
  mode:'offline local math; no Spine runtime',
  envelope:'quintic onset and final fade; exact zero before start and at 970ms'},
 channels,samples};
const target=path.join(appRoot,'src/game/data/treasureObjectGenerator.json');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(output)+'\n');
console.log(`Baked local spring/strike: ${Object.keys(channels).length} attachment channels, ${stepMs}ms samples, exact ${durationMs}ms rest`);

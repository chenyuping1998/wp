// Offline only: import the user's local generator maths, never its 4.3 runtime.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const generatorRoot=path.resolve(appRoot,'../../../spine-generator');
const {wave,sum}=await import(pathToFileURL(path.join(generatorRoot,'src/motions.ts')).href);
const seconds=7.2,steps=360;
const channels={
 surge:sum([
  wave({amplitude:.76,period:seconds,peakAt:1.8,duration:seconds}),
  wave({amplitude:.24,period:seconds/2,peakAt:.55,duration:seconds}),
 ]),
 drift:sum([
  wave({amplitude:.82,period:seconds,peakAt:0,duration:seconds}),
  wave({amplitude:.18,period:seconds/2,peakAt:1.35,duration:seconds}),
 ]),
};
const output={
 version:1,
 source:{project:'spine-generator',module:'src/motions.ts',functions:['wave','sum'],mode:'offline math sampling; no Spine runtime'},
 durationMs:seconds*1000,
 steps,
 channels:Object.fromEntries(Object.entries(channels).map(([name,motion])=>{
  const values=Array.from({length:steps},(_,i)=>Number(motion.value(i/steps*seconds).toFixed(7)));
  values.push(values[0]);
  return [name,values];
 })),
};
const target=path.join(appRoot,'src/game/data/treasureBeachGenerator.json');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(output)+'\n');
console.log('Baked local wave/sum: 7.2s, two offset channels, 360 intervals, '+path.relative(appRoot,target));

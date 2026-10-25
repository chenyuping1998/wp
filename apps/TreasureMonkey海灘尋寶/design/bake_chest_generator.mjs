import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2]??path.join(root,'../../../spine-generator'));
const {strike}=await import(pathToFileURL(path.join(source,'src/motions.ts')).href);
// A mechanical hinge has a clear release, followed by a damped overshoot.
// Only the analytic motion is baked; no Spine runtime or foreign rig is shipped.
const parameters={anticipation:{value:-.045,time:.16,ease:'sineInOut'},action:{value:1,time:.13,ease:'quartIn'},overshoot:{amount:.085,frequency:6,damping:.58},hold:.33,recover:{time:.35,ease:'sineInOut'}};
const motion=strike(parameters),intervals=240;
const values=Array.from({length:intervals+1},(_,i)=>Number(motion.value(i/intervals*motion.duration).toFixed(8)));
values[0]=values[values.length-1]=0;
const output={source:'E:/stake/spine-generator/src/motions.ts#strike',generator:'spine-motion-kit 0.1.0',durationMs:970,parameters,values};
const destination=path.join(root,'src/game/data/treasureChestGenerator.json');
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(output)+'\n');
console.log(`Baked generator hinge: ${values.length} samples, ${motion.duration.toFixed(3)}s; ${destination}`);

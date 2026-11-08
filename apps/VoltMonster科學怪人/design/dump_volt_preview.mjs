/** Preview poses from the same rigs and skinning functions as the runtime. */
import fs from 'node:fs';import path from 'node:path';import {register} from 'node:module';import{fileURLToPath,pathToFileURL}from'node:url';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e}}`));
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {buildRig,skin}=await import(pathToFileURL(path.join(app,'src/game/meshWin/meshRig.ts')).href);
const {VOLT_SYMBOLS}=await import(pathToFileURL(path.join(app,'src/game/meshWin/voltSymbols.ts')).href);
const all={};for(const[key,spec]of Object.entries(VOLT_SYMBOLS)){
 const rig=buildRig(spec.rig);all[key]=Array.from({length:31},(_,i)=>{
  const positions=new Float32Array(rig.rest.length);skin(rig,spec.pose(rig,i*50),spec.feetY,positions);
  return Array.from(positions,(v,j)=>Math.round((v-rig.rest[j])*10000)/10000);
 });
}
fs.writeFileSync(path.join(app,'design/.volt_preview_poses.json'),JSON.stringify(all));

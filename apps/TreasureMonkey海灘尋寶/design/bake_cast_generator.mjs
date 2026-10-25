import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Offline authoring only. The shipped game reads the resulting JSON and never
// imports Spine 4.3, its runtime, or files outside this application.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(root,'../../../spine-generator');
const {findPreset}=await import(pathToFileURL(path.join(source,'src/presets.ts')).href);
const params={breathe:{period:4,intensity:.32},chain:{period:4,amplitude:.9,lagFrames:3,gain:1.10,mode:'keys'}};
const roles={chest:'chest',shoulders:['shoulderL','shoulderR'],head:'head',chain:['tailRoot','tailMid','tailTip']};
const context=p=>({facing:1,size:700/580,fps:30,param:(name,fallback)=>p[name]??fallback,role:name=>roles[name],roleOpt:name=>roles[name],roleList:name=>Array.isArray(roles[name])?roles[name]:roles[name]?[roles[name]]:[],worldRotation:()=>0,ikChain:()=>undefined});
const breath=findPreset('breathe').build(context(params.breathe));
const chain=findPreset('chain-sway').build(context(params.chain));
const at=(list,bone,channel)=>{
 const track=list.find(t=>t.bone===bone&&t.channel===channel);
 if(!track)throw new Error(`Missing source motion ${bone}/${channel}`);
 return t=>track.motion.value(t);
};
const tailPhase=1.6; // tail root follows the chest's inhalation, then 100ms/link
const functions={
 breathX:at(breath.local,'chest','scaleX'),
 breathY:at(breath.local,'chest','scaleY'),
 shoulderY:at(breath.screen,'shoulderL','y'),
 head:at(breath.screen,'head','rotate'),
 tail: t=>at(chain.local,'tailRoot','rotate')(t-tailPhase),
 tailMid:t=>at(chain.local,'tailMid','rotate')(t-tailPhase),
 tailTip:t=>at(chain.local,'tailTip','rotate')(t-tailPhase),
};
const frames=120,duration=4,h=.0001,round=n=>+n.toFixed(14),channels={};
for(const [name,f] of Object.entries(functions)){
 channels[name]=Array.from({length:frames+1},(_,i)=>{
  const t=i*duration/frames,v=f(t),before=f(t-h),after=f(t+h);
  // Position plus per-second derivatives support C2 quintic interpolation.
  return [round(v),round((after-before)/(2*h)),round((after-2*v+before)/h**2)];
 });
 // Exact loop seam; derivatives are periodic as well as positions.
 channels[name][frames]=[...channels[name][0]];
}
const result={schema:1,source:{generator:'spine-motion-kit',files:['src/presets.ts','src/motions.ts','src/ease.ts'].map(file=>({path:`E:/stake/spine-generator/${file}`,sha256:createHash('sha256').update(fs.readFileSync(path.join(source,file))).digest('hex')})),presets:params,tailPhaseSeconds:tailPhase,space:'Generator degrees and Y-up; app converts to radians and Y-down'},periodMs:duration*1000,sampleCount:frames,channels};
const destination=path.join(root,'src/game/data/treasureCastGenerator.json');
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify(result)+'\n');
console.log('Baked breathe + chain-sway from local spine-generator: 4s / 120 C2 samples, no runtime dependency');

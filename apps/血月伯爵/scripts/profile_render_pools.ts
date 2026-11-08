/** Offline CPU/scene-graph profile. Does not start a renderer or measure FPS. */
import fs from 'node:fs';
import path from 'node:path';
import {Texture} from 'pixi.js';
import type {Book,Reveal} from '../src/game/bloodmoonTypes';
import {ReelView} from '../src/game/reelView.ts';
import {DustView} from '../src/game/dustView.ts';
import {EnergyView} from '../src/game/energyView.ts';
import {timingFor} from '../src/game/presentation.ts';
import {legacyCells} from './reel-reference.ts';
const data=JSON.parse(fs.readFileSync(new URL('../static/data/demo-books.json',import.meta.url),'utf8'));
const books=[...Object.values(data.modes).flat(),...Object.values(data.scenarios)] as Book[];
const reveals=books.flatMap(book=>book.events.filter((e):e is Reveal=>e.type==='reveal'));
const wild=data.scenarios.wild.events.find((e:Reveal)=>e.type==='reveal') as Reveal;
const giant=reveals.find(reveal=>reveal.bars.some(bar=>bar.size===6))!;
const normal=reveals.find(reveal=>!reveal.wildPlan.triggered&&reveal.bars.every(bar=>bar.size===1))!;
const textures=Array.from({length:14},()=>new Texture({source:Texture.EMPTY.source}));
const percentile=(times:number[],p:number)=>times.slice().sort((a,b)=>a-b)[Math.min(times.length-1,Math.floor(times.length*p))];
const profiles=[];
for(const [scenario,reveal] of [['normal',normal],['wild',wild],['six-by-six',giant]] as const)for(const turbo of [false,true]){
 const view=new ReelView();view.setTextures(textures);view.configure({bars:reveal.bars,board:reveal.board,reveal,turbo});
 const identities=new Set(view.view.children.flatMap(strip=>strip.children));
 const duration=timingFor(reveal,turbo).duration,times:number[]=[];
 let previous=new Set<string>(),legacyCreates=0,legacyRemoves=0,maxVisible=0;
 for(let clock=0;clock<=duration;clock+=1000/60){
  const cells=legacyCells(reveal,clock,turbo),keys=new Set(cells.map(cell=>cell.key));
  for(const key of keys)if(!previous.has(key))legacyCreates++;
  for(const key of previous)if(!keys.has(key))legacyRemoves++;
  previous=keys;maxVisible=Math.max(maxVisible,cells.length);
 }
 // Warm JS/JIT before sampling. All textures are stand-ins, no GPU is invoked.
 for(let repeat=0;repeat<3;repeat++)for(let frame=0;frame<120;frame++)view.draw(frame/120*duration,true,null);
 for(let repeat=0;repeat<4;repeat++)for(let clock=0;clock<=duration;clock+=1000/60){const at=performance.now();view.draw(clock,true,null);times.push(performance.now()-at);}
 const retained=new Set(view.view.children.flatMap(strip=>strip.children));
 profiles.push({scenario,turbo,durationMs:duration,samples:times.length,maxVisibleCells:maxVisible,legacyKeyedCreates:legacyCreates,legacyKeyedRemoves:legacyRemoves,pooledCellsPreparedWhileIdle:identities.size,pooledCreatesDuringSpin:[...retained].filter(node=>!identities.has(node)).length,pooledReplacementsDuringSpin:[...identities].filter(node=>!retained.has(node)).length,cpuUpdateMedianMs:percentile(times,.5),cpuUpdateP95Ms:percentile(times,.95)});
 view.destroy();
}
const dust=new DustView('ambient'),energy=new EnergyView();energy.configure(Array.from({length:6},()=>Array(6).fill(10)));
const dustTimes:number[]=[],energyTimes:number[]=[];
for(let frame=0;frame<1200;frame++){
 let at=performance.now();dust.draw(frame/60,1600,900,1);dustTimes.push(performance.now()-at);
 at=performance.now();energy.draw(frame%60*1000/60,true);energyTimes.push(performance.now()-at);
}
dust.destroy();energy.destroy();
const report={schemaVersion:1,date:'2026-11-07',kind:'offline-cpu-scene-graph-profile',scope:'CPU transforms/texture assignment only; no Svelte flush, GPU, image upload, video decoding or device FPS measurement.',reels:profiles,dust:{particles:28,sharedImmutableCircleMeshes:1,pathsRebuiltPerAnimationFrame:0,cpuUpdateMedianMs:percentile(dustTimes,.5),cpuUpdateP95Ms:percentile(dustTimes,.95)},energy:{maxParticles:36,glowLayersPerParticle:3,sharedImmutableCircleMeshes:1,pathsRebuiltPerAnimationFrame:0,cpuUpdateMedianMs:percentile(energyTimes,.5),cpuUpdateP95Ms:percentile(energyTimes,.95)}};
const output=path.resolve(process.argv[2]??'E:/stake/tmp/bloodmoon-render-pools-profile.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,reels:profiles,dust:report.dust,energy:report.energy}));

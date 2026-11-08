import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SYMBOL_IDLE_WRAP,SYMBOL_IDLE_SPECS,symbolIdleFrame,idleCellPhase} from '../src/game/symbolIdleMotion.ts';
const names=['H1','H2','H3','H4','H5','L1','L2','L3','L4','S'];
assert.deepEqual(Object.keys(SYMBOL_IDLE_SPECS).sort(),[...names].sort());
const signatures=new Set(),report={};
const bounds=JSON.parse(fs.readFileSync(new URL('./hypno-symbols-manifest.json',import.meta.url)));
let maxEdge=0;
for(const name of names){
 const disabled=symbolIdleFrame(name,.7,17,false);assert.deepEqual(disabled,{x:0,y:0,rotation:0,sx:1,sy:1,act:0,u:-1,loop:0});
 const s=SYMBOL_IDLE_SPECS[name];assert.equal(SYMBOL_IDLE_WRAP%s.loop,0);assert.equal(SYMBOL_IDLE_WRAP%s.cycle,0);
 assert.ok(s.cycle>=4&&s.cycle<=8&&s.duration>=.5&&s.duration<=1.6);
 let visible=0,ambientRange=0;const first=symbolIdleFrame(name,0),ambient=[];let maxOffset=0,maxScale=0;
 const ratios=name==='S'?1.1:name.startsWith('L')?.84:.98;
 const hull=bounds[name].hull.map(point=>point.map(v=>v/512-.5));
 for(let k=0;k<=s.cycle*1000;k+=8){
  const t=k/1000,f=symbolIdleFrame(name,t);assert.ok(Object.values(f).every(Number.isFinite));
  maxOffset=Math.max(maxOffset,Math.abs(f.x),Math.abs(f.y));maxScale=Math.max(maxScale,f.sx,f.sy);
  if(f.u>=0)visible=Math.max(visible,Math.abs(f.rotation)/(Math.PI/60),Math.abs(f.x)/.03,Math.abs(f.y)/.03,Math.abs(f.sx-1)/.04,Math.abs(f.sy-1)/.04);
  else ambient.push(f);
  for(const [x,y] of hull){
   const u=(x*f.sx*Math.cos(f.rotation)-y*f.sy*Math.sin(f.rotation)+f.x)*ratios;
   const v=(x*f.sx*Math.sin(f.rotation)+y*f.sy*Math.cos(f.rotation)+f.y)*ratios;
   maxEdge=Math.max(maxEdge,Math.abs(u),Math.abs(v));
   assert.ok(Math.abs(u)<=.505&&Math.abs(v)<=.505,`${name} painted bounds leave the cell: ${u},${v}`);
  }
 }
 for(const f of ambient)ambientRange=Math.max(ambientRange,Math.abs(f.rotation-ambient[0].rotation),Math.abs(f.sy-ambient[0].sy),Math.abs(f.y-ambient[0].y));
 assert.ok(visible>=1,`${name} needs a readable act`);assert.ok(ambientRange>.003,`${name} ambient must stay alive`);
 assert.ok(maxScale<=1.12&&maxOffset<=.1);
 const a=symbolIdleFrame(name,0,.373),b=symbolIdleFrame(name,SYMBOL_IDLE_WRAP,.373);for(const key of Object.keys(a))assert.ok(Math.abs(a[key]-b[key])<1e-10);
 const signature=JSON.stringify(Array.from({length:15},(_,i)=>symbolIdleFrame(name,i*s.cycle/15)));assert.ok(!signatures.has(signature));signatures.add(signature);
 report[name]={description:s.description,cycle:s.cycle,actSeconds:s.duration,visibleAct:visible,ambientRange,maxScale,maxOffset};
}
const phases=new Set();for(let reel=0;reel<6;reel++)for(let row=1;row<=5;row++)phases.add(idleCellPhase(reel,row));assert.ok(phases.size>=25,'Cells must not pulse as one block');
const result={passed:true,scope:'Pure motion, actual painted bounds, wrap continuity; actual browser frames checked separately',clockWrap:SYMBOL_IDLE_WRAP,distinctCellPhases:phases.size,maxPaintedCellEdge:maxEdge,symbols:report};
fs.writeFileSync(new URL('./symbol-idle-validation.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(`Symbol idle PASS: ten distinct ambient + act performances, ${phases.size} cell phases, no painted cell overflow, seamless 120s wrap.`);

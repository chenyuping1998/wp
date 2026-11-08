/** Export production poses and verify pinned ambience geometry over two gust cycles. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {register} from 'node:module';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e}}`));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,process.argv.includes('--living')?'design/preview_mummy_20261107/living_scene':'design/preview_mummy_20261107/motion_polish');fs.mkdirSync(out,{recursive:true});
const core=await import(pathToFileURL(path.join(root,'src/game/meshWin/meshRig.ts')));
const {MESH_WINS}=await import(pathToFileURL(path.join(root,'src/game/meshWin/index.ts')));
const motion=await import(pathToFileURL(path.join(root,'src/game/mummyAmbienceMotion.ts')));
const {BG_MOTION_PARTS}=await import(pathToFileURL(path.join(root,'src/game/bgMotionParts.ts')));
const {LIVING_LINEN}=await import(pathToFileURL(path.join(root,'src/game/livingLinen.ts')));
const assets=fs.readFileSync(path.join(root,'src/game/assets.ts'),'utf8');
function texture(key){const re=new RegExp('\\b'+key+':[^}]*?new URL\\([\'\"]([^\'\"]+)');const m=assets.match(re);if(!m)throw new Error(`texture key:${key}`);return 'static/'+m[1].replace(/^(\.\.\/)+/,'');}
const awardMeta=[],awardFloats=[],fps=24,n=48;
for(const [name,spec] of Object.entries(MESH_WINS)){
 const rig=core.buildRig(spec.rig),v=new Float32Array(rig.rest.length),frames=[];
 for(let f=0;f<n;f++){const p=spec.pose(rig,f*1000/fps);core.skin(rig,p,spec.feetY,v);awardFloats.push(...v);frames.push({flash:p.flash,sheen:p.sheen,air:p.air});}
 awardMeta.push({name,uvs:Array.from(rig.uvs),indices:Array.from(rig.indices),verts:v.length,mode:spec.mode,subject:texture(spec.mode==='panel'?(spec.sprite??spec.key):spec.key+'Subject'),plate:spec.mode==='panel'?null:texture(spec.key+'Plate'),glow:texture(spec.key+'Glow'),sheenTexture:texture(spec.key+'Sheen'),frames});
}
fs.writeFileSync(path.join(out,'awards.json'),JSON.stringify({fps,n,items:awardMeta}));fs.writeFileSync(path.join(out,'awards.bin'),Buffer.from(new Float32Array(awardFloats).buffer));
const bgMeta=[],bgFloats=[];let tested=0,minArea=Infinity,maxArea=0,maxPinError=0,maxTravel=0;
function area(v,a,b,c){a*=2;b*=2;c*=2;return(v[b]-v[a])*(v[c+1]-v[a+1])-(v[b+1]-v[a+1])*(v[c]-v[a]);}
for(const mode of ['base','feature','hold']){
 const parts=BG_MOTION_PARTS[mode],items=[];
 if(mode!=='base'){
  const grid=motion.surfaceGrid(),rest=new Float32Array(grid.positions);
  const pinned=mode==='feature'?[[960,120],[345,450],[200,450],[1850,650],[960,880]]:[[960,120],[440,450],[1550,450],[960,880]];
  for(let f=0;f<=510;f++){
   const t=f/15*1000;motion.surfaceVertices(mode,t,-1,grid.uvs,grid.positions);
   for(let k=0;k<grid.indices.length;k+=3){const a=grid.indices[k],b=grid.indices[k+1],c=grid.indices[k+2],ratio=area(grid.positions,a,b,c)/area(rest,a,b,c);minArea=Math.min(minArea,ratio);maxArea=Math.max(maxArea,ratio);if(ratio<.5||ratio>1.6)throw new Error(`Surface fold/stretch:${mode}@${t} ${ratio}`);}
   for(const [x,y] of pinned){let near=0,d=Infinity;for(let i=0;i<rest.length;i+=2){const q=(rest[i]-x)**2+(rest[i+1]-y)**2;if(q<d){d=q;near=i;}}const drift=Math.hypot(grid.positions[near]-rest[near],grid.positions[near+1]-rest[near+1]);if(drift>.001)throw new Error(`Stone landmark moved:${mode} ${x},${y} ${drift}`);}
   tested++;
  }
  for(let f=0;f<204;f++){motion.surfaceVertices(mode,f/12*1000,-1,grid.uvs,grid.positions);bgFloats.push(...grid.positions);}
  items.push({surface:true,p:{x:0,y:0,w:1920,h:1080},texture:texture(mode==='feature'?'gbBgFeature':'gbBgHoldAndSpin'),uvs:Array.from(grid.uvs),indices:Array.from(grid.indices),verts:rest.length});
 }
 for(const [list,fire] of [[(parts.linen??[]).concat(LIVING_LINEN[mode]),false],[parts.flames,true]])for(const p of list){
  const grid=motion.partGrid(p),rest=new Float32Array(grid.positions),evalAt=(t,age)=>{(fire?motion.flameVertices:motion.linenVertices)(p,t,age,grid.uvs,grid.positions);};
  let travel=0;
  for(let f=0;f<=1020;f++){
   const t=f/30*1000;evalAt(t,f>300&&f<390?t-10000:-1);
   for(let k=0;k<grid.indices.length;k+=3){const [a,b,c]=grid.indices.slice(k,k+3),ratio=area(grid.positions,a,b,c)/area(rest,a,b,c);minArea=Math.min(minArea,ratio);maxArea=Math.max(maxArea,ratio);if(ratio<.5||ratio>1.6)throw new Error(`Ambience fold/stretch:${p.key}@${t} ${ratio}`);}
   for(let i=0;i<rest.length;i+=2){const d=Math.hypot(grid.positions[i]-rest[i],grid.positions[i+1]-rest[i+1]);travel=Math.max(travel,d);if(fire?grid.uvs[i+1]>=p.ay:grid.uvs[i+1]===0)maxPinError=Math.max(maxPinError,d);}
   tested++;
  }
  maxTravel=Math.max(maxTravel,travel);
  if(travel<.3)throw new Error(`Ambience does not act:${p.key}`);
  for(let f=0;f<204;f++){evalAt(f/12*1000,-1);bgFloats.push(...grid.positions);}
  items.push({p,fire,texture:texture(p.key),uvs:Array.from(grid.uvs),indices:Array.from(grid.indices),verts:rest.length});
 }
 bgMeta.push({mode,far:texture(mode==='base'?'gbBgBase':mode==='feature'?'gbBgFeature':'gbBgHoldAndSpin'),props:texture(mode==='base'?'mummyBaseProps':mode==='feature'?'mummyFeatureProps':'mummyHoldProps'),items});
}
if(maxPinError>.0001)throw new Error(`Unpinned cloth/fire:${maxPinError}`);
const report={passed:true,frames:tested,minArea,maxArea,maxPinError,maxTravel,gustPeriodMs:motion.GUST_PERIOD,stoneLandmarksPinned:true,method:'Production geometry over two gusts; cloth/fire at 30 fps including win draught; foliage/drapes at 15 fps'};
fs.writeFileSync(path.join(out,'ambience_verification.json'),JSON.stringify(report,null,2));console.log(report);
fs.writeFileSync(path.join(out,'backgrounds.json'),JSON.stringify({fps:12,n:204,modes:bgMeta}));fs.writeFileSync(path.join(out,'backgrounds.bin'),Buffer.from(new Float32Array(bgFloats).buffer));

import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';import {pathToFileURL} from 'node:url';
const [app,out]=process.argv.slice(2),kind=app.includes('Purrfia')?'purrfia':'parrot',temp=path.join(app,'design/.prize-review.mjs');
fs.writeFileSync(temp,stripTypeScriptTypes(fs.readFileSync(path.join(app,'src/game/symbolPerformance.ts'),'utf8')));
try{
 const {partPerformance,partVertex}=await import(pathToFileURL(temp).href),parts=JSON.parse(fs.readFileSync(path.join(app,'src/game/symbolParts.json'),'utf8'));
 let samples=0,minArea=1;const frames=[];
 for(let frame=0;frame<=40;frame++){
  const t=frame/40,layers=[];
  for(const [n,name] of ['S','H1','H2','H3','H4','L1'].entries()){
   const specs=parts[name]??[['mg'+name,0,0,1,1]];
   for(const [part,x,y,w,h] of specs){
    const p=partPerformance(kind,name,part,t),v=[],uv=[],triangles=[],boost=1+.055*Math.sin(t*Math.PI),c=Math.cos(p.rotation),s=Math.sin(p.rotation);
    assert(p.sx>0&&p.sy>0);samples++;
    for(let yy=0;yy<=6;yy++)for(let xx=0;xx<=6;xx++){
     const q=partVertex(xx/6,yy/6,w*180,h*180,p.bend,p.ripple,t),dx=q.x*p.sx,dy=q.y*p.sy;
     v.push((n%3)*240+120+(x*180+p.x*180+c*dx-s*dy)*boost,Math.floor(n/3)*240+130+(y*180+p.y*180+s*dx+c*dy)*boost);uv.push(xx/6,yy/6);
     if(xx<6&&yy<6){const i=yy*7+xx;triangles.push(i,i+1,i+8,i,i+8,i+7);}
    }
    for(let i=0;i<triangles.length;i+=3){const [a,b,c]=triangles.slice(i,i+3),area=(v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]);assert(Number.isFinite(area)&&area>0,`${part} folds at ${t}`);minArea=Math.min(minArea,area/(w*h*180*180/36));}
    const base=path.join(app,'static/assets/sprites',kind+'Symbols'),file=part.startsWith('mg')?part.slice(2).toLowerCase()+'.png':part+'.png';assert(fs.existsSync(path.join(base,file)));
    layers.push({file:path.join(base,file),positions:v,uvs:uv,triangles});
   }
  }frames.push({t,layers});
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(frames));
 const report={kind,frames:frames.length,partSamples:samples,minAreaRatio:+minArea.toFixed(4),folds:0,reviewFps:25,slowMotion:true,scope:'actual per-part performance and mesh helper used by the game; 6 prize types, 41 phases'};fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{fs.unlinkSync(temp);}

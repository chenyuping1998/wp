// Fit native generated expression art; retain original head perimeter/alpha.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const root='design/source/v9/laugh';
const states=['inhale','rising','peak','settle'];
const zones={mg:'26,81 44,73 62,99 76,74 108,80 123,108 112,129 113,146 100,166 64,173 26,158 21,130 34,112',fg:'36,83 63,74 72,105 86,78 128,82 140,118 130,139 126,163 105,181 55,184 28,164 24,139 35,122'};
const inks=[[40,40,40],[239,234,220],[232,181,125],[211,157,105],[184,123,96],[74,72,70],[160,110,70]];
const preview=[];
for(const cast of ['mg','fg']) {
 const original=`design/source/${cast}/head_2_face.png`;
 const {data:base,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info;
 const mask=await sharp(Buffer.from(`<svg width="${w}" height="${h}"><polygon points="${zones[cast]}" fill="white"/></svg>`)).blur(1.1).ensureAlpha().raw().toBuffer();
 for(const state of states) {
  const edited=await sharp(`${root}/${cast}_${state}_raw.png`).resize(w,h,{fit:'fill'}).ensureAlpha().raw().toBuffer();
  const output=Buffer.from(base);
  for(let p=0;p<w*h;p++) {
   const i=p*4,a=mask[i+3]/255;
   if(!a)continue;
   const rgb=[edited[i],edited[i+1],edited[i+2]];
   const nearest=inks.reduce((best,color)=>{
    const distance=color.reduce((sum,v,c)=>sum+(v-rgb[c])**2,0);
    return distance<best.distance?{color,distance}:best;
   },{color:inks[0],distance:Infinity}).color;
   for(let c=0;c<3;c++)output[i+c]=Math.round(base[i+c]*(1-a)+nearest[c]*a);
  }
  const dest=`design/source/${cast}/head_2_face_${state}.png`;
  await sharp(output,{raw:{width:w,height:h,channels:4}}).png().toFile(dest);
  console.log(`${cast}/${state} fitted to ${w}x${h}, original alpha retained`);
 }
 const row=['closed','inhale','half','rising','open','peak','settle'];
 for(let c=0;c<row.length;c++) {
  const suffix=row[c]==='closed'?'':`_${row[c]}`;
  preview.push({input:await sharp(`design/source/${cast}/head_2_face${suffix}.png`).resize(220,220,{fit:'contain',background:'#e4e0d4'}).png().toBuffer(),left:c*220,top:cast==='mg'?0:220});
 }
}
await sharp({create:{width:1540,height:440,channels:4,background:'#e4e0d4'}}).composite(preview).png().toFile('design/qa/v9/laugh/expressions.png');

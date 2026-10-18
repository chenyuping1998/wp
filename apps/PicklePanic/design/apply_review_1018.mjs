// Canvas/alpha registration of imagegen production outputs, with no painted
// substitute artwork. Run after the 10-17 exporter if both are being rebuilt.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const APP=path.resolve(import.meta.dirname,'..');
const SRC=path.join(APP,'design/source/review_1018');
const ART=path.join(APP,'static/assets/pickle');
const selected=JSON.parse(fs.readFileSync(path.join(SRC,'generated.json'),'utf8'));
const clear={r:0,g:0,b:0,alpha:0};
const blank=(w,h)=>sharp({create:{width:w,height:h,channels:4,background:clear}});
fs.mkdirSync(path.join(SRC,'raw'),{recursive:true});
const raw=name=>path.join(SRC,'raw',name+'.png');
for(const [name,src] of Object.entries(selected)){
 if(fs.existsSync(src))fs.copyFileSync(src,raw(name));
 else if(!fs.existsSync(raw(name)))throw new Error('Missing selected image '+name);
}
async function tight(name){
 const input=await sharp(raw(name)).ensureAlpha().png().toBuffer();
 const {data,info}=await sharp(input).raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 // Ignore nearly invisible generation noise outside the actual ink. Including
 // alpha=1 specks would shrink the whole object when registering its bounds.
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)throw new Error('Empty image '+name);
 return sharp(input).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).png().toBuffer();
}
if(selected.low_label){
 const ink=await sharp(await tight('low_label')).resize(432,433,{fit:'fill'}).png().toBuffer();
 await blank(512,512).composite([{input:ink,left:36,top:36}]).png().toFile(path.join(ART,'low_label.png'));
}
if(selected.ticker){
 const ink=await sharp(await tight('ticker')).resize(882,188,{fit:'contain',background:clear}).png().toBuffer();
 await blank(894,200).composite([{input:ink,left:6,top:6}]).png().toFile(path.join(ART,'ticker.png'));
}
if(selected.ray){
 const ink=await sharp(await tight('ray')).resize(90,248,{fit:'fill'}).png().toBuffer();
 await blank(256,256).composite([{input:ink,left:83,top:8}]).png().toFile(path.join(ART,'ray.png'));
}
for(const n of [1,5,6])if(selected['steam'+n]){
 // Full-canvas resize retains the drawn relative size of each animation frame.
 await sharp(raw('steam'+n)).resize(256,256,{fit:'fill'}).png().toFile(path.join(ART,`door_steam_${n}_v2.png`));
}
if(selected.bg_feature)await sharp(raw('bg_feature')).resize(1920,1080,{fit:'fill'}).webp({lossless:true}).toFile(path.join(ART,'bg_feature_v2.webp'));
console.log('Registered F/G/H and review repairs; artwork source retained in '+SRC);

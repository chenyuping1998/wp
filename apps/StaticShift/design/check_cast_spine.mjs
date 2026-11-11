// Audit the cast actually shipped by Mascot/FeatureIntro (2026-11-09: Spine 4.3
// rigs from spine-motion-kit, packed by design/cast_v2/build_game_cast.py).
// Same revision end to end: 交件 layers == kit images == atlas pixels, and the
// shipped rig == the accepted kit rig. Source consistency only; the rendered
// motion review (every clip, frame by frame) is still mandatory.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const castDir=path.join(root,'design/cast_v2');
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
function png(file){
 const b=fs.readFileSync(file),chunks=[];let w,h;
 for(let p=8;p<b.length;){const n=b.readUInt32BE(p),type=b.toString('ascii',p+4,p+8),data=b.subarray(p+8,p+8+n);p+=n+12;
  if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);assert(data[8]===8&&data[9]===6&&data[12]===0,`Expected RGBA8: ${file}`);}
  if(type==='IDAT')chunks.push(data);
 }
 const raw=inflateSync(Buffer.concat(chunks)),stride=w*4,out=Buffer.alloc(w*h*4);let p=0;
 for(let y=0;y<h;y++){const filter=raw[p++];assert(filter<=4,`PNG filter ${filter}`);
  for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?out[i-4]:0,b=y?out[i-stride]:0,c=y&&x>=4?out[i-stride-4]:0;
   out[i]=(raw[p++]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }
 }return {w,h,data:out};
}
function components(im){
 const seen=new Uint8Array(im.w*im.h),stack=new Int32Array(seen.length);let count=0;
 for(let i=0;i<seen.length;i++){if(seen[i]||!im.data[i*4+3])continue;count++;let n=1;stack[0]=i;seen[i]=1;
  while(n){const k=stack[--n],x=k%im.w,y=Math.floor(k/im.w);
   for(const j of [x?k-1:-1,x<im.w-1?k+1:-1,y?k-im.w:-1,y<im.h-1?k+im.w:-1])
    if(j>=0&&!seen[j]&&im.data[j*4+3]){seen[j]=1;stack[n++]=j;}
  }
 }return count;
}
// build_game_cast.py's crop: alpha box grown by PAD, clamped to the canvas
const PAD=2;
function cropBox(im){
 let x0=im.w,y0=im.h,x1=-1,y1=-1;
 for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++)if(im.data[(y*im.w+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 assert(x1>=0,'empty layer');
 return [Math.max(0,x0-PAD),Math.max(0,y0-PAD),Math.min(im.w,x1+1+PAD),Math.min(im.h,y1+1+PAD)];
}
const CLIPS=['idle','idle_fidget','gaze','react_small','gaze_dud','win_big','win_big_loop','win_big_end'];
let checked=0;
for(const who of ['dj','host']){
 const runtime=path.join(root,'static/assets/castSpine43',who);
 const rig=JSON.parse(fs.readFileSync(path.join(runtime,'cast.json'),'utf8'));
 assert(rig.skeleton.spine.startsWith('4.3.'),`${who}: shipped rig is not Spine 4.3`);
 const source=path.join(castDir,rig.staticShift.source);
 const sha=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0,16);
 assert(sha===rig.staticShift.sourceSha256_16,`${who}: shipped rig is stale against ${rig.staticShift.source} — rerun build_game_cast.py`);
 for(const clip of CLIPS)assert(rig.animations[clip],`${who}: missing clip ${clip}`);
 const sheet=JSON.parse(fs.readFileSync(path.join(runtime,'cast_atlas.json'),'utf8'));
 const page=png(path.join(runtime,sheet.meta.image));
 const kitImages=path.join(path.dirname(source),'images');
 // accepted layers: cast v3 (2026-11-11 加粗) lives beside its rig as 拆層/<who>/layers; older rigs use cast_v2/交件
 const v3=path.resolve(path.dirname(source),'..','..',who,'layers');
 const delivered=fs.existsSync(v3)&&source.includes('cast_v3_')?v3:path.join(castDir,'交件',who,'layers');
 for(const [slot,atts] of Object.entries(rig.skins[0].attachments))for(const name of Object.keys(atts)){
  const layer=png(path.join(delivered,`${name}.png`));
  assert(fs.readFileSync(path.join(kitImages,`${name}.png`)).equals(fs.readFileSync(path.join(delivered,`${name}.png`))),`${who}/${name}: rig images differ from 交件 — re-rig the accepted art`);
  if(/^(arm|leg)_/.test(name))assert(components(layer)===1,`${who}/${name}: limb is not one connected part`);
  const f=sheet.frames[rig.staticShift.prefix+name];assert(f,`${who}/${slot}/${name}: no atlas frame`);
  const [bx,by,bx1,by1]=cropBox(layer),{x,y,w,h}=f.frame;
  assert(w===bx1-bx&&h===by1-by,`${who}/${name}: crop size drift`);
  for(let row=0;row<h;row++)
   assert(layer.data.subarray(((by+row)*layer.w+bx)*4,((by+row)*layer.w+bx+w)*4).equals(page.data.subarray(((y+row)*page.w+x)*4,((y+row)*page.w+x+w)*4)),`${who}/${name}: atlas differs from 交件`);
  checked++;
 }
}
console.log(`OK: ${checked} cast drawings (accepted layers) — 交件 = rig images = atlas pixels, rigs current, all 8 clips per figure. Rendered review still required.`);

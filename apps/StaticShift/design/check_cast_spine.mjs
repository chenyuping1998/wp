// Audit the cast actually shipped by Mascot/FeatureIntro. This checks source
// consistency, not visual quality; rendered motion review remains mandatory.
import fs from 'node:fs';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
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
let checked=0;
for(const [cast,folder] of [['mg','staticShiftDJ'],['fg','staticShiftHost']]){
 const source=path.join(root,'design/source',cast),runtime=path.join(root,'static/assets/spines',folder);
 const meta=JSON.parse(fs.readFileSync(path.join(source,'layers.json'),'utf8')),atlas=fs.readFileSync(path.join(runtime,'cast.atlas'),'utf8');
 const page=png(path.join(runtime,atlas.split(/\r?\n/).find(Boolean)));
 const regions=new Map([...atlas.matchAll(/\n([^\n]+)\nbounds:(\d+),(\d+),(\d+),(\d+)/g)].map(m=>[m[1],m.slice(2).map(Number)]));
 for(const layer of meta.layers){
  const image=png(path.join(source,layer.file)),region=regions.get(layer.name);assert(region,`${cast}: missing ${layer.name}`);
  const [x,y,w,h]=region;assert(w===image.w&&h===image.h&&w===layer.w&&h===layer.h,`${cast}/${layer.name}: dimensions drift`);
  assert(components(image)===1,`${cast}/${layer.name}: detached source fragment`);
  for(let row=0;row<h;row++)assert(image.data.subarray(row*w*4,(row+1)*w*4).equals(page.data.subarray(((y+row)*page.w+x)*4,((y+row)*page.w+x+w)*4)),`${cast}/${layer.name}: atlas differs from source`);
  checked++;
 }
 const rig=JSON.parse(fs.readFileSync(path.join(runtime,'cast.json'),'utf8'));
 for(const name of ['idle','cheer','chestbeat','hype','nod','throwit','flinch','alert','glance','flutter'])assert(rig.animations[name],`${cast}: missing ${name}`);
 for(const [clip,animation] of Object.entries(rig.animations))for(const [bone,timelines] of Object.entries(animation.bones||{}))
  for(const key of timelines.rotate||[])assert('value' in key&&!('angle' in key),`${cast}/${clip}/${bone}: wrong rotation format`);
}
console.log(`OK: ${checked} connected cast layers match atlas pixels; all 20 Spine clips present. Rendered review still required.`);

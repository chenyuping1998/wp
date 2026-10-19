import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire('E:/stake/tools/gen/package.json');const {PNG}=require('pngjs');
const im=PNG.sync.read(fs.readFileSync(process.argv[2]??new URL('./source/boomana_reskin_v3/painted_body_atlas.png',import.meta.url)));
const seen=new Uint8Array(im.width*im.height),comps=[];
for(let start=0;start<seen.length;start++){
 if(seen[start]||im.data[start*4+3]<40)continue;
 const queue=[start];seen[start]=1;let x0=im.width,y0=im.height,x1=0,y1=0;
 for(let q=0;q<queue.length;q++){
  const k=queue[q],x=k%im.width,y=Math.floor(k/im.width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
  for(const n of [x? k-1:-1,x+1<im.width?k+1:-1,y?k-im.width:-1,y+1<im.height?k+im.width:-1])if(n>=0&&!seen[n]&&im.data[n*4+3]>=40){seen[n]=1;queue.push(n);}
 }
 if(queue.length>60)comps.push({pixels:queue.length,box:[x0,y0,x1+1,y1+1]});
}
console.log(im.width,im.height);console.log(JSON.stringify(comps.sort((a,b)=>b.pixels-a.pixels),null,2));

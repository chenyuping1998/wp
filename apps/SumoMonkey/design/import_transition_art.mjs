// Mechanical fitting and discrete ink registration of native generated art.
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const palette=['EFEADC','E4E0D4','F3F0E6','4A4846','282828','2C2A29','423F3C','B87B60','A86E56','C79E79','D6B08B','AB8361','DED7C6'].map(h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)));
for(const [name,w,h] of [['door',1400,1080],['noren',1920,420]]){
 const raw=await sharp(`design/source/v8/transition/${name}_raw.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=raw.info.width,y0=raw.info.height,x1=0,y1=0;
 for(let y=0;y<raw.info.height;y++)for(let x=0;x<raw.info.width;x++)if(raw.data[(y*raw.info.width+x)*4+3]>128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const {data}=await sharp(`design/source/v8/transition/${name}_raw.png`).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(w,h,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4){let best=0,min=Infinity;for(let p=0;p<palette.length;p++){let d=0;for(let c=0;c<3;c++)d+=(data[i+c]-palette[p][c])**2;if(d<min){min=d;best=p;}}for(let c=0;c<3;c++)data[i+c]=palette[best][c];data[i+3]=data[i+3]>128?255:0;}
 // Maintain the specified central opening of the four-panel curtain.
 if(name==='noren')for(let y=64;y<h;y++)for(let x=952;x<968;x++)data[(y*w+x)*4+3]=0;
 await sharp(data,{raw:{width:w,height:h,channels:4}}).png().toFile(`static/assets/sprites/sushiScene/${name}.png`);
 console.log(name,{width:w,height:h,sourceCrop:[x0,y0,x1+1,y1+1]});
}

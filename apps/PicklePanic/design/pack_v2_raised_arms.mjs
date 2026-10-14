import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const dir='static/assets/spines/pickleBoss',out='design/source/production_v2/cast';
let atlas=fs.readFileSync(dir+'/cast.atlas','utf8');if(!atlas.includes('\nv2_raise_L\n')){
 const data=fs.readFileSync(dir+'/cast.png'),meta=await sharp(data).metadata();
 fs.copyFileSync(dir+'/cast.png',out+'/boss_atlas_before.png');fs.copyFileSync(dir+'/cast.atlas',out+'/boss_atlas_before.atlas');
 const layers=[{input:data,left:0,top:0}];let x=2,y=meta.height+4,rowH=0;
 for(const side of ['L','R']){const input=fs.readFileSync(out+'/raised_arm_'+side+'.png'),m=await sharp(input).metadata();layers.push({input,left:x,top:y});atlas=atlas.trimEnd()+'\n';atlas+=`v2_raise_${side}\nbounds:${x},${y},${m.width},${m.height}\noffsets:0,0,${m.width},${m.height}\nindex:-1\n`;x+=m.width+4;rowH=Math.max(rowH,m.height);}
 const height=y+rowH+4;atlas=atlas.replace(/^size:\d+,\d+$/m,`size:${meta.width},${height}`);
 await sharp({create:{width:meta.width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(dir+'/cast.png');fs.writeFileSync(dir+'/cast.atlas',atlas);
}

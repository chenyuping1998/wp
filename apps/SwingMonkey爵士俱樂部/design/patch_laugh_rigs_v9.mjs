// Append expression regions to CURRENT atlases without regenerating body rigs.
// Compare input hashes before writing, so concurrent edits cause a clean stop.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {LAUGH,applyLaughV9} from './laugh_motion_v9.mjs';
const require=createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const [cast,folder]of [['mg','sushiMaster'],['fg','sushiApprentice']]) {
 const dir=`static/assets/spines/${folder}`;
 const names=['monkey.png','monkey.atlas','monkey.json'];
 const originals=Object.fromEntries(names.map(name=>[name,fs.readFileSync(path.join(dir,name))]));
 const skeleton=JSON.parse(originals['monkey.json']);
 let atlas=originals['monkey.atlas'].toString();
 const imageInfo=await sharp(originals['monkey.png']).metadata();
 let x=2,y=imageInfo.height+2,rowH=0;
 const composites=[{input:originals['monkey.png'],left:0,top:0}];
 const regions=[];
 const attachments=skeleton.skins[0].attachments.head_2_face;
 for(const state of LAUGH.faceStates) {
  const name=`head_2_face_${state}`;
  if(attachments[name]&&new RegExp(`\\n${name}\\n`).test(atlas))continue;
  const file=`design/source/${cast}/${name}.png`;
  const data=fs.readFileSync(file),{width:w,height:h}=await sharp(data).metadata();
  if(x+w+2>imageInfo.width){x=2;y+=rowH+4;rowH=0;}
  composites.push({input:data,left:x,top:y});
  regions.push(`${name}\nbounds:${x},${y},${w},${h}\noffsets:0,0,${w},${h}\nindex:-1\n`);
  attachments[name]={...structuredClone(attachments.head_2_face),path:name};
  x+=w+4;rowH=Math.max(rowH,h);
 }
 applyLaughV9(skeleton.animations);
 const height=regions.length?y+rowH+2:imageInfo.height;
 atlas=atlas.replace(/^size:\d+,\d+$/m,`size:${imageInfo.width},${height}`);
 if(regions.length)atlas=atlas.trimEnd()+'\n'+regions.join('');
 const png=regions.length?await sharp({create:{width:imageInfo.width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).png().toBuffer():originals['monkey.png'];
 const outputs={'monkey.png':png,'monkey.atlas':Buffer.from(atlas),'monkey.json':Buffer.from(JSON.stringify(skeleton))};
 for(const name of names)if(hash(fs.readFileSync(path.join(dir,name)))!==hash(originals[name]))throw new Error(`Concurrent edit: ${folder}/${name}; reload current rig before retrying.`);
 const backup=`design/source/v9/laugh/rig-before-${folder}`;
 fs.mkdirSync(backup,{recursive:true});
 for(const name of names) {
  if(!fs.existsSync(path.join(backup,name)))fs.writeFileSync(path.join(backup,name),originals[name]);
  fs.writeFileSync(path.join(dir,`${name}.laugh-tmp`),outputs[name]);
  fs.renameSync(path.join(dir,`${name}.laugh-tmp`),path.join(dir,name));
 }
 console.log(`${folder}: appended ${regions.length} face regions; ten-beat laugh; all other rig data retained`);
}

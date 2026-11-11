// Integrate generated repairs into existing registration; keep rig and motion.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const app=path.resolve(import.meta.dirname,'..'),work=app+'/design/source/review_1101';
if(fs.existsSync(app+'/design/source/review_1101_ankles/mg-lower-leg-sheet.png'))throw Error('This exporter restores the rejected split-foot revision. Use design/apply_ankle_review_1101.mjs for the connected-ankle release.');
const specs=[
 ['mg','left_arm_0_upper_arm','mg-left-upper-arm',0,0,130,163],
 ['mg','right_arm_0_upper_arm','mg-right-upper-arm',0,0,101,139],
 ['mg','left_leg_1_calf','mg-left-calf',27,0,76,105],
 ['mg','right_leg_1_calf','mg-right-calf',4,0,76,103],
 ['mg','left_leg_0_thigh','mg-left-thigh',28,0,80,81],
 ['mg','right_leg_0_thigh','mg-right-thigh',24,0,84,87],
 ['fg','left_leg_0_thigh','fg-left-thigh',12,0,74,91],
 ['fg','right_leg_0_thigh','fg-right-thigh',25,0,78,91],
 ['mg','torso_0_trunk','mg-torso',15,0,260,380],
 ['mg','right_arm_2_hand','mg-right-hand',9,0,83,204],
 ['fg','left_arm_0_upper_arm','fg-left-upper-arm',0,0,146,179],
 ['fg','right_arm_0_upper_arm','fg-right-upper-arm',0,0,155,186],
];
async function bounds(file,threshold=8){const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=-1,y1=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>threshold){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};}
for(const [role,name,raw,x,y,w,h] of specs){
 if(name.includes('_leg_'))continue;
 const meta=JSON.parse(fs.readFileSync(app+'/design/source/'+role+'/layers.json'));const l=meta.layers.find(l=>l.name===name);
 const file=work+'/raw/'+raw+'.png';const bb=await bounds(file);
 let buf=await sharp(file).extract(bb).resize(w,h,{fit:'fill'}).png().toBuffer();
 let output=await sharp({create:{width:l.w,height:l.h,channels:4,background:'#00000000'}}).composite([{input:buf,left:x,top:y}]).png().toBuffer();
 // Preserve the original neck registration under the unchanged face.
 if(role==='mg' && name==='torso_0_trunk'){
  const data=await sharp(output).ensureAlpha().raw().toBuffer();
  const old=await sharp(work+'/before/mg/'+l.file).ensureAlpha().raw().toBuffer();
  old.copy(data,0,0,115*l.w*4);
  for(let yy=115;yy<240;yy++)for(let xx=0;xx<l.w;xx++){const i=(yy*l.w+xx)*4;const cream=v=>v[i]>170&&v[i+1]>140&&v[i+2]>100;if(!cream(data)&&!cream(old)){data[i+3]=Math.min(data[i+3],old[i+3]);for(let c=0;c<3;c++)data[i+c]=old[i+c];}}
  output=await sharp(data,{raw:{width:l.w,height:l.h,channels:4}}).png().toBuffer();
 }


 if(role==='mg' && name==='right_arm_0_upper_arm')output=fs.readFileSync(work+'/before/mg/'+l.file);
 if(role==='mg' && name==='left_arm_0_upper_arm'){
  const data=await sharp(output).ensureAlpha().raw().toBuffer();
  const old=await sharp(work+'/before/mg/'+l.file).ensureAlpha().raw().toBuffer();
  // Restrict repaint to the scarf remnant, preserving the original elbow ink.
  for(let yy=0;yy<l.h;yy++)for(let xx=0;xx<l.w;xx++){
   const i=(yy*l.w+xx)*4;if(xx<88||yy<25||yy>125)old.copy(data,i,i,i+4);
  }
  output=await sharp(data,{raw:{width:l.w,height:l.h,channels:4}}).png().toBuffer();
 }
 if(role==='mg' && name==='right_arm_2_hand'){
  const old=await sharp(work+'/before/mg/'+l.file).ensureAlpha().raw().toBuffer();
  const seen=new Uint8Array(l.w*l.h);let largest=[];
  for(let z=0;z<seen.length;z++){if(seen[z]||old[z*4+3]<8)continue;const q=[z];seen[z]=1;
   for(let j=0;j<q.length;j++){const k=q[j],x=k%l.w,y=Math.floor(k/l.w);for(const n of [x?k-1:-1,x+1<l.w?k+1:-1,y?k-l.w:-1,y+1<l.h?k+l.w:-1])if(n>=0&&!seen[n]&&old[n*4+3]>=8){seen[n]=1;q.push(n)}}
   if(q.length>largest.length)largest=q;
  }
  const keep=new Uint8Array(seen.length);for(const k of largest)keep[k]=1;
  for(let k=0;k<keep.length;k++)if(!keep[k])old.fill(0,k*4,k*4+4);
  output=await sharp(old,{raw:{width:l.w,height:l.h,channels:4}}).png().toBuffer();
 }
 fs.writeFileSync(app+'/design/source/'+role+'/'+l.file,output);
}
// Paint each full leg once, then take registered overlapping crops.
for(const role of ['mg','fg']){
 const meta=JSON.parse(fs.readFileSync(work+'/before/'+role+'/layers.json'));
 const file=work+'/raw/compact-whole-legs.png',m=await sharp(file).metadata();
 for(const [index,side] of ['left','right'].entries()){
  const half=await sharp(file).extract({left:index*Math.floor(m.width/2),top:0,width:Math.floor(m.width/2),height:m.height}).png().toBuffer();
  const bb=await bounds(half,128);
  const [px,py,pw,ph,cuff]=role==='mg'?(index===0?[177,575,95,235,140]:[320,575,95,235,140]):(index===0?[178,570,90,235,142]:[315,570,90,235,142]);
  const raw=await sharp(half).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let split=Math.round(bb.height*.7);
  for(let y=Math.round(bb.height*.4);y<bb.height;y++){
   let n=0;for(let x=bb.left;x<bb.left+bb.width;x++){const i=((bb.top+y)*raw.info.width+x)*4;if(raw.data[i]>190&&raw.data[i+1]>165&&raw.data[i+2]>110&&raw.data[i+3]>128)n++;}
   if(n>bb.width*.08){split=y;break;}
  }
  let top=await sharp(half).extract({...bb,height:split}).resize(pw,cuff,{fit:'fill'}).png().toBuffer();
  const shear=index===1?.22:0;
  if(shear)top=await sharp(top).affine([[1,shear],[0,1]],{background:'#00000000'}).png().toBuffer();
  const sockRaw=await sharp(half).extract({left:bb.left,top:bb.top+split,width:bb.width,height:bb.height-split}).png().toBuffer();
  const sock=await sharp(sockRaw).resize(pw,ph-cuff,{fit:'fill'}).png().toBuffer();
  let placed=await sharp({create:{width:meta.canvas[0],height:meta.canvas[1],channels:4,background:'#00000000'}}).composite([{input:top,left:px-Math.round(shear*cuff),top:py},{input:sock,left:px,top:py+cuff}]).png().toBuffer();
  // Match the approved six spot inks, preserving every alpha pixel and contour.
  const inkPixels=await sharp(placed).ensureAlpha().raw().toBuffer();
  const inks=['6A9F35','31572C','FFF0CF','E9B83E','C84A36','20231D'].map(h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)));
  for(let k=0;k<inkPixels.length;k+=4){if(!inkPixels[k+3])continue;let best=0,dist=Infinity;for(let j=0;j<inks.length;j++){const d=inks[j].reduce((a,c,i)=>a+(c-inkPixels[k+i])**2,0);if(d<dist){dist=d;best=j;}}for(let c=0;c<3;c++)inkPixels[k+c]=inks[best][c];}
  placed=await sharp(inkPixels,{raw:{width:meta.canvas[0],height:meta.canvas[1],channels:4}}).png().toBuffer();
  fs.writeFileSync(work+'/'+role+'-'+side+'-leg-full.png',placed);
  for(const l of meta.layers.filter(l=>l.name.startsWith(side+'_leg_')&&!l.name.includes('_2_foot'))){
   l.y=l.name.includes('_0_thigh')?py:py+cuff-65;l.h=l.name.includes('_0_thigh')?cuff+30:ph-cuff+65;
   const band=await sharp(placed).extract({left:0,top:l.y,width:meta.canvas[0],height:l.h}).png().toBuffer();
   const pb=await bounds(band,128);l.x=Math.max(0,pb.left-2);l.w=Math.min(meta.canvas[0]-l.x,pb.width+4);
   await sharp(placed).extract({left:l.x,top:l.y,width:l.w,height:l.h}).png().toFile(app+'/design/source/'+role+'/'+l.file);
  }
 }
 fs.writeFileSync(app+'/design/source/'+role+'/layers.json',JSON.stringify(meta,null,2)+'\n');
}
for(const [side,w,h] of [['L',179,240],['R',163,254]]){
 const file=work+'/raw/raised-arm-'+side+'.png',bb=await bounds(file);
 await sharp(file).extract(bb).resize(w,h,{fit:'fill'}).png().toFile(app+'/design/source/production_v2/cast/raised_arm_'+side+'.png');
}
for(const [role,key] of [['mg','pickleBoss'],['fg','picklePepper']]){
 const meta=JSON.parse(fs.readFileSync(app+'/design/source/'+role+'/layers.json'));
 meta.layers.find(l=>l.name==='torso_0_trunk').z=18;
 for(const side of ['left','right']){const t=meta.layers.find(l=>l.name===side+'_leg_0_thigh'),c=meta.layers.find(l=>l.name===side+'_leg_1_calf');t.z=side==='left'?10:14;c.z=t.z+1;} 
 fs.writeFileSync(app+'/design/source/'+role+'/layers.json',JSON.stringify(meta,null,2)+'\n');
 const rig=JSON.parse(fs.readFileSync(work+'/before/'+key+'/cast.json'));
 const torso=rig.slots.find(s=>s.name==='torso_0_trunk');
 rig.slots=rig.slots.filter(s=>s!==torso);
 const lastLeg=Math.max(...rig.slots.map((s,i)=>s.name.includes('_leg_')?i:-1));
 rig.slots.splice(lastLeg+1,0,torso);

 fs.writeFileSync(app+'/static/assets/spines/'+key+'/cast.json',JSON.stringify(rig));
 const originalMeta=JSON.parse(fs.readFileSync(work+'/before/'+role+'/layers.json'));
 const matrices=[];
 for(const bone of rig.bones){
  const parent=bone.parent?matrices[rig.bones.findIndex(n=>n.name===bone.parent)]:{a:1,b:0,c:0,d:1};
  const angle=(bone.rotation||0)*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle);
  matrices.push({a:parent.a*c+parent.b*sn,b:-parent.a*sn+parent.b*c,c:parent.c*c+parent.d*sn,d:-parent.c*sn+parent.d*c});
 }
 for(const l of meta.layers){
  const old=originalMeta.layers.find(v=>v.name===l.name),at=rig.skins[0].attachments[l.name][l.name];
  if(l.x===old.x&&l.w===old.w&&l.y===old.y&&l.h===old.h)continue;
  if(at.type==='mesh'){
   let k=0;
   for(let v=0;v<at.uvs.length/2;v++){
    const dx=l.x-old.x+at.uvs[v*2]*(l.w-old.w),dy=-(l.y-old.y+at.uvs[v*2+1]*(l.h-old.h)),n=at.vertices[k++];
    for(let j=0;j<n;j++){
     const m=matrices[at.vertices[k]],det=m.a*m.d-m.b*m.c;
     at.vertices[k+1]=+(at.vertices[k+1]+(m.d*dx-m.b*dy)/det).toFixed(4);
     at.vertices[k+2]=+(at.vertices[k+2]+(-m.c*dx+m.a*dy)/det).toFixed(4);k+=4;
    }
   }
  }else {at.x+=(l.x-old.x)+(l.w-old.w)/2;at.y-=(l.y-old.y)+(l.h-old.h)/2;}
  at.width=l.w;at.height=l.h;
 }
 fs.writeFileSync(app+'/static/assets/spines/'+key+'/cast.json',JSON.stringify(rig));
 const oldAtlas=fs.readFileSync(work+'/before/'+key+'/cast.atlas','utf8'),oldPage=work+'/before/'+key+'/cast.png';
 const prop=oldAtlas.match(/sack\nbounds:(\d+),(\d+),(\d+),(\d+)/).slice(1).map(Number);
 const regions=[{name:'sack',buffer:await sharp(oldPage).extract({left:prop[0],top:prop[1],width:prop[2],height:prop[3]}).png().toBuffer(),w:prop[2],h:prop[3]}];
 for(const l of meta.layers)regions.push({name:l.name,buffer:fs.readFileSync(app+'/design/source/'+role+'/'+l.file),w:l.w,h:l.h});
 if(role==='mg')for(const side of ['L','R']){const buffer=fs.readFileSync(app+'/design/source/production_v2/cast/raised_arm_'+side+'.png'),m=await sharp(buffer).metadata();regions.push({name:'v2_raise_'+side,buffer,w:m.width,h:m.height});}
 let rx=2,ry=2,row=0;
 for(const r of regions){if(rx+r.w+2>1024){rx=2;ry+=row+2;row=0;}r.x=rx;r.y=ry;rx+=r.w+2;row=Math.max(row,r.h);}
 const height=ry+row+2;
 await sharp({create:{width:1024,height,channels:4,background:'#00000000'}}).composite(regions.map(r=>({input:r.buffer,left:r.x,top:r.y}))).png().toFile(app+'/static/assets/spines/'+key+'/cast.png');
 fs.writeFileSync(app+'/static/assets/spines/'+key+'/cast.atlas',`cast.png\nsize:1024,${height}\nformat:RGBA8888\nfilter:MipMapLinearLinear,Linear\nrepeat:none\n`+regions.map(r=>`${r.name}\nbounds:${r.x},${r.y},${r.w},${r.h}\noffsets:0,0,${r.w},${r.h}\nindex:-1\n`).join(''));
 const assembled=await sharp({create:{width:meta.canvas[0],height:meta.canvas[1],channels:4,background:'#00000000'}}).composite([...meta.layers].sort((a,b)=>a.z-b.z).map(l=>({input:app+'/design/source/'+role+'/'+l.file,left:l.x,top:l.y}))).png().toBuffer();
 fs.writeFileSync(work+'/'+role+'-assembled.png',assembled);
}
console.log('Source and atlas updated; bones, weights and motion unchanged; leg crop/mesh registration synchronized; legs ordered behind apron.');

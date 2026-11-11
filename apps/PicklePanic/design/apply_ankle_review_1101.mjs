// Repair the existing #7 rig, never alter its bone motions. The ankle is one
// continuous calf/sock/shoe image and weighted mesh, not two sliding cutouts.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const app=path.resolve(import.meta.dirname,'..'),work=app+'/design/source/review_1101_ankles';
const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
async function bounds(input){const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=-1,y1=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}}
for(const [role,key] of [['mg','pickleBoss'],['fg','picklePepper']]){
 const folder=app+'/design/source/'+role,meta=JSON.parse(fs.readFileSync(work+'/before/'+role+'/layers.json'));
 const rig=JSON.parse(fs.readFileSync(work+'/before/'+key+'/cast.json'));
 const source=work+'/'+role+'-lower-leg-sheet.png',dims=await sharp(source).metadata();
 const root=JSON.parse(fs.readFileSync(folder+'/rig.json')).root;
 const matrices=[];
 for(const b of rig.bones){const p=b.parent?matrices[rig.bones.findIndex(v=>v.name===b.parent)]:{a:1,b:0,c:0,d:1,tx:0,ty:0};const angle=(b.rotation||0)*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),sx=b.scaleX??1,sy=b.scaleY??1;matrices.push({a:(p.a*co+p.b*si)*sx,b:(-p.a*si+p.b*co)*sy,c:(p.c*co+p.d*si)*sx,d:(-p.c*si+p.d*co)*sy,tx:p.a*(b.x||0)+p.b*(b.y||0)+p.tx,ty:p.c*(b.x||0)+p.d*(b.y||0)+p.ty})}
 for(const [i,side] of ['left','right'].entries()){
  const layer=meta.layers.find(v=>v.name===side+'_leg_1_calf'),foot=side+'_leg_2_foot';
  const half=await sharp(source).extract({left:i*Math.floor(dims.width/2),top:0,width:Math.floor(dims.width/2),height:dims.height}).png().toBuffer();const bb=await bounds(half);
  const pic=await sharp(half).extract(bb).png().toBuffer();
  const raw=await sharp(pic).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Measure the connected sock immediately above the collar in the SOURCE,
  // and align it with the actual calf's ankle, not the old clipped shoe box.
  let sx=0,n=0;for(let y=Math.round(bb.height*.47);y<bb.height*.56;y++)for(let x=0;x<bb.width;x++){const k=(y*bb.width+x)*4;if(raw.data[k]>190&&raw.data[k+1]>165&&raw.data[k+2]>110&&raw.data[k+3]>=128){sx+=x;n++}}
  if(!n)throw Error('Cannot locate source sock '+role+side);
  const w=role==='mg'?(i?185:211):(i?155:162),h=310,ankleX=role==='mg'?(i?380:220):(i?372:218);
  layer.x=Math.round(ankleX-(sx/n)/bb.width*w);layer.y=575;layer.w=w;layer.h=h;layer.file=side+'_leg_1_calf_foot.png';layer.z=i?15:11;
  let skinEnd=0,shoeStart=0;
  for(let y=Math.round(bb.height*.2);y<bb.height*.65;y++){let cream=0,shoe=0;for(let x=0;x<bb.width;x++){const k=(y*bb.width+x)*4;if(raw.data[k+3]<128)continue;if(raw.data[k]>190&&raw.data[k+1]>165&&raw.data[k+2]>110)cream++;if(role==='mg'?(raw.data[k]>170&&raw.data[k+1]>110&&raw.data[k+2]<100):(raw.data[k]>140&&raw.data[k+1]<130&&raw.data[k+2]<100))shoe++;}if(!skinEnd&&cream>bb.width*.035)skinEnd=y;if(skinEnd&&!shoeStart&&shoe>bb.width*.035){shoeStart=y;break;}}
  if(!skinEnd||shoeStart<=skinEnd)throw Error('Unresolved anatomical bands '+role+side);
  const bands=[];for(const [top,height,target,left] of [[0,skinEnd,140,0],[skinEnd,shoeStart-skinEnd,50,140],[shoeStart,bb.height-shoeStart,120,190]])bands.push({input:await sharp(pic).extract({left:0,top,width:bb.width,height}).resize(w,target,{fit:'fill'}).png().toBuffer(),left:0,top:left});
  const pixels=await sharp({create:{width:w,height:h,channels:4,background:'#00000000'}}).composite(bands).ensureAlpha().raw().toBuffer();
  const inks=['6A9F35','31572C','FFF0CF','E9B83E','C84A36','20231D'].map(s=>[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)));
  for(let k=0;k<pixels.length;k+=4){if(!pixels[k+3])continue;let best=0,dist=Infinity;for(let q=0;q<inks.length;q++){const d=inks[q].reduce((s,c,j)=>s+(c-pixels[k+j])**2,0);if(d<dist){best=q;dist=d}}for(let j=0;j<3;j++)pixels[k+j]=inks[best][j]}
  await sharp(pixels,{raw:{width:w,height:h,channels:4}}).png().toFile(folder+'/'+layer.file);
  // Reuse the existing mesh's UV grid, hull and triangles; regenerate rest
  // coordinates and weights through the complete anatomical ankle.
  const template=rig.skins[0].attachments[side+'_arm_0_upper_arm'][side+'_arm_0_upper_arm'];
  const attachment={type:'mesh',uvs:[...template.uvs],triangles:[...template.triangles],hull:template.hull},vertices=[];
  rig.skins[0].attachments[layer.name][layer.name]=attachment;
  const names=['hip',i?'legR':'legL',i?'legR_calf':'legL_calf',i?'legR_foot':'legL_foot'];
  for(let j=0;j<attachment.uvs.length;j+=2){const x=layer.x+attachment.uvs[j]*w,y=layer.y+attachment.uvs[j+1]*h,onLeg=smooth((y-575)/65),lower=smooth((y-650)/65),onFoot=smooth((y-735)/65);const weights=[1-onLeg,onLeg*(1-lower),onLeg*lower*(1-onFoot),onLeg*lower*onFoot],entries=weights.map((weight,k)=>({weight,index:rig.bones.findIndex(b=>b.name===names[k])})).filter(v=>v.weight>1e-7);const total=entries.reduce((s,v)=>s+v.weight,0);vertices.push(entries.length);
   for(const v of entries){const m=matrices[v.index],det=m.a*m.d-m.b*m.c,dx=x-root[0]-m.tx,dy=root[1]-y-m.ty;vertices.push(v.index,+((m.d*dx-m.b*dy)/det).toFixed(5),+((-m.c*dx+m.a*dy)/det).toFixed(5),+(v.weight/total).toFixed(8))}
  }
  attachment.vertices=vertices;attachment.width=w;attachment.height=h;
  delete rig.slots.find(v=>v.name===foot).attachment;delete rig.skins[0].attachments[foot];
  const thigh=side+'_leg_0_thigh';delete rig.slots.find(v=>v.name===thigh).attachment;delete rig.skins[0].attachments[thigh];
  meta.layers=meta.layers.filter(v=>v.name!==foot&&v.name!==thigh);
 }
 for(const f of ['bones','animations','physics'])if(JSON.stringify(rig[f])!==JSON.stringify(JSON.parse(fs.readFileSync(work+'/before/'+key+'/cast.json'))[f]))throw Error('Motion changed '+f);
 meta.revision='2026-11-01 connected calf/sock/shoe; old foot layers retired';
 fs.writeFileSync(folder+'/layers.json',JSON.stringify(meta,null,2)+'\n');
 // Retain unchanged accessories and raised arms exactly from the v13 atlas.
 const oldAtlas=fs.readFileSync(work+'/before/'+key+'/cast.atlas','utf8'),oldPage=work+'/before/'+key+'/cast.png';
 const records=[...oldAtlas.matchAll(/([^\n]+)\nbounds:(\d+),(\d+),(\d+),(\d+)/g)];
 const regions=[];
 for(const l of meta.layers)regions.push({name:l.name,buffer:fs.readFileSync(folder+'/'+l.file),w:l.w,h:l.h});
 const before=JSON.parse(fs.readFileSync(work+'/before/'+role+'/layers.json'));
 for(const [_,name,x,y,w,h] of records){if(before.layers.some(l=>l.name===name))continue;regions.push({name,w:+w,h:+h,buffer:await sharp(oldPage).extract({left:+x,top:+y,width:+w,height:+h}).png().toBuffer()})}
 let x=2,y=2,row=0;for(const r of regions){if(x+r.w+2>1024){x=2;y+=row+2;row=0}r.x=x;r.y=y;x+=r.w+2;row=Math.max(row,r.h)}
 const height=y+row+2;await sharp({create:{width:1024,height,channels:4,background:'#00000000'}}).composite(regions.map(r=>({input:r.buffer,left:r.x,top:r.y}))).png().toFile(app+'/static/assets/spines/'+key+'/cast.png');
 fs.writeFileSync(app+'/static/assets/spines/'+key+'/cast.atlas',`cast.png\nsize:1024,${height}\nformat:RGBA8888\nfilter:MipMapLinearLinear,Linear\nrepeat:none\n`+regions.map(r=>`${r.name}\nbounds:${r.x},${r.y},${r.w},${r.h}\noffsets:0,0,${r.w},${r.h}\nindex:-1\n`).join(''));
 fs.writeFileSync(app+'/static/assets/spines/'+key+'/cast.json',JSON.stringify(rig));
 await sharp({create:{width:meta.canvas[0],height:meta.canvas[1],channels:4,background:'#00000000'}}).composite([...meta.layers].sort((a,b)=>a.z-b.z).map(l=>({input:folder+'/'+l.file,left:l.x,top:l.y}))).png().toFile(work+'/'+role+'-assembled.png');
 console.log(role,'continuous ankle meshes exported; original bone/animation/physics preserved');
}

// Register generated replacement parts; retain every bone, weight and animation.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = require('sharp');
const app = path.resolve(import.meta.dirname, '..');
const work = path.join(app, 'design/source/review_1021');
const before = rel => path.join(work, 'before', rel);
const dest = rel => path.join(app, rel);
const blank = (width, height) => sharp({create:{width,height,channels:4,background:'#00000000'}});
const meta = JSON.parse(fs.readFileSync(before('design/source/fg/layers.json')));
const original = JSON.parse(JSON.stringify(meta));
const names = ['torso_0_trunk','left_arm_0_upper_arm','right_arm_0_upper_arm',
  'left_arm_2_hand','right_arm_2_hand','left_leg_0_thigh','right_leg_0_thigh',
  'left_leg_1_calf','right_leg_1_calf'];
const sheet = await sharp(path.join(work,'raw/parts.png')).resize(1200,1200).png().toBuffer();
async function bounds(buffer) {
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8){
    x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);
  }
  return {left:x0,top:y0,width:x1-x0,height:y1-y0};
}
for (const [i,name] of names.entries()) {
  const l=meta.layers.find(l=>l.name===name);
  const tile=await sharp(sheet).extract({left:i%3*400,top:Math.floor(i/3)*400,width:400,height:400}).png().toBuffer();
  const b=await bounds(tile);
  const width=name.includes('trunk')?260:Math.round(l.w*(name.includes('arm')?1.35:1.2));
  // Torso's former crop contained transparent arm underlay. Its new crop is
  // centred over the measured chest, rather than that obsolete crop centre.
  l.x=name.includes('trunk')?155:name.includes('arm')?(name.startsWith('left_')?l.x-(width-l.w):l.x):l.x-Math.round((width-l.w)/2);
  l.w=width;
  let data=await sharp(tile).extract(b).resize(l.w,l.h,{fit:'fill'}).png().toBuffer();
  if(name.includes('trunk')){
    // Register the vest/apron around the unchanged torso centre. The apron
    // flares below the hands, rather than painting a second forearm behind them.
    const profile=[[0,72],[40,130],[80,174],[140,174],[180,174],[220,190],[240,194],[280,196],[320,206],[340,230],[360,260]];
    const paint=await sharp(data).ensureAlpha().raw().toBuffer();
    const out=Buffer.alloc(paint.length);
    for(let yy=0;yy<l.h;yy++){
      let pl=l.w,ph=-1;
      for(let xx=0;xx<l.w;xx++)if(paint[(yy*l.w+xx)*4+3]>8){pl=Math.min(pl,xx);ph=Math.max(ph,xx);}
      if(ph<pl)continue;
      const next=profile.findIndex(p=>p[0]>=yy),p1=profile[Math.max(0,next-1)],p2=profile[next<0?profile.length-1:next];
      const width=p1[1]+(p2[1]-p1[1])*(yy-p1[0])/Math.max(1,p2[0]-p1[0]);
      const left=283-l.x-width/2;
      for(let xx=Math.max(0,Math.ceil(left));xx<Math.min(l.w,left+width);xx++){
        const sx=Math.min(ph,Math.max(pl,Math.round(pl+(xx-left)/width*(ph-pl))));
        paint.copy(out,(yy*l.w+xx)*4,(yy*l.w+sx)*4,(yy*l.w+sx)*4+4);
      }
    }
    data=await sharp(out,{raw:{width:l.w,height:l.h,channels:4}}).png().toBuffer();
  }
  if(!name.includes('trunk')){
    // Register each row to the existing limb centreline. A simple rectangle
    // resize drifts the elbow/shoulder silhouette on these diagonal pieces.
    const old=original.layers.find(o=>o.name===name);
    const ref=await sharp(before('design/source/fg/'+l.file)).ensureAlpha().raw().toBuffer();
    // Ignore disconnected apron crumbs retained in the old cutout. They must
    // not pull a hand's scanline towards an unrelated island of cream fabric.
    const visited=new Uint8Array(old.w*old.h);let largest=[];
    for(let q=0;q<visited.length;q++){
      if(visited[q]||ref[q*4+3]<=8)continue;
      const queue=[q];visited[q]=1;
      for(let h=0;h<queue.length;h++){
        const t=queue[h],x=t%old.w,y=Math.floor(t/old.w);
        for(const n of [x?t-1:-1,x+1<old.w?t+1:-1,y?t-old.w:-1,y+1<old.h?t+old.w:-1])
          if(n>=0&&!visited[n]&&ref[n*4+3]>8){visited[n]=1;queue.push(n);}
      }
      if(queue.length>largest.length)largest=queue;
    }
    const main=new Uint8Array(visited.length);for(const q of largest)main[q]=1;
    const paint=await sharp(data).ensureAlpha().raw().toBuffer();
    const registered=Buffer.alloc(l.w*l.h*4);
    for(let yy=0;yy<l.h;yy++){
      let lo=old.w,hi=-1,pl=l.w,ph=-1;
      for(let xx=0;xx<old.w;xx++)if(main[yy*old.w+xx]){lo=Math.min(lo,xx);hi=Math.max(hi,xx);}
      for(let xx=0;xx<l.w;xx++)if(paint[(yy*l.w+xx)*4+3]>8){pl=Math.min(pl,xx);ph=Math.max(ph,xx);}
      if(hi<lo||ph<pl)continue;
      const ramp=name.includes('_0_upper_arm')?Math.min(1,Math.max(0,(yy-24)/24)):1;
      const half=name.includes('arm')?(hi-lo+1+old.w*.35*ramp)/2:(hi-lo+1)*1.2/2;
      // Arms grow away from the body; their original inner contour and all
      // skeleton pivots remain fixed, so a fuller apron cannot become underlay.
      const mid=name.includes('arm')
        ? name.startsWith('left_')?old.x+hi-l.x-half:old.x+lo-l.x+half
        :old.x+(lo+hi)/2-l.x;
      for(let xx=Math.max(0,Math.ceil(mid-half));xx<=Math.min(l.w-1,Math.floor(mid+half));xx++){
        const sx=Math.min(ph,Math.max(pl,Math.round(pl+(xx-mid+half)/(2*half)*(ph-pl))));
        paint.copy(registered,(yy*l.w+xx)*4,(yy*l.w+sx)*4,(yy*l.w+sx)*4+4);
      }
    }
    if(name.includes('_0_upper_arm')){
      for(let yy=0;yy<24;yy++)for(let xx=0;xx<old.w;xx++){
        const tx=old.x+xx-l.x;
        if(tx>=0&&tx<l.w)ref.copy(registered,(yy*l.w+tx)*4,(yy*old.w+xx)*4,(yy*old.w+xx)*4+4);
      }
    }
    if(name.includes('leg'))for(let k=0;k<registered.length;k+=4){
      // The historical thigh crop contained a brown apron/background crumb.
      // This is cutout cleanup, not an additional ink on the green character.
      if(registered[k]>registered[k+1]*1.15&&registered[k]>24)registered[k+3]=0;
    }
    const exporter=sharp(registered,{raw:{width:l.w,height:l.h,channels:4}});
    data=await exporter.png(name==='right_arm_0_upper_arm'||name.includes('_0_thigh')?{palette:true,colours:12,dither:0}:{}).toBuffer();
  }
  fs.writeFileSync(dest('design/source/fg/'+l.file),data);
}
fs.writeFileSync(dest('design/source/fg/layers.json'),JSON.stringify(meta,null,2)+'\n');

// Repack the page, including the unchanged prop, head and shoes.
const atlasDir='static/assets/spines/picklePepper/';
const oldPage=await sharp(before(atlasDir+'cast.png')).png().toBuffer();
const regions=[{name:'sack',buffer:await sharp(oldPage).extract({left:2,top:2,width:512,height:512}).png().toBuffer(),w:512,h:512}];
for(const l of meta.layers)regions.push({name:l.name,buffer:fs.readFileSync(dest('design/source/fg/'+l.file)),w:l.w,h:l.h});
let x=2,y=2,row=0;
for(const r of regions){if(x+r.w+2>1024){x=2;y+=row+2;row=0;}r.x=x;r.y=y;x+=r.w+2;row=Math.max(row,r.h);}
const height=y+row+2;
await blank(1024,height).composite(regions.map(r=>({input:r.buffer,left:r.x,top:r.y}))).png().toFile(dest(atlasDir+'cast.png'));
fs.writeFileSync(dest(atlasDir+'cast.atlas'),`cast.png\nsize:1024,${height}\nformat:RGBA8888\nfilter:MipMapLinearLinear,Linear\nrepeat:none\n`+
  regions.map(r=>`${r.name}\nbounds:${r.x},${r.y},${r.w},${r.h}\noffsets:0,0,${r.w},${r.h}\nindex:-1\n`).join(''));
const rig=JSON.parse(fs.readFileSync(before(atlasDir+'cast.json')));
const matrices=[];
for(const b of rig.bones){
  const p=b.parent?matrices[rig.bones.findIndex(n=>n.name===b.parent)]:{a:1,b:0,c:0,d:1};
  const angle=(b.rotation||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  matrices.push({a:p.a*c+p.b*s,b:-p.a*s+p.b*c,c:p.c*c+p.d*s,d:-p.c*s+p.d*c});
}
for(const name of names){
  const old=original.layers.find(l=>l.name===name),l=meta.layers.find(l=>l.name===name);
  const a=rig.skins[0].attachments[name][name];
  if(a.type!=='mesh'){
    a.x+=(l.x-old.x)+(l.w-old.w)/2;
    a.width=l.w;a.height=l.h;
    continue;
  }
  let k=0;
  for(let v=0;v<a.uvs.length/2;v++){
    const dx=l.x-old.x+a.uvs[v*2]*(l.w-old.w);
    const n=a.vertices[k++];
    for(let j=0;j<n;j++){
      const m=matrices[a.vertices[k]],det=m.a*m.d-m.b*m.c;
      a.vertices[k+1]=+(a.vertices[k+1]+m.d*dx/det).toFixed(4);
      a.vertices[k+2]=+(a.vertices[k+2]-m.c*dx/det).toFixed(4);
      k+=4;
    }
  }
  a.width=l.w;a.height=l.h;
}
fs.writeFileSync(dest(atlasDir+'cast.json'),JSON.stringify(rig));
const assembled=await blank(...meta.canvas).composite([...meta.layers].sort((a,b)=>a.z-b.z).map(l=>({input:dest('design/source/fg/'+l.file),left:l.x,top:l.y}))).png().toBuffer();
fs.writeFileSync(path.join(work,'fg_registered.png'),assembled);
// Cards and cover use the exact same new layered character, so proportions
// cannot drift between the game and the store illustrations.
const bb=await bounds(assembled),cut=await sharp(assembled).extract(bb).png().toBuffer();
const hero=await sharp(cut).resize({width:192,height:412,fit:'inside'}).png().toBuffer();
const hm=await sharp(hero).metadata();
await blank(198,420).composite([{input:hero,left:Math.round((198-hm.width)/2),top:3}]).png().toFile(dest('static/assets/pickle/buy_chef.png'));
const coverOld=await sharp(before('design/cover/PicklePanic-Cover-FG.png')).raw().toBuffer({resolveWithObject:true});
for(let yy=0;yy<1080;yy++)for(let xx=1378;xx<1920;xx++)coverOld.data[(yy*1920+xx)*4+3]=0;
const coverHero=await sharp(cut).resize({height:825}).png().toBuffer(),cm=await sharp(coverHero).metadata();
const composed=await sharp(coverOld.data,{raw:coverOld.info}).composite([{input:coverHero,left:1550-Math.round(cm.width/2),top:205}]).raw().toBuffer();
for(let yy=0;yy<1080;yy++)for(let xx=0;xx<1378;xx++){
 const k=(yy*1920+xx)*4;if(coverOld.data[k+3])coverOld.data.copy(composed,k,k,k+4);
}
const cover=await sharp(composed,{raw:coverOld.info}).png().toBuffer();
fs.writeFileSync(dest('design/cover/PicklePanic-Cover-FG.png'),cover);
await sharp(dest('design/cover/PicklePanic-Cover-BG.png')).composite([{input:cover}]).png().toFile(dest('design/cover/PicklePanic-preview.png'));
// Production spot-ink separation: use the brief's actual six inks. The raw
// imagegen original remains intact alongside this deterministic print export.
const cutin=await sharp(path.join(work,'raw/cutin.png')).resize(768,768,{fit:'fill'}).ensureAlpha().raw().toBuffer();
const inks=['6A9F35','31572C','FFF0CF','E9B83E','C84A36','20231D'].map(h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)));
for(let k=0;k<cutin.length;k+=4){
 let best=0,score=Infinity;
 for(let j=0;j<inks.length;j++){
  const d=inks[j].reduce((s,c,i)=>s+(c-cutin[k+i])**2,0);
  if(d<score){score=d;best=j;}
 }
 for(let j=0;j<3;j++)cutin[k+j]=inks[best][j];
}
await sharp(cutin,{raw:{width:768,height:768,channels:4}}).png().toFile(dest('static/assets/pickle/upgrade_cutin.png'));
// Copy only the right-hand character region; plaque and boss stay pixel-exact.
if(fs.existsSync(path.join(work,'raw/max.png'))){
 const gen=await sharp(path.join(work,'raw/max.png')).resize(1600,900,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 const old=await sharp(before('static/assets/pickle/win_max_base.png')).ensureAlpha().raw().toBuffer();
 for(let yy=0;yy<900;yy++)gen.copy(old,(yy*1600+1337)*4,(yy*1600+1337)*4,(yy*1600+1600)*4);
 await sharp(old,{raw:{width:1600,height:900,channels:4}}).png().toFile(dest('static/assets/pickle/win_max_base.png'));
}
fs.writeFileSync(path.join(work,'registration.json'),JSON.stringify({layers:meta.layers,regions:regions.map(({buffer,...r})=>r),bonesUnchanged:JSON.stringify(rig.bones)===JSON.stringify(JSON.parse(fs.readFileSync(before(atlasDir+'cast.json'))).bones)},null,2));
console.log('Registered nine generated parts, weighted meshes, cards, cut-in and cover.');

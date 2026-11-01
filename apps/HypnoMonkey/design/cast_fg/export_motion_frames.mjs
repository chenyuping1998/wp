/** Actual final JSON evaluated by official Spine 4.3, including app-specific slots. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
import {parseSkeleton} from '/Users/stone/tools/spine-generator/src/spineJson.ts';import {decodePngAlpha} from '/Users/stone/tools/spine-generator/src/png.ts';
const req=createRequire('/Users/stone/tools/spine-generator/package.json');const{Skeleton,Physics,AnimationState,AnimationStateData}=req('@esotericsoftware/spine-core');
const D=path.dirname(fileURLToPath(import.meta.url));const json=JSON.parse(fs.readFileSync(path.join(D,'cast_fg_spine/cast_fg.json'),'utf8'));const data=parseSkeleton(json),sk=new Skeleton(data),sd=new AnimationStateData(data);sd.defaultMix=.12;const state=new AnimationState(sd);
const skin=json.skins[0].attachments;const boxes=new Map();
for(const name of fs.readdirSync(path.join(D,'layers')).filter(f=>f.endsWith('.png'))){const a=decodePngAlpha(fs.readFileSync(path.join(D,'layers',name)));let x0=a.width,y0=a.height,x1=0,y1=0;for(let y=0;y<a.height;y+=2)for(let x=0;x<a.width;x+=2)if(a.data[y*a.width+x]>64){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}boxes.set(name.replace('.png',''),[x0,y0,x1,y1]);}
let X0=Infinity,Y0=Infinity,X1=-Infinity,Y1=-Infinity;const raw=[],FPS=25,segments=[];
for(const anim of data.animations){
 const start=raw.length;state.setAnimation(0,anim.name,['idle','win_big_loop'].includes(anim.name));const duration=anim.name==='win_big_loop'?anim.duration*2:anim.duration;
 for(let i=0;i<=Math.ceil(duration*FPS);i++){
  if(i){state.update(1/FPS);sk.update(1/FPS);}sk.setupPose();state.apply(sk);sk.updateWorldTransform(Physics.none);
  const current=state.tracks[0],t=current.loop?current.trackTime%anim.duration:Math.min(current.trackTime,anim.duration),keys=json.animations[anim.name]?.slots??{},slots=[];
  for(const slot of json.slots){let live=slot.attachment;for(const key of keys[slot.name]?.attachment??[])if((key.time??0)<=t+1e-6)live=key.name??null;if(!live)continue;const att=skin[slot.name]?.[live];if(!att||!boxes.has(live))continue;const p=sk.findBone(slot.bone).getAppliedPose(),r=(att.rotation??0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r);const a=p.a*c+p.b*s,b=-p.a*s+p.b*c,c1=p.c*c+p.d*s,d=-p.c*s+p.d*c,qx=p.worldX+p.a*(att.x??0)+p.b*(att.y??0),qy=p.worldY+p.c*(att.x??0)+p.d*(att.y??0),ex=qx-a*att.width/2+b*att.height/2,ey=qy-c1*att.width/2+d*att.height/2;const m=[a,b,c1,d,ex,ey];if(!m.every(Number.isFinite))throw new Error('Nonfinite transform');slots.push([live,m]);const[x0,y0,x1,y1]=boxes.get(live);for(const[x,y]of[[x0,y0],[x1,y0],[x0,y1],[x1,y1]]){const xx=ex+a*x-b*y,yy=ey+c1*x-d*y;X0=Math.min(X0,xx);X1=Math.max(X1,xx);Y0=Math.min(Y0,yy);Y1=Math.max(Y1,yy);}}
  raw.push({label:anim.name,time:t,slots});
 }
 segments.push({label:anim.name,start,end:raw.length-1});
 // Include real 120ms animation-state recovery into idle after every action.
 if(!['idle','win_big','win_big_loop'].includes(anim.name)){state.setAnimation(0,'idle',true);for(let i=0;i<4;i++){state.update(1/FPS);sk.update(1/FPS);state.apply(sk);sk.updateWorldTransform(Physics.none);}}
}
const height=720,pad=35;Y0=Math.min(Y0,-30);const scale=(height-pad*2)/(Y1-Y0),width=Math.ceil(((X1-X0)*scale+pad*2)/2)*2;
const frames=raw.map(f=>({label:f.label,time:f.time,slots:f.slots.map(([n,[a,b,c,d,e,f]])=>[n,[a*scale,-b*scale,-c*scale,d*scale,pad+(e-X0)*scale,pad+(Y1-f)*scale]])}));
fs.writeFileSync(path.join(D,'qa/motion-frames.json'),JSON.stringify({width,height,fps:FPS,frames,segments,worldBounds:{X0,X1,Y0,Y1},source:'Final cast_fg.json, actual Spine 4.3 AnimationState, all ten actions and two cheer loops'}));console.log(`${frames.length} frames, ${segments.length} actions; fixed ${width}x${height} camera; final JSON evaluated.`);

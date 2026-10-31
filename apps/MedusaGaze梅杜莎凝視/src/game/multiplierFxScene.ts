import { Container, Graphics, Mesh, MeshGeometry,Sprite,ColorMatrixFilter,type Texture } from 'pixi.js';
import { gazePose,eyeRadianceRays,ORB_CHARGE_DISTANCE,orbColor,orbWakePoint,releaseAccent, type OrbVisual, type Point } from './multiplierPerformance';
import { impactMotePose } from './presentationMotion';
import { drawImpactWave } from './presentationFx';
import {orbPower} from './orbPower';
import {drawOrbMantle,drawOrbPowerImpact} from './orbPowerFx';
export type MultiplierFxState={orbs:OrbVisual[];eyes:Point[];gaze:number;gazeProgress?:number;target:Point;transfer:number;plate:Point;score:Point};
type Burst=Point&{age:number;value:number;color:number;strength:number;frame:'score'|'plate'|'orb'};
type Shard={mesh:Mesh;geometry:MeshGeometry;x:number;y:number;vx:number;vy:number;spin:number;age:number;life:number};
export function createMultiplierFxScene(textures:{green:Texture;purple:Texture;gold:Texture;glow?:Texture}){
 const root=new Container(),trails=new Graphics(),eyes=new Graphics(),flashes=new Graphics(),pieces=new Container(),bloom=new Container(),eyeSurface=new Graphics(),flightBloom=new Container();root.eventMode='none';root.label='Medusa multiplier / emerald radiance, charge, flight and impact';root.addChild(trails,eyes,flashes,pieces,bloom,eyeSurface,flightBloom);
 const flightGlows=new Map<number,Sprite>();
 const halos=textures.glow?Array.from({length:3},()=>{const halo=new Sprite(textures.glow);halo.anchor.set(.5);halo.tint=0x4bff7b;halo.blendMode='add';halo.alpha=0;bloom.addChild(halo);return halo;}):[];
 // Shader compilation needs a browser GL context; Node replays geometry only.
 const stoneMaterial=typeof document==='undefined'?undefined:new ColorMatrixFilter();stoneMaterial?.saturate(-1);pieces.filters=stoneMaterial?[stoneMaterial]:[];
 trails.blendMode='add';eyes.blendMode='add';flashes.blendMode='add';
 let state:MultiplierFxState={orbs:[],eyes:[],gaze:0,target:{x:0,y:0},transfer:0,plate:{x:0,y:0},score:{x:0,y:0}},time=0,reduced=false,disposed=false;let bursts:Burst[]=[],shards:Shard[]=[];
 function draw(){
  trails.clear();eyes.clear();flashes.clear();eyeSurface.clear();for(const halo of halos)halo.alpha=0;if(reduced)return;
  const liveIds=new Set(state.orbs.filter(orb=>orb.alpha>.001&&orb.stone===0).map(orb=>orb.id));
  for(const [id,glow] of flightGlows)if(!liveIds.has(id)){glow.destroy();flightGlows.delete(id);}
  for(const orb of state.orbs){
   if(orb.stone>0)continue;const color=orbColor(orb.value),power=orbPower(orb.value);
   if(textures.glow&&orb.alpha>.001){let glow=flightGlows.get(orb.id);if(!glow){glow=new Sprite(textures.glow);glow.anchor.set(.5);glow.blendMode='add';flightBloom.addChild(glow);flightGlows.set(orb.id,glow);}
    glow.tint=color;glow.position.set(orb.x-Math.cos(orb.angle)*(orb.charging?0:10),orb.y-Math.sin(orb.angle)*(orb.charging?0:10));glow.rotation=orb.angle;
    glow.width=(orb.charging?106:150)*orb.scale*power.corona;glow.height=(orb.charging?106:96)*orb.scale*power.corona;glow.alpha=(orb.charging?.16+.17*power.energy:.2+.21*power.energy)*orb.alpha;
   }
   drawOrbMantle(trails,orb.x,orb.y,orb.value,orb.scale,orb.charging?orb.chargeProgress??0:orb.flightProgress??1,orb.alpha,!!orb.charging);
   for(let i=orb.trail.length-1;i>0;i--){const a=orb.trail[i],b=orb.trail[i-1],fade=(1-i/orb.trail.length)*orb.alpha;
    if(Math.hypot(a.x-b.x,a.y-b.y)<.1)continue;
    trails.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:(3+16*fade)*(.8+.7*power.energy),color,alpha:(.13+.16*power.energy)*fade});
    trails.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:(1+4*fade)*(.8+.35*power.energy),color:0xfff9d4,alpha:(.4+.25*power.energy)*fade});
   }
   if(!orb.charging&&orb.trail.length>1){
    const progress=orb.flightProgress??1;
    if(progress<.28){const accent=releaseAccent(progress),origin=orb.trail[orb.trail.length-1],angle=orb.angle,ca=Math.cos(angle),sa=Math.sin(angle);
     // A pressure ring opens across the launch axis, anchored at release.
     for(let segment=0;segment<=24;segment++){const a=segment*Math.PI/12,x=Math.cos(a)*accent.radius*accent.stretch*power.corona,y=Math.sin(a)*accent.radius*power.corona,px=origin.x+ca*x-sa*y,py=origin.y+sa*x+ca*y;if(segment===0)trails.moveTo(px,py);else trails.lineTo(px,py);}
     trails.stroke({width:1.5+accent.alpha,color:0xf3ffd8,alpha:accent.alpha*.72*orb.alpha});
     for(let petal=0;petal<power.petals;petal++){const a=angle+Math.PI*.5+petal*Math.PI*2/power.petals,r=accent.radius*.65*power.corona,L=(12+accent.radius*.24)*power.corona;
      trails.moveTo(origin.x+Math.cos(a)*r,origin.y+Math.sin(a)*r).lineTo(origin.x+Math.cos(a)*(r+L),origin.y+Math.sin(a)*(r+L)).stroke({width:1.3,color,alpha:accent.alpha*.65*orb.alpha});}
     if(accent.flash>0)trails.ellipse(origin.x,origin.y,14,20).fill({color:0xfff7d2,alpha:accent.flash*.55*orb.alpha});
    }
    for(let strand=0;strand<power.wakeStrands;strand++)for(let i=1;i<orb.trail.length;i++){
     const a=orbWakePoint(orb.trail,i-1,progress,strand,power.wakeStrands),b=orbWakePoint(orb.trail,i,progress,strand,power.wakeStrands);
     if(Math.hypot(a.x-b.x,a.y-b.y)<.1)continue;
     trails.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:a.width+3,color,alpha:a.alpha*.12*orb.alpha});
     trails.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:a.width*(.8+.55*power.energy),color:strand%2?color:0xfff3c5,alpha:a.alpha*(.48+.28*power.energy)*orb.alpha});
    }
    for(let i=2;i<orb.trail.length-1;i+=3){const spark=orbWakePoint(orb.trail,i,progress+.16,i%2),tail=orb.trail[i+1],point=orb.trail[i];
     trails.circle(spark.x,spark.y,1.1+(i%2)*.5).fill({color:i%2?color:0xfffbd2,alpha:spark.alpha*orb.alpha});
     trails.moveTo(spark.x,spark.y).lineTo(spark.x+(tail.x-point.x)*.55,spark.y+(tail.y-point.y)*.55).stroke({width:.8,color,alpha:spark.alpha*.55*orb.alpha});
    }
    for(let band=0;band<2;band++){const angle=progress*8*(band?1:-1)+band*Math.PI,r=(48+band*3)*orb.scale;
     trails.moveTo(orb.x+Math.cos(angle)*r,orb.y+Math.sin(angle)*r).arc(orb.x,orb.y,r,angle,angle+1.25).stroke({width:1.1,color:band?color:0xedffd3,alpha:.48*orb.alpha});
    }
   }
   if(orb.charging){const progress=orb.chargeProgress??0,r=(12+orb.scale*23)*power.bodyScale;for(let k=0;k<3;k++){const a=progress*8+k*Math.PI*2/3,rr=r+k*4;trails.moveTo(orb.x+Math.cos(a)*rr,orb.y+Math.sin(a)*rr).arc(orb.x,orb.y,rr,a,a+1.1).stroke({width:1.2,color,alpha:.42*orb.alpha});}
    // Curved pinpricks converge from outside the painted orb; no opaque disk
    // over its multiplier numeral. The last squeeze brightens once.
    for(let k=0;k<power.motes;k++){const p=(progress*1.5+k/power.motes)%1,angle=k*Math.PI*2/power.motes-progress*3.3,rr=(40+(1-p)*38)*power.corona;
     const x=orb.x+Math.cos(angle)*rr,y=orb.y+Math.sin(angle)*rr*.72,a=Math.sin(Math.PI*p)*orb.alpha*.72;
     trails.circle(x,y,k%3===0?1.7:1).fill({color:k%2?color:0xfff9d8,alpha:a});trails.moveTo(x,y).quadraticCurveTo(orb.x+Math.cos(angle+.2)*(rr-8),orb.y+Math.sin(angle+.2)*(rr-8)*.72,orb.x+Math.cos(angle+.35)*(rr-16),orb.y+Math.sin(angle+.35)*(rr-16)*.72).stroke({width:.75,color,alpha:a*.45});}
   }
  }
  if(state.gaze>0){
   const progress=state.gazeProgress??.4,pose=gazePose(progress),strength=state.gaze;
   const center={x:state.eyes.reduce((sum,p)=>sum+p.x,0)/Math.max(1,state.eyes.length),y:state.eyes.reduce((sum,p)=>sum+p.y,0)/Math.max(1,state.eyes.length)};
   const dx=state.target.x-center.x,dy=state.target.y-center.y,length=Math.hypot(dx,dy)||1;
   const charge={x:center.x+dx/length*ORB_CHARGE_DISTANCE,y:center.y+dy/length*ORB_CHARGE_DISTANCE};
   const eyeGap=state.eyes.length>1?Math.hypot(state.eyes[1].x-state.eyes[0].x,state.eyes[1].y-state.eyes[0].y):28,eyeWidth=Math.max(3,Math.min(9,eyeGap*.25));
   state.eyes.forEach((eye,index)=>{
    const halo=halos[index];if(halo){halo.position.set(eye.x,eye.y);halo.width=38+82*pose.spread;halo.height=24+50*pose.spread;halo.alpha=.28*strength;}
    // The eyes visibly become emerald before their radiance opens outwards.
    for(let k=4;k>0;k--)eyes.ellipse(eye.x,eye.y,7+k*4,3+k*2.7).fill({color:k>2?0x43df77:0x67ff7d,alpha:(.022+(4-k)*.025)*strength});
    // Normal blending actually turns the white eye green. Additive bloom alone
    // leaves a white sclera white, so the coloured surface is a separate layer.
    eyeSurface.ellipse(eye.x,eye.y,eyeWidth,eyeWidth*.54).fill({color:0x2de85c,alpha:.96*strength});
    eyeSurface.ellipse(eye.x,eye.y,eyeWidth*.14,eyeWidth*.38).fill({color:0x0d5228,alpha:.78*strength});
    eyeSurface.circle(eye.x-eyeWidth*.25,eye.y-eyeWidth*.18,eyeWidth*.13).fill({color:0xdcffbd,alpha:.7*strength});
    // Twelve varied, short rays per eye: a local fan of light, not a laser.
    const fade=.2+.8*(1-pose.gather);
    for(const ray of eyeRadianceRays(eye,charge,progress,index)){
     const vx=ray.to.x-ray.from.x,vy=ray.to.y-ray.from.y,L=Math.hypot(vx,vy)||1,nx=-vy/L,ny=vx/L,a=ray.alpha*strength*fade;
     const mx=ray.from.x+vx*.42,my=ray.from.y+vy*.42;
     eyes.poly([ray.from.x+nx,ray.from.y+ny,mx+nx*ray.width,my+ny*ray.width,ray.to.x,ray.to.y,mx-nx*ray.width,my-ny*ray.width,ray.from.x-nx,ray.from.y-ny]).fill({color:0x5dff70,alpha:.26*a});
     eyes.moveTo(ray.from.x,ray.from.y).lineTo(ray.to.x,ray.to.y).stroke({color:0xcfffab,width:1.2,alpha:.62*a});
    }
   });
   // Energy folds back into the orb as separate curved strands and spark motes.
   const gatherLight=Math.sin(Math.PI*pose.gather)*strength;
   if(halos[2]){halos[2].position.set(charge.x,charge.y);halos[2].width=halos[2].height=88;halos[2].alpha=.42*gatherLight;}
   if(gatherLight>0){
    for(let k=3;k>0;k--)eyes.circle(charge.x,charge.y,11+k*8).fill({color:0x6eff89,alpha:.025*gatherLight});
    for(let k=0;k<18;k++){
     const angle=k*Math.PI*2/18+pose.gather*1.7,r=(18+(k%5)*11)*(1-pose.gather)+8;
     const x=charge.x+Math.cos(angle)*r,y=charge.y+Math.sin(angle)*r*.7;
     eyes.circle(x,y,k%3===0?1.7:1).fill({color:k%3?0x91ff8f:0xe9ffcc,alpha:gatherLight*(.4+(k%3)*.18)});
    }
    state.eyes.forEach((eye,index)=>{
     const bend=index===0?-22:22;
     eyes.moveTo(eye.x,eye.y).bezierCurveTo(eye.x+dx/length*28,eye.y+bend,charge.x-dx/length*20,charge.y+bend*.7,charge.x,charge.y).stroke({color:0x80ff89,width:1.1,alpha:.38*gatherLight});
    });
   }
  }
  if(state.transfer>0){trails.moveTo(state.plate.x,state.plate.y).lineTo(state.score.x,state.score.y).stroke({width:9,color:0xb8ff5a,alpha:.15*state.transfer});trails.moveTo(state.plate.x,state.plate.y).lineTo(state.score.x,state.score.y).stroke({width:2,color:0xfff2a0,alpha:state.transfer});}
  for(const burst of bursts){const p=Math.min(1,burst.age/.36),s=burst.strength;
   drawOrbPowerImpact(flashes,burst.x,burst.y,burst.value,burst.age,burst.frame);
   if(burst.frame!=='score')drawImpactWave(flashes,burst.x,burst.y,burst.age,s,burst.color);
   for(let k=0;k<6;k++){const mote=impactMotePose(k,burst.age),x=burst.x+mote.x*s,y=burst.y+mote.y*s;
    flashes.circle(x,y,mote.size).fill({color:k%2?burst.color:0xfff4b6,alpha:mote.alpha*.8});
    if(k%2===0)flashes.moveTo(x-3,y).lineTo(x+3,y).moveTo(x,y-3).lineTo(x,y+3).stroke({width:.7,color:0xe2ffc5,alpha:mote.alpha*.55});
   }
   if(p>=1)continue;
   if(burst.frame==='score'){
    const grow=4+28*(1-(1-p)**3),a=(1-p)**2;
    flashes.roundRect(burst.x-208-grow,burst.y-119-grow,416+grow*2,238+grow*2,22+grow*.5).stroke({width:3*(1-p)+.2,color:burst.color,alpha:.85*a});
    for(const side of [-1,1])for(const up of [-1,1]){
     const x=burst.x+side*(208+grow),y=burst.y+up*(119+grow);
     flashes.moveTo(x,y).lineTo(x+side*20*Math.sin(Math.PI*p),y+up*12*Math.sin(Math.PI*p)).stroke({width:2*(1-p)+.1,color:0xfff6d5,alpha:a});
    }
    continue;
   }
   if(burst.frame==='plate'){
    flashes.ellipse(burst.x,burst.y,108+30*p,69+24*p).stroke({width:3*(1-p)+.2,color:burst.color,alpha:(1-p)**2*.8});
   }
   if(p<.12)flashes.circle(burst.x,burst.y,13*s*(1-p/.12)).fill({color:0xfff9d4,alpha:.75});
   flashes.circle(burst.x,burst.y,(18+52*p)*s).stroke({width:(1-p)*3,color:burst.color,alpha:(1-p)**2*.8});
   for(let k=0;k<7;k++){const angle=k*Math.PI*2/7+.18;const from=(17+32*p)*s,to=from+24*Math.sin(Math.PI*p)*s;flashes.moveTo(burst.x+Math.cos(angle)*from,burst.y+Math.sin(angle)*from).lineTo(burst.x+Math.cos(angle)*to,burst.y+Math.sin(angle)*to).stroke({width:Math.max(.1,2*(1-p)),color:k%2?burst.color:0xfff6d5,alpha:(1-p)**1.5*.8});}
  }
 }
 function clearTransient(){bursts=[];for(const s of shards){s.mesh.destroy();s.geometry.destroy();}shards=[];flashes.clear();for(const glow of flightGlows.values())glow.destroy();flightGlows.clear();}
 return{root,
  setState(value:MultiplierFxState){state=value;draw();},setReducedMotion(value:boolean){reduced=value;if(value)clearTransient();draw();},
  impact(at:Point,value:number,frame:'score'|'plate'|'orb'='orb'){if(!reduced)bursts.push({...at,age:0,value,color:orbColor(value),strength:orbPower(value).impact,frame});},
  shatter(at:Point,value:number){
   if(reduced)return;const texture=value>=100?textures.gold:value>=15?textures.purple:textures.green;
   for(let k=0;k<8;k++){const aa=k*Math.PI/4,bb=(k+1)*Math.PI/4,r=47,vertices=[0,0,Math.cos(aa)*r,Math.sin(aa)*r,Math.cos(bb)*r,Math.sin(bb)*r],cx=(vertices[2]+vertices[4])/3,cy=(vertices[3]+vertices[5])/3;
    const geometry=new MeshGeometry({positions:new Float32Array(vertices.map((v,i)=>v-(i%2?cy:cx))),uvs:new Float32Array(vertices.map(v=>v/94+.5)),indices:new Uint32Array([0,1,2])});const mesh=new Mesh({geometry,texture});mesh.tint=0xaaa99a;pieces.addChild(mesh);
    mesh.position.set(at.x+cx,at.y+cy);const angle=(aa+bb)/2;shards.push({mesh,geometry,x:at.x+cx,y:at.y+cy,vx:Math.cos(angle)*115,vy:Math.sin(angle)*75-105,spin:(k%2?1:-1)*(1.8+k*.25),age:0,life:.32});
   }
  },
  update(dt:number){if(disposed)return;dt=Math.max(0,Math.min(.05,dt));time+=dt;bursts=bursts.map(b=>({...b,age:b.age+dt})).filter(b=>b.age<.56);
   shards=shards.filter(s=>{s.age+=dt;if(s.age>=s.life){s.mesh.destroy();s.geometry.destroy();return false;}s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=900*dt;s.mesh.position.set(s.x,s.y);s.mesh.rotation+=s.spin*dt;s.mesh.alpha=Math.min(1,(s.life-s.age)/.12);return true;});draw();
  },clearTransient,destroy(){if(disposed)return;disposed=true;clearTransient();root.destroy({children:true});stoneMaterial?.destroy();},
 };
}
export type MultiplierFxController=ReturnType<typeof createMultiplierFxScene>;

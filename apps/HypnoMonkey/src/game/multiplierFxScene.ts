import { Container, Graphics, Mesh, MeshGeometry, ColorMatrixFilter,type Texture } from 'pixi.js';
import { gazePose,orbColor, type OrbVisual, type Point } from './multiplierPerformance';
export type MultiplierFxState={orbs:OrbVisual[];eyes:Point[];gaze:number;gazeProgress?:number;target:Point;transfer:number;plate:Point;score:Point};
type Burst=Point&{age:number;color:number;strength:number;frame:'score'|'plate'|'orb'};
type Shard={mesh:Mesh;geometry:MeshGeometry;x:number;y:number;vx:number;vy:number;spin:number;age:number;life:number};
export function createMultiplierFxScene(textures:{green:Texture;purple:Texture;gold:Texture}){
 const root=new Container(),trails=new Graphics(),eyes=new Graphics(),flashes=new Graphics(),pieces=new Container();root.eventMode='none';root.label='Medusa multiplier / charge, slipstream, impact and painted shards';root.addChild(trails,eyes,flashes,pieces);
 // Shader compilation needs a browser GL context; Node replays geometry only.
 const stoneMaterial=typeof document==='undefined'?undefined:new ColorMatrixFilter();stoneMaterial?.saturate(-1);pieces.filters=stoneMaterial?[stoneMaterial]:[];
 trails.blendMode='add';eyes.blendMode='add';flashes.blendMode='add';
 let state:MultiplierFxState={orbs:[],eyes:[],gaze:0,target:{x:0,y:0},transfer:0,plate:{x:0,y:0},score:{x:0,y:0}},time=0,reduced=false,disposed=false;let bursts:Burst[]=[],shards:Shard[]=[];
 function draw(){
  trails.clear();eyes.clear();flashes.clear();if(reduced)return;
  for(const orb of state.orbs){
   if(orb.stone>0)continue;const color=orbColor(orb.value);
   for(let i=orb.trail.length-1;i>0;i--){const a=orb.trail[i],b=orb.trail[i-1],fade=(1-i/orb.trail.length)*orb.alpha;
    if(Math.hypot(a.x-b.x,a.y-b.y)<.1)continue;
    trails.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:3+16*fade,color,alpha:.21*fade});
    trails.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:1+4*fade,color:0xfff9d4,alpha:.62*fade});
   }
   if(orb.charging){const r=12+orb.scale*23;for(let k=0;k<3;k++){const a=time*8+k*Math.PI*2/3,rr=r+k*4;trails.moveTo(orb.x+Math.cos(a)*rr,orb.y+Math.sin(a)*rr).arc(orb.x,orb.y,rr,a,a+1.1).stroke({width:1.2,color,alpha:.42*orb.alpha});}}
  }
  if(state.gaze>0){
   const pose=gazePose(state.gazeProgress??.4),strength=state.gaze;
   for(const eye of state.eyes){
    // Compact bloom and a single focus flare, registered to each moving pupil.
    for(let k=3;k>0;k--)eyes.ellipse(eye.x,eye.y,7+k*5,3+k*3).fill({color:k===3?0x4db93c:0xb5ff63,alpha:(.028+(3-k)*.02)*strength});
    eyes.ellipse(eye.x,eye.y,7,3.6).fill({color:0xb8ff5a,alpha:.95*strength});eyes.ellipse(eye.x,eye.y,3,2).fill({color:0xffffe1,alpha:strength});
    eyes.moveTo(eye.x-18-pose.focus*12,eye.y).lineTo(eye.x+18+pose.focus*12,eye.y).stroke({color:0xc8ff89,width:1,alpha:.5*strength*pose.focus});
    const dx=state.target.x-eye.x,dy=state.target.y-eye.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,tx=eye.x+dx*pose.reach,ty=eye.y+dy*pose.reach;
    for(const [width,endWidth,color,opacity] of [[9,4,0x55da44,.09],[4,1.8,0xa4ff60,.29],[.9,.5,0xf2ffd5,.60]]){
     eyes.poly([eye.x+nx*width,eye.y+ny*width,tx+nx*endWidth,ty+ny*endWidth,tx-nx*endWidth,ty-ny*endWidth,eye.x-nx*width,eye.y-ny*width]).fill({color,alpha:opacity*strength});
    }
    // Two fine energy packets travel once down each beam instead of flickering.
    for(let k=0;k<2;k++){const p=Math.min(1,Math.max(0,((state.gazeProgress??.4)-k*.19)*2.3));if(p<=0||p>=1)continue;const end=Math.min(pose.reach,p),start=Math.max(0,end-.055);eyes.moveTo(eye.x+dx*start,eye.y+dy*start).lineTo(eye.x+dx*end,eye.y+dy*end).stroke({color:0xf5ffd8,width:2,alpha:.8*strength});}
   }
   // The arriving gaze carves a local mineral seal; it never suggests extra wins.
   if(pose.reach>.97){const a=strength*.55,r=32+pose.stone*52;
    eyes.ellipse(state.target.x,state.target.y,r,r*.58).stroke({color:0xb8ff5a,width:2,alpha:a});
    eyes.ellipse(state.target.x,state.target.y,r+10,(r+10)*.58).stroke({color:0x66dc71,width:5,alpha:a*.12});
    for(let k=0;k<8;k++){const angle=k*Math.PI/4+.12,rr=r+9;eyes.moveTo(state.target.x+Math.cos(angle)*rr,state.target.y+Math.sin(angle)*rr*.58).lineTo(state.target.x+Math.cos(angle)*(rr+10),state.target.y+Math.sin(angle)*(rr+10)*.58).stroke({color:0xe3ffd0,width:1.6,alpha:a});}
   }
  }
  if(state.transfer>0){trails.moveTo(state.plate.x,state.plate.y).lineTo(state.score.x,state.score.y).stroke({width:9,color:0xb8ff5a,alpha:.15*state.transfer});trails.moveTo(state.plate.x,state.plate.y).lineTo(state.score.x,state.score.y).stroke({width:2,color:0xfff2a0,alpha:state.transfer});}
  for(const burst of bursts){const p=burst.age/.36,s=burst.strength;
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
 function clearTransient(){bursts=[];for(const s of shards){s.mesh.destroy();s.geometry.destroy();}shards=[];flashes.clear();}
 return{root,
  setState(value:MultiplierFxState){state=value;draw();},setReducedMotion(value:boolean){reduced=value;if(value)clearTransient();draw();},
  impact(at:Point,value:number,frame:'score'|'plate'|'orb'='orb'){if(!reduced)bursts.push({...at,age:0,color:orbColor(value),strength:value>=100?1.25:1,frame});},
  shatter(at:Point,value:number){
   if(reduced)return;const texture=value>=100?textures.gold:value>=15?textures.purple:textures.green;
   for(let k=0;k<8;k++){const aa=k*Math.PI/4,bb=(k+1)*Math.PI/4,r=47,vertices=[0,0,Math.cos(aa)*r,Math.sin(aa)*r,Math.cos(bb)*r,Math.sin(bb)*r],cx=(vertices[2]+vertices[4])/3,cy=(vertices[3]+vertices[5])/3;
    const geometry=new MeshGeometry({positions:new Float32Array(vertices.map((v,i)=>v-(i%2?cy:cx))),uvs:new Float32Array(vertices.map(v=>v/94+.5)),indices:new Uint32Array([0,1,2])});const mesh=new Mesh({geometry,texture});mesh.tint=0xaaa99a;pieces.addChild(mesh);
    mesh.position.set(at.x+cx,at.y+cy);const angle=(aa+bb)/2;shards.push({mesh,geometry,x:at.x+cx,y:at.y+cy,vx:Math.cos(angle)*115,vy:Math.sin(angle)*75-105,spin:(k%2?1:-1)*(1.8+k*.25),age:0,life:.32});
   }
  },
  update(dt:number){if(disposed)return;dt=Math.max(0,Math.min(.05,dt));time+=dt;bursts=bursts.map(b=>({...b,age:b.age+dt})).filter(b=>b.age<.36);
   shards=shards.filter(s=>{s.age+=dt;if(s.age>=s.life){s.mesh.destroy();s.geometry.destroy();return false;}s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=900*dt;s.mesh.position.set(s.x,s.y);s.mesh.rotation+=s.spin*dt;s.mesh.alpha=Math.min(1,(s.life-s.age)/.12);return true;});draw();
  },clearTransient,destroy(){if(disposed)return;disposed=true;clearTransient();root.destroy({children:true});stoneMaterial?.destroy();},
 };
}
export type MultiplierFxController=ReturnType<typeof createMultiplierFxScene>;

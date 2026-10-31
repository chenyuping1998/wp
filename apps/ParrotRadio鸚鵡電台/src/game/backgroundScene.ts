import {Container,Graphics,Mesh,MeshGeometry,Sprite,Texture} from 'pixi.js';
import {seaSample,seaWeight,paintAmbient} from './backgroundMotion';
import {applyCamera,createCinemaLayer,type CinemaPreset} from './cinemaLight';
/**
 * The deck at sea, lit. One dense mesh carries the painting; its texture lookup is bent where things move — the sea
 * (as before), the palm fronds and the two deck plants swaying on their roots, the sail breathing — so nothing is
 * drawn over the set. On top: shafts of sun over the water (day only), glints popping on the sea, leaf shadows
 * playing across the planks, and the speaker's cones pumping to the radio (harder in the feature).
 * Over it all, the film layer (cinemaLight.ts, user 2026-10-31: 電影程度): bloom from the painting's own highlights,
 * sea mist along the horizon, the sun's lens flare (day), a breathing vignette and a camera that slowly pushes and
 * drifts. By day a cloud's shadow now and then sails across the sea and the deck; at dusk the sky's stars twinkle and,
 * once in a while, one falls.
 * 2026-10-31 (user: 繼續加強背景動態): by day the sea's reflected light ripples over the sail; at dusk the string
 * lights sway on their cable, each bulb about its hook, their glow following.
 */
const W=1920,H=1080;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const hash=(n:number)=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};

// where the set moves, in its own pixels
const CROWN=[1872,40] as const; // the top-right palm's crown: its fronds turn about it
const PLANTS=[{x:120,y:1080,box:[0,850,250,1080]},{x:1800,y:1080,box:[1660,760,1920,1080]}] as const; // rooted at the bottom
const HORN={x:258,y:290,rx:100,ry:125}; // the brass horn on the mast is metal: the sail's breath must not bend it
const CONES=[{x:1807.5,y:577.5,r:44},{x:1807.5,y:475,r:28}] as const; // woofer, tweeter
const SUN_BEAMS=[[1980,-60,170],[1890,-90,120],[2060,40,140]] as const; // day: from the sun behind the right palms
const BEAM_ANGLE=Math.PI-Math.atan2(560,700); // down and to the left, as the deck's shadows fall
const DAY_FILM:CinemaPreset={
 bloom:{from:.76,to:.97,strength:.30,tint:0xfff0d2},
 haze:[{y:540,height:170,color:0xe2f4ff,alpha:.11,speed:9,scale:1.3},{y:960,height:260,color:0xffe0a8,alpha:.05,speed:4}],
 flares:[{x:1830,y:55,color:0xfff0c8,size:720,streak:3,ghosts:true}],
 vignette:.26,
};
const DUSK_FILM:CinemaPreset={
 bloom:{from:.52,to:.88,strength:.42,tint:0xffd2b0},
 haze:[{y:535,height:200,color:0xff9e78,alpha:.10,speed:7,scale:1.3},{y:960,height:260,color:0xff9a5a,alpha:.05,speed:4}],
 flares:[],
 vignette:.40,
};
const CLOUD_PERIOD=32,CLOUD_CROSS=14; // day: s between cloud shadows, s to cross the frame
const METEOR_PERIOD=26; // dusk: s between falling stars

function palmOffset(x:number,y:number,t:number){
 const w=smooth(1490,1580,x)*(1-smooth(210,300,y));if(w<=0)return [0,0];
 const theta=(.016*Math.sin(t*.85)+.006*Math.sin(t*2.1+1))*Math.min(1,Math.hypot(x-CROWN[0],y-CROWN[1])/380)*w;
 return [-theta*(y-CROWN[1]),theta*(x-CROWN[0])];
}
function plantOffset(x:number,y:number,t:number){
 let dx=0;
 for(const [i,p] of PLANTS.entries()){
  const [l,top,r,b]=p.box,w=smooth(l,l+30,x)*(1-smooth(r-30,r,x))*smooth(top,top+40,y)*(1-smooth(b-10,b,y));
  if(w>0)dx+=w*((p.y-y)/(p.y-top))*(4.5*Math.sin(t*1.05+i*1.9)+1.5*Math.sin(t*2.6+i));
 }
 return dx;
}
function sailOffset(x:number,y:number,t:number){
 const edge=620-y*.62,w=smooth(185,240,x)*(1-smooth(edge+10,edge+60,x))*(1-smooth(470,540,y));if(w<=0)return 0;
 const horn=clamp(((x-HORN.x)/HORN.rx)**2+((y-HORN.y)/HORN.ry)**2-.6);
 return w*horn*clamp((x-180)/440)*(6*Math.sin(t*.72)+2*Math.sin(t*1.7+.6));
}

function canvasTexture(width:number,height:number,paint:(ctx:CanvasRenderingContext2D)=>void){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;paint(canvas.getContext('2d')!);return Texture.from(canvas);
}
const beamTexture=()=>canvasTexture(512,64,ctx=>{
 for(let x=0;x<512;x++){const along=Math.sin(Math.PI*Math.min(1,x/120))*(1-x/512)**1.2;const g=ctx.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${along})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x,0,1,64);}
});
/** a cone of the speaker as its own small mesh over the painting: the centre pushes out, the rim stays put */
function cone(c:{x:number;y:number;r:number},texture:Texture){
 const rings=6,segs=28,base:number[]=[],uvs:number[]=[],indices:number[]=[];
 base.push(c.x,c.y);uvs.push(c.x/W,c.y/H);
 for(let ring=1;ring<=rings;ring++)for(let s=0;s<segs;s++){const a=s/segs*Math.PI*2,r=c.r*ring/rings,x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r;base.push(x,y);uvs.push(x/W,y/H);}
 for(let s=0;s<segs;s++)indices.push(0,1+s,1+(s+1)%segs);
 for(let ring=1;ring<rings;ring++)for(let s=0;s<segs;s++){const a=1+(ring-1)*segs+s,b=1+(ring-1)*segs+(s+1)%segs,c2=a+segs,d=b+segs;indices.push(a,c2,b,b,c2,d);}
 const positions=new Float32Array(base),geometry=new MeshGeometry({positions,uvs:new Float32Array(uvs),indices:new Uint32Array(indices)});
 const mesh=new Mesh({geometry,texture});
 return {mesh,geometry,set(push:number){
  // radial bulge: a point at radius r moves out by push·(1−(r/R)²)·r — zero at the rim, so no seam
  for(let i=0;i<base.length;i+=2){const dx=base[i]-c.x,dy=base[i+1]-c.y,k=1+push*(1-(dx*dx+dy*dy)/(c.r*c.r));positions[i]=c.x+dx*k;positions[i+1]=c.y+dy*k;}
  geometry.getBuffer('aPosition').update();
 }};
}

export function createBackgroundScene(base:Texture,free:Texture){
 const root=new Container(),decor=new Container(),gull=new Graphics(),cable=new Graphics(),glints=new Graphics();root.eventMode='none';root.label='Living painted environment';
 const cols=96,rows=54,positions=new Float32Array((cols+1)*(rows+1)*2),uvs=new Float32Array(positions.length),indices:number[]=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const i=(y*(cols+1)+x)*2;positions[i]=x/cols*W;positions[i+1]=y/rows*H;uvs[i]=x/cols;uvs[i+1]=y/rows;}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;indices.push(a,b,c,b,d,c);}
 const weights=Float32Array.from({length:positions.length/2},(_,i)=>seaWeight(positions[i*2],positions[i*2+1]));
 const geometry=new MeshGeometry({positions,uvs,indices:new Uint32Array(indices)}),plate=new Mesh({geometry,texture:base});root.addChild(plate);
 const cones=CONES.map(c=>cone(c,base));for(const c of cones)root.addChild(c.mesh);
 const makeMap=()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=288;const ctx=canvas.getContext('2d')!;const texture=Texture.from(canvas);const sprite=new Sprite({texture,width:W,height:H});root.addChild(sprite);return {ctx,texture,sprite};};
 const shadow=makeMap(),lightMap=makeMap();shadow.sprite.blendMode='multiply';lightMap.sprite.blendMode='add';
 const beamTex=beamTexture(),beams=SUN_BEAMS.map(([x,y,width])=>{const s=new Sprite({texture:beamTex,tint:0xfff1cc,blendMode:'add',anchor:{x:0,y:.5}});s.position.set(x,y);s.rotation=BEAM_ANGLE;s.width=1500;s.height=width;root.addChild(s);return s;});
 root.addChild(glints,decor);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!,grad=ctx.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.25,'rgba(255,255,255,.32)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const glowTexture=Texture.from(canvas);
 const lights:Sprite[]=[],bulbs:Graphics[]=[],hooks:[number,number][]=[];
 const lamp=(x:number,y:number,size:number,color:number)=>{const s=new Sprite({texture:glowTexture,tint:color,anchor:.5,width:size,height:size,blendMode:'add'});s.position.set(x,y);decor.addChild(s);lights.push(s);};
 decor.addChild(cable);cable.moveTo(225,145).quadraticCurveTo(1010,390,1770,375).stroke({color:0x443724,width:2,alpha:.8});
 for(let i=0;i<12;i++){const t=i/11,x=(1-t)**2*225+2*(1-t)*t*1010+t*t*1770,y=(1-t)**2*145+2*(1-t)*t*390+t*t*375;lamp(x,y+12,70,0xffbd66);hooks.push([x,y]);const b=new Graphics().moveTo(x,y).lineTo(x,y+10).stroke({color:0x5c4429,width:2}).ellipse(x,y+15,4.5,7).fill(0xffefb6);decor.addChild(b);bulbs.push(b);}decor.addChild(gull);
 // the film layer, one per set; a cloud's shadow (day) and the sky's stars and meteor (dusk) under it
 const cloudShadow=new Sprite({texture:glowTexture,anchor:.5,tint:0x6f7f98,blendMode:'multiply',alpha:0,width:1500,height:520});cloudShadow.y=815;
 const starsLayer=new Graphics(),meteor=new Graphics();
 const stars:{x:number;y:number;r:number;phase:number;speed:number}[]=[];
 {
  // stars only where the painted dusk sky is: dark blue-violet, above the horizon, clear of the palms and the sail
  const c=document.createElement('canvas');c.width=192;c.height=54;const g=c.getContext('2d',{willReadFrequently:true})!;
  g.drawImage(free.source.resource as CanvasImageSource,0,0,1920,540,0,0,192,54);const d=g.getImageData(0,0,192,54).data;
  for(let i=0;i<400&&stars.length<70;i++){
   const x=Math.floor(hash(i*3+1)*192),y=Math.floor(hash(i*3+2)*48),k=(y*192+x)*4,r=d[k],gg=d[k+1],b=d[k+2],lum=(r*.3+gg*.59+b*.11)/255;
   if(b>gg+18&&b>r-30&&lum<.42)stars.push({x:x*10+hash(i)*10,y:y*10+hash(i+9)*10,r:hash(i+5)>.85?3:1.9,phase:hash(i+7)*6.3,speed:.6+hash(i+8)*1.4});
  }
 }
 root.addChild(cloudShadow,starsLayer,meteor);
 const film={day:createCinemaLayer(base,DAY_FILM),dusk:createCinemaLayer(free,DUSK_FILM)};
 root.addChild(film.day.root,film.dusk.root);
 // the sea's light rippling on the sail (day): a few slow bright waves on a small canvas, cut by the sail's lit cloth
 const SAIL_BOX=[150,0,630,520] as const,ck=1/3,cw=Math.ceil((SAIL_BOX[2]-SAIL_BOX[0])*ck),chh=Math.ceil((SAIL_BOX[3]-SAIL_BOX[1])*ck);
 const causticCanvas=document.createElement('canvas');causticCanvas.width=cw;causticCanvas.height=chh;const cctx=causticCanvas.getContext('2d')!;
 const sailMask=document.createElement('canvas');sailMask.width=cw;sailMask.height=chh;
 {
  const m=sailMask.getContext('2d',{willReadFrequently:true})!;m.drawImage(base.source.resource as CanvasImageSource,SAIL_BOX[0],SAIL_BOX[1],SAIL_BOX[2]-SAIL_BOX[0],SAIL_BOX[3]-SAIL_BOX[1],0,0,cw,chh);
  const img=m.getImageData(0,0,cw,chh),d=img.data;
  for(let i=0;i<d.length;i+=4){
   const px=(i/4)%cw/ck+SAIL_BOX[0],py=Math.floor(i/4/cw)/ck+SAIL_BOX[1],edge=620-py*.62,r=d[i],g=d[i+1],b=d[i+2];
   // the cloth: inside the sail's outline, bright and cream (not the brass horn, the ropes or the mast)
   const inSail=smooth(195,235,px)*(1-smooth(edge-30,edge+5,px))*(1-smooth(480,520,py)),horn=clamp(((px-HORN.x)/HORN.rx)**2+((py-HORN.y)/HORN.ry)**2-.7);
   const cloth=smooth(170,215,(r+g+b)/3)*smooth(-10,10,r-b-20)*(1-smooth(60,90,r-b));
   d[i]=d[i+1]=d[i+2]=255;d[i+3]=255*inSail*horn*cloth;
  }
  m.putImageData(img,0,0);
 }
 const causticTexture=Texture.from(causticCanvas),caustics=new Sprite({texture:causticTexture,blendMode:'add',tint:0xffd890,alpha:.5});
 caustics.position.set(SAIL_BOX[0],SAIL_BOX[1]);caustics.width=SAIL_BOX[2]-SAIL_BOX[0];caustics.height=SAIL_BOX[3]-SAIL_BOX[1];root.addChildAt(caustics,root.getChildIndex(film.day.root));
 let causticAge=1;
 const paintCaustics=(t:number)=>{
  const c=cctx;c.globalCompositeOperation='source-over';c.clearRect(0,0,cw,chh);c.globalCompositeOperation='lighter';c.lineCap='round';
  for(let n=0;n<9;n++){
   // each wave runs up the cloth slowly, bending; brighter where two cross
   const base0=((n/9+t*.035)%1)*chh*1.2-chh*.1,a=.35+.25*Math.sin(t*.8+n*1.7);c.strokeStyle=`rgba(255,255,255,${a})`;c.lineWidth=2.2+.9*Math.sin(n*2.3);
   c.beginPath();for(let x=0;x<=cw;x+=4){const y=base0+5*Math.sin(x*.09+t*1.1+n)+3*Math.sin(x*.21-t*1.7+n*2.1);x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  }
  c.globalCompositeOperation='destination-in';c.drawImage(sailMask,0,0);causticTexture.source.update();
 };
 let layoutW=W,layoutH=H;
 let feature=false,reduced=false,volume=1,time=0,mapAge=1,dirty=true;
 function update(dt:number){
  dt=Math.max(0,Math.min(.1,dt));if(!reduced)time+=dt;const t=time;
  // the painting's surface: sea, fronds, plants, sail
  for(let i=0;i<uvs.length;i+=2){
   const x=positions[i],y=positions[i+1],p=seaSample(x,y,t,reduced,weights[i/2]);
   if(reduced){uvs[i]=p.u;uvs[i+1]=p.v;continue;}
   const palm=palmOffset(x,y,t);
   uvs[i]=p.u+(palm[0]+plantOffset(x,y,t)+sailOffset(x,y,t))/W;uvs[i+1]=p.v+palm[1]/H;
  }
  geometry.getBuffer('aUV').update();
  // the speaker: a kick on every beat (≈104 bpm), the woofer most
  const beat=(t*104/60)%1,kick=reduced?0:Math.exp(-beat*7)*(feature?1:.55);
  cones.forEach((c,i)=>c.set(kick*(i?.05:.085)));
  beams.forEach((b,i)=>{b.visible=!feature&&!reduced;b.alpha=.13+.05*Math.sin(t*.3+i*2.1)+.03*Math.sin(t*1.1+i);});
  glints.clear();
  if(!reduced)for(let i=0;i<9;i++){
   // a glint pops, holds a beat and goes, somewhere on the open water (left of the board, right of it)
   const life=1.6,cycle=Math.floor((t+hash(i)*life)/life),u=((t+hash(i)*life)%life)/life,seed=i*13+cycle;
   const right=hash(seed)>.45,x=right?1330+hash(seed+1)*360:390+hash(seed+1)*220,y=575+hash(seed+2)*140;
   if(seaWeight(x,y)<.6)continue;
   const a=Math.sin(Math.PI*clamp(u*2.2))**2,s=(3+hash(seed+3)*4)*(.6+.4*a);
   if(a<.02)continue;
   glints.moveTo(x-s*2.4,y).lineTo(x+s*2.4,y).moveTo(x,y-s*1.4).lineTo(x,y+s*1.4).stroke({color:feature?0xffd9a0:0xffffff,width:1.6,alpha:a*.9}).circle(x,y,1.6).fill({color:0xffffff,alpha:a});
  }
  cable.visible=feature;for(let i=0;i<lights.length;i++){const bank=i<4?1:i<8?clamp((volume-4)/4):clamp((volume-10)/6);lights[i].visible=feature;lights[i].alpha=.12+bank*.15+Math.sin(t*.7+i)*.012;bulbs[i].visible=feature;bulbs[i].alpha=.55+bank*.4;}
  caustics.visible=!feature&&!reduced;causticAge+=dt;
  if(caustics.visible&&causticAge>=1/15){paintCaustics(t);causticAge=0;}
  if(feature)for(let i=0;i<bulbs.length;i++){
   // the bulbs sway on the cable about their hooks, a breath of wind running along it; the glow follows the bulb
   const [hx,hy]=hooks[i],a=reduced?0:.16*Math.sin(t*1.1-i*.45)+.05*Math.sin(t*2.3+i);
   bulbs[i].pivot.set(hx,hy);bulbs[i].position.set(hx,hy);bulbs[i].rotation=a;
   lights[i].position.set(hx-15*Math.sin(a),hy+15*Math.cos(a)-3);
  }
  gull.clear();const g=(t%19)/9;if(!feature&&!reduced&&g<1){const x=500+g*900,y=145-Math.sin(g*Math.PI)*60,s=9+Math.sin(g*Math.PI)*3,flap=Math.sin(t*3.1)*3;gull.moveTo(x-s,y+flap).quadraticCurveTo(x-s*.4,y-3,x,y).quadraticCurveTo(x+s*.4,y-3,x+s,y+flap).stroke({color:0x496b81,width:1.8,alpha:.65});}
  // the film: a cloud's shadow dims the sun (day); the more the speaker is turned up, the brighter the dusk glows
  const cl=reduced?-1:((t+CLOUD_PERIOD-12)%CLOUD_PERIOD)/CLOUD_CROSS;
  cloudShadow.visible=!feature&&cl>=0&&cl<=1;
  if(cloudShadow.visible){cloudShadow.x=W+800-(W+1600)*cl;cloudShadow.alpha=.7*Math.sin(Math.PI*cl);}
  const shade=cloudShadow.visible?Math.max(0,1-Math.abs(cloudShadow.x-1100)/900)*Math.sin(Math.PI*cl):0;
  film.day.setVisible(!feature);film.dusk.setVisible(feature);
  film.day.update(t,1-.55*shade,reduced);film.dusk.update(t,.8+.2*clamp(volume/16),reduced);
  beams.forEach(b=>{b.alpha*=1-.6*shade;});
  starsLayer.clear();meteor.clear();starsLayer.visible=meteor.visible=feature;
  if(feature){
   for(const st of stars){const tw=reduced?.7:.55+.45*Math.sin(t*st.speed+st.phase)**2;starsLayer.circle(st.x,st.y,st.r).fill({color:0xfff4e6,alpha:.7*tw});}
   const m=reduced?-1:((t+METEOR_PERIOD-7)%METEOR_PERIOD)/1.1;
   if(m>=0&&m<=1){
    // a falling star: a short bright head and a tail that draws on and fades, high over the island and clear of the sail (it is behind it)
    const x0=1010,y0=58,dx=-290,dy=104,head=Math.min(1,m*1.25),tail=Math.max(0,m*1.25-.35),a=Math.sin(Math.PI*m);
    meteor.moveTo(x0+dx*tail,y0+dy*tail).lineTo(x0+dx*head,y0+dy*head).stroke({color:0xfff2dc,width:2.4,alpha:.75*a});
    meteor.circle(x0+dx*head,y0+dy*head,2.6).fill({color:0xffffff,alpha:.9*a});
   }
  }
  applyCamera(root,layoutW,layoutH,t,reduced);
  mapAge+=dt;
  if(dirty||mapAge>=1/24){paintAmbient(shadow.ctx,lightMap.ctx,t,'parrot',feature,reduced);paintDeck(shadow.ctx,lightMap.ctx,t,feature,reduced);shadow.texture.source.update();lightMap.texture.source.update();mapAge=0;}dirty=false;
 }
 update(0);
 return {root,update,
  setLayout(width:number,height:number){layoutW=width;layoutH=height;applyCamera(root,width,height,time,reduced);},
  setState(fg:boolean,v:number,_paused:boolean,reduce:boolean){dirty=dirty||feature!==fg||volume!==v||reduced!==reduce;feature=fg;volume=v;reduced=reduce;const texture=fg?free:base;plate.texture=texture;for(const c of cones)c.mesh.texture=texture;},
  /** review only: jump the set's clock, optionally into the feature's set */
  seek(seconds:number,fg=feature){time=seconds;feature=fg;plate.texture=fg?free:base;for(const c of cones)c.mesh.texture=plate.texture;dirty=true;update(0);},
  destroy(){film.day.destroy();film.dusk.destroy();root.destroy({children:true});geometry.destroy();for(const c of cones)c.geometry.destroy();for(const t of [glowTexture,beamTex,shadow.texture,lightMap.texture,causticTexture])t.destroy(true);}};
}

/** leaf shadows from the palms overhead playing over the planks, with warm flecks of sun between them */
function paintDeck(shadow:CanvasRenderingContext2D,light:CanvasRenderingContext2D,time:number,feature:boolean,reduced:boolean){
 const t=reduced?0:time;
 shadow.save();light.save();
 shadow.beginPath();shadow.rect(0,885,W,H-885);shadow.clip();light.beginPath();light.rect(0,885,W,H-885);light.clip();
 for(let i=0;i<34;i++){
  // clusters under the right palm and the left plant; each blob a frond tip, swaying with the palm's turn
  const right=i%3!==0,cx=right?1180+hash(i)*700:60+hash(i)*420,cy=905+hash(i+1)*170;
  const sway=(right?22:14)*Math.sin(t*.85+hash(i+2)*.6)+6*Math.sin(t*2.1+i);
  const rx=26+hash(i+3)*38,ry=rx*.32,rot=-.35+hash(i+4)*.3;
  shadow.fillStyle=`rgba(${feature?'40,24,60':'52,38,20'},${.16+hash(i+5)*.1})`;
  shadow.beginPath();shadow.ellipse(cx+sway,cy,rx,ry,rot,0,Math.PI*2);shadow.fill();
  if(i%4===0){light.fillStyle=`rgba(255,${feature?'170,110':'214,150'},${.07+.05*Math.sin(t*1.3+i)})`;light.beginPath();light.ellipse(cx+sway*1.1+rx,cy+ry,rx*.45,ry*.6,rot,0,Math.PI*2);light.fill();}
 }
 shadow.restore();light.restore();
}

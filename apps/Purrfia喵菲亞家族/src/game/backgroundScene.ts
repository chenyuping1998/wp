import {Container,Graphics,Mesh,MeshGeometry,Sprite,Texture} from 'pixi.js';
import FX from './backgroundFx.json';
import {applyCamera,createCinemaLayer,type CinemaPreset} from './cinemaLight';
/**
 * The office and the alley, lit. Every moving light is cut from the painting itself (tools/build_bg_light_masks.py
 * → backgroundFx.json, 1920×1080 space), so nothing is painted over the set; only light changes on it.
 *  - office: shafts of sun stand in the air with dust turning in them; now and then a cloud's shadow sweeps the
 *    room from the window side — the painted sun patches dim under it, the shafts fade, the dust stops glinting,
 *    and the desk lamp and wall sconce read stronger for the moment the room is darker. One pass, then long
 *    stretches of plain sun.
 *  - alley: the three neon signs hum (a slow swell, and now and then the fish sign stutters off and back), their
 *    reflections in the wet street follow them, a light rain falls and rings the puddles, and the cat in the box
 *    blinks.
 *  - both, the film layer (cinemaLight.ts, user 2026-10-31: 電影程度): bloom from the painting's own highlights, slow
 *    haze, a lens streak on the main lights, a breathing vignette and a camera that slowly pushes and drifts. The
 *    alley adds a car's headlights crossing behind the far arch (and their streak in the wet street) and, now and
 *    then, distant lightning over the skyline.
 *  - 2026-10-31 (user: 繼續加強背景動態): the wet street's reflections ripple — the cobbles are one mesh over the
 *    painting whose texture lookup is bent a few pixels sideways, more toward the camera — and in the office a
 *    bird's shadow now and then skims the patches of sun on the floor.
 */
export const BACKGROUND_KEYS=['mgBgBase','mgBgFree','bgFxSunlit','bgFxNeonCat','bgFxNeonFish','bgFxNeonPaw','bgFxReflectPink','bgFxReflectCyan'] as const;
type Rect=readonly number[];
const W=1920,H=1080,TAU=Math.PI*2;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const hash=(n:number)=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};

// office light, in the set's pixels
const CLOUD_PERIOD=27; // seconds between passing clouds
const SWEEP=10; // seconds the shadow takes to cross the room
const SUN_ANGLE=Math.atan2(456,336); // the painted blind stripes run this way
const BEAMS=[[70,40,150],[205,70,120],[335,100,170],[455,150,110]] as const; // window start x, y, width
const LAMPS=[{x:92,y:500,size:420,color:0xffc46a},{x:1545,y:128,size:260,color:0xffbe6e}] as const;
// alley light
const NEON=[{key:'neonCat',glow:[186,150,360],color:0xff4fb4,reflect:'pink'},{key:'neonFish',glow:[468,258,280],color:0x52f2ff,reflect:'cyan'},{key:'neonPaw',glow:[1838,196,280],color:0xff5cc6,reflect:'pink'}] as const;
const STREET_LAMPS=[[306,324,170],[594,414,130],[1704,240,170],[1628,378,130],[1286,480,110],[858,450,90],[1104,458,90]] as const;
// the film layer: what each set's camera sees in its light
const OFFICE_FILM:CinemaPreset={
 bloom:{from:.72,to:.96,strength:.34,tint:0xffe2b8},
 haze:[{y:430,height:640,color:0xffd49a,alpha:.075,speed:5},{y:900,height:320,color:0xffc27a,alpha:.05,speed:3,scale:1.4}],
 flares:[{x:205,y:140,color:0xffd9a6,size:520,streak:3.2,ghosts:true},{x:1545,y:128,color:0xffbe6e,size:150,streak:2.6}],
 vignette:.34,
};
const ALLEY_FILM:CinemaPreset={
 bloom:{from:.46,to:.85,strength:.5},
 haze:[{y:950,height:380,color:0x8fa8ff,alpha:.13,speed:14,scale:1.2},{y:590,height:260,color:0xb18cff,alpha:.07,speed:8}],
 flares:[{x:186,y:150,color:0xff4fb4,size:240,streak:5},{x:468,y:258,color:0x52f2ff,size:220,streak:5.5},{x:1838,y:196,color:0xff5cc6,size:210,streak:5}],
 vignette:.42,
};
// behind the far arch (its opening is x 902..1072, the cross street at y ≈ 658)
const ARCH={left:902,right:1072,road:658,street:[690,860] as const};
const CAR_PERIOD=21,CAR_CROSS=3.4; // s between cars, s to cross the opening
const STORM_PERIOD=38; // s between distant lightning
// the wet cobbles: the street between the left curb (under the bins and boxes) and the right steps
const STREET=[[720,690],[1170,690],[1480,790],[1920,940],[1920,1080],[110,1080],[110,870],[360,800]] as const;
const STREET_BOX=[100,680,1920,1080] as const;
// the office: a bird crossing the sun, every BIRD_PERIOD s, BIRD_CROSS s to cross
const BIRD_PERIOD=17,BIRD_CROSS=1.7;
/** 0..1 inside the street polygon, fading over 28px outside it */
function streetWeight(x:number,y:number){
 let inside=false,best=Infinity;
 for(let i=0,j=STREET.length-1;i<STREET.length;j=i++){
  const [xi,yi]=STREET[i],[xj,yj]=STREET[j];
  if(yi>y!==yj>y&&x<((xj-xi)*(y-yi))/(yj-yi)+xi)inside=!inside;
  const dx=xi-xj,dy=yi-yj,t=Math.max(0,Math.min(1,((x-xj)*dx+(y-yj)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(xj+t*dx-x,yj+t*dy-y));
 }
 return inside?Math.min(1,.4+best/28):Math.max(0,.4-best/70);
}

function canvasTexture(width:number,height:number,paint:(ctx:CanvasRenderingContext2D)=>void){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;paint(canvas.getContext('2d')!);return Texture.from(canvas);
}
const glowTexture=()=>canvasTexture(128,128,ctx=>{const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.22,'rgba(255,255,255,.38)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);});
/** a soft shaft: bright core fading along its length and to both sides */
const beamTexture=()=>canvasTexture(512,64,ctx=>{
 for(let x=0;x<512;x++){const along=Math.sin(Math.PI*Math.min(1,x/90))*(1-x/512)**1.3;const g=ctx.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${along})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x,0,1,64);}
});

export function createBackgroundScene(textures:Record<string,Texture>){
 const root=new Container();root.eventMode='none';root.label='Purrfia set, lit';
 const plate=new Sprite({texture:textures.mgBgBase,width:W,height:H});root.addChild(plate);
 const owned:Texture[]=[];const own=(t:Texture)=>(owned.push(t),t);
 const glow=own(glowTexture());
 const place=(key:string,rect:Rect,props:Partial<Sprite>={})=>{const s=new Sprite({texture:textures[key],...props});s.position.set(rect[0],rect[1]);s.width=rect[2];s.height=rect[3];return s;};
 const spot=(x:number,y:number,size:number,color:number)=>{const s=new Sprite({texture:glow,tint:color,anchor:.5,blendMode:'add',alpha:0});s.position.set(x,y);s.width=s.height=size;return s;};

 // ── office ─────────────────────────────────────────────────────────────────
 const office=new Container();root.addChild(office);
 // The cloud's shadow is painted, not masked: a masked sprite is drawn through a filter and loses its multiply.
 // A small canvas holds the sun patches cut by the moving shadow band (soft front and back edges).
 const shadeCanvas=document.createElement('canvas');shadeCanvas.width=480;shadeCanvas.height=270;
 const shadeCtx=shadeCanvas.getContext('2d')!,shadeTexture=own(Texture.from(shadeCanvas));
 const sunlitImage=textures.bgFxSunlit.source.resource as CanvasImageSource,sunlitRect=FX.purrfia.base.sunlit;
 const shade=new Sprite({texture:shadeTexture,width:W,height:H,tint:0x5e5262,blendMode:'multiply'});
 const sunGlow=place('bgFxSunlit',FX.purrfia.base.sunlit,{tint:0xffc477,blendMode:'add'});
 office.addChild(shade,sunGlow);
 const paintShade=(front:number)=>{
  // front: the shadow's leading edge in set pixels; its core is 1300 px long with 500 px soft edges
  const k=shadeCanvas.width/W,ctx=shadeCtx;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,shadeCanvas.width,shadeCanvas.height);
  const g=ctx.createLinearGradient((front-2300)*k,0,front*k,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.22,'rgba(255,255,255,1)');g.addColorStop(.78,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,shadeCanvas.width,shadeCanvas.height);
  ctx.globalCompositeOperation='destination-in';ctx.drawImage(sunlitImage,sunlitRect[0]*k,sunlitRect[1]*k,sunlitRect[2]*k,sunlitRect[3]*k);
  shadeTexture.source.update();
 };
 const beamTex=own(beamTexture()),beams=BEAMS.map(([x,y,width])=>{const s=new Sprite({texture:beamTex,tint:0xffdca0,blendMode:'add',anchor:{x:0,y:.5}});s.position.set(x,y);s.rotation=SUN_ANGLE;s.width=1350;s.height=width;office.addChild(s);return s;});
 const dust=new Graphics();office.addChild(dust);
 const lamps=LAMPS.map(l=>office.addChild(spot(l.x,l.y,l.size,l.color)));
 // a bird's shadow, only where the sun falls (painted like the cloud's: a small canvas cut by the sunlit map)
 const birdCanvas=document.createElement('canvas');birdCanvas.width=480;birdCanvas.height=270;
 const birdCtx=birdCanvas.getContext('2d')!,birdTexture=own(Texture.from(birdCanvas));
 const birdShape=document.createElement('canvas');birdShape.width=birdCanvas.width;birdShape.height=birdCanvas.height;const birdShapeCtx=birdShape.getContext('2d')!;
 const bird=new Sprite({texture:birdTexture,width:W,height:H,tint:0x5a3218,blendMode:'multiply',alpha:.75});office.addChild(bird);
 const paintBird=(p:number,t:number)=>{
  // skims the patches of sun on the floor from the window side (the sunlit map is the window and the floor patches;
  // the wall's stripes are painted into the set itself), nearer and bigger as it crosses toward the camera
  const k=birdCanvas.width/W,ctx=birdCtx,x=(300+p*980)*k,y=(745+p*150-Math.sin(p*Math.PI)*25)*k,span=(150+60*p)*k,flap=Math.sin(t*22)*.55;
  const sh=birdShapeCtx;sh.clearRect(0,0,birdCanvas.width,birdCanvas.height);
  sh.save();sh.translate(x,y);sh.rotate(.48);sh.fillStyle='#fff';
  // a gull's silhouette: each wing a leading edge out to the tip and a broad trailing edge back (a wing with chord,
  // so it never thins to a line mid-beat), and a short body
  for(const side of [-1,1]){
   sh.beginPath();sh.moveTo(0,-span*.04);
   sh.quadraticCurveTo(side*span*.5,-span*(.22+flap*.35),side*span,-span*flap*.55);
   sh.quadraticCurveTo(side*span*.6,span*.06,side*span*.18,span*.2);
   sh.lineTo(0,span*.12);sh.closePath();sh.fill();
  }
  sh.beginPath();sh.ellipse(0,span*.05,span*.07,span*.22,0,0,Math.PI*2);sh.fill();sh.restore();
  ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,birdCanvas.width,birdCanvas.height);ctx.drawImage(birdShape,0,0);
  ctx.globalCompositeOperation='destination-in';ctx.drawImage(sunlitImage,sunlitRect[0]*k,sunlitRect[1]*k,sunlitRect[2]*k,sunlitRect[3]*k);
  // and a faint trace of it where the sun is not, so the flight reads as one pass across the floor
  ctx.globalCompositeOperation='destination-over';ctx.globalAlpha=.22;ctx.drawImage(birdShape,0,0);ctx.globalAlpha=1;
  birdTexture.source.update();
 };

 // ── alley ──────────────────────────────────────────────────────────────────
 const alley=new Container();root.addChild(alley);
 // the street's reflections, rippling: a grid over the cobbles, its texture lookup bent sideways
 const sCols=72,sRows=16,sPos=new Float32Array((sCols+1)*(sRows+1)*2),sUv=new Float32Array(sPos.length),sIdx:number[]=[],sW=new Float32Array(sPos.length/2);
 for(let gy=0;gy<=sRows;gy++)for(let gx=0;gx<=sCols;gx++){const i=gy*(sCols+1)+gx,x=STREET_BOX[0]+(STREET_BOX[2]-STREET_BOX[0])*gx/sCols,y=STREET_BOX[1]+(STREET_BOX[3]-STREET_BOX[1])*gy/sRows;sPos[i*2]=x;sPos[i*2+1]=y;sUv[i*2]=x/W;sUv[i*2+1]=y/H;sW[i]=streetWeight(x,y);if(gx<sCols&&gy<sRows)sIdx.push(i,i+1,i+sCols+2,i,i+sCols+2,i+sCols+1);}
 const streetGeo=new MeshGeometry({positions:sPos,uvs:sUv,indices:new Uint32Array(sIdx)}),street=new Mesh({geometry:streetGeo,texture:textures.mgBgFree});alley.addChild(street);
 const streetLamps=STREET_LAMPS.map(([x,y,size])=>alley.addChild(spot(x,y,size,0xffb35c)));
 const reflect={pink:place('bgFxReflectPink',FX.purrfia.free.reflectPink,{blendMode:'add'}),cyan:place('bgFxReflectCyan',FX.purrfia.free.reflectCyan,{blendMode:'add'})};
 alley.addChild(reflect.pink,reflect.cyan);
 const neon=NEON.map(n=>{
  const rect=FX.purrfia.free[n.key],key='bgFx'+n.key[0].toUpperCase()+n.key.slice(1);
  const halo=spot(n.glow[0],n.glow[1],n.glow[2],n.color),lit=place(key,rect,{blendMode:'add'}),off=place(key,rect,{tint:0x2a2030,blendMode:'multiply',alpha:0});
  alley.addChild(halo,off,lit);return {...n,halo,lit,off};
 });
 const rain=new Graphics(),lids=new Graphics();alley.addChild(rain,lids);
 // headlights behind the arch, and their streaks in the wet street below it
 const car=new Container(),beamsOnStreet=new Container();alley.addChild(beamsOnStreet,car);
 const headlights=[0,1].map(()=>car.addChild(spot(0,ARCH.road,46,0xfff2d0)));
 const streaks=[0,1].map(()=>{const s=new Sprite({texture:glow,tint:0xffe8c0,anchor:{x:.5,y:0},blendMode:'add',alpha:0});s.y=ARCH.street[0];s.width=30;s.height=ARCH.street[1]-ARCH.street[0];return beamsOnStreet.addChild(s);});
 // the sky over the skyline lighting up: only the sky and the far towers in it (the blue of the painting above the
 // rooftops), strongest at the top — the brick walls either side stay as they are
 const skyFlash=new Sprite({texture:own(canvasTexture(240,70,ctx=>{
  ctx.drawImage(textures.mgBgFree.source.resource as CanvasImageSource,0,0,1920,560,0,0,240,70);
  const img=ctx.getImageData(0,0,240,70),d=img.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],y=Math.floor(i/4/240)/70,sky=smooth(14,46,b-r)*smooth(80,140,b)*(1-smooth(.55,1,y));d[i]=d[i+1]=d[i+2]=255;d[i+3]=sky*255;}
  ctx.putImageData(img,0,0);
 })),width:W,height:560,tint:0xe6e0ff,blendMode:'add',alpha:0});
 alley.addChildAt(skyFlash,0);
 const film={office:createCinemaLayer(textures.mgBgBase,OFFICE_FILM),alley:createCinemaLayer(textures.mgBgFree,ALLEY_FILM)};
 root.addChild(film.office.root,film.alley.root);

 let fg=false,reduced=false,time=0,shadeFrame=0,layoutW=W,layoutH=H;
 /** distant lightning: a bright double flicker and a slow fade, every STORM_PERIOD s (offset so it is not on load) */
 const storm=(t:number)=>{const u=(t+STORM_PERIOD-14)%STORM_PERIOD;const pulse=(a:number,len:number)=>u<a||u>a+len?0:Math.exp(-(u-a)/len*3);return Math.max(pulse(0,.10),pulse(.17,.75)*1.15);};
 /** 0..1: how far the cloud's shadow has crossed the room, or -1 between clouds */
 const sweep=(t:number)=>{const p=(t%CLOUD_PERIOD)-6;return p<0||p>SWEEP?-1:p/SWEEP;};
 // the fish sign's stutter: a few quick drops, every 9–14 s
 const DROPS=[[0,.09],[.15,.27],[.33,.5]];
 const stutter=(t:number)=>{const cycle=Math.floor(t/11.5),u=t-(cycle*11.5+hash(cycle)*3);return DROPS.some(([a,b])=>u>=a&&u<b)?1:0;};
 const blink=(t:number)=>{const cycle=Math.floor(t/6.3),start=cycle*6.3+hash(cycle+7)*2.4,u=t-start,twice=hash(cycle+3)>.7;const one=(v:number)=>v<0||v>.18?0:Math.sin(Math.PI*v/.18);return Math.max(one(u),twice?one(u-.26):0);};

 function update(dt:number){
  dt=Math.max(0,Math.min(.1,dt));if(!reduced)time+=dt;const t=time;
  office.visible=!fg;alley.visible=fg;plate.texture=fg?textures.mgBgFree:textures.mgBgBase;
  film.office.setVisible(!fg);film.alley.setVisible(fg);
  applyCamera(root,layoutW,layoutH,t,reduced);
  if(!fg){
   const s=reduced?-1:sweep(t);shade.visible=s>=0;
   if(s>=0){shadeFrame+=dt;if(shadeFrame>=1/20||!dt){shadeFrame=0;paintShade(s*(W+2300));}}
   // how much of the lit floor is under the core of the shadow
   const cover=s<0?0:smooth(0,.25,s)*(1-smooth(.75,1,s));
   shade.alpha=.7;sunGlow.alpha=(.16+.04*Math.sin(t*.4))*(1-cover);
   beams.forEach((b,i)=>{b.alpha=(.2+.06*Math.sin(t*.35+i*1.7))*(1-cover*.85);b.x=BEAMS[i][0]+Math.sin(t*.11+i)*6;});
   lamps.forEach((l,i)=>{l.alpha=(i?.14:.20)+.16*cover;});
   film.office.update(t,1-cover*.75,reduced);
   const bp=reduced?-1:((t+BIRD_PERIOD-5)%BIRD_PERIOD)/BIRD_CROSS;bird.visible=bp>=0&&bp<=1&&cover<.5;
   if(bird.visible)paintBird(bp,t);
   dust.clear();
   if(!reduced)for(let i=0;i<46;i++){
    // motes drift slowly inside the shafts and only glint where the light catches them
    const b=BEAMS[i%BEAMS.length],along=((t*(9+hash(i)*7)+hash(i+1)*1300)%1300),across=(hash(i+2)-.5)*b[2]*.7+Math.sin(t*.5+i)*8;
    const x=b[0]+Math.cos(SUN_ANGLE)*along-Math.sin(SUN_ANGLE)*across,y=b[1]+Math.sin(SUN_ANGLE)*along+Math.cos(SUN_ANGLE)*across;
    const glint=(.5+.5*Math.sin(t*(1.3+hash(i+4))+i*2.1))*(1-along/1300)*(1-cover);
    if(glint>.05)dust.circle(x,y,hash(i+5)>.7?2.6:1.7).fill({color:0xfff0c8,alpha:glint*.8});
   }
  }else{
   const hum=(i:number)=>.82+.12*Math.sin(t*1.7+i*2.3)+.06*Math.sin(t*5.3+i);
   neon.forEach((n,i)=>{
    const off=i===1&&!reduced?stutter(t):0,level=reduced?.9:hum(i)*(1-off);
    n.lit.alpha=.55*level;n.halo.alpha=.30*level;n.off.alpha=off*.85;
   });
   const pinkLevel=(neon[0].lit.alpha+neon[2].lit.alpha)/2/.55,cyanLevel=neon[1].lit.alpha/.55;
   reflect.pink.alpha=.45*pinkLevel;reflect.cyan.alpha=.5*cyanLevel;
   streetLamps.forEach((l,i)=>{l.alpha=.16+.03*Math.sin(t*.9+i*1.3)-(i===1&&!reduced&&(t%17)<.25?.1:0);});
   const flash=reduced?0:storm(t);skyFlash.alpha=.36*flash;
   film.alley.update(t,Math.min(1.25,(pinkLevel+cyanLevel)/2+.35*flash),reduced);
   // a car crosses behind the arch, left to right: two headlights, seen only in the opening, and their streaks
   const c=reduced?-1:((t+CAR_PERIOD-9)%CAR_PERIOD)/CAR_CROSS;
   car.visible=beamsOnStreet.visible=c>=0&&c<=1;
   if(car.visible){
    const x=ARCH.left-40+(ARCH.right-ARCH.left+80)*c;
    headlights.forEach((h,i)=>{const hx=x+i*16,inside=smooth(ARCH.left-8,ARCH.left+14,hx)*(1-smooth(ARCH.right-14,ARCH.right+8,hx));h.x=hx;h.alpha=.75*inside;});
    streaks.forEach((s,i)=>{const hx=x+i*16,inside=smooth(ARCH.left-8,ARCH.left+14,hx)*(1-smooth(ARCH.right-14,ARCH.right+8,hx));s.x=hx;s.alpha=.16*inside;});
   }
   // the reflections ripple: sideways mostly, a little up and down, more toward the camera; slow, two waves
   for(let i=0;i<sW.length;i++){
    const w=reduced?0:sW[i];if(w<=0)continue;const x=sPos[i*2],y=sPos[i*2+1],near=(y-680)/400;
    sUv[i*2]=(x+w*(.8+2.6*near)*(Math.sin(y*.045-t*1.9+x*.004)+.5*Math.sin(y*.11+t*1.3)))/W;
    sUv[i*2+1]=(y+w*(.4+1.1*near)*Math.sin(x*.02+y*.03-t*1.2))/H;
   }
   streetGeo.getBuffer('aUV').update();
   rain.clear();lids.clear();
   if(!reduced){
    for(let i=0;i<72;i++){
     // light rain, slanting with the wind; front drops faster, longer and brighter (the set is shown at ~0.8 scale
     // or less, so a 1 px streak would vanish)
     const near=hash(i)>.65,speed=near?1650:1150,len=near?52:30,p=(t*speed/1300+hash(i+1))%1;
     const x=(hash(i+2)*2100-90+p*140)%W,y=p*1300-110;
     rain.moveTo(x,y).lineTo(x-len*.11,y-len).stroke({color:0xd6e6ff,width:near?2.4:1.6,alpha:near?.42:.28});
    }
    for(let i=0;i<14;i++){
     // rings in the puddles, over the street only (the near half of the frame)
     const life=.7,cycle=Math.floor((t+hash(i)*life)/life),u=((t+hash(i)*life)%life)/life,seed=i*31+cycle;
     const y=800+hash(seed)*270,x=40+hash(seed+1)*1840,r=4+u*(10+(y-800)*.05);
     rain.ellipse(x,y,r*1.5,r*.48).stroke({color:0xdce8ff,width:1.8,alpha:(1-u)**1.5*.6});
    }
    const shut=blink(t);
    // the lid is the box's own dark interior coming down over the eye (it starts below the slit's cardboard edge)
    if(shut>0)for(const [x,y,w,h] of FX.purrfia.free.eyes)lids.rect(x-w*.7,y-h*.6,w*1.4,h*1.25*shut).fill(0x050302);
   }
  }
 }
 update(0);
 return {root,update,
  setLayout(width:number,height:number){layoutW=width;layoutH=height;applyCamera(root,width,height,time,reduced);},
  setState(feature:boolean,_volume:number,_paused:boolean,reduce:boolean){fg=feature;reduced=reduce;update(0);},
  /** review only: jump the set's clock, optionally into the feature's set */
  seek(seconds:number,feature=fg){time=seconds;fg=feature;update(0);},
  destroy(){film.office.destroy();film.alley.destroy();streetGeo.destroy();root.destroy({children:true});for(const t of owned)t.destroy(true);}};
}

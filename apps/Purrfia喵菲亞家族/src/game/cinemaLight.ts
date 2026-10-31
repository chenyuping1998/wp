import {Container,Sprite,Texture,TilingSprite} from 'pixi.js';
/**
 * The film layer over a painted set (user 2026-10-31: 背景動態光影要達電影程度). Everything here is light the painting
 * already implies; nothing new is painted onto the set:
 *  - bloom    the painting's own brightest areas, cut and softened at load, laid back over it additively — so a window,
 *             a neon tube or the sea's sparkle glows the way a lens sees it. It breathes very slowly.
 *  - haze     bands of slow-moving air (dust in a sunny room, fog along a wet street, sea mist at the horizon): a
 *             tileable noise baked into a soft band, two layers drifting at different speeds so it never repeats.
 *  - flares   an anamorphic streak and, for a sun, a few ghosts along the line through the frame's centre.
 *  - vignette the edges held down a touch, breathing with the light.
 *  - camera   a slow push and drift over 20–40 s, the way a film camera is never quite still. 3.5% overscan keeps the
 *             painting's edges out of frame.
 * Restraint is the brief (memory: motion-restraint-pro-feel): long periods, small amplitudes, no flicker. With reduced
 * motion the light holds still and the camera does not move.
 * All coordinates are the set's own 1920×1080 pixels.
 */
const W=1920,H=1080,TAU=Math.PI*2;
export type HazeBand={y:number;height:number;color:number;alpha:number;speed:number;scale?:number};
export type Flare={x:number;y:number;color:number;size:number;streak?:number;ghosts?:boolean};
export type CinemaPreset={
 /** luminance (0..1) where the bloom starts, and how strong it is laid back */
 bloom:{from:number;to:number;strength:number;tint?:number};
 haze:HazeBand[];
 flares:Flare[];
 vignette:number;
};
export const OVERSCAN=1.035;

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const canvas=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

/** the painting's brightest light, softened: drawn small, kept where it is bright, blurred by down- and up-sampling
 *  (ctx.filter is missing on Safari, which half the players are on) */
function bloomTexture(source:CanvasImageSource,from:number,to:number){
 const w=320,h=180,c=canvas(w,h),ctx=c.getContext('2d',{willReadFrequently:true})!;
 ctx.drawImage(source,0,0,w,h);
 const img=ctx.getImageData(0,0,w,h),d=img.data;
 for(let i=0;i<d.length;i+=4){
  // luminance only: keyed on the brightest channel, a deep blue sky counted as "bright" and, added back, its blue
  // clipped and its green climbed — the sky went teal
  const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,lum=.2126*r+.7152*g+.0722*b,k=smooth(from,to,lum);
  d[i]=d[i]*k;d[i+1]=d[i+1]*k;d[i+2]=d[i+2]*k;d[i+3]=255;
 }
 ctx.putImageData(img,0,0);
 // two soft passes: a wide glow and a tighter one over it
 const out=canvas(w,h),o=out.getContext('2d')!;o.fillStyle='#000';o.fillRect(0,0,w,h);
 for(const [k,alpha] of [[8,.9],[3,.7]] as const){
  const small=canvas(Math.ceil(w/k),Math.ceil(h/k)),s=small.getContext('2d')!;s.imageSmoothingQuality='high';s.drawImage(c,0,0,small.width,small.height);
  const mid=canvas(Math.ceil(w/2),Math.ceil(h/2)),m=mid.getContext('2d')!;m.imageSmoothingQuality='high';m.drawImage(small,0,0,mid.width,mid.height);
  o.globalCompositeOperation='lighter';o.globalAlpha=alpha;o.imageSmoothingQuality='high';o.drawImage(mid,0,0,w,h);
 }
 return Texture.from(out);
}

/** value noise that tiles horizontally, baked into a soft vertical band */
function hazeTexture(seed:number){
 const w=512,h=128,c=canvas(w,h),ctx=c.getContext('2d')!,img=ctx.createImageData(w,h),d=img.data;
 const rnd=(x:number,y:number)=>{const s=Math.sin((x*127.1+y*311.7+seed*74.7))*43758.5453;return s-Math.floor(s);};
 const noise=(x:number,y:number,period:number)=>{
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const p=(a:number)=>((a%period)+period)%period;
  const a=rnd(p(xi),yi),b=rnd(p(xi+1),yi),c2=rnd(p(xi),yi+1),e=rnd(p(xi+1),yi+1);
  return a+(b-a)*u+(c2-a)*v+(a-b-c2+e)*u*v;
 };
 for(let y=0;y<h;y++){
  const band=Math.sin(Math.PI*y/(h-1))**1.6;
  for(let x=0;x<w;x++){
   let n=0,amp=.55,f=4;
   for(let o=0;o<4;o++){n+=amp*noise(x/w*f,y/h*f*.5+o*7,f);amp*=.5;f*=2;}
   const v=smooth(.32,.8,n)*band,i=(y*w+x)*4;
   d[i]=d[i+1]=d[i+2]=255;d[i+3]=v*255;
  }
 }
 ctx.putImageData(img,0,0);return Texture.from(c);
}

const radial=(stops:[number,number][],size=128)=>{const c=canvas(size,size),ctx=c.getContext('2d')!,g=ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [at,a] of stops)g.addColorStop(at,`rgba(255,255,255,${a})`);ctx.fillStyle=g;ctx.fillRect(0,0,size,size);return Texture.from(c);};
/** a long thin horizontal glow: the anamorphic streak */
const streakTexture=()=>{const c=canvas(512,32),ctx=c.getContext('2d')!;for(let x=0;x<512;x++){const u=Math.abs(x-256)/256,a=(1-u)**2.2;const g=ctx.createLinearGradient(0,0,0,32);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x,0,1,32);}return Texture.from(c);};
const vignetteTexture=()=>{const c=canvas(320,180),ctx=c.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,320,180);ctx.setTransform(1,0,0,180/320,0,0);const g=ctx.createRadialGradient(160,160,60,160,160,205);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');ctx.globalCompositeOperation='destination-out';ctx.fillStyle=g;ctx.fillRect(0,0,320,320);return Texture.from(c);};

export function createCinemaLayer(plate:Texture,preset:CinemaPreset){
 const root=new Container();root.eventMode='none';root.label='film light';
 const owned:Texture[]=[];const own=(t:Texture)=>(owned.push(t),t);
 const bloomTex=own(bloomTexture(plate.source.resource as CanvasImageSource,preset.bloom.from,preset.bloom.to));
 const bloom=new Sprite({texture:bloomTex,width:W,height:H,blendMode:'add',tint:preset.bloom.tint??0xffffff});root.addChild(bloom);
 const hazeTex=[own(hazeTexture(1)),own(hazeTexture(2))];
 const haze=preset.haze.flatMap((band,i)=>[0,1].map(layer=>{
  const s=new TilingSprite({texture:hazeTex[layer],width:W,height:band.height,tint:band.color,blendMode:'add'});
  s.position.set(0,band.y-band.height/2);const k=(band.scale??1)*(layer?1.7:1);s.tileScale.set(k*W/512*(layer?.8:1),band.height/128);
  root.addChild(s);return {s,band,layer,i};
 }));
 const glow=own(radial([[0,1],[.18,.42],[.5,.1],[1,0]])),ring=own(radial([[0,0],[.62,0],[.8,.5],[.9,.2],[1,0]])),disc=own(radial([[0,.55],[.7,.35],[1,0]])),streak=own(streakTexture());
 const flares=preset.flares.map(f=>{
  const core=new Sprite({texture:glow,anchor:.5,tint:f.color,blendMode:'add',width:f.size,height:f.size});core.position.set(f.x,f.y);
  const line=new Sprite({texture:streak,anchor:.5,tint:f.color,blendMode:'add',width:f.size*(f.streak??4),height:f.size*.09});line.position.set(f.x,f.y);
  root.addChild(core,line);
  // ghosts: on the line from the source through the frame's centre, alternating discs and rings, smaller farther on
  const ghosts=f.ghosts?[.45,.9,1.25,1.6].map((k,j)=>{const s=new Sprite({texture:j%2?ring:disc,anchor:.5,tint:f.color,blendMode:'add'});s.position.set(f.x+(W/2-f.x)*k*1.1,f.y+(H/2-f.y)*k*1.1);s.width=s.height=f.size*(j%2?.5:.22)*(1+j*.15);root.addChild(s);return s;}):[];
  return {f,core,line,ghosts};
 });
 const vignette=new Sprite({texture:own(vignetteTexture()),width:W,height:H,blendMode:'multiply',tint:0x0a0608});root.addChild(vignette);

 return {root,
  /** t: the set's clock (s); light: 0..1 how bright the set's main light is right now (a cloud, a stutter) */
  update(t:number,light=1,reduced=false){
   const breathe=reduced?0:Math.sin(t*TAU/23)*.5+Math.sin(t*TAU/37+1.3)*.5;
   bloom.alpha=preset.bloom.strength*(.9+.1*breathe)*(.55+.45*light);
   for(const {s,band,layer,i} of haze){
    s.alpha=band.alpha*(layer?.7:1)*(.85+.15*Math.sin(t*TAU/(29+i*7)+layer));
    if(!reduced)s.tilePosition.x=t*band.speed*(layer?1.6:1)+(layer?173:0),s.tilePosition.y=Math.sin(t*TAU/41+i)*6*(layer?-1:1);
   }
   for(const [j,{f,core,line,ghosts}] of flares.entries()){
    const k=light*(.85+.15*(reduced?0:Math.sin(t*TAU/17+j*2.2)));
    core.alpha=.30*k;line.alpha=.22*k;line.width=f.size*(f.streak??4)*(.95+.05*breathe);
    for(const [g,s] of ghosts.entries())s.alpha=(g%2?.10:.08)*k;
   }
   vignette.alpha=preset.vignette*(1-.06*breathe);
  },
  setVisible(v:boolean){root.visible=v;},
  destroy(){root.destroy({children:true});for(const t of owned)t.destroy(true);}};
}

/** the camera: a slow push and drift over the cover-fitted set. Call every frame with the layout's size. */
export function applyCamera(target:Container,width:number,height:number,t:number,reduced:boolean){
 const cover=Math.max(width/W,height/H);
 const push=reduced?0:.006*Math.sin(t*TAU/31)+.004*Math.sin(t*TAU/47+.8);
 const s=cover*(OVERSCAN+push);
 // a drift of at most ~0.9% of the frame, inside the overscan
 const dx=reduced?0:(Math.sin(t*TAU/37)*.6+Math.sin(t*TAU/23+2.1)*.4)*W*.009;
 const dy=reduced?0:(Math.sin(t*TAU/43+1.1)*.6+Math.sin(t*TAU/29)*.4)*H*.006;
 target.scale.set(s);
 target.position.set((width-W*s)/2+dx*s,(height-H*s)/2+dy*s);
}

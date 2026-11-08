/** One draught across the tomb: anchored cloth, flame-tip flow and local light.
 * Pure plate-space geometry, shared by the renderer and offline visual QA. */
import {smoothstep} from './meshWin/meshRig';
import type {BgPart} from './bgMotionParts';
import fields from './tombSurfaceFields';
export function surfaceGrid(){return partGrid({key:'far',x:0,y:0,w:1920,h:1080,ax:0,ay:0},fields.cols,fields.rows);}
export function surfaceVertices(mode:'base'|'feature'|'hold',t:number,winAge:number,uvs:Float32Array,out:Float32Array){
 for(let i=0;i<out.length;i+=2){out[i]=uvs[i]*1920;out[i+1]=uvs[i+1]*1080;}
 if(mode==='base')return;
 for(const f of fields.modes[mode]){
  const w=tombWind(t,f.pivot[0],winAge),angle=w*f.amp*2.3*Math.PI/180;
  for(const [index,weight] of f.weights){
   const i=index*2,x=uvs[i]*1920,y=uvs[i+1]*1080,dx=x-f.pivot[0],dy=y-f.pivot[1];
   if(f.kind==='leaf'){
    out[i]+=weight*(-dy*Math.sin(angle)+dx*(Math.cos(angle)-1));
    out[i+1]+=weight*(dx*Math.sin(angle)+dy*(Math.cos(angle)-1));
   }else{
    const free=smoothstep(Math.abs(dy)/Math.max(80,f.rect[3]-f.rect[1]));
    const wave=Math.sin(t/1600-y/150)+.22*Math.sin(t/830-y/90);
    out[i]+=weight*free*14*f.amp*w*wave;out[i+1]+=weight*free*2.4*w*Math.sin(t/1900-x/210);
   }
  }
 }
}
export const GUST_PERIOD=11000;
export function tombWind(t:number,x:number,winAge=-1){
 const delay=x/1920*1100,local=t-900-delay;
 const cycle=local<0?-1:local%GUST_PERIOD;
 const gust=cycle<0||cycle>4700?0:cycle<1400?smoothstep(cycle/1400):1-smoothstep((cycle-1400)/3300);
 const reaction=winAge<delay?0:Math.sin(Math.PI*Math.min(1,(winAge-delay)/2400))**2*.22;
 const ambient=.32*Math.sin(t/3600-x/1800)+.13*Math.sin(t/5700+x/900);
 return (ambient+gust*.8+reaction)*smoothstep(t/1500);
}
export function partGrid(p:BgPart,cols=20,rows=18){
 const positions=new Float32Array((cols+1)*(rows+1)*2),uvs=new Float32Array(positions.length),indices=new Uint32Array(cols*rows*6);
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const i=(r*(cols+1)+c)*2;positions[i]=c/cols*p.w;positions[i+1]=r/rows*p.h;uvs[i]=c/cols;uvs[i+1]=r/rows;}
 for(let r=0,k=0;r<rows;r++)for(let c=0;c<cols;c++,k+=6){const a=r*(cols+1)+c,b=a+1,d=a+cols+1,e=d+1;indices.set([a,b,e,a,e,d],k);}
 return {positions,uvs,indices};
}
export function linenVertices(p:BgPart,t:number,winAge:number,uvs:Float32Array,out:Float32Array){
 const wind=tombWind(t,p.x+p.w/2,winAge),long=p.h>p.w*1.3;
 const strength=Math.min(long?24:12,p.h*(long?.09:.07));
 for(let i=0;i<out.length;i+=2){const u=uvs[i],v=uvs[i+1];
  // The upper seam is sewn down. A swag also keeps both side supports fixed.
  const free=smoothstep((v-.12)/.88)*(long?1:Math.sin(Math.PI*u)**2);
  const wave=Math.sin(t/950-v*5.8-p.x/700)+.24*Math.sin(t/510-v*9+p.x/1100);
  out[i]=u*p.w+strength*free*wind*(.65+.35*wave);
  out[i+1]=v*p.h+strength*.24*free*wind*Math.sin(t/1200-v*5.8);
 }
}
export function fireEnergy(t:number,seed:number){
 return .5*Math.sin(t*.0067+seed)+.3*Math.sin(t*.0113+seed*1.7)+.2*Math.sin(t*.0181+seed*2.3);
}
export function flameVertices(p:BgPart,t:number,winAge:number,uvs:Float32Array,out:Float32Array){
 const seed=p.x/130,wind=tombWind(t,p.x,winAge),f=fireEnergy(t,seed);
 for(let i=0;i<out.length;i+=2){const u=uvs[i],v=uvs[i+1],free=Math.max(0,(p.ay-v)/p.ay)**1.7;
  out[i]=u*p.w+free*(wind*10+Math.sin(t*.0041-v*5+seed)*6);
  out[i+1]=v*p.h-free*(3.5+3*f+2*Math.sin(t*.006-v*7+seed));
 }
}

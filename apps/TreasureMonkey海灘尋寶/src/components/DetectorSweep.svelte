<script lang="ts">
 import {onMount} from 'svelte';
 import { Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import {detectorHandoff} from '../game/treasureMechanicMotion';
 let reduced=$state(false);
 onMount(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>reduced=preference.matches;update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);});
 let {progress=0,power=1,preparation=1,width=118,height=472}:{progress?:number;power?:number;preparation?:number;width?:number;height?:number}=$props();
 const hash=(i:number)=>{const n=Math.sin(i*127.1+53.7)*43758.5453;return n-Math.floor(n);};
 const draw=(g:PixiGraphics)=>{
  g.clear();if(power<=0)return;
  const left=-width*.46,right=width*.46;
  const handoff=detectorHandoff(preparation,progress);
  if(handoff.acquisition>.001&&!reduced){
   const r=handoff.radius;
   for(let i=0;i<3;i++){
    const a=(preparation*1.5+i*2.1),span=.7;
    g.moveTo(Math.cos(a)*(r+i*4),8+Math.sin(a)*(r+i*4));
    for(let k=1;k<=8;k++)g.lineTo(Math.cos(a+span*k/8)*(r+i*4),8+Math.sin(a+span*k/8)*(r+i*4));
    g.stroke({color:i===1?0xfff5dc:0x278891,width:i===1?2:3,alpha:handoff.acquisition*power});
   }
  }
  if(preparation<1)return;
  if(progress<=0)return;
  const y=Math.min(height,progress*height),bow=reduced?0:Math.sin(progress*Math.PI*2)*5;
  const beamPower=power*handoff.beam;
  g.roundRect(left,0,right-left,y,9).fill({color:0x63c7c2,alpha:.07*power});
  for(let i=0;i<5;i++){
   const dy=y-i*6;if(dy<0)continue;
   g.moveTo(left+3,dy).bezierCurveTo(left*.3,dy-5+bow,right*.4,dy+3-bow,right-3,dy-2).stroke({width:Math.max(1,7-i),color:i===0?0x278891:0x9ce2d3,alpha:beamPower*(1-i/5)*.65});
  }
  g.moveTo(left+3,y-2).quadraticCurveTo(bow,y-9,right-3,y-2).stroke({width:2.2,color:0xfff6db,alpha:beamPower});
  // Grain seeds advect behind the sweep, with unequal sizes and flight arcs.
  if(!reduced)for(let i=0;i<28;i++){
   const age=(progress*3.1+hash(i+3))%1,x=left+hash(i+19)*(right-left);
   const dy=-Math.sin(age*Math.PI)*(8+hash(i+11)*21),r=1+hash(i+51)*1.6;
   g.ellipse(x+(hash(i+71)-.5)*age*22,Math.min(height-2,Math.max(1,y+dy)),r,r*.6).fill({color:i%3?0xd6b17a:0xffedc5,alpha:(1-age)*power});
  }
  // A short response at each crossed cell boundary follows the exact linear
  // conversion clock; the graphic never advances the evaluated Wild rows.
  for(let row=1;row<=4;row++){
   const age=(progress-row/4)*4;if(age<0||age>.48)continue;
   const rowY=Math.min(height-4,row*height/4);
   g.moveTo(left+8,rowY).quadraticCurveTo(0,rowY-10*age,right-8,rowY).stroke({color:0xfff4d6,width:2.5*(1-age),alpha:(1-age/.48)*power*.7});
  }
 };
</script>
<Graphics draw={draw}/>

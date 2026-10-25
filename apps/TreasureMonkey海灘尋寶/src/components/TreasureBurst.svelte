<script lang="ts">
 import { onMount } from 'svelte';
 import { Container,Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 let {x=0,y=0,scale=1,delay=0,flavour='gold',oncomplete=()=>{}}:{x?:number;y?:number;scale?:number;delay?:number;flavour?:'gold'|'neon';oncomplete?:()=>void}=$props();
 let time=$state(-1);
 const grains=Array.from({length:22},(_,i)=>({vx:(i-10.5)*12,vy:-150-(i%5)*22,lag:(i%3)*.018,r:2+i%4}));
 onMount(()=>{let raf=0;const start=performance.now()+delay;const tick=(now:number)=>{time=(now-start)/1000;if(time>=.95){oncomplete();return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
 const draw=(g:PixiGraphics)=>{g.clear();if(time<0)return;grains.forEach((p,i)=>{
  const t=time-p.lag;if(t<0)return;const px=p.vx*t,py=p.vy*t+250*t*t,alpha=Math.max(0,Math.min(1,(.9-t)/.3));
  if(i%5===0&&flavour==='gold')g.ellipse(px,py,p.r*Math.max(.25,Math.abs(Math.cos(t*8))),p.r).fill({color:0xf5c232,alpha}).stroke({width:1.2,color:0x946228,alpha});
  else g.poly([px-p.r,py,px,py-p.r*.7,px+p.r,py,px,py+p.r*.7]).fill({color:i%3?0xd5ad69:0xffedc5,alpha});
 });};
</script>
<Container {x} {y} {scale}><Graphics draw={draw}/></Container>

<script lang="ts">
 import { onMount } from 'svelte';
 import { Container,Sprite,Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 let {width,height,oncover=()=>{},oncomplete=()=>{},previewTime,playbackRate=1}:{width:number;height:number;oncover?:()=>void;oncomplete?:()=>void;previewTime?:number;playbackRate?:number}=$props();
 let clock=$state(0);
 const time=$derived(previewTime??clock);
 const reveal=$derived(time>=680);
 const textureHeight=$derived(height*1.08);
 const textureWidth=$derived(Math.max(width*1.08,textureHeight*1.5));
 const progress=$derived(Math.min(1,Math.max(0,(time-(reveal?680:0))/(reveal?600:500))));
 // Start beyond the complete spray silhouette; finish with opaque water over
 // every pixel. Hold the same cover/swap/reveal timing as the game contract.
 const edge=$derived(time>=500&&!reveal?width+textureWidth*.4:(width+textureWidth*.8)*(1-(1-progress)**3)-textureWidth*.4);
 const imageLeft=$derived(reveal?edge+textureWidth*.8:edge-textureWidth*.8);
 const imageY=$derived(-height*.04+Math.sin(time/320)*height*.012);
 onMount(()=>{
  if(previewTime!==undefined)return;
  let raf=0,previous=performance.now(),covered=false;
  const tick=(now:number)=>{
   if(!document.hidden)clock+=Math.max(0,now-previous)*playbackRate;
   previous=now;
   if(!covered&&clock>=500){covered=true;oncover();}
   if(clock>=1280){oncomplete();return;}
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 });
 const drawWater=(g:PixiGraphics)=>{
  g.clear();
  // Extend only the opaque back of the painted plate. Foam keeps its original
  // alpha, fine spray and interconnected pockets rather than vector outlines.
  const seam=imageLeft+(reveal?-1:1)*textureWidth*.55;
  if(reveal){if(seam<width)g.rect(Math.max(0,seam),0,width-Math.max(0,seam),height).fill(0x00acc4);}
  else if(seam>0)g.rect(0,0,Math.min(width,seam),height).fill(0x00acc4);
 };
</script>
<Container>
 <Graphics isMask draw={drawWater}/>
 <Sprite key="treasureWaveWater" width={width} height={height}/>
</Container>
<Container x={imageLeft} y={imageY} scale={{x:reveal?-1:1,y:1}}>
 <Sprite key="treasureWaveSurf" width={textureWidth} height={textureHeight}/>
</Container>

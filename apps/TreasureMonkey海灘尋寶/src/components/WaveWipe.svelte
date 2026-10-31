<script lang="ts">
 import { onMount } from 'svelte';
 import { Container,Sprite,Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import {waveWipePose} from '../game/waveWipe';
 let {width,height,oncover=()=>{},oncomplete=()=>{},previewTime,playbackRate=1}:{width:number;height:number;oncover?:()=>void;oncomplete?:()=>void;previewTime?:number;playbackRate?:number}=$props();
 let clock=$state(0);
 const time=$derived(previewTime??clock);
 const pose=$derived(waveWipePose(time,width,height));
 const imageY=$derived(-height*.04);
 onMount(()=>{
  if(previewTime!==undefined)return;
  let covered=false,finished=false;
  return subscribePresentationFrame(delta=>{
   if(finished)return;
   clock+=Math.min(delta,48)*playbackRate;
   if(!covered&&clock>=500){covered=true;oncover();}
   if(clock>=1280){finished=true;oncomplete();}
  });
 });
 const drawWater=(g:PixiGraphics)=>{
  g.clear();
  // Extend only the opaque back of the painted plate. Foam keeps its original
  // alpha, fine spray and interconnected pockets rather than vector outlines.
  const {seam,reveal}=pose;
  if(reveal){if(seam<width)g.rect(Math.max(0,seam),0,width-Math.max(0,seam),height).fill(0x00acc4);}
  else if(seam>0)g.rect(0,0,Math.min(width,seam),height).fill(0x00acc4);
 };
</script>
<Container>
 <Graphics isMask draw={drawWater}/>
 <Sprite key="treasureWaveWater" width={width} height={height}/>
</Container>
<Container x={pose.imageLeft} y={imageY} scale={{x:pose.reveal?-1:1,y:1}}>
 <Sprite key="treasureWaveSurf" width={pose.textureWidth} height={pose.textureHeight}/>
</Container>

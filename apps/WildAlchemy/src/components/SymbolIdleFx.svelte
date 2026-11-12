<script lang="ts">
 import { Graphics, Sprite } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import type { IdleFrame } from '../game/symbolIdleMotion';
 import { SYMBOL_SIZE } from '../game/constants';
 type Props = { name:string; frame:IdleFrame; assetKey:string; width:number; height:number };
 const props:Props=$props();
 const draw=(g:PixiGraphics) => {
  g.clear();
  if(props.name==='H4') {
   // Three fine ink-edged steam curls rise directly from the mug's mouth.
   for(let i=0;i<3;i++) {
    const u=(props.frame.loopU+i/3)%1;
    const x=(-0.06+i*.045+Math.sin(u*7+i)*.018)*SYMBOL_SIZE;
    const y=(-.11-u*.22)*SYMBOL_SIZE;
    const a=Math.sin(Math.PI*u)*(.35+.4*props.frame.act);
    g.moveTo(x,y);g.bezierCurveTo(x-5,y-5,x+7,y-11,x+2,y-19);
    g.stroke({color:0x201b16,width:3,alpha:a*.8});
    g.moveTo(x,y);g.bezierCurveTo(x-5,y-5,x+7,y-11,x+2,y-19);
    g.stroke({color:0xd5cbb7,width:1.2,alpha:a});
   }
  }
 };
</script>
{#if props.name==='H4'}<Graphics {draw} />{/if}
{#if (props.name==='H5' || props.name==='SW') && props.frame.act>0.01}
 <Sprite key={props.assetKey} anchor={0.5} width={props.width} height={props.height}
  tint={props.name==='SW'?0x9dc6dc:0xc8b998} alpha={props.frame.act*(props.name==='SW'?.48:.32)} blendMode="add" />
{/if}

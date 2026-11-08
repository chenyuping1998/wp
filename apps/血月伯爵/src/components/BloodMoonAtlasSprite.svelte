<script lang="ts">
 import {BaseSprite} from 'pixi-svelte';
 import {Texture,Rectangle} from 'pixi.js';
 import {getContext} from '../game/context';
 const {asset,frame,columns=1,rows=8,x,y,width,height,alpha=1,tint=0xffffff,rotation=0}:{asset:string;frame:number;columns?:number;rows?:number;x:number;y:number;width:number;height:number;alpha?:number;tint?:number;rotation?:number}=$props();
 const context=getContext();
 const source=$derived(context.stateApp.loadedAssets?.[asset] as Texture|undefined);
 let slices=$state<Texture[]>([]);
 $effect(()=>{
  const texture=source;
  if(!texture)return;
  const w=texture.width/columns,h=texture.height/rows;
  slices=Array.from({length:columns*rows},(_,i)=>new Texture({source:texture.source,frame:new Rectangle(i%columns*w,Math.floor(i/columns)*h,w,h)}));
  return()=>{for(const item of slices)item.destroy(false);slices=[];};
 });
 // The atlas is a shared immutable GPU texture; only frame rectangles change.
 let selected=$derived(slices[((Math.floor(frame)%(columns*rows))+columns*rows)%(columns*rows)]);
</script>
{#if selected}<BaseSprite texture={selected} anchor={.5} {x} {y} {width} {height} {alpha} {tint} {rotation}/>{/if}

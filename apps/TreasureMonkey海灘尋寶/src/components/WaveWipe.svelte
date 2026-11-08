<script lang="ts">
 import { onMount } from 'svelte';
 import { getContextApp,getContextParent } from 'pixi-svelte';
 import { Mesh,MeshGeometry,Texture,TilingSprite,Container as PixiContainer,Graphics as PixiGraphicsObject } from 'pixi.js';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import {waveWipePose,waveFrontOffset,WAVE_COVER_MS,WAVE_END_MS} from '../game/waveWipe';
 let {width,height,oncover=()=>{},oncomplete=()=>{},previewTime,playbackRate=1}:{width:number;height:number;oncover?:()=>void;oncomplete?:()=>void;previewTime?:number;playbackRate?:number}=$props();
 let clock=$state(0);
 const time=$derived(previewTime??clock);
 const pose=$derived(waveWipePose(time,width,height));
 const imageY=$derived(-height*.04);
 const app=getContextApp(),parent=getContextParent();

 // Water body: tiles behind the surf and drifts at its own pace (about a
 // third of the front's travel plus a slow current), so the mass of water is
 // not glued to its foam edge.
 const water=new TilingSprite({texture:Texture.EMPTY,width:1,height:1});
 const mask=new PixiGraphicsObject();
 const waterLayer=new PixiContainer();
 waterLayer.addChild(water,mask);water.mask=mask;
 // Surf front: a grid mesh over the painted surf so the foam can ripple.
 const COLS=28,ROWS=18;
 const rest=new Float32Array((COLS+1)*(ROWS+1)*2),uvs=new Float32Array(rest.length),indices=new Uint32Array(COLS*ROWS*6);
 for(let r=0;r<=ROWS;r++)for(let c=0;c<=COLS;c++){const i=(r*(COLS+1)+c)*2;uvs[i]=c/COLS;uvs[i+1]=r/ROWS;}
 for(let r=0,o=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const a=r*(COLS+1)+c,b=a+1,d=a+COLS+1,e=d+1;indices.set([a,b,d,b,e,d],o);o+=6;}
 const geometry=new MeshGeometry({positions:rest,uvs,indices});
 const surf=new Mesh({geometry,texture:Texture.EMPTY});
 parent.addToParent(waterLayer);parent.addToParent(surf);

 $effect(()=>{
  const assets=app.stateApp.loadedAssets;
  const waterTexture=(assets.treasureWaveWater as Texture)??Texture.EMPTY;
  water.texture=waterTexture;surf.texture=(assets.treasureWaveSurf as Texture)??Texture.EMPTY;
  water.width=width;water.height=height;
  const tile=height/Math.max(1,waterTexture.height);water.tileScale.set(tile);
  water.tilePosition.set(pose.imageLeft*.35+time*.045,0);
  mask.clear();
  const {seam}=pose;
  if(seam>0)mask.rect(0,0,Math.min(width,seam),height).fill(0xffffff);
  waterLayer.visible=seam>0;
  // Surf mesh positions in screen px.
  for(let r=0;r<=ROWS;r++)for(let c=0;c<=COLS;c++){
   const i=(r*(COLS+1)+c)*2,u=c/COLS,v=r/ROWS,o=waveFrontOffset(u,v,time,pose);
   rest[i]=pose.imageLeft+u*pose.textureWidth+o.x;rest[i+1]=imageY+v*pose.textureHeight+o.y;
  }
  geometry.getBuffer('aPosition').update();
  surf.alpha=pose.alpha;surf.visible=pose.imageLeft<width&&pose.imageLeft+pose.textureWidth>0;
 });
 onMount(()=>{
  const stop=previewTime!==undefined?()=>{}:(()=>{
   let covered=false,finished=false;
   return subscribePresentationFrame(delta=>{
    if(finished)return;
    clock+=Math.min(delta,48)*playbackRate;
    if(!covered&&clock>=WAVE_COVER_MS){covered=true;oncover();}
    if(clock>=WAVE_END_MS){finished=true;oncomplete();}
   });
  })();
  return()=>{stop();geometry.destroy();};
 });
</script>

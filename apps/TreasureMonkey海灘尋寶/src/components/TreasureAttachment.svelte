<script lang="ts">
 import {Sprite as PixiSprite,Texture,Rectangle} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import frames from '../game/treasureAttachmentFrames.json';
 let {frameKey,width,height,x=0,y=0,anchorX=.5,anchorY=.5,tint,alpha=1}:{frameKey:keyof typeof frames;width:number;height:number;x?:number;y?:number;anchorX?:number;anchorY?:number;tint?:number;alpha?:number}=$props();
 const app=getContextApp(),parent=getContextParent(),sprite=new PixiSprite(Texture.EMPTY);
 parent.addToParent(sprite);
 $effect(()=>{
  const frame=frames[frameKey],atlas=app.stateApp.loadedAssets[frame.atlas] as Texture|undefined;
  if(!atlas)return;
  const [x,y,width,height]=frame.rect;
  const texture=new Texture({source:atlas.source,frame:new Rectangle(x,y,width,height)});
  sprite.texture=texture;
  return()=>texture.destroy(false);
 });
 $effect(()=>{
  // Reapply dimensions after the atlas becomes available or the frame changes.
  app.stateApp.loadedAssets[frames[frameKey].atlas];
  sprite.position.set(x,y);sprite.anchor.set(anchorX,anchorY);sprite.width=width;sprite.height=height;sprite.tint=tint??0xffffff;sprite.alpha=alpha;
 });
</script>

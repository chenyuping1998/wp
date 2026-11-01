<script lang="ts">
 import { getContextApp, getContextParent } from 'pixi-svelte';
 import { Sprite, Texture, Rectangle } from 'pixi.js';
 type Props={ assetKey:string; mode:'base'|'lockdown'|'riot'|'breakout'; x:number; y:number; width:number; height:number; time:number };
 const props:Props=$props();
 const app=getContextApp();const parent=getContextParent();
 // Fixture/flame rectangles measured in the approved 1920x1080 plates.
 // Reuse their actual pixels, with no new drawing or download. Additive patches
 // are direct siblings of the plate, without an intervening mask/filter.
 const regions={
  base:[[112,302,48,80],[1710,309,50,86],[1512,371,30,52]],
  lockdown:[[94,360,40,88],[1780,340,46,85],[1571,52,35,48]],
  riot:[[235,282,138,136],[1515,288,140,130]],
  breakout:[[62,16,235,190],[1775,123,103,150]],
 } as const;
 let patches = $state.raw<{sprite:Sprite;texture:Texture;box:readonly number[]}[]>([]);
 $effect(()=>{
  const texture=app.stateApp.loadedAssets[props.assetKey] as Texture|undefined;
  const boxes=regions[props.mode];if(!texture?.source)return;
  const made=boxes.map(box=>{
   const [x,y,w,h]=box;
   const crop=new Texture({source:texture.source,frame:new Rectangle(x,y,w,h)});
   const sprite=new Sprite({texture:crop,blendMode:'add'});
   sprite.label=`ht-scene-${props.mode}`;parent.addToParent(sprite);
   return {sprite,texture:crop,box};
  });patches=made;
  return ()=>{patches=[];for(const p of made){p.sprite.destroy();p.texture.destroy(false);}};
 });
 $effect(()=>{
  const sx=props.width/1920,sy=props.height/1080,t=props.time;
  patches.forEach(({sprite,box},i)=>{
   const [x,y,w,h]=box;sprite.position.set(props.x+x*sx,props.y+y*sy);sprite.width=w*sx;sprite.height=h*sy;
   if(props.mode==='riot')sprite.alpha=.12+.32*(.5+.5*Math.sin(t*7.3+i*2))*(.65+.35*Math.sin(t*13.7+i));
   else if(props.mode==='lockdown')sprite.alpha=.12+.55*Math.max(0,Math.sin(t*2.4+i*2))**5;
   else if(props.mode==='breakout')sprite.alpha=.06+.3*Math.max(0,Math.sin(t*.85+i*2.7))**8;
   else sprite.alpha=.05+.22*(.5+.5*Math.sin(t*1.7+i))*(Math.sin(t*11+i)>.91?.25:1);
  });
 });
</script>

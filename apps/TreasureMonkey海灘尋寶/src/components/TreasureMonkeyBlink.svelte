<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Mesh,MeshGeometry,Sprite,Texture} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {createSymbolSkin,skinSymbol,monkeyBlinkFrame} from '../game/treasureSymbolRig';
 let {width,height,time,reduced=false}:{width:number;height:number;time:number;reduced?:boolean}=$props();
 const app=getContextApp(),parent=getContextParent(),view=new Container();
 const skin=createSymbolSkin('W',40),positions=new Float32Array(skin.rest.length);
 const geometry=new MeshGeometry({positions,uvs:skin.uvs,indices:skin.indices});
 const face=new Mesh({geometry,texture:Texture.EMPTY}),mask=new Sprite(Texture.EMPTY);
 const frame=$derived(monkeyBlinkFrame(time,reduced));
 view.addChild(face,mask);view.mask=mask;mask.anchor.set(.5);
 onMount(()=>{
  // Code-native feather mask confines the new eyelid painting to the sockets.
  // The original silhouette, hat, nose, smile and badge are never replaced.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');
  if(!ctx)return()=>{view.destroy({children:true});geometry.destroy();};
  for(const [cx,cy,rx,ry] of [[.529,.457,.091,.098],[.663,.443,.062,.079]]){
   ctx.save();ctx.translate(cx*512,cy*512);ctx.scale(rx*512,ry*512);
   const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
   gradient.addColorStop(0,'white');gradient.addColorStop(.76,'white');gradient.addColorStop(1,'transparent');
   ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
  const maskTexture=Texture.from(canvas);mask.texture=maskTexture;mask.width=width;mask.height=height;
  parent.parent.addChild(view);
  return()=>{view.destroy({children:true});geometry.destroy();maskTexture.destroy(true);};
 });
 $effect(()=>{
  face.texture=(app.stateApp.loadedAssets[frame===2?'treasureMonkeyBlinkClosed':'treasureMonkeyBlinkHalf'] as Texture)??Texture.EMPTY;
  face.scale.set(width,height);mask.width=width;mask.height=height;
  skinSymbol(skin,'W',time,reduced,positions);geometry.getBuffer('aPosition').update();
  view.alpha=1;view.visible=frame>0;
 });
</script>

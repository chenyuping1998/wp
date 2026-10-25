<script lang="ts">
 import {Mesh,MeshGeometry,Texture} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount} from 'svelte';
 import {createBeachMesh,deformBeachMesh} from '../game/treasureBeachMotion';
 import {subscribePresentationFrame} from '../game/presentationClock';

 let {x=0,y=0,width,height,anchor=0,previewTime,reduced=false}:{
  x?:number;y?:number;width:number;height:number;anchor?:number|{x:number;y:number};
  previewTime?:number;reduced?:boolean;
 }=$props();
 const app=getContextApp(),parent=getContextParent(),skin=createBeachMesh();
 const positions=skin.rest.slice();
 const geometry=new MeshGeometry({positions,uvs:skin.uvs,indices:skin.indices});
 const mesh=new Mesh({geometry,texture:Texture.EMPTY});
 let clock=$state(0),preference=$state(false);
 const calm=$derived(reduced||preference),time=$derived(previewTime??clock);
 parent.addToParent(mesh);

 $effect(()=>{
  mesh.texture=(app.stateApp.loadedAssets.hmBgBase as Texture)??Texture.EMPTY;
  const ax=typeof anchor==='number'?anchor:anchor.x,ay=typeof anchor==='number'?anchor:anchor.y;
  mesh.position.set(x-width*ax,y-height*ay);mesh.scale.set(width,height);
 });
 $effect(()=>{
  deformBeachMesh(skin,time,calm,positions);
  geometry.getBuffer('aPosition').update();
 });
 onMount(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>preference=media.matches;
  update();media.addEventListener('change',update);
  const unsubscribe=subscribePresentationFrame(delta=>{
   if(!calm&&previewTime===undefined&&delta>0)clock+=delta;
  });
  return()=>{
   unsubscribe();media.removeEventListener('change',update);
   // The parent context destroys the mesh. This geometry is ours; the loaded
   // texture belongs to the asset cache and must remain alive for other scenes.
   geometry.destroy();
  };
 });
</script>

<script lang="ts">
 import {Mesh,MeshGeometry,type Texture} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount} from 'svelte';
 import {surfaceGrid,surfaceVertices} from '../game/mummyAmbienceMotion';
 import {getContext} from '../game/context';
 const {mode,textureKey,x,y,width,height,active=true}:{mode:'base'|'feature'|'hold';textureKey:string;x:number;y:number;width:number;height:number;active?:boolean}=$props();
 const app=getContextApp(),parent=getContextParent(),context=getContext();let winStarted=-1;
 context.eventEmitter.subscribeOnMount({winLinesShow:()=>{winStarted=performance.now();}});
 onMount(()=>{
  const texture=app.stateApp.loadedAssets?.[textureKey] as Texture|undefined;if(!texture)return;
  const grid=surfaceGrid(),geometry=new MeshGeometry(grid),mesh=new Mesh({geometry,texture});mesh.label=`${mode} pinned background`;parent.parent.addChildAt(mesh,0);
  const start=performance.now();let raf=0;
  const tick=(now:number)=>{
   if(active){mesh.position.set(x,y);mesh.scale.set(width/1920,height/1080);surfaceVertices(mode,now-start,winStarted<0?-1:now-winStarted,grid.uvs,grid.positions);geometry.getBuffer('aPosition').update();}
   raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(raf);mesh.destroy();geometry.destroy();};
 });
</script>

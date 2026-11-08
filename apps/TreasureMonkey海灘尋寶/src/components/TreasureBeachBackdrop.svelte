<script lang="ts">
 import {Mesh,MeshGeometry,Texture,Container,Graphics,Sprite} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount,untrack} from 'svelte';
 import {createBeachMesh,deformBeachMesh} from '../game/treasureBeachMotion';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import {skin as skinProp} from '../game/bgMeshRig';
 import {BEACH_PROPS,BG_CANVAS} from '../game/treasureBgProps';
 import {drawBeachLife} from '../game/treasureBeachLife';
 import {CLOUD_BAND} from '../game/treasureCloudBand';
 import {cloudOffset,CLOUD_WIDTH} from '../game/treasureClouds';

 let {x=0,y=0,width,height,anchor=0,previewTime,reduced=false,gustSeq=0}:{
  x?:number;y?:number;width:number;height:number;anchor?:number|{x:number;y:number};
  previewTime?:number;reduced?:boolean;
  /** bumped on a win: sends a gust across the beach */
  gustSeq?:number;
 }=$props();
 const app=getContextApp(),parent=getContextParent(),skin=createBeachMesh();
 const positions=skin.rest.slice();
 const geometry=new MeshGeometry({positions,uvs:skin.uvs,indices:skin.indices});
 const mesh=new Mesh({geometry,texture:Texture.EMPTY});
 let clock=$state(0),preference=$state(false);
 const calm=$derived(reduced||preference),time=$derived(previewTime??clock);
 parent.addToParent(mesh);
 // The clouds drift (game/treasureClouds.ts): two wrapped copies of the cut
 // strip under a soft-edged window mask, then the band's land over them so
 // they pass behind the mountains, islands and lighthouse.
 const sky=new Container(),cloudA=new Sprite(Texture.EMPTY),cloudB=new Sprite(Texture.EMPTY),horizon=new Sprite(Texture.EMPTY);
 const cloudBank=new Container();cloudBank.addChild(cloudA,cloudB);
 const windowFade=fadeTexture(),windowMask=new Sprite(windowFade);
 windowMask.position.set(CLOUD_BAND.x0,CLOUD_BAND.y0);windowMask.setSize(CLOUD_WIDTH,CLOUD_BAND.y1-CLOUD_BAND.y0);
 cloudBank.mask=windowMask;
 horizon.position.set(CLOUD_BAND.x0,CLOUD_BAND.y0);
 sky.addChild(cloudBank,windowMask,horizon);
 parent.addToParent(sky);
 function fadeTexture(){
  // alpha 0 -> 1 -> 0 across the window: clouds dissolve at its edges
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1;
  const g=canvas.getContext('2d')!,edge=CLOUD_BAND.fade/CLOUD_WIDTH,grad=g.createLinearGradient(0,0,256,0);
  grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(edge,'rgba(255,255,255,1)');
  grad.addColorStop(1-edge,'rgba(255,255,255,1)');grad.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=grad;g.fillRect(0,0,256,1);
  return Texture.from(canvas);
 }
 // Palms, umbrella and plants in one wind (game/treasureBgProps.ts):
 // meshes over rectangles of the same plate, so at rest they ARE the plate.
 // Gulls and the lighthouse beacon are drawn over them (treasureBeachLife.ts).
 const propLayer=new Container(),life=new Graphics();
 const windProps=BEACH_PROPS.map(spec=>{
  const positions=new Float32Array(spec.rig.rest),geometry=new MeshGeometry({positions,uvs:spec.rig.uvs,indices:spec.rig.indices});
  const piece=new Mesh({geometry,texture:Texture.EMPTY});propLayer.addChild(piece);
  return {spec,positions,geometry,piece};
 });
 propLayer.addChild(life);
 parent.addToParent(propLayer);
 let gustStart=-1;
 $effect(()=>{if(gustSeq>0)untrack(()=>{gustStart=time;});});

 $effect(()=>{
  const assets=app.stateApp.loadedAssets;
  mesh.texture=(assets.hmBgClean as Texture)??(assets.hmBgBase as Texture)??Texture.EMPTY;
  cloudA.texture=cloudB.texture=(assets.hmBgClouds as Texture)??Texture.EMPTY;
  horizon.texture=(assets.hmBgHorizon as Texture)??Texture.EMPTY;
  const ax=typeof anchor==='number'?anchor:anchor.x,ay=typeof anchor==='number'?anchor:anchor.y;
  mesh.position.set(x-width*ax,y-height*ay);mesh.scale.set(width,height);
  propLayer.position.set(x-width*ax,y-height*ay);propLayer.scale.set(width/BG_CANVAS[0],height/BG_CANVAS[1]);
  sky.position.copyFrom(propLayer.position);sky.scale.copyFrom(propLayer.scale);
  for(const p of windProps)p.piece.texture=mesh.texture;
 });
 $effect(()=>{
  deformBeachMesh(skin,time,calm,positions);
  geometry.getBuffer('aPosition').update();
  const env={t:calm?0:time,gustT:calm||gustStart<0?-1:time-gustStart};
  for(const p of windProps){skinProp(p.spec.rig,p.spec.drive(p.spec.rig,env),p.spec.rect[3],p.positions);p.geometry.getBuffer('aPosition').update();}
  drawBeachLife(life,time,calm);
  const drift=cloudOffset(env,calm);
  cloudA.position.set(CLOUD_BAND.x0+drift,CLOUD_BAND.y0);cloudB.position.set(CLOUD_BAND.x0+drift-CLOUD_WIDTH,CLOUD_BAND.y0);
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
   for(const p of windProps)p.geometry.destroy();
   windowFade.destroy(true); // our own canvas gradient, not cached art
  };
 });
</script>

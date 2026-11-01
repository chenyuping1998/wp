<script lang="ts">
 import { Container, Sprite, Matrix, type Texture } from 'pixi.js';
 import { getContextApp, getContextParent } from 'pixi-svelte';
 import { onDestroy } from 'svelte';
 import mg from '../game/sumoMotion_mg.json';
 import fg from '../game/sumoMotion_fg.json';
 // Baked at 30fps from the tool's Spine4.3 IK/physics. Shared runtime is4.2.
 type Props={x?:number;y?:number;height:number;cast?:'mg'|'fg';animation?:string;loop?:boolean;mirror?:boolean;animationTime?:number;restart?:number;oncomplete?:()=>void};
 const props:Props=$props();
 const app=getContextApp(),parent=getContextParent();
 const root=new Container();root.label='SumoFigure spine-motion4.3';parent.addToParent(root);
 let sprites:Sprite[]=[],time=0,finished=false,token='';
 let rendered:number[][]=[],blendFrom:number[][]=[],blendTime=.18;
 const BLEND_SECONDS=.18;
 const matrix=new Matrix();
 const data=$derived(props.cast==='fg'?fg:mg);
 const clip=$derived(data.clips[(props.animation??'idle') as keyof typeof data.clips]??data.clips.idle);
 $effect(()=>{const key=`${props.cast??'mg'}/${props.animation??'idle'}/${props.restart??0}`;if(key!==token){blendFrom=token.startsWith(`${props.cast??'mg'}/`)?rendered.map(v=>v.slice()):[];blendTime=0;token=key;time=0;finished=false;}});
 $effect(()=>{
  const cast=props.cast??'mg';const loaded=app.stateApp.loadedAssets;if(!loaded)return;
  for(const sprite of sprites)sprite.destroy();sprites=[];
  for(const name of data.names){
   const texture=loaded[`sumo_${cast}_${name}` as keyof typeof loaded] as Texture|undefined;
   if(!texture)continue;
   const sprite=new Sprite(texture);sprite.label=`sumo ${name}`;root.addChild(sprite);sprites.push(sprite);
  }
 });
 $effect(()=>{root.position.set(props.x??0,props.y??0);root.scale.set((props.mirror?-1:1)*props.height/data.height,props.height/data.height);});
 const tick=(ticker:{deltaMS:number})=>{
  const dt=Math.min(ticker.deltaMS,100)/1000;time+=dt;blendTime+=dt;
  const loop=props.loop??true,clock=props.animationTime??time,t=loop?clock%clip.duration:Math.min(clock,clip.duration);
  const f=Math.min(t*clip.fps,clip.frames.length-1),a=Math.floor(f),b=Math.min(a+1,clip.frames.length-1),mix=f-a;
  for(let i=0;i<sprites.length;i++){
   const left=clip.frames[a][i],right=clip.frames[b][i];if(!left||!right)continue;
   let v=left.map((n,j)=>n+(right[j]-n)*mix);
   // Blend complete evaluated poses from the official 4.3 bake. Shared joint
   // points follow the same interpolation; do not shrink or crossfade the art.
   if(props.animationTime===undefined&&blendFrom[i]&&blendTime<BLEND_SECONDS){
    const p=Math.min(1,blendTime/BLEND_SECONDS),weight=p*p*(3-2*p);
    v=v.map((n,j)=>blendFrom[i][j]+(n-blendFrom[i][j])*weight);
   }
   rendered[i]=v;
   matrix.set(v[0],v[1],v[2],v[3],v[4],v[5]);sprites[i].setFromMatrix(matrix);
  }
  if(!loop&&clock>=clip.duration&&!finished){finished=true;props.oncomplete?.();}
 };
 $effect(()=>{const ticker=app.stateApp.pixiApplication?.ticker;ticker?.add(tick);return()=>{ticker?.remove(tick);};});
 onDestroy(()=>{root.destroy({children:true});});
</script>

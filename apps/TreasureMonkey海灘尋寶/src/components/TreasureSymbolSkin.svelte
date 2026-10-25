<script lang="ts">
 import {Mesh,MeshGeometry,Texture,Graphics as PixiGraphics} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount,untrack} from 'svelte';
 import {createSymbolSkin,skinSymbol,SYMBOL_RIGS,symbolBoneMatrices,applyMatrix} from '../game/treasureSymbolRig';
 let {name,assetKey,width,height,time,reduced=false,tint,alpha=1,overlay=false,debugBones=false}:{name:string;assetKey:string;width:number;height:number;time:number;reduced?:boolean;tint?:number;alpha?:number;overlay?:boolean;debugBones?:boolean}=$props();
 const app=getContextApp(),parent=getContextParent();
 // A skin is allocated once per mounted win, never for idle/spinning symbols.
 const skin=untrack(()=>createSymbolSkin(name,name==='W'?40:24)),positions=new Float32Array(skin.rest.length);
 const geometry=new MeshGeometry({positions,uvs:skin.uvs,indices:skin.indices});
 const mesh=new Mesh({geometry,texture:Texture.EMPTY});
 const debug=new PixiGraphics();
 parent.addToParent(mesh);parent.addToParent(debug);
 onMount(()=>()=>geometry.destroy());
 $effect(()=>{
  mesh.texture=(app.stateApp.loadedAssets[assetKey] as Texture)??Texture.EMPTY;
  mesh.scale.set(width,height);mesh.tint=tint??0xffffff;mesh.alpha=alpha;mesh.blendMode=overlay?'add':'normal';
  skinSymbol(skin,name,time,reduced,positions);geometry.getBuffer('aPosition').update();
  debug.clear();
  if(debugBones&&!overlay){
   const matrices=symbolBoneMatrices(name,time,reduced);
   (SYMBOL_RIGS[name]??[]).forEach((b,i)=>{
    const p=applyMatrix(matrices[i],b.x,b.y),tip=applyMatrix(matrices[i],b.cx,b.cy);
    debug.moveTo((p.x-.5)*width,(p.y-.5)*height).lineTo((tip.x-.5)*width,(tip.y-.5)*height).stroke({color:0x13c7cb,width:1.5});
    debug.circle((p.x-.5)*width,(p.y-.5)*height,3).fill(0xffefb2).stroke({color:0x147b87,width:1});
   });
  }
 });
</script>

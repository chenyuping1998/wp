<script lang="ts">
 import {Mesh,MeshGeometry,Texture} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount,untrack} from 'svelte';
 import {createCastSkin,deformCastSkin,type CastAttachment} from '../game/treasureCastSkin';
 let {assetKey,part,kind,bend,rotation=0,breathX=0,breathY=0,shoulderY=0,middleBend}:{assetKey:string;part:CastAttachment;kind:'body'|'tail';bend:number;rotation?:number;breathX?:number;breathY?:number;shoulderY?:number;middleBend?:number}=$props();
 const app=getContextApp(),parent=getContextParent();
 const skin=untrack(()=>createCastSkin(part,kind)),positions=new Float32Array(skin.rest.length);
 const geometry=new MeshGeometry({positions,uvs:skin.uvs,indices:skin.indices}),mesh=new Mesh({geometry,texture:Texture.EMPTY});
 parent.addToParent(mesh);
 onMount(()=>()=>geometry.destroy());
 $effect(()=>{
  mesh.texture=(app.stateApp.loadedAssets[assetKey] as Texture)??Texture.EMPTY;
  mesh.position.set(part.x,part.y);mesh.rotation=rotation;
  deformCastSkin(skin,bend,positions,{breathX,breathY,shoulderY,middleBend});geometry.getBuffer('aPosition').update();
 });
</script>

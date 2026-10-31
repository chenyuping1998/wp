<script lang="ts">
 import {Mesh,MeshGeometry,Texture} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount,untrack} from 'svelte';
 import {createCastSkin,deformCastSkin,type CastAttachment} from '../game/treasureCastSkin';
 let {assetKey,part,kind,bend,rotation=0,breathX=0,breathY=0,shoulderY=0,middleBend,chest=0,foreground=false}:{assetKey:string;part:CastAttachment;kind:'body'|'tail'|'arm';bend:number;rotation?:number;breathX?:number;breathY?:number;shoulderY?:number;middleBend?:number;chest?:number;foreground?:boolean}=$props();
 const app=getContextApp(),parent=getContextParent();
 const skin=$derived(createCastSkin(part,kind,16,16,foreground)),positions=new Float32Array(untrack(()=>skin.rest.length));
 const initialSkin=untrack(()=>skin);
 const geometry=new MeshGeometry({positions,uvs:initialSkin.uvs,indices:initialSkin.indices}),mesh=new Mesh({geometry,texture:Texture.EMPTY});
 parent.addToParent(mesh);
 onMount(()=>()=>geometry.destroy());
 $effect(()=>{geometry.uvs=skin.uvs;});
 $effect(()=>{
  mesh.texture=(app.stateApp.loadedAssets[assetKey] as Texture)??Texture.EMPTY;
  mesh.position.set(part.x,part.y);mesh.rotation=rotation;
  deformCastSkin(skin,bend,positions,{breathX,breathY,shoulderY,middleBend,chest});geometry.getBuffer('aPosition').update();
 });
</script>

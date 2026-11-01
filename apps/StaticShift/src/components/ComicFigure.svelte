<script lang="ts">
 import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
 import { getContextApp, getContextParent } from 'pixi-svelte';
 import { onMount } from 'svelte';
 import { deform } from '../game/comicMotion';
 type Props={assetKey:string; width:number; height:number; kind?:'cast'|'portrait'; reaction?:number; variant?:number; active?:boolean};
 const props:Props=$props(); const app=getContextApp(); const parent=getContextParent();
 const root=new Container(); root.label='staticShiftComicMesh';parent.addToParent(root);
 onMount(()=>{
  const cols=20, rows=40, count=(cols+1)*(rows+1), pos=new Float32Array(count*2),uvs=new Float32Array(count*2),ids:number[]=[];
  for(let y=0;y<=rows;y++) for(let x=0;x<=cols;x++){const i=(y*(cols+1)+x)*2;uvs[i]=x/cols;uvs[i+1]=y/rows;}
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*(cols+1)+x;ids.push(i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1);}
  const geo=new MeshGeometry({positions:pos,uvs,indices:new Uint32Array(ids)});let mesh:Mesh|null=null; let current='';let id=0;
  const update=()=>{
   const tex=app.stateApp.loadedAssets?.[props.assetKey] as Texture|undefined;
   if(tex&&current!==props.assetKey){if(!mesh){mesh=new Mesh({geometry:geo,texture:tex});root.addChild(mesh);}else mesh.texture=tex;current=props.assetKey;}
   for(let i=0;i<count;i++){const [u,v]=deform(uvs[i*2],uvs[i*2+1],props.active===false?0:performance.now(),props.kind??'cast',props.reaction??0,props.variant??0);pos[i*2]=(u-.5)*props.width;pos[i*2+1]=(v-.5)*props.height;}
   geo.getBuffer('aPosition').update();id=requestAnimationFrame(update);
  };update();return()=>{cancelAnimationFrame(id);geo.destroy();};
 });
</script>

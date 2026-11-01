<script lang="ts">
 import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
 import { getContextApp, getContextParent } from 'pixi-svelte';
 import { onMount } from 'svelte';
 import { radioPoint, TAPE_REELS } from '../game/radioSymbolMotion';
 type Props = { assetKey:string; name:string; width:number; height:number; ms:number; reelMs?:number; actU?:number; win?:boolean };
 const props:Props=$props();
 const app=getContextApp(), parent=getContextParent();
 const root=new Container(); root.label=`radioSymbol ${props.name}`; parent.addToParent(root);
 const cols=32, rows=32, count=(cols+1)*(rows+1);
 const positions=new Float32Array(count*2), uvs=new Float32Array(count*2), indices:number[]=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const i=(y*(cols+1)+x)*2;uvs[i]=x/cols;uvs[i+1]=y/rows;}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*(cols+1)+x;indices.push(i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1);}
 let geometry:MeshGeometry|undefined;
 const reels:{geometry:MeshGeometry; uv:Float32Array; cx:number;cy:number;r:number}[]=[];
 let ready=$state(false);
 onMount(()=>{
  const texture=app.stateApp.loadedAssets?.[props.assetKey] as Texture|undefined;
  if(!texture) { console.error(`Radio symbol texture missing: ${props.assetKey}`); return; }
  geometry=new MeshGeometry({positions,uvs,indices:new Uint32Array(indices)});
  root.addChild(new Mesh({geometry,texture}));
  // Disc overlays sample the same source, with an opaque interior covering the
  // printed spokes. The metal rims and the case beneath never turn or stretch.
  for(const [cx,cy,r] of TAPE_REELS[props.name]??[]) {
   const p=new Float32Array(66*2), uv=new Float32Array(66*2), ids:number[]=[];
   p[0]=(cx-.5)*props.width;p[1]=(cy-.5)*props.height;
   for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;p[(i+1)*2]=(cx-.5+r*Math.cos(a))*props.width;p[(i+1)*2+1]=(cy-.5+r*Math.sin(a))*props.height;if(i<64)ids.push(0,i+1,i+2);}
   const g=new MeshGeometry({positions:p,uvs:uv,indices:new Uint32Array(ids)});
   root.addChild(new Mesh({geometry:g,texture}));reels.push({geometry:g,uv,cx,cy,r});
  }
  ready=true;
  return()=>{geometry?.destroy();for(const reel of reels)reel.geometry.destroy();};
 });
 $effect(()=>{
  if(!ready)return;
  for(let i=0;i<count;i++) {
   const [u,v]=radioPoint(props.name,uvs[i*2],uvs[i*2+1],props.ms,props.actU??-1,props.win??false);
   positions[i*2]=(u-.5)*props.width;positions[i*2+1]=(v-.5)*props.height;
  }
  geometry!.getBuffer('aPosition').update();
  for(const reel of reels) {
   const angle=(props.reelMs??props.ms)/(props.name==='L4'?2600:5200)*Math.PI*2 + (props.win ? Math.PI*2*(props.ms>=1400?1:(props.ms/1400)**2*(3-2*props.ms/1400)) : 0);
   reel.uv[0]=reel.cx;reel.uv[1]=reel.cy;
   for(let i=0;i<=64;i++){const a=i/64*Math.PI*2-angle;reel.uv[(i+1)*2]=reel.cx+reel.r*Math.cos(a);reel.uv[(i+1)*2+1]=reel.cy+reel.r*Math.sin(a);}
   reel.geometry.getBuffer('aUV').update();
  }
 });
</script>

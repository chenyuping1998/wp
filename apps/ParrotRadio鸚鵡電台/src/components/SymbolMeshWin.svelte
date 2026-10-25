<script lang="ts">
 import {onMount,onDestroy} from 'svelte';import {getContextParent} from 'pixi-svelte';import {Container,Mesh,MeshGeometry,type Texture} from 'pixi.js';
 import {getContext} from '../game/context';import {SYMBOL_SIZE} from '../game/constants';import parts from '../game/symbolParts.json';
 import type {getSymbolInfo} from '../game/utils';
 const props:{x?:number;y?:number;name:string;symbolInfo:ReturnType<typeof getSymbolInfo>;oncomplete?:()=>void}=$props();
 const context=getContext(),parent=getContextParent();let root:Container|undefined,raf=0,timer:ReturnType<typeof setTimeout>|undefined,finished=false;
 const finish=()=>{if(!finished){finished=true;props.oncomplete?.();}};
 onMount(()=>{const loaded=context.stateApp.loadedAssets as Record<string,Texture>;root=new Container();root.position.set(props.x??0,props.y??0);root.eventMode='none';parent.parent.addChild(root);
  const specs=(parts as Record<string,(string|number)[][]>)[props.name]??[[props.symbolInfo.assetKey,0,0,props.symbolInfo.sizeRatios.width,props.symbolInfo.sizeRatios.height]];
  const meshes=specs.map((p,index)=>{const key=String(p[0]).startsWith('mg')?String(p[0]):'part_'+p[0],texture=loaded[key];if(!texture)throw Error('Missing symbol part '+key);
   const positions=new Float32Array(50),uvs=new Float32Array(50),indices:number[]=[];for(let y=0;y<5;y++)for(let x=0;x<5;x++){const i=(y*5+x)*2;uvs[i]=x/4;uvs[i+1]=y/4;if(x<4&&y<4){const a=y*5+x;indices.push(a,a+1,a+6,a,a+6,a+5);}}
   const geometry=new MeshGeometry({positions,uvs,indices:new Uint32Array(indices)}),mesh=new Mesh({geometry,texture});root!.addChild(mesh);
   return {mesh,geometry,positions,index,x:Number(p[1])*SYMBOL_SIZE,y:Number(p[2])*SYMBOL_SIZE,w:Number(p[3])*SYMBOL_SIZE,h:Number(p[4])*SYMBOL_SIZE};});
  const start=performance.now();const duration=props.name==='S'?500:380;
  const tick=(now:number)=>{const t=Math.min(1,(now-start)/duration),wave=Math.sin(t*Math.PI),tail=Math.sin(t*Math.PI*2)*(1-t);
   for(const p of meshes){p.mesh.position.set(p.x+tail*(p.index?4:0),p.y-wave*(p.index?5:2));p.mesh.rotation=tail*(p.index ? .12 : .025);
    for(let y=0;y<5;y++)for(let x=0;x<5;x++){const i=(y*5+x)*2,nx=x/4,ny=y/4;const pin=Math.sin(nx*Math.PI)*Math.sin(ny*Math.PI);p.positions[i]=(nx-.5)*p.w+Math.sin(t*6+ny*3)*wave*pin*4;p.positions[i+1]=(ny-.5)*p.h-wave*pin*3;}
    p.geometry.getBuffer('aPosition').update();}
   if(t<1)raf=requestAnimationFrame(tick);else finish();};tick(start);timer=setTimeout(finish,duration+100);
 });onDestroy(()=>{clearTimeout(timer);cancelAnimationFrame(raf);root?.destroy({children:true});});
</script>

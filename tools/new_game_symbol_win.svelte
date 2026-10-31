<script lang="ts">
 import {onMount,onDestroy} from 'svelte';import {getContextParent} from 'pixi-svelte';import {Container,Graphics,Mesh,MeshGeometry,type Texture} from 'pixi.js';
 import {getContext} from '../game/context';import {SYMBOL_SIZE} from '../game/constants';import parts from '../game/symbolParts.json';import {partPerformance,partVertex} from '../game/symbolPerformance';
 import type {getSymbolInfo} from '../game/utils';
 const kind='__KIND__' as 'purrfia'|'parrot';
 const props:{x?:number;y?:number;name:string;symbolInfo:ReturnType<typeof getSymbolInfo>;oncomplete?:()=>void}=$props();
 const context=getContext(),parent=getContextParent();let root:Container|undefined,raf=0,timer:ReturnType<typeof setTimeout>|undefined,finished=false;
 const geometries:MeshGeometry[]=[];
 const finish=()=>{if(!finished){finished=true;props.oncomplete?.();}};
 onMount(()=>{
  const loaded=context.stateApp.loadedAssets as Record<string,Texture>,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  root=new Container();root.position.set(props.x??0,props.y??0);root.eventMode='none';parent.parent.addChild(root);
  const halo=new Graphics(),glint=new Graphics();root.addChild(halo);
  const specs=(parts as Record<string,(string|number)[][]>)[props.name]??[[props.symbolInfo.assetKey,0,0,props.symbolInfo.sizeRatios.width,props.symbolInfo.sizeRatios.height]];
  const meshes=specs.map(p=>{
   const part=String(p[0]),key=part.startsWith('mg')?part:'part_'+part,texture=loaded[key];if(!texture)throw Error('Missing symbol part '+key);
   const positions=new Float32Array(98),uvs=new Float32Array(98),indices:number[]=[];
   for(let y=0;y<7;y++)for(let x=0;x<7;x++){const i=(y*7+x)*2;uvs[i]=x/6;uvs[i+1]=y/6;if(x<6&&y<6){const a=y*7+x;indices.push(a,a+1,a+8,a,a+8,a+7);}}
   const geometry=new MeshGeometry({positions,uvs,indices:new Uint32Array(indices)}),mesh=new Mesh({geometry,texture});geometries.push(geometry);root!.addChild(mesh);
   return {part,mesh,geometry,positions,x:Number(p[1])*SYMBOL_SIZE,y:Number(p[2])*SYMBOL_SIZE,w:Number(p[3])*SYMBOL_SIZE,h:Number(p[4])*SYMBOL_SIZE};
  });root.addChild(glint);
  const start=performance.now(),duration=reduced?180:props.name==='S'?820:640;
  const tick=(now:number)=>{
   const t=Math.min(1,(now-start)/duration),phase=reduced?0:t,hit=Math.sin(phase*Math.PI);
   root!.scale.set(1+hit*.055);
   for(const p of meshes){
    const pose=partPerformance(kind,props.name,p.part,phase);p.mesh.position.set(p.x+pose.x*SYMBOL_SIZE,p.y+pose.y*SYMBOL_SIZE);p.mesh.rotation=pose.rotation;p.mesh.scale.set(pose.sx,pose.sy);
    for(let y=0;y<7;y++)for(let x=0;x<7;x++){const i=(y*7+x)*2,v=partVertex(x/6,y/6,p.w,p.h,pose.bend,pose.ripple,phase);p.positions[i]=v.x;p.positions[i+1]=v.y;}
    p.geometry.getBuffer('aPosition').update();
   }
   halo.clear();glint.clear();
   if(hit>.01){
    halo.roundRect(-SYMBOL_SIZE*.47,-SYMBOL_SIZE*.47,SYMBOL_SIZE*.94,SYMBOL_SIZE*.94,12).fill({color:kind==='purrfia'?0xffd679:0x8cecff,alpha:hit*.11}).stroke({color:0xffe5a5,width:1.6,alpha:hit*.65});
    for(let i=0;i<2;i++){const q=(phase*1.1+i*.45)%1,a=Math.sin(q*Math.PI)*hit,x=(i?-.31:.27)*SYMBOL_SIZE,y=(-.35+q*.28)*SYMBOL_SIZE,r=(3+i)*a;glint.moveTo(x-r,y).lineTo(x+r,y).moveTo(x,y-r*1.8).lineTo(x,y+r*1.8).stroke({color:0xfff6d2,width:1.3,alpha:a*.85});}
   }
   if(t<1)raf=requestAnimationFrame(tick);else finish();
  };tick(start);timer=setTimeout(finish,duration+140);
 });
 onDestroy(()=>{clearTimeout(timer);cancelAnimationFrame(raf);root?.destroy({children:true});for(const g of geometries)g.destroy();});
</script>

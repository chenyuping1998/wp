from pathlib import Path
import json
ROOT=Path('E:/stake/wp/apps')
CAT={'S':[['s_ring',0,0,1,1],['s_gem',.12,-.13,.42,.42]],'H1':[['h1_bowl',0,0,1,1],['h1_fish',0,.05,.5,.53],['h1_water',0,-.19,.85,.35]],'H2':[['h2_can',0,.14,1,.8],['h2_lid',-.12,-.3,.76,.53],['h2_tail',.3,-.07,.34,.4]],'H3':[['h3_ball',0,0,1,1],['h3_thread',.25,.23,.65,.5]],'H4':[['h4_pot',0,.2,.9,.72],['h4_leaves',0,-.19,1,.8]]}
BIRD={'S':[['s_mic',0,0,1,1.1],['s_feather',.26,-.03,.35,.65],['s_charm',.25,.28,.32,.45]],'H1':[['h1_disc',0,0,1,1],['h1_label',0,0,.4,.4]],'H2':[['h2_hat',0,-.05,1.1,1],['h2_cord',.12,.3,.7,.6]],'H3':[['h3_scope',0,0,1.1,.95],['h3_eye',.23,-.06,.4,.4]],'H4':[['h4_coconut',0,.14,1,.9],['h4_straw',-.02,-.23,.34,.75],['h4_umbrella',.23,-.25,.6,.55]]}
for folder,parts in [('Purrfia喵菲亞家族',CAT),('ParrotRadio鸚鵡電台',BIRD)]:
 app=ROOT/folder
 (app/'src/game/symbolParts.json').write_text(json.dumps(parts),encoding='utf-8')
 (app/'src/components/SymbolMeshWin.svelte').write_text('''<script lang="ts">
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
   for(const p of meshes){p.mesh.position.set(p.x+tail*(p.index?4:0),p.y-wave*(p.index?5:2));p.mesh.rotation=tail*(p.index?.12:.025);
    for(let y=0;y<5;y++)for(let x=0;x<5;x++){const i=(y*5+x)*2,nx=x/4,ny=y/4;const pin=Math.sin(nx*Math.PI)*Math.sin(ny*Math.PI);p.positions[i]=(nx-.5)*p.w+Math.sin(t*6+ny*3)*wave*pin*4;p.positions[i+1]=(ny-.5)*p.h-wave*pin*3;}
    p.geometry.getBuffer('aPosition').update();}
   if(t<1)raf=requestAnimationFrame(tick);else finish();};tick(start);timer=setTimeout(finish,duration+100);
 });onDestroy(()=>{clearTimeout(timer);cancelAnimationFrame(raf);root?.destroy({children:true});});
</script>
''',encoding='utf-8')
 if parts is CAT:
  p=app/'src/components/Symbol.svelte';s=p.read_text(encoding='utf-8').replace("import SymbolWinAnim from './SymbolWinAnim.svelte';","import SymbolWinAnim from './SymbolMeshWin.svelte';").replace("\n\t\tpetrify={props.rawSymbol.name !== 'S'}",'');p.write_text(s,encoding='utf-8')
 else:
  p=app/'src/components/Symbol.svelte';s=p.read_text(encoding='utf-8').replace(" import {Sprite,Container}"," import SymbolMeshWin from './SymbolMeshWin.svelte';\n import {Sprite,Container}");s=s.replace("{#if props.state!=='explosion'}","{#if props.state==='win'}<SymbolMeshWin name={props.rawSymbol.name} symbolInfo={info} x={props.x} y={props.y} oncomplete={props.oncomplete}/>{:else if props.state!=='explosion'}")
  s=s.replace("if(state==='win'||state==='land')","if(state==='land')");p.write_text(s,encoding='utf-8')
 print(folder,'mesh parts installed')

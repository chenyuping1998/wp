<script lang="ts">
 import {onMount,untrack} from 'svelte';
 import {Container,Graphics} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolInfo} from '../game/utils';
 import {getSymbolWinMotion,HOLD_MS} from '../game/symbolWinMotion';
 import {featureTimeScale} from '../game/timeScale';
 import {motionTrack,gridSymbolTime,symbolContact} from '../game/treasureMotion';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import SymbolArt from './SymbolArt.svelte';
 import {secondarySymbolTime} from '../game/treasureAttention';
 let {x=0,y=0,symbolInfo,symbolName,cell,oncomplete=()=>{},previewTime,playbackRate,primary=true,debugBones=false}:{x?:number;y?:number;symbolInfo:ReturnType<typeof getSymbolInfo>;symbolName:string;cell?:{reel:number;row:number};oncomplete?:()=>void;previewTime?:number;playbackRate?:number;primary?:boolean;debugBones?:boolean}=$props();
 let elapsed=$state(0),reduced=$state(false),finished=false;
 // Keep this performance's role if its payline overlay clears before the last
 // symbol finishes. Switching roles mid-gesture would jump its local clock.
 const isPrimary=untrack(()=>primary);
 const finish=()=>{if(!finished){finished=true;oncomplete();}};
 const t=$derived(previewTime??elapsed);
 const motionTime=$derived(gridSymbolTime(isPrimary?t:secondarySymbolTime(t),cell));
 const frame=$derived(getSymbolWinMotion(symbolName).frame(motionTime));
 const contact=$derived(symbolContact(symbolName)*SYMBOL_SIZE);
 const gain=$derived((reduced?.25:1)*(isPrimary?1:.8));
 const emphasis=$derived(motionTrack(motionTime/HOLD_MS,[[0,0],[.18,.7],[.38,1],[.65,.8],[1,0]])*(isPrimary?1:.45));
 const marker=(g:PixiGraphics)=>{
  g.clear();const half=SYMBOL_SIZE*.445,arm=SYMBOL_SIZE*.13;
  if(!symbolName.startsWith('L'))g.roundRect(-half,-half,half*2,half*2,9).fill({color:0xffe3a6,alpha:.055*emphasis});
  if(['H1','H2','H3','H4','H5','SW'].includes(symbolName))g.ellipse(0,SYMBOL_SIZE*.34,SYMBOL_SIZE*.23,SYMBOL_SIZE*.025).fill({color:0x99744c,alpha:.09*emphasis});
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
   const px=sx*half,py=sy*half;
   g.moveTo(px-sx*arm*emphasis,py).lineTo(px,py).lineTo(px,py-sy*arm*emphasis).stroke({color:0x2d8990,width:2,alpha:emphasis*.8});
  }
 };
 onMount(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>reduced=preference.matches;update();preference.addEventListener('change',update);
  if(previewTime!==undefined)return()=>preference.removeEventListener('change',update);
  let stop=()=>{};
  stop=subscribePresentationFrame(delta=>{
   elapsed+=delta*(playbackRate??featureTimeScale());
   if(elapsed>=HOLD_MS){elapsed=HOLD_MS;stop();finish();}
  });
  return()=>{stop();preference.removeEventListener('change',update);finish();};
 });
</script>
<Container {x} {y}>
 <Graphics draw={marker}/>
 <Container x={frame.dx*SYMBOL_SIZE*gain} y={contact+frame.dy*SYMBOL_SIZE*gain} pivot={{x:0,y:contact}} rotation={frame.rotation*gain} scale={{x:1+(frame.scaleX-1)*gain,y:1+(frame.scaleY-1)*gain}}>
  <SymbolArt {symbolInfo} {symbolName} {cell} mode="win" t={motionTime} {reduced} {debugBones}/>
 </Container>
</Container>

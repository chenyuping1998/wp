<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Graphics,Rectangle} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import {getContext} from '../game/context';
 const props:{oncomplete:()=>void;oncover?:()=>void}=$props();
 const context=getContext();
 const TOTAL_MS=1300,COVER_MS=650;
 let age=$state(0),covered=false,done=false;
 const flash=$derived(age<300?0:age<600?(age-300)/300:age<=800?1:Math.max(0,1-(age-800)/500));
 const blackout=$derived(age<300?.18+.22*(.5+.5*Math.sin(age/26)):0);
 const size=$derived(context.stateLayoutDerived.canvasSizes());
 function cover(){if(!covered){covered=true;props.oncover?.();}}
 function complete(){if(done)return;cover();done=true;props.oncomplete();}
 onMount(()=>{
  // Keep the book protocol and sound-event contract; replace only the visual motif.
  context.eventEmitter.broadcast({type:'soundWheel',cue:'bandageSweep'});
  const start=performance.now();let raf=0;
  function frame(now:number){
   age=Math.min(TOTAL_MS,now-start);
   // The full white underlay is already opaque at 600ms, before swapping scenes.
   if(age>=COVER_MS)cover();
   if(age>=TOTAL_MS)complete();else raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  const safety=setTimeout(complete,TOTAL_MS+600);
  return()=>{cancelAnimationFrame(raf);clearTimeout(safety);};
 });
 function bolt(g:PixiGraphics){
  g.clear();if(age<300||age>920)return;
  const w=size.width,h=size.height,x=w*.54;
  const points=[x,0,x-w*.055,h*.25,x+w*.025,h*.25,x-w*.04,h*.57,x+w*.045,h*.48,x-w*.025,h];
  for(const [width,color,alpha]of [[36,0x4ff0c8,.18],[13,0x80ffe3,.7],[4,0xffffff,1]]as const){
   g.poly(points,false).stroke({width,color,alpha:alpha*Math.min(1,(age-300)/110)});
  }
 }
</script>
<Container zIndex={1000}>
 <Rectangle {...size} backgroundColor={0x091219} alpha={blackout}/>
 <Graphics draw={bolt}/>
 <Rectangle {...size} backgroundColor={0xf5fffd} alpha={flash}/>
</Container>

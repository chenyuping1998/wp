<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Graphics,Sprite} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import {MainContainer} from 'components-layout';
 import {getContext} from '../game/context';
 type Props={oncomplete:()=>void;oncover?:()=>void;onreveal?:()=>void;kind?:'curtain'|'portal';tone?:'violet'|'gold'};
 const props:Props=$props(),context=getContext();
 let elapsed=$state(0);
 const portal=$derived(props.kind==='portal');
 // ATG 戰神賽特 FG entry (research ATG-Seth-Capture §6-1), 1.5 s: the curtain
 // sweeps shut by 0.45 s, a white flash peaks at 0.9 s (the scene swaps under
 // it), then the curtain opens on the free game by 1.5 s.
 //
 // Portal (天使奧丁 FG_Board_Start Out, research/xinstar-angelodin §5.1), 1.6 s:
 // a swirl opens in the middle of the feature plaque and grows to fill the
 // screen by 0.85 s, the white flash peaks at 0.95 s and the scene swaps under
 // it, then the flash fades on the new scene. Ours is a sea whirlpool (teal on foam).
 const DONE=$derived(portal?1600:1500);
 const COVER_MS=$derived(portal?900:450);
 const REVEAL_MS=$derived(portal?1050:900);
 const cover=$derived(elapsed<450?1-(1-elapsed/450)**3:elapsed<1000?1:(1-Math.min(1,(elapsed-1000)/500))**3);
 const white=$derived(portal
  ?(elapsed<650?0:elapsed<950?((elapsed-650)/300)**2:Math.max(0,1-(elapsed-950)/650)**1.6)
  :(elapsed<800||elapsed>1050?0:Math.sin(Math.PI*(elapsed-800)/250)));
 const sizes=$derived(context.stateLayoutDerived.canvasSizes());
 const board=$derived(context.stateGameDerived.boardLayout());
 const main=$derived(context.stateLayoutDerived.mainLayout());
 // portal radius in main-container units: from nothing to past every canvas corner
 const reach=$derived(Math.hypot(sizes.width,sizes.height)/Math.max(.01,main.scale));
 const grow=$derived(Math.min(1,elapsed/850));
 const radius=$derived(reach*(grow<.35?.12*(grow/.35)**.7:.12+.88*((grow-.35)/.65)**2.2));
 const palette=$derived(props.tone==='gold'?{arm:0xf2b632,gap:0xfff3d6,ink:0x5a3208,core:0xfff8e8}:{arm:0x1f7f86,gap:0xe3f3ee,ink:0x12343a,core:0xf6fcfa});
 const ARMS=6,STEPS=28,TWIST=Math.PI*2.4;
 const drawPortal=(g:PixiGraphics)=>{
  g.clear();
  if(!portal||elapsed>=1000||radius<=0)return;
  const spin=elapsed*.011;
  g.circle(0,0,radius).fill(palette.gap);
  for(let k=0;k<ARMS;k++){
   const base=spin+k*Math.PI*2/ARMS,points:number[]=[];
   for(let i=0;i<=STEPS;i++){const r=radius*i/STEPS,a=base+TWIST*i/STEPS;points.push(Math.cos(a)*r,Math.sin(a)*r);}
   for(let i=STEPS;i>=0;i--){const r=radius*i/STEPS,a=base+Math.PI/ARMS+TWIST*i/STEPS;points.push(Math.cos(a)*r,Math.sin(a)*r);}
   g.poly(points).fill(palette.arm).stroke({color:palette.ink,width:3,alpha:.55});
  }
  g.circle(0,0,radius).stroke({color:palette.ink,width:6});
  // the eye of the spiral flares as it opens
  g.circle(0,0,Math.min(radius*.22,60+radius*.05)).fill({color:palette.core,alpha:.9});
 };
 onMount(()=>{
  let raf=0,last=performance.now(),done=false,covered=false,revealed=false;
  const markCover=()=>{if(!covered){covered=true;props.oncover?.();}};
  const markReveal=()=>{if(!revealed){revealed=true;props.onreveal?.();}};
  const finish=()=>{if(done)return;done=true;markCover();markReveal();props.oncomplete();};
  context.eventEmitter.broadcast({type:'soundTransitionBlast'});
  const tick=(now:number)=>{
   elapsed=Math.min(DONE,elapsed+Math.min(100,Math.max(0,now-last)));last=now;
   if(elapsed>=COVER_MS)markCover();if(elapsed>=REVEAL_MS)markReveal();
   if(elapsed>=DONE)finish();else raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  const visibility=()=>{last=performance.now();if(document.hidden)finish();};
  document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);};
 });
</script>
<Container>
 {#if portal}
  <MainContainer>
   <Graphics x={board.x} y={board.y} draw={drawPortal}/>
  </MainContainer>
 {:else}
  <Sprite key="mgTransitionCurtain" x={-(sizes.width/2+8)*(1-cover)} y={-2} width={sizes.width/2+8} height={sizes.height+4}/>
  <Sprite key="mgTransitionCurtain" x={sizes.width-(sizes.width/2+8)*cover} y={-2} width={sizes.width/2+8} height={sizes.height+4}/>
 {/if}
 <Graphics draw={(g)=>{g.clear();if(white>0)g.rect(-4,-4,sizes.width+8,sizes.height+8).fill({color:0xfff8e8,alpha:white});}}/>
</Container>

<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Graphics,Sprite} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import {MainContainer} from 'components-layout';
 import {getContext} from '../game/context';
 import geometry from '../game/artGeometry.json';
 type Props={oncomplete:()=>void;oncover?:()=>void;onreveal?:()=>void;kind?:'portal';tone?:'violet'|'gold'};
 const props:Props=$props(),context=getContext();
 let elapsed=$state(0);
 // Whirlpool gate (天使奧丁 FG_Board_Start Out, research/xinstar-angelodin §5.1): the plaque's
 // Out runs 2.33 s and the scene swaps 1.5 s in (6.5 s -> 8.0 s). A whirlpool opens in the
 // middle of the board inside the painted wave ring (portal_in teal for the way in and the
 // loading screen, portal_out gold for the way out) and grows to fill the screen by 1.4 s; the
 // white flash peaks at 1.5 s and the scene swaps under it, then the flash fades on the new scene.
 const DONE=2330,COVER_MS=1500,REVEAL_MS=1650,GROW_MS=1400;
 const white=$derived(elapsed<1100?0:elapsed<1500?((elapsed-1100)/400)**2:Math.max(0,1-(elapsed-1500)/830)**1.6);
 const sizes=$derived(context.stateLayoutDerived.canvasSizes());
 const board=$derived(context.stateGameDerived.boardLayout());
 const main=$derived(context.stateLayoutDerived.mainLayout());
 const gold=$derived(props.tone==='gold');
 const ring=$derived(gold?geometry.portal.out:geometry.portal.in);
 const squash=$derived(ring.hole.ry/ring.hole.rx);
 // radius in main-container units: from nothing to past every canvas corner (the gate is an
 // ellipse as wide as the ring's hole, so its short axis has to clear the corners too)
 const reach=$derived(Math.hypot(sizes.width,sizes.height)/Math.max(.01,main.scale)/squash);
 const grow=$derived(Math.min(1,elapsed/GROW_MS));
 const radius=$derived(reach*(grow<.35?.12*(grow/.35)**.7:.12+.88*((grow-.35)/.65)**2.2));
 const spin=$derived(elapsed*.0011);
 const palette=$derived(gold?{arm:0xf2b632,gap:0xfff3d6,ink:0x5a3208,core:0xfff8e8}:{arm:0x1f7f86,gap:0xe3f3ee,ink:0x12343a,core:0xf6fcfa});
 const ARMS=6,STEPS=28,TWIST=Math.PI*2.4;
 const drawPortal=(g:PixiGraphics)=>{
  g.clear();
  if(elapsed>=COVER_MS+100||radius<=0)return;
  const turn=elapsed*.011;
  g.circle(0,0,radius).fill(palette.gap);
  for(let k=0;k<ARMS;k++){
   const base=turn+k*Math.PI*2/ARMS,points:number[]=[];
   for(let i=0;i<=STEPS;i++){const r=radius*i/STEPS,a=base+TWIST*i/STEPS;points.push(Math.cos(a)*r,Math.sin(a)*r);}
   for(let i=STEPS;i>=0;i--){const r=radius*i/STEPS,a=base+Math.PI/ARMS+TWIST*i/STEPS;points.push(Math.cos(a)*r,Math.sin(a)*r);}
   g.poly(points).fill(palette.arm).stroke({color:palette.ink,width:3,alpha:.55});
  }
  // the eye of the whirlpool flares as it opens
  g.circle(0,0,Math.min(radius*.22,60+radius*.05)).fill({color:palette.core,alpha:.9});
 };
 // the painted ring hugs the whirlpool's rim: its hole (measured on the art) = the radius
 const ringScale=$derived(radius*1.04/ring.hole.rx);
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
 <MainContainer>
  {#if elapsed<COVER_MS+100&&radius>0}
   <Container x={board.x} y={board.y} rotation={spin}>
    <Container scale={{x:1,y:squash}}>
     <Graphics draw={drawPortal}/>
    </Container>
    <Sprite key={gold?'mgPortalOut':'mgPortalIn'} anchor={{x:ring.hole.x/ring.width,y:ring.hole.y/ring.height}}
     width={ring.width*ringScale} height={ring.height*ringScale}/>
   </Container>
  {/if}
 </MainContainer>
 <Graphics draw={(g)=>{g.clear();if(white>0)g.rect(-4,-4,sizes.width+8,sizes.height+8).fill({color:0xfff8e8,alpha:white});}}/>
</Container>

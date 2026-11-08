<script lang="ts">
 /**
  * The backgrounds' slow life (2026-11-07, after slot-motion-recipes §5: a
  * background lives on loops of 15 s and more, swings of a few degrees, never
  * a short sine):
  *   linen   each swag and loose strip on its own, hung from its top, swaying
  *           and breathing on three incommensurate periods (7-19 s) — it never
  *           visibly repeats. (It used to be ONE sprite of the whole linen layer
  *           turned about the screen centre, which moved the wall painted in
  *           that layer with it.)
  *   fire    an additive copy of each painted flame (design/build_mummy_bg_motion.py)
  *           licking up from its base and flickering, under the warm glow that
  *           was already there. Additive, so it can never uncover the painting.
  * Nothing else moves: the frame, the walls and the statues stay still.
  */
 import { Container, Sprite } from 'pixi-svelte';
 import { onMount } from 'svelte';
 import { BG_MOTION_PARTS, type BgPart } from '../game/bgMotionParts';
 const {mode,x,y,width,height}:{mode:'base'|'feature'|'hold';x:number;y:number;width:number;height:number}=$props();
 const keys={base:'mummyBaseProps',feature:'mummyFeatureProps',hold:'mummyHoldProps'} as const;
 const parts=$derived(BG_MOTION_PARTS[mode]);
 const sx=$derived(width/1920), sy=$derived(height/1080);
 let clock=$state(0);
 onMount(()=>{const start=performance.now();const timer=setInterval(()=>clock=(performance.now()-start)/1000,33);return()=>clearInterval(timer);});

 // smooth irregular noise in -1..1: three sines on incommensurate periods
 const drift=(t:number,seed:number,p=[7.3,11.9,18.7])=>
  .5*Math.sin(2*Math.PI*t/p[0]+seed)+.3*Math.sin(2*Math.PI*t/p[1]+seed*2.1)+.2*Math.sin(2*Math.PI*t/p[2]+seed*3.7);
 // fire: the same, fast — a flame never holds still
 const flick=(t:number,seed:number)=>
  .5*Math.sin(2*Math.PI*t*1.7+seed)+.3*Math.sin(2*Math.PI*t*2.9+seed*1.9)+.2*Math.sin(2*Math.PI*t*4.6+seed*3.1);

 // position only: each part's texture IS its crop, so `scale` (sx, sy) sizes it
 const place=(p:BgPart)=>({x:(p.x+p.ax*p.w)*sx,y:(p.y+p.ay*p.h)*sy,anchor:{x:p.ax,y:p.ay}});
 // swing by size: a long loose strip swings more than a wide swag pinned at both ends
 const linen=(p:BgPart,i:number,t:number)=>{
  const long=p.h/Math.max(p.w,1);
  const amp=long>2?.022:.009; // radians: ~1.3 deg strips, ~0.5 deg swags
  return {rotation:amp*drift(t,i*1.7),skew:{x:.012*drift(t,i*2.3+1,[9.1,13.7,21.3]),y:0},breathe:1+.012*drift(t,i*.9+2,[8.3,12.1,17.9])};
 };
 const fire=(i:number,t:number)=>{
  const f=flick(t,i*2.4);
  return {sy:1.03+.07*f,sx:1+.025*flick(t,i*2.4+5),rotation:.03*flick(t,i*2.4+9),alpha:.22+.16*f};
 };
 // the warm glow round each fire, where the fire is
 const glows=$derived(parts.flames.map(p=>({x:(p.x+p.ax*p.w)*sx,y:(p.y+(p.ay-.45)*p.h)*sy,size:Math.max(p.w,p.h)*2.2})));
</script>
<Container {x} {y}>
 <Sprite key={keys[mode]} {width} {height} />
 {#each parts.linen ?? [] as p,i (p.key)}
  {@const l=linen(p,i,clock)}
  <Sprite key={p.key} {...place(p)} rotation={l.rotation} skew={l.skew} scale={{x:sx,y:sy*l.breathe}} />
 {/each}
 {#each glows as g,i (i)}
  <Sprite key="fxGlow" x={g.x} y={g.y} anchor={.5} width={g.size*sx} height={g.size*sy} tint={0xffc89b} blendMode="add" alpha={.12+.05*flick(clock,i*3.3+1)} />
 {/each}
 {#each parts.flames as p,i (p.key)}
  {@const f=fire(i,clock)}
  <Sprite key={p.key} {...place(p)} scale={{x:sx*f.sx,y:sy*f.sy}} rotation={f.rotation} blendMode="add" alpha={f.alpha} />
 {/each}
 {#if mode==='feature'}
  <Sprite key="fxGlow" x={width*.16} y={height*.42} rotation={.18} anchor={.5} width={width*.09} height={height*.66} tint={0xf2e8d0} alpha={.065+.02*drift(clock,4,[10.3,15.1,23.9])} blendMode="add" />
 {/if}
</Container>

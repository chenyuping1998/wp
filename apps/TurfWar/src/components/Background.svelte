<script lang="ts">
 import { Sprite, Rectangle } from 'pixi-svelte';
 import { FadeContainer } from 'components-pixi';
 import { onMount } from 'svelte';
 import { getContext } from '../game/context';
 import StreetLife from './StreetLife.svelte';
 const context = getContext();
 let clock = $state(0);
 const mode = $derived(context.stateGame.gameType === 'basegame' ? 'base' : context.stateGame.bonusTier === 'don' ? 'epic' : 'feature');
 const scene = $derived.by(() => {
  const {width,height}=context.stateLayoutDerived.canvasSizes();
  const scale=Math.max(width/1920,height/1080)*1.02;
  const w=1920*scale,h=1080*scale;
  return {width:w,height:h,x:(width-w)/2+Math.sin(clock*.08)*Math.min(3,(w-width)/2),y:(height-h)/2};
 });
 onMount(() => {let raf=0,last=performance.now();const tick=(now:number)=>{clock+=Math.min(100,Math.max(0,now-last))/1000;last=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
</script>
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0xd8d6d1} zIndex={-3} />
<FadeContainer show={mode==='base'} duration={450} zIndex={-2}><Sprite key="hmBgBase" {...scene} /></FadeContainer>
<FadeContainer show={mode==='feature'} duration={450} zIndex={-2}><Sprite key="hmBgFeature" {...scene} /></FadeContainer>
<FadeContainer show={mode==='epic'} duration={450} zIndex={-2}><Sprite key="hmBgEpic" {...scene} /></FadeContainer>
<StreetLife {scene} {mode} />

<script lang="ts">
 import {onDestroy} from 'svelte';
 import {Sprite} from 'pixi-svelte';
 import {getContext} from '../game/context';
 import BoardContainer from './BoardContainer.svelte';
 import {BOARD_SIZES} from '../game/constants';
 const context=getContext();let age=$state(-1),raf=0,serial=$state(0);
 context.eventEmitter.subscribeOnMount({scatterDing:()=>{serial++;cancelAnimationFrame(raf);const start=performance.now();const tick=(now:number)=>{age=now-start;if(age<1200)raf=requestAnimationFrame(tick);else age=-1;};raf=requestAnimationFrame(tick);}});
 onDestroy(()=>cancelAnimationFrame(raf));
</script>
{#if age>=0}
 <BoardContainer>
  <!-- No bell copies here any more (review 10-17): they were drawn half a cell
       down-right of the reels, over the frame, while the real Scatters under
       them were already playing their own win (pop, frame, ring). -->
  {#if age<700}<Sprite key={`gbDing${Math.floor(age/110)%3+1}V2`} x={BOARD_SIZES.width*.5} y={-40} anchor={.5} width={210} height={100} alpha={Math.min(1,(700-age)/150)}/>{/if}
 </BoardContainer>
{/if}

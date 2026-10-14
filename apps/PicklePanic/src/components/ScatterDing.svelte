<script lang="ts">
 import {onDestroy} from 'svelte';
 import {Container,Sprite} from 'pixi-svelte';
 import {getContext} from '../game/context';
 import BoardContainer from './BoardContainer.svelte';
 import LayeredSymbol from './LayeredSymbol.svelte';
 import {getSymbolX,getSymbolInfo} from '../game/utils';
 import {BOARD_SIZES,SYMBOL_SIZE,PLATE_SCALE} from '../game/constants';
 const context=getContext();let age=$state(-1),raf=0,serial=$state(0);
 const bells=$derived(context.stateGame.board.flatMap((reel,r)=>reel.reelState.symbols.filter(s=>s.rawSymbol.name==='S'&&s.symbolY()>0&&s.symbolY()<BOARD_SIZES.height).map(s=>({x:getSymbolX(r),y:s.symbolY(),raw:s.rawSymbol}))));
 context.eventEmitter.subscribeOnMount({scatterDing:()=>{serial++;cancelAnimationFrame(raf);const start=performance.now();const tick=(now:number)=>{age=now-start;if(age<1200)raf=requestAnimationFrame(tick);else age=-1;};raf=requestAnimationFrame(tick);}});
 onDestroy(()=>cancelAnimationFrame(raf));
</script>
{#if age>=0}
 <BoardContainer>
  {#each bells as bell}
   <Container x={bell.x} y={bell.y}><Sprite key="gbSymbolPaper" anchor={.5} width={SYMBOL_SIZE*PLATE_SCALE} height={SYMBOL_SIZE*PLATE_SCALE}/>{#key serial}<LayeredSymbol symbolName="S" symbolInfo={getSymbolInfo({rawSymbol:bell.raw,state:'win'})} mode="win"/>{/key}</Container>
  {/each}
  {#if age<700}<Sprite key={`gbDing${Math.floor(age/110)%3+1}V2`} x={BOARD_SIZES.width*.5} y={-40} anchor={.5} width={210} height={100} alpha={Math.min(1,(700-age)/150)}/>{/if}
 </BoardContainer>
{/if}

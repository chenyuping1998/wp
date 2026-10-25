<script lang="ts">
 import {Container,Graphics,Text,Sprite} from 'pixi-svelte';
 import {stateBet} from 'state-shared';
 import {untrack} from 'svelte';
 import {getContext} from '../game/context';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolX} from '../game/utils';
 import BoardContainer from './BoardContainer.svelte';
 import {GAME_FONT} from '../game/fonts';
 const context=getContext();let openingAge=$state(0);
 $effect(()=>{if(!context.stateGame.openingBoxes.length)return;let raf=0;const start=performance.now();const tick=(now:number)=>{openingAge=(now-start)/(stateBet.isTurbo?400:780);raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
 const frames=['art_box_closed','art_box_peek_1','art_box_peek_2','art_box_open_1','art_box_open_2','art_box_open_3','art_box_open_4'];
 
 const cells=$derived(context.stateGame.cellMults.flatMap((col,reel)=>col.flatMap((mult,row)=>row>=1&&row<=7&&mult>=2?[{reel,row,mult}]:[])));
</script>
<BoardContainer>
 {#each cells as cell (`${cell.reel}:${cell.row}`)}
  <Container x={getSymbolX(cell.reel)+SYMBOL_SIZE*.29} y={(cell.row-.18)*SYMBOL_SIZE}>
   <Graphics draw={g=>{g.clear();g.roundRect(-20,-9,40,18,4).fill(0x141826).stroke({color:cell.mult===128?0xff4fa3:0xf2c14e,width:1});}} />
   <Text text={`×${cell.mult}`} anchor={0.5} style={{fontFamily:GAME_FONT,fontSize:13,fill:0xffe6a0}} />
  </Container>
 {/each}
 {#each context.stateGame.openingBoxes as box (`${box.reel}:${box.row}`)}
  <Sprite key={frames[Math.min(6,Math.floor(openingAge*7))]} anchor={.5} x={getSymbolX(box.reel)} y={(box.row-.5)*SYMBOL_SIZE} width={SYMBOL_SIZE*1.1} height={SYMBOL_SIZE*1.1} alpha={Math.max(0,1-Math.max(0,openingAge-.75)*4)}/>

 {/each}
</BoardContainer>

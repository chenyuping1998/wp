<script lang="ts">
 import {Graphics,Text} from 'pixi-svelte';
 import {getContext} from '../game/context';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolX} from '../game/utils';
 import BoardContainer from './BoardContainer.svelte';
 import {GAME_FONT} from '../game/fonts';
 const context=getContext();
 const cells=$derived(context.stateGame.cellMults.flatMap((col,reel)=>col.flatMap((mult,row)=>row>=1&&row<=7&&mult>0?[{reel,row,mult}]:[])));
 const color=(mult:number)=>mult>=128?0xff4fa3:mult>=32?0xf2c14e:mult>=8?0xb6c3d5:0xb88652;
</script>
<BoardContainer>
 {#each cells as cell (`${cell.reel}:${cell.row}`)}
  <Graphics draw={g=>{const x=getSymbolX(cell.reel)-SYMBOL_SIZE/2;const y=(cell.row-1)*SYMBOL_SIZE;g.clear();g.roundRect(x+3,y+3,SYMBOL_SIZE-6,SYMBOL_SIZE-6,7).fill({color:color(cell.mult),alpha:cell.mult>=2?.32:.12}).stroke({color:color(cell.mult),width:2,alpha:.8});for(let i=0;i<3;i++)g.moveTo(x+21+i*9,y+27-i*3).lineTo(x+34+i*9,y+49-i*3).stroke({color:color(cell.mult),width:2,alpha:.65});}} />
 {/each}
</BoardContainer>

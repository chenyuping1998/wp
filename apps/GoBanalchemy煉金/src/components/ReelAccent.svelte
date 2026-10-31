<script lang="ts">
 import { Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import BoardContainer from './BoardContainer.svelte';
 import { presentation } from '../game/presentation.svelte';
 import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
 import { getSymbolX } from '../game/utils';
 const draw = (g: PixiGraphics) => {
  g.clear();
  presentation.reels.forEach((look,i) => {
   const x=getSymbolX(i), left=x-SYMBOL_SIZE*.46, right=x+SYMBOL_SIZE*.46;
   if (look.rail>.001 && look.blur>.05) {
    g.moveTo(left,0).lineTo(left,BOARD_SIZES.height).stroke({width:1,color:0x8ee6ba,alpha:look.rail*look.blur});
    g.moveTo(right,0).lineTo(right,BOARD_SIZES.height).stroke({width:1,color:0x8ee6ba,alpha:look.rail*look.blur});
   }
   if (look.landing>.003) {
    const y=BOARD_SIZES.height-3;
    g.roundRect(x-SYMBOL_SIZE*.36,y,SYMBOL_SIZE*.72,2,1).fill({color:0x8ee6ba,alpha:look.landing*.3});
   }
  });
 };
</script>
<BoardContainer><Graphics {draw} /></BoardContainer>

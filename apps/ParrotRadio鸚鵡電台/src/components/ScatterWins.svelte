<script lang="ts" module>
 import type {ScatterWinDatum} from '../game/bookEventHandlerMap';
 export type EmitterEventScatterWins={type:'scatterWinsShow';wins:ScatterWinDatum[];pace?:string}|{type:'scatterWinsHide'};
</script>
<script lang="ts">
 import {Graphics,Text} from 'pixi-svelte';import {waitForTimeout} from 'utils-shared/wait';import {bookEventAmountToCurrencyString} from 'utils-shared/amount';
 import {getContext} from '../game/context';import {SYMBOL_SIZE} from '../game/constants';import {getSymbolX} from '../game/utils';import BoardContainer from './BoardContainer.svelte';
 const context=getContext();let wins=$state<ScatterWinDatum[]>([]);
 context.eventEmitter.subscribeOnMount({scatterWinsHide:()=>wins=[],scatterWinsShow:async e=>{wins=e.wins;for(const win of e.wins)for(const p of win.positions){const cell=context.stateGame.board[p.reel]?.reelState.symbols[p.row];if(cell)cell.symbolState='win';}await waitForTimeout(e.pace?.includes('turbo')?280:620);}});
</script>
<BoardContainer>
 <Graphics draw={g=>{g.clear();for(const win of wins)for(const p of win.positions)g.roundRect(getSymbolX(p.reel)-SYMBOL_SIZE*.46,(p.row-1)*SYMBOL_SIZE+4,SYMBOL_SIZE*.92,SYMBOL_SIZE*.92,12).stroke({color:context.stateGame.encored?0xf2c14e:0x50e8df,width:4});}}/>
 {#each wins as win}<Text x={getSymbolX(win.overlay.reel)} y={(win.overlay.row-.5)*SYMBOL_SIZE} anchor={.5} text={bookEventAmountToCurrencyString(win.win)} style={{fontFamily:'Arial',fontSize:23,fontWeight:'700',fill:0xffffff,stroke:{color:0x102b40,width:5}}}/>{/each}
</BoardContainer>

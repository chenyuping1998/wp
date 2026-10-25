<script lang="ts" module>
 import type {Position,RawSymbol} from '../game/types';
 export type EmitterEventTumble={type:'tumbleRun';explodingSymbols:Position[];newSymbols:RawSymbol[][]};
</script>
<script lang="ts">
 import {waitForTimeout} from 'utils-shared/wait';import {stateBet} from 'state-shared';
 import {getContext} from '../game/context';import {planCascadeColumn,gravityProgress} from '../game/symbolMotion';import {BOARD_DIMENSIONS,SYMBOL_SIZE} from '../game/constants';
 const context=getContext();const y=(row:number)=>(row-.5)*SYMBOL_SIZE;
 context.eventEmitter.subscribeOnMount({tumbleRun:async e=>{
  const removed=new Map<number,number[]>();for(const p of e.explodingSymbols){removed.set(p.reel,[...(removed.get(p.reel)??[]),p.row]);context.stateGame.board[p.reel].reelState.symbols[p.row].symbolState='explosion';}
  await waitForTimeout(stateBet.isTurbo?90:180);
  await Promise.all(context.stateGame.board.map(async(reel,i)=>{
   const rows=removed.get(i);if(!rows?.length)return;
   const symbols=reel.reelState.symbols;const plan=planCascadeColumn(symbols.map(s=>s.rawSymbol),rows,e.newSymbols[i]??[],BOARD_DIMENSIONS.y);
   for(const m of plan.moves){const s=symbols[m.carrier];if(m.incoming){s.rawSymbol=m.rawSymbol;void s.symbolY.set(y(m.from),{duration:0});}s.symbolState='spin';}
   await Promise.all(plan.moves.map(m=>Promise.race([symbols[m.carrier].symbolY.set(y(m.to),{duration:stateBet.isTurbo?130:260,easing:gravityProgress}),waitForTimeout(stateBet.isTurbo?210:340)])));
   reel.setSymbolsWithRawSymbols(plan.column);for(let r=0;r<reel.reelState.symbols.length;r++){const s=reel.reelState.symbols[r];void s.symbolY.set(y(r),{duration:0});s.symbolState='static';}
  }));
 }});
</script>

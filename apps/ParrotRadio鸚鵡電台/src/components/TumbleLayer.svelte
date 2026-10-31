<script lang="ts" module>
 import type {Position,RawSymbol} from '../game/types';
 export type EmitterEventTumble={type:'tumbleRun';explodingSymbols:Position[];newSymbols:RawSymbol[][]};
</script>
<script lang="ts">
 import {waitForTimeout} from 'utils-shared/wait';import {stateBet} from 'state-shared';
 import BoardContainer from './BoardContainer.svelte';import FlyingNotes from './FlyingNotes.svelte';import {getSymbolX} from '../game/utils';
 import {getContext} from '../game/context';import {planCascadeColumn,gravityProgress} from '../game/symbolMotion';import {BOARD_DIMENSIONS,SYMBOL_SIZE} from '../game/constants';
 const context=getContext();const y=(row:number)=>(row-.5)*SYMBOL_SIZE;
 let flights=$state<{id:number;x:number;y:number;seed:number}[]>([]),nextFlight=0;
 context.eventEmitter.subscribeOnMount({tumbleRun:async e=>{
  const unique=[...new Map(e.explodingSymbols.map(p=>[p.reel+':'+p.row,p])).values()];flights=unique.map(p=>({id:nextFlight++,x:getSymbolX(p.reel),y:y(p.row),seed:(p.reel+p.row)%4}));context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_note_fly'});
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
<BoardContainer>{#each flights as flight (flight.id)}<FlyingNotes {...flight} oncomplete={()=>flights=flights.filter(f=>f.id!==flight.id)}/>{/each}</BoardContainer>

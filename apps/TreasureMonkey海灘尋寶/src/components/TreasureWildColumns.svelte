<script lang="ts">
 import { Tween } from 'svelte/motion';
 import { onDestroy } from 'svelte';
 import { linear } from 'svelte/easing';
 import { Container } from 'pixi-svelte';
 import { waitForTimeout } from 'utils-shared/wait';
 import { getContext } from '../game/context';
 import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
 import { featureScaled } from '../game/timeScale';
 import { getSymbolX } from '../game/utils';
 import BoardContainer from './BoardContainer.svelte';
 import DetectorSweep from './DetectorSweep.svelte';
 const context=getContext();
 type Column={reel:number;sweep:Tween<number>;power:Tween<number>;preparation:Tween<number>};
 let columns=$state<Column[]>([]),generation=0;
 onDestroy(()=>{generation++;columns=[];context.stateGame.castFocus=null;});
 context.eventEmitter.subscribeOnMount({
  wildColumnExpand:async({wilds})=>{
   const token=++generation;
   const reels=[...new Set(wilds.map(wild=>wild.reel))];
   context.stateGame.castFocus=reels.length?{reel:reels[0],row:1}:null;
   columns=reels.map(reel=>({reel,sweep:new Tween(0),power:new Tween(1),preparation:new Tween(0)}));
   context.stateGame.castReaction={kind:'trigger',seq:context.stateGame.castReaction.seq+1};
   await Promise.all(columns.map(column=>column.preparation.set(1,{duration:featureScaled(300),easing:linear})));
   if(token!==generation)return;
   await Promise.all(columns.map(async column=>{
    const sweep=column.sweep.set(1,{duration:featureScaled(520),easing:linear});
    for(let row=1;row<=BOARD_DIMENSIONS.y;row++){
     await waitForTimeout(featureScaled(520/BOARD_DIMENSIONS.y));
     if(token!==generation)return;
     if(column.reel===reels[0])context.stateGame.castFocus={reel:column.reel,row};
     const symbol=context.stateGame.board[column.reel]?.reelState.symbols[row];
     if(symbol&&!symbol.rawSymbol.scatter&&symbol.rawSymbol.name!=='S')symbol.rawSymbol={name:'W',wild:true};
    }
    await sweep;await waitForTimeout(featureScaled(120));
    await column.power.set(0,{duration:featureScaled(220)});
   }));
   if(token===generation){columns=[];context.stateGame.castFocus=null;}
  },
  wildColumnClear:()=>{generation++;columns=[];context.stateGame.castFocus=null;},
 });
</script>
<BoardContainer>{#each columns as column(column.reel)}<Container x={getSymbolX(column.reel)}><DetectorSweep progress={column.sweep.current} preparation={column.preparation.current} power={column.power.current} width={SYMBOL_SIZE} height={SYMBOL_SIZE*BOARD_DIMENSIONS.y}/></Container>{/each}</BoardContainer>

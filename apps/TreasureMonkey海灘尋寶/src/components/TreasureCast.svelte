<script lang="ts">
 import { MainContainer } from 'components-layout';
 import { getContext } from '../game/context';
 import TreasureFigure from './TreasureFigure.svelte';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolX} from '../game/utils';
 const context=getContext();
 const layout=$derived(context.stateGameDerived.boardLayout());
 const box=$derived(context.stateLayoutDerived.mainLayout());
 const side=$derived(box.width-layout.x-layout.width*layout.scale*.55);
 const height=$derived(Math.min(box.height*.78,side*1.9));
 const x=$derived(layout.x+layout.width*layout.scale*.56);
 const who=$derived(context.stateGame.gameType==='freegame'?'lifeguard':'digger');
 const reaction=$derived(context.stateGame.castReaction);
 const cue=$derived(reaction.kind==='trigger'?'scan':reaction.kind);
 const top=$derived(layout.y+layout.height*layout.scale*.50-height);
 const focus=$derived.by(()=>{
  const cells=context.stateGame.primaryWinningCells;
  const target=context.stateGame.castFocus??(cells.length?{reel:cells.reduce((sum,p)=>sum+p.reel,0)/cells.length,row:cells.reduce((sum,p)=>sum+p.row,0)/cells.length}:null);
  if(!target)return undefined;
  const tx=layout.x+(getSymbolX(target.reel)-layout.pivot.x)*layout.scale;
  const ty=layout.y+((target.row-.5)*SYMBOL_SIZE-layout.pivot.y)*layout.scale;
  return {x:(tx-x-height*236/700)/(height*.7),y:(ty-top-height*125/700)/(height*.55)};
 });
</script>
{#if side>130&&!context.stateGame.featureSplashShow}
 <MainContainer><TreasureFigure {who} {x} y={top} {height} {cue} {focus} sequence={reaction.seq} /></MainContainer>
{/if}

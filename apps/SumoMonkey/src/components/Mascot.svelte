<script lang="ts" module>
 export type EmitterEventMascot = {type:'mascotChestBeat'}|{type:'mascotThrow'}|{type:'mascotGoggleTease'};
</script>
<script lang="ts">
 import { getContext } from '../game/context';
 import SumoFigure from './SumoFigure.svelte';
 import castBounds from '../game/sumoCastPlacement.json';
 import { BOARD_SIZES } from '../game/constants';
 const context=getContext();
 let animation=$state('idle'),loop=$state(true),serial=$state(0);
 const cast=$derived(context.stateGame.gameType==='freegame'?'fg':'mg');
 const placement=$derived.by(()=>{
  const layout=context.stateLayoutDerived.mainLayout(),board=context.stateGameDerived.boardLayout();
  // Off the 4-row frame, not the live one: extra dohyo rows shrink the cells,
  // and a narrower board must not make the rikishi bigger mid-feature.
  const left=board.x+board.width*board.baseScale*.64,gap=layout.width-left;
  if(gap<225)return null;
  // Bounds use the filled alpha silhouette, normalized by the baked rig height.
  // The mirrored idle stance fits the side band; punches travel toward the reels.
  const bounds=castBounds[cast],margin=16;
  const outward=Math.max(...Object.values(bounds).map(clip=>-clip.left));
  const span=bounds.idle.right+outward;
  const height=Math.min(layout.height*.81,(gap-margin*2)/span);
  // feet on the frame floor, which stays put while the dohyo rises
  const floor=board.y+board.height*board.scale/2+BOARD_SIZES.height*board.baseScale*.14;
  return {x:layout.width-margin-height*outward,y:Math.min(floor,layout.height-112),height};
 });
 const play=(name:string)=>{animation=name;loop=false;serial++;};
 const idle=()=>{animation='idle';loop=true;};
 $effect(()=>{const p=placement;context.stateGame.mascotThrowOrigin=p?{x:p.x-p.height*.28,y:p.y-p.height*.65}:null;});
 context.eventEmitter.subscribeOnMount({
  mascotChestBeat:()=>play('celebrate'),mascotThrow:()=>play('punch'),mascotGoggleTease:()=>play('idle_weave'),
  banditLevelUp:()=>play('punch'),winUpdate:({winLevelData})=>{if(winLevelData.type==='big')play('celebrate');},
  winLinesShow:()=>{if(animation==='idle')play('hit');},
 });
</script>
{#if placement}
 <SumoFigure {...placement} {cast} {animation} {loop} restart={serial} mirror oncomplete={idle}/>
{/if}

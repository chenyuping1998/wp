<script lang="ts" module>
 export type EmitterEventMascot = {type:'mascotChestBeat'}|{type:'mascotThrow'}|{type:'mascotGoggleTease'};
</script>
<script lang="ts">
 import { getContext } from '../game/context';
 import SumoFigure from './SumoFigure.svelte';
 import castBounds from '../game/sumoCastPlacement.json';
 import { BOARD_SIZES } from '../game/constants';
 const context=getContext();
 // frame art: the visible ring below the reel opening, as a fraction of the 4-row opening height
 const FRAME_RING=.084,BAND_START=.6; // ring measured on screen: 1440×810 frame bottom at 639 for opening 597
 let animation=$state('idle'),loop=$state(true),serial=$state(0);
 const cast=$derived(context.stateGame.gameType==='freegame'?'fg':'mg');
 const placement=$derived.by(()=>{
  const layout=context.stateLayoutDerived.mainLayout(),board=context.stateGameDerived.boardLayout();
  // Off the 4-row frame, not the live one: extra dohyo rows shrink the cells,
  // and a narrower board must not make the rikishi bigger mid-feature.
  // Stone 2026-11-10: bigger, higher, feet level with the board's bottom edge. The side band now starts
  // just past the frame's visible ring (was .64) and the screen margin is tighter (was 16).
  const left=board.x+board.width*board.baseScale*BAND_START,gap=layout.width-left;
  if(gap<225)return null;
  // Bounds use the filled alpha silhouette, normalized by the baked rig height.
  // The mirrored idle stance fits the side band; punches travel toward the reels.
  const bounds=castBounds[cast],margin=6;
  const outward=Math.max(...Object.values(bounds).map(clip=>-clip.left));
  const span=bounds.idle.right+outward;
  // the furthest punch may cross the frame's wood (as before) but never reach the symbols: the reel opening's
  // right edge is the hard limit for the deepest reach of any animation
  const reach=Math.max(...Object.values(bounds).map(clip=>clip.right));
  const opening=board.x+board.width*board.baseScale/2+4;
  const height=Math.min(layout.height*.81,(gap-margin*2)/span,(layout.width-margin-opening)/(outward+reach));
  // soles on the frame's visible bottom edge (was 0.14 of the 4-row board below the opening, i.e. below the
  // frame); it stays put while the dohyo rises
  const edge=board.y+board.height*board.scale/2+BOARD_SIZES.height*board.baseScale*FRAME_RING;
  return {x:layout.width-margin-height*outward,y:Math.min(edge-height*bounds.idle.bottom,layout.height-112),height};
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

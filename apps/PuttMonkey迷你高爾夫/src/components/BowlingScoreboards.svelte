<script lang="ts" module>
 export type EmitterEventBowlingScoreboards =
  | { type: 'bowlingFrameStart' }
  | { type: 'bowlingFrameScore'; amount: number; big?: boolean };
</script>
<script lang="ts">
 // The course card: the last five holes' wins.
 //
 // 2026-10-18 (user): right under the Buy Bonus plate, centred on it. It used
 // to be painted into the backdrop (parallax coordinates, left of the plate);
 // it is now placed in the standard main layout — the same box the bet bar
 // places Buy Bonus in (LayoutBottomBar: x railWidth/2, y height*0.46) — so it
 // stays under the plate at every landscape size, still behind the board.
 import { Container, Graphics, Text } from 'pixi-svelte';
 import { MainContainer } from 'components-layout';
 import { uiTheme } from 'components-ui-pixi';
 import { getContext } from '../game/context';
 import { NUMBER_FONT } from '../game/fonts';
 const context = getContext();
 const INK=0x1b2a22, PAPER=0xfff6df, ACCENT=0x3fb4e8;
 const CARD_W=368, CARD_H=184;
 // components-ui-pixi UI_BASE_SIZE (ButtonBuyBonus's box before scaling)
 const UI_BASE_SIZE=150;
 let frames = $state<{number:number; amount:number; big:boolean}[]>([]);
 let next = 1;
 context.eventEmitter.subscribeOnMount({
  bowlingFrameStart: () => { frames = [...frames, {number:next++,amount:0,big:false}].slice(-5); },
  bowlingFrameScore: ({amount,big}) => {
   frames=frames.map((f,i)=>i===frames.length-1?{...f,amount:Math.max(0,amount),big:!!big}:f);
  }
 });
 const place = $derived.by(() => {
  const box = context.stateLayoutDerived.mainLayoutStandard();
  // the Buy Bonus plate's lower edge, from the same theme keys it is drawn with
  const plateH = UI_BASE_SIZE * uiTheme.buyBonusButtonScale * uiTheme.buyBonusBoxAspect
   * uiTheme.buyBonusPlateScale * uiTheme.buyBonusRailScale;
  const top = box.height * 0.46 + plateH / 2 + 14;
  const floor = box.height - uiTheme.barHeight - 12;
  const scale = Math.min(.88, (uiTheme.railWidth * .9) / CARD_W, (floor - top) / CARD_H);
  return { x: uiTheme.railWidth * 0.5, y: top + CARD_H * scale / 2, scale };
 });
 const format=(n:number)=>`${(n/100).toFixed(n>=1000?0:1).replace(/\.0$/,'')}×`;
</script>
{#if context.stateLayoutDerived.layoutType()!=='portrait' && place.scale > .35}
<MainContainer standard>
 <Container x={place.x} y={place.y} scale={place.scale}>
  <Graphics draw={(g)=>{
   g.clear();g.roundRect(-CARD_W/2,-CARD_H/2,CARD_W,CARD_H,12).fill(INK).stroke({color:PAPER,width:6});
   g.moveTo(-165,-35).lineTo(165,-35).stroke({color:ACCENT,width:2});
  }}/>
  <Text text="COURSE CARD" anchor={0.5} y={-63}
   style={{fontFamily:NUMBER_FONT,fontSize:24,fill:PAPER,letterSpacing:2}}/>
  {#each [0,1,2,3,4] as column}
   {@const frame=frames[frames.length-1-column]}
   <Container x={-140+column*70}>
    <Text text={`HOLE ${frame?.number??column+1}`} anchor={0.5} y={-12}
     style={{fontFamily:NUMBER_FONT,fontSize:12,fill:ACCENT}}/>
    <Text text={frame?format(frame.amount):'—'} anchor={0.5} y={23}
     style={{fontFamily:NUMBER_FONT,fontSize:22,fill:frame?.big?ACCENT:PAPER}}/>
   </Container>
  {/each}
 </Container>
</MainContainer>
{/if}

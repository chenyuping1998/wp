<script lang="ts" module>
 export type EmitterEventBowlingScoreboards =
  | { type: 'bowlingFrameStart' }
  | { type: 'bowlingFrameScore'; amount: number; big?: boolean };
</script>
<script lang="ts">
 import { Container, Graphics, Text } from 'pixi-svelte';
 import { MainContainer } from 'components-layout';
 import { uiTheme } from 'components-ui-pixi';
 import { getContext } from '../game/context';
 import { NUMBER_FONT } from '../game/fonts';
 type Props = { parallax: { x:number; y:number; width:number; height:number } };
 const props: Props = $props();
 const context = getContext();
 const INK=0x141a33, PAPER=0xf6f0dc, ACCENT=0x7cf05a;
 let frames = $state<{number:number; amount:number; big:boolean}[]>([]);
 let next = 1;
 context.eventEmitter.subscribeOnMount({
  bowlingFrameStart: () => { frames = [...frames, {number:next++,amount:0,big:false}].slice(-5); },
  bowlingFrameScore: ({amount,big}) => {
   frames=frames.map((f,i)=>i===frames.length-1?{...f,amount:Math.max(0,amount),big:!!big}:f);
  }
 });
 // UNDER THE BUY BONUS (user, 2026-10-17). It used to hug the screen's left
 // edge in background units while the button sits on the bar's left rail, so
 // the two drifted apart on wide screens. Now in the bar's own coordinates
 // (LayoutBottomBar: the button's centre is railWidth/2, 0.46 of the standard
 // height, scaled buyBonusRailScale) and centred under the button, just below
 // the cow's hooves: the art fills 950/1132 of its square plate (buyBonusCow.ts).
 const box=$derived(context.stateLayoutDerived.mainLayoutStandard());
 const plateHalf=$derived(150*uiTheme.buyBonusButtonScale*uiTheme.buyBonusPlateScale*uiTheme.buyBonusRailScale*0.5);
 const PANEL_SCALE=.88, PANEL_HALF_H=92;
 const signX=$derived(uiTheme.railWidth*0.5);
 const signY=$derived(box.height*0.46+plateHalf*(950/1132)+14+PANEL_HALF_H*PANEL_SCALE);
 const format=(n:number)=>`${(n/100).toFixed(n>=1000?0:1).replace(/\.0$/,'')}×`;
</script>
{#if context.stateLayoutDerived.layoutType()!=='portrait'}
<MainContainer standard>
 <Container x={signX} y={signY} scale={PANEL_SCALE}>
  <Graphics draw={(g)=>{
   g.clear();g.roundRect(-184,-92,368,184,12).fill(INK).stroke({color:PAPER,width:6});
   g.moveTo(-165,-35).lineTo(165,-35).stroke({color:ACCENT,width:2});
  }}/>
  <Text text="CONTACT LOG" anchor={0.5} y={-63}
   style={{fontFamily:NUMBER_FONT,fontSize:24,fill:PAPER,letterSpacing:2}}/>
  {#each [0,1,2,3,4] as column}
   {@const frame=frames[frames.length-1-column]}
   <Container x={-140+column*70}>
    <Text text={`SCAN ${frame?.number??column+1}`} anchor={0.5} y={-12}
     style={{fontFamily:NUMBER_FONT,fontSize:12,fill:ACCENT}}/>
    <Text text={frame?format(frame.amount):'—'} anchor={0.5} y={23}
     style={{fontFamily:NUMBER_FONT,fontSize:22,fill:frame?.big?ACCENT:PAPER}}/>
   </Container>
  {/each}
 </Container>
</MainContainer>

{/if}

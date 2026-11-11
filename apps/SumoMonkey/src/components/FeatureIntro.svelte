<script lang="ts">
 import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import { MainContainer } from 'components-layout';
 import { onMount } from 'svelte';
 import { getContext } from '../game/context';
 import { GAME_FONT } from '../game/fonts';
 import config from '../game/config';
 import { gameText } from '../game/i18nText';
 import InkNumber from './InkNumber.svelte';
 import { getSocialTerms } from '../game/socialTerms';
 const context=getContext();
 const layout=$derived(context.stateLayoutDerived.mainLayout());
 const stacked=$derived(layout.width/layout.height<1.2);
 const cardW=$derived(stacked?layout.width*.87:layout.width*.25);
 const cardH=$derived(stacked?layout.height*.205:Math.min(layout.height*.57,cardW*1.38));
 const panels=[
  {key:'v8IntroCollect',title:'THE RIKISHI',body:'Every Rikishi collects every Prize Medallion at ×1.'},
  {key:'v8IntroSlice',title:'FREE SPINS',body:`${config.banditMeter.thresholds.join(' / ')} Rikishi: +${config.banditMeter.spinsAdded} spins. Each completed tier raises the dohyo by one row.`},
  {key:'v8IntroReceipt',title:'MAX WIN',body:`The total win is capped at ${config.betModes.base.max_win.toLocaleString()}× your ${getSocialTerms().bet}.`}
 ];
 const tagSize=$derived(Math.max(14,Math.min(layout.width*.026,21)));
 const tagY=$derived(stacked?Math.min(layout.width*.67,680)*.16:92);
 let tagW=$state(0);
 // paper slip behind the tagline: salmon offset print + ink edge, sized to the text
 function drawTagSlip(g:PixiGraphics){
  g.clear();
  const slipW=tagW+tagSize*1.6,slipH=tagSize*1.9;
  g.rect(-slipW/2+3,-slipH/2+3,slipW,slipH).fill(0xc47d60);
  g.rect(-slipW/2,-slipH/2,slipW,slipH).fill(0xefeadc).stroke({width:2,color:0x282828});
 }
 // portrait card text (UI check 2026-11-07 U4: body was ~7px tall on a 390px phone): body never
 // below 12px; title and body sit higher in the card so four wrapped lines still clear the frame
 const bodySize=$derived(stacked?Math.max(12,cardW*.036):cardW*.047);
 let t=$state(0);onMount(()=>{const start=performance.now();let raf=0;const tick=(now:number)=>{t=now-start;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
</script>
<MainContainer>
 <Container x={layout.width*.5} y={layout.height*(stacked?.16:.14)} rotation={.009*Math.sin(t/2900*Math.PI*2)}>
  <Sprite key="sumoLogoMain" anchor={.5} y={stacked?-Math.min(layout.width*.67,680)*.06:-10} width={Math.min(layout.width*.8,640)} height={Math.min(layout.width*.8,640)*.375}/>
  <!-- the loose diamond stamp and the empty rule read as unfinished (review 2026-11-03,
       "Low quality assets"): the rule now carries the board's tagline.
       UI check 2026-11-07 U3: salmon on the dimmed scene was ~2:1 and 8px tall on a phone —
       now ink on a paper slip (same ink edge + salmon offset as the cards), never below 14px. -->
  <Container y={tagY}>
   <Graphics draw={drawTagSlip}/>
   <Text text="5 × 4 · 1,024 WAYS" anchor={.5} onresize={(s)=>tagW=s.width} style={{fontFamily:GAME_FONT,fontSize:tagSize,letterSpacing:2,fill:0x282828}}/>
  </Container>
 </Container>
 {#each panels as panel,i}
  {@const cx=stacked?layout.width*.5:layout.width*(.23+i*.27)}
  {@const cy=stacked?layout.height*(.39+i*.211):layout.height*.57}
  <Container x={cx} y={cy} rotation={stacked?0:Math.sin(t/2000+i)*.005}>
   <Sprite key="v8MenuFrame" anchor={.5} width={cardW} height={cardH}/>
   <Sprite key={panel.key} anchor={.5} x={stacked?-cardW*.25:0} y={stacked?0:-cardH*.16} width={stacked?cardW*.38:cardW*.79} height={stacked?cardW*.38*.625:cardW*.79*.625}/>
   <!-- The cap is centered in the illustration's reserved bottom 20% paper strip. -->
   {#if i===2}{@const artW=stacked?cardW*.38:cardW*.79}{@const numSize=cardW*(stacked?.05:.07)}<InkNumber text={`${config.betModes.base.max_win.toLocaleString()}×`} role="count" x={stacked?-cardW*.25:0} y={(stacked?0:-cardH*.16)+artW*.625*.4} fontSize={numSize} maxWidth={artW*.9}/>{/if}
   <Text text={panel.title} anchor={.5} x={stacked?cardW*.205:0} y={stacked?-cardH*.29:cardH*.12} style={{fontFamily:GAME_FONT,fontSize:cardW*(stacked?.046:.075),fill:0x282828}}/>
   <Text text={panel.body} anchor={{x:.5,y:0}} x={stacked?cardW*.205:0} y={stacked?-cardH*.13:cardH*.23} style={{fontFamily:GAME_FONT,fontSize:bodySize,lineHeight:bodySize*(stacked?1.4:1.36),fill:0x282828,align:'center',wordWrap:true,breakWords:true,wordWrapWidth:cardW*(stacked?.48:.75)}}/>
  </Container>
 {/each}
</MainContainer>

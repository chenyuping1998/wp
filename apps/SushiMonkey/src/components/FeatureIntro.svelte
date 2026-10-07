<script lang="ts">
 import { Container, Sprite, Text } from 'pixi-svelte';
 import { MainContainer } from 'components-layout';
 import { onMount } from 'svelte';
 import { getContext } from '../game/context';
 import { GAME_FONT } from '../game/fonts';
 import config from '../game/config';
 import { gameText } from '../game/i18nText';
 import InkNumber from './InkNumber.svelte';
 const context=getContext();
 const layout=$derived(context.stateLayoutDerived.mainLayout());
 const stacked=$derived(layout.width/layout.height<1.2);
 const cardW=$derived(stacked?layout.width*.87:layout.width*.25);
 const cardH=$derived(stacked?layout.height*.205:Math.min(layout.height*.57,cardW*1.38));
 const panels=[
  {key:'v8IntroCollect',title:'THE CHEF',body:'Every Chef collects every Sushi Plate at ×1.'},
  {key:'v8IntroSlice',title:'FREE SPINS',body:'4 / 8 / 12 Chefs: +10 spins and all 10, then J, then Q become Plates.'},
  {key:'v8IntroReceipt',title:'MAX WIN',body:'The total win is capped at 10,000× your bet.'}
 ];
 let t=$state(0);onMount(()=>{const start=performance.now();let raf=0;const tick=(now:number)=>{t=now-start;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
 const volatility=(config as unknown as {volatility?:number}).volatility;
 // No invented official rating. Until one exists, five neutral dishes accompany
 // the authored theme; publish a numeric rating only when supplied by math.
</script>
<MainContainer>
 <Container x={layout.width*.5} y={layout.height*.16} rotation={.009*Math.sin(t/2900*Math.PI*2)}>
  <Sprite key="v8LogoBoard" anchor={.5} width={Math.min(layout.width*.67,680)} height={Math.min(layout.width*.67,680)*.375}/>
  <Text text="SUSHI MONKEY" anchor={.5} y={-Math.min(layout.width*.67,680)*.375*.23} style={{fontFamily:GAME_FONT,fontSize:Math.min(layout.width*.065,54),fill:0x282828}}/>
  <Sprite key="v8LogoStamp" anchor={.5} x={Math.min(layout.width*.31,315)} y={-22} width={Math.min(layout.width*.105,82)} height={Math.min(layout.width*.105,82)}/>
 </Container>
 <Container x={layout.width*.5-55} y={layout.height*.287}>
  {#each [0,1,2,3,4] as i}<Sprite key={volatility!==undefined&&i<volatility?'v8SoyFull':'v8SoyEmpty'} x={i*23} width={20} height={20}/>{/each}
 </Container>
 {#each panels as panel,i}
  {@const cx=stacked?layout.width*.5:layout.width*(.23+i*.27)}
  {@const cy=stacked?layout.height*(.39+i*.211):layout.height*.57}
  <Container x={cx} y={cy} rotation={stacked?0:Math.sin(t/2000+i)*.005}>
   <Sprite key="v8MenuFrame" anchor={.5} width={cardW} height={cardH}/>
   <Sprite key={panel.key} anchor={.5} x={stacked?-cardW*.25:0} y={stacked?0:-cardH*.16} width={stacked?cardW*.38:cardW*.79} height={stacked?cardW*.38*.625:cardW*.79*.625}/>
   {#if i===2}<InkNumber text="10,000×" role="count" x={stacked?-cardW*.18:cardW*.17} y={stacked?cardH*.10:-cardH*.14} fontSize={cardW*(stacked?.04:.07)} maxWidth={cardW*(stacked?.17:.36)}/>{/if}
   <Text text={panel.title} anchor={.5} x={stacked?cardW*.17:0} y={stacked?-cardH*.23:cardH*.12} style={{fontFamily:GAME_FONT,fontSize:cardW*(stacked?.046:.075),fill:0x282828}}/>
   <Text text={panel.body} anchor={{x:.5,y:0}} x={stacked?cardW*.17:0} y={stacked?-cardH*.035:cardH*.23} style={{fontFamily:GAME_FONT,fontSize:cardW*(stacked?.027:.047),lineHeight:cardW*(stacked?.039:.064),fill:0x282828,align:'center',wordWrap:true,breakWords:true,wordWrapWidth:cardW*(stacked?.48:.75)}}/>
  </Container>
 {/each}
</MainContainer>

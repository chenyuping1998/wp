<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Sprite,Graphics,Text} from 'pixi-svelte';
 import {stateBet} from 'state-shared';
 import {stateBloodMoon as bm} from '../game/bloodmoon.svelte';
 import {winTier,scoreAt,panelMotion,celebrationStages,clamp01} from '../game/presentation';
 import {winEnvelope,winMotion} from '../game/winMotion';
 import BloodMoonWinSpine from './BloodMoonWinSpine.svelte';
 import BloodMoonWinParticles from './BloodMoonWinParticles.svelte';
 import BloodMoonWinCounter from './BloodMoonWinCounter.svelte';
 import {acquireWinCounterFonts} from '../game/winCounterFonts';
 import {GAME_FONT} from '../game/fonts';
 const {reduced=false}:{reduced?:boolean}=$props();
 const currency=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 onMount(acquireWinCounterFonts);
 const tier=$derived(winTier(bm.spinWin));
 const stages=$derived(celebrationStages(bm.spinWin,bm.duration));
 const index=$derived(Math.max(0,stages.findLastIndex(s=>bm.clock>=s.at)));
 const stage=$derived(stages[index]),previous=$derived(stages[index-1]);
 const age=$derived(bm.clock-(stage?.at??0));
 const motion=$derived(winMotion(age,bm.clock,bm.duration,reduced));
 const envelope=$derived(winEnvelope(bm.clock,bm.duration));
 const normalMotion=$derived(panelMotion(bm.clock,bm.duration));
 const amount=$derived(scoreAt(bm.spinWin,bm.baseWin,bm.winMultiplier,Math.floor(bm.clock/33.333)*33.333,bm.duration)*stateBet.wageredBetAmount/100);
 const text=$derived(currency.format(amount));
 const tone=$derived(stage?.tier==='epic'?0xe9a7fa:stage?.tier==='mega'?0xff9b65:stage?.tier==='super'?0xc6c3ff:0xbdeac8);
 const rigLayers=$derived.by(()=>{
  if(bm.phase!=='win'||!tier||!stage||age<0)return [];
  const p=clamp01(age/320),blend=p*p*(3-2*p),layers=[];
  if(previous&&blend<1)layers.push({tier:previous.tier,id:`${bm.presentationId}/${previous.tier}`,time:reduced?1200:(bm.clock-previous.at)*1.12,alpha:1-blend});
  layers.push({tier:stage.tier,id:`${bm.presentationId}/${stage.tier}`,time:reduced?1200:age*1.12,alpha:blend});
  return layers;
 });
 const style={fontFamily:GAME_FONT,fontWeight:'bold' as const,fill:0xffe7b3,stroke:{color:0x24091b,width:6},dropShadow:{color:0x000000,blur:8,distance:3}};
 const labelStyle={...style,fontSize:13,letterSpacing:5,fill:0xb9a17e,stroke:{color:0x140b16,width:2},dropShadow:{color:0x000000,blur:2,distance:1}};
 const subtitleStyle={...style,fontSize:16,letterSpacing:3,fill:0xd3b58b,stroke:{color:0x180b18,width:3}};
</script>
<!-- Mounted while idle so the original skeletal scenes are ready before a win. -->
<Container x={640+motion.shake} y={350+motion.exitY} alpha={bm.phase==='win'&&tier?envelope:0}>
 <BloodMoonWinSpine active={bm.phase==='win'&&!!tier} layers={rigLayers}/>
 <Sprite key="bmWin_rays" anchor={.5} y={-40} width={1000} height={1000} rotation={reduced?0:bm.clock*.000035} alpha={bm.phase==='win'&&tier ? .14+motion.impact*.12 : 0} tint={tone} blendMode="add"/>
 <BloodMoonWinParticles active={bm.phase==='win'&&!!tier&&!reduced} {age} previousAge={previous?bm.clock-previous.at:-1} {tone}/>
 {#if bm.phase==='win'&&tier&&stage}
  {#if previous&&age>=0&&age<200}
   <Sprite key={`bmCelebration_${previous.tier}`} anchor={.5} y={-86-30*clamp01(age/200)} width={600} height={145} alpha={1-clamp01(age/200)}/>
  {/if}
  <Container y={motion.titleY} scale={{x:motion.scaleX,y:motion.scaleY}} alpha={motion.alpha}>
   <Sprite key={`bmCelebration_${stage.tier}`} anchor={.5} width={600} height={145}/>
   {#if !reduced&&motion.sheen>0&&motion.sheen<1}
    <Container>
     <Graphics isMask x={-470+motion.sheen*940} draw={g=>g.moveTo(-90,-120).lineTo(15,-120).lineTo(100,120).lineTo(-5,120).closePath().fill(0xffffff)}/>
     <Sprite key={`bmCelebration_${stage.tier}`} anchor={.5} width={600} height={145} alpha={.6} blendMode="add"/>
    </Container>
   {/if}
  </Container>
  <Container y={motion.plateY} scale={motion.plateScale}>
   <Sprite key="bmWin_plaque" anchor={.5} width={830} height={250}/>
   <Sprite key="bmWin_plaque" anchor={.5} width={830} height={250} alpha={motion.impact*.11} tint={tone} blendMode="add"/>
   <Text anchor={.5} y={-49} text="WIN" style={labelStyle}/>
   <BloodMoonWinCounter {text} y={7}/>
  </Container>
  <Text anchor={.5} y={232} alpha={envelope*clamp01((bm.clock-700)/450)} text={bm.winMultiplier>1?`BLOOD MULTIPLIER  ×${bm.winMultiplier}`:'THE NIGHT IS YOURS'} style={subtitleStyle}/>
 {/if}
</Container>
{#if bm.phase==='win'&&bm.spinWin>0}
 {#if !tier}
  <Container x={640} y={621+normalMotion.y*.25} alpha={normalMotion.alpha} scale={normalMotion.scale}>
   <Graphics draw={g=>g.roundRect(-175,-32,350,64,18).fill({color:0x170913,alpha:.96}).stroke({color:0xa7773e,width:2})}/>
   <BloodMoonWinCounter {text} size={38} emboss={false}/>
   {#if bm.winMultiplier>1&&bm.clock>bm.duration*.4}<Text anchor={.5} y={-62} text={`×${bm.winMultiplier}`} style={{...style,fontSize:36,fill:0xf2c57f}}/>{/if}
  </Container>
 {/if}
{/if}

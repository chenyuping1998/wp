<script lang="ts">
 import {Container,Sprite,Graphics,Text} from 'pixi-svelte';
 import {stateBet} from 'state-shared';
 import {stateBloodMoon as bm} from '../game/bloodmoon.svelte';
 import {panelMotion,easeOut,clamp01,MULTIPLIER_AT,PLUS_SPINS_AT} from '../game/presentation';
 import {GAME_FONT} from '../game/fonts';
 import BloodMoonDust from './BloodMoonDust.svelte';
 import BloodMoonWinCounter from './BloodMoonWinCounter.svelte';
 const currency=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const {reduced=false}:{reduced?:boolean}=$props();
 const upgrade=$derived(bm.phase==='progress'&&!!bm.progress?.addedSpins&&bm.clock>=MULTIPLIER_AT);
 const local=$derived(upgrade?bm.clock-MULTIPLIER_AT:bm.clock);
 const duration=$derived(upgrade?bm.duration-MULTIPLIER_AT:bm.duration);
 const motion=$derived(panelMotion(local,duration));
 const title=$derived(bm.phase==='freeStart'?'THE BLOOD MOON RISES':bm.phase==='freeEnd'?'TOTAL WIN':bm.clock<PLUS_SPINS_AT?`×${bm.fg.multiplier}`:`+${bm.progress?.addedSpins??0} FREE SPINS`);
 const subtitle=$derived(bm.phase==='freeStart'?`${bm.fg.spinsTotal} FREE SPINS`:bm.phase==='freeEnd'?`${bm.fg.spinsPlayed} FREE SPINS`:`${bm.fg.points} BLOOD POINTS`);
 const total=$derived(currency.format(bm.totalWin*easeOut(bm.clock/2400)*stateBet.wageredBetAmount/100));
 const style={fontFamily:GAME_FONT,fontWeight:'bold' as const,fill:0xf8ddb0,stroke:{color:0x27091a,width:5},dropShadow:{color:0x000000,blur:7,distance:3}};
</script>
{#if bm.phase==='freeStart'||bm.phase==='freeEnd'||upgrade}
 <Container x={640} y={340+motion.y} scale={motion.scale} alpha={motion.alpha}>
  <Sprite key="bmScene_bloodMoon" anchor={.5} y={-110} width={280} height={280} alpha={.75} blendMode="add"/>
  <Sprite key="bmEnvironment_glint" anchor={.5} width={700} height={700} tint={0xba2d53} alpha={.12} blendMode="add" rotation={reduced?0:bm.clock*.000055}/>
  {#each [-1,1] as side}
   <Sprite key="bmEnvironment_mist" anchor={.5} x={side*(240+60*easeOut(local/1500))} y={65+Math.sin(local*.001)*18} width={530} height={240} tint={0x8d304e} alpha={.2}/>
  {/each}
  <Graphics draw={g=>g.roundRect(-365,-100,730,bm.phase==='freeEnd'?285:235,24).fill({color:0x190b1d,alpha:.94}).stroke({color:0x987047,width:2})}/>
  <Sprite key="bmScene_transitionCrest" anchor={.5} y={-115} width={220} height={141}/>
  <Text anchor={.5} y={-5} text={title} style={{...style,fontSize:bm.phase==='freeStart'?34:43,letterSpacing:2}}/>
  {#if bm.phase==='freeEnd'}<BloodMoonWinCounter text={total} y={70} size={57} emboss={false}/>{/if}
  <Text anchor={.5} y={bm.phase==='freeEnd'?133:66} text={subtitle} style={{...style,fontSize:24,fill:0xcab28f}}/>
  {#if !reduced}
   <BloodMoonDust kind="transition" time={local/1000}/>
  {/if}
 </Container>
{/if}

<script lang="ts">
 import { onMount } from 'svelte';
 import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
 import { getContext } from '../game/context';
 import { sceneMotion } from '../game/sceneMotion.svelte';
 import { GAME_FONT } from '../game/fonts';
 const c=getContext();const l=$derived(c.stateLayoutDerived.mainLayout());const free=$derived(c.stateGame.gameType==='freegame');
 let t=$state(0),kickAt=-1000,kickStrength=0;let kickDuration=100;let raf=0;
 c.eventEmitter.subscribeOnMount({boardFrameImpact:({strength,kind})=>{
  if((strength??1)<=0)return; const now=performance.now(),next=Math.min(1.8,strength??1);
  kickStrength=now-kickAt<32?Math.max(kickStrength,next):next;kickAt=now;
  kickDuration=kind==='upgrade'?150:kind==='win'?125:100;
  performance.mark('staticshift:impact:'+ (kind??'landing'));
 }});
 onMount(()=>{const started=performance.now();const tick=(now:number)=>{
  t=(now-started)/1000;const k=(now-kickAt)/kickDuration;
  // A sharp downward hit, two descending shelves, then a clean rest. Never random x jitter.
  const envelope=k<0||k>=1?0:k<.38?1:k<.70?.33:.10;
  sceneMotion.y=envelope*l.height*.0107*kickStrength;
  raf=requestAnimationFrame(tick);
 };raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);sceneMotion.y=0;};});
 const bird=$derived.by(()=>{const p=t%16.2;let x=.17,stand=0,face=1;
 if(p>3.5&&p<7.8)x=.17-(p-3.5)/4.3*.13;
 else if(p>=7.8&&p<13.2){x=.04;stand=p<10.1?0:p<10.4?(p-10.1)/.3:p<12.4?1:p<12.7?1-(p-12.4)/.3:0;}
 else if(p>=13.2){x=.04+(p-13.2)/3*.13;face=-1;}
 const walking=(p>3.5&&p<7.8)||p>13.2;
 return{x:x*l.width,y:l.height*.91-(walking?Math.abs(Math.sin(t*19))*3:stand*12),r:walking?Math.sin(t*19)*.035:-stand*.20,face};});
 const sign=$derived(free?0xb8d080:(t%6<.35?0xe7aa53:0x82c9cf));
</script>
{#if l.width/l.height>1.3}
 <Container x={l.width*.105} y={l.height*.19}>
  <Graphics draw={(g)=>{g.clear();g.poly([-93,-38,95,-35,91,35,-90,38]).fill(0x15191f).stroke({width:3,color:0x535e88});}}/>
  <Text anchor={0.5} y={-10} text={free?'ON AIR':'STATIC'} style={{fontFamily:GAME_FONT,fontSize:28,fill:sign}}/>
  <Text anchor={0.5} y={17} text={free?'AFTER HOURS':'89.4 FM'} style={{fontFamily:GAME_FONT,fontSize:14,fill:0xe5e2d6}}/>
 </Container>
 <Container x={bird.x} y={bird.y} rotation={bird.r} scale={{x:bird.face,y:1}}><Sprite key="ssPigeon" anchor={{x:.5,y:1}} width={84} height={65}/></Container>
{/if}

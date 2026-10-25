<script lang="ts">
 import { onMount } from 'svelte';
 import { Container, Sprite } from 'pixi-svelte';
 import { MainContainer } from 'components-layout';
 import { getContext } from '../game/context';
 import type { WinLevelAlias } from '../game/winLevelMap';
 type Props={emit?:boolean;levelAlias?:WinLevelAlias};
 const props:Props=$props();
 const context=getContext();
 type Coin={id:number;x:number;y:number;vx:number;vy:number;age:number;life:number;size:number;phase:number};
 let coins=$state.raw<Coin[]>([]);
 const tiers:Partial<Record<WinLevelAlias,number>>={substantial:4,big:6,superwin:8,mega:10,epic:12,max:15};
 // The polished painted Medusa medallion is also the celebration coin.
 // Horizontal foreshortening is evaluated in Pixi; no template coin atlas.
 onMount(()=>{
  let raf=0,last=0,spawn=0,id=0;const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const tick=(now:number)=>{
   if(!last||document.hidden){last=now;raf=requestAnimationFrame(tick);return;}
   const dt=Math.min(.05,(now-last)/1000);last=now;
   if(preference.matches){coins=[];spawn=0;raf=requestAnimationFrame(tick);return;}
   const rate=props.levelAlias?tiers[props.levelAlias]??0:0;
   if(props.emit&&rate)spawn+=dt*rate;else spawn=0;
   const next=coins.map(c=>({...c,age:c.age+dt,x:c.x+c.vx*dt,y:c.y+c.vy*dt,vy:c.vy+1300*dt})).filter(c=>c.age<c.life);
   while(spawn>=1&&next.length<65){spawn--;next.push({id:id++,x:(Math.random()-.5)*230,y:230,vx:(Math.random()-.5)*230,vy:-730-Math.random()*170,age:0,life:1.7+Math.random()*.3,size:36+Math.random()*17,phase:Math.random()*Math.PI*2});}
   coins=next;raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);coins=[];};
 });
</script>
<MainContainer>
 <Container x={context.stateGameDerived.boardLayout().x} y={context.stateGameDerived.boardLayout().y}>
  {#each coins as coin (coin.id)}
   <Container x={coin.x} y={coin.y} rotation={Math.sin(coin.phase)*coin.age*.8}
    scale={{x:.12+.88*Math.abs(Math.cos(coin.phase+coin.age*7)),y:1}} alpha={Math.min(1,(coin.life-coin.age)/.24)}>
    <Sprite key="mgS" anchor={0.5} width={coin.size} height={coin.size}/>
   </Container>
  {/each}
 </Container>
</MainContainer>

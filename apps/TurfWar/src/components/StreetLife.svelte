<script lang="ts">
  import { onMount } from 'svelte';
  import { Container, Graphics, Text } from 'pixi-svelte';
  import { TITLE_FONT } from '../game/fonts';
  type Props = { scene: {x:number;y:number;width:number;height:number}; mode: 'base'|'feature'|'epic' };
  const props: Props = $props();
  let clock = $state(0);
  const scale = $derived(props.scene.width/1920);
  const enabled = typeof location === 'undefined' || new URLSearchParams(location.search).get('bgfx') !== 'none';
  onMount(() => {
    let frame = 0, last = 0;
    const tick = (now:number) => { if(last)clock+=Math.min(100,Math.max(0,now-last))/1000;last=now;frame=requestAnimationFrame(tick); };
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  });
  const bird = $derived.by(() => {
    const phase=clock%18;
    const walk=phase<5?phase/5:phase<10?1:phase<15?1-(phase-10)/5:0;
    return {x:205+walk*175,y:735-Math.abs(Math.sin(clock*8))*((phase<5||phase>10&&phase<15)?3:0),face:phase<10?1:-1,peck:phase>6&&phase<9?Math.sin(clock*5)*.28:0};
  });
</script>

{#if enabled}
<Container zIndex={-1} x={props.scene.x} y={props.scene.y} scale={scale}>
  {#if props.mode === 'base'}
    <!-- A pigeon walks/pecks on the bin ledge; it has its own clock and limbs. -->
    <Container x={bird.x} y={bird.y} scale={{x:bird.face,y:1}} rotation={bird.peck}>
      <Graphics draw={(g)=>{
        g.clear();g.ellipse(0,-19,24,15);g.fill(0x55585d);g.stroke({color:0x121212,width:3});
        g.ellipse(7,-24,15,8);g.fill(0x9a9ca0);g.stroke({color:0x121212,width:2});
        g.poly([-21,-19,-36,-24,-25,-8]);g.fill(0x3a3d42);g.stroke({color:0x121212,width:2});
        g.circle(19,-37,11);g.fill(0x3a3d42);g.stroke({color:0x121212,width:3});
        g.poly([27,-39,37,-35,27,-33]);g.fill(0xffc38a);g.circle(23,-40,2);g.fill(0xf7f5f0);
        const step=Math.sin(clock*8)*5;
        g.moveTo(-8,-6);g.lineTo(-10+step,1);g.lineTo(-2+step,1);g.moveTo(8,-6);g.lineTo(10-step,1);g.lineTo(18-step,1);g.stroke({color:0x121212,width:3});
      }} />
    </Container>
    <!-- Steam belongs to the pavement drain at the left of the painted alley. -->
    {#each [0,1,2] as i}
      {@const p=(clock*.22+i/3)%1}
      <Graphics alpha={(1-p)*.3} draw={(g)=>{
        const x=125+Math.sin(clock*.8+i)*16;const y=970-p*240;const w=12+p*26;
        g.clear();g.moveTo(x-w*.5,y);g.bezierCurveTo(x-w,y-35,x+w,y-70,x,y-105);g.bezierCurveTo(x+w*1.5,y-65,x+w*.25,y-25,x+w*.5,y);g.closePath();g.fill(0xf7f5f0);
      }} />
    {/each}
  {:else}
    <!-- Feature modes: swinging warehouse chain and an intermittent amber lamp. -->
    <Container x={180} y={145} rotation={Math.sin(clock*.9)*.075}>
      <Graphics draw={(g)=>{
        g.clear();for(let i=0;i<8;i++){g.ellipse(0,i*13,5,9);g.stroke({color:i%2?0x9a9ca0:0x55585d,width:3});}
        g.poly([-26,115,-18,98,18,98,26,115]);g.fill(0x121212);g.stroke({color:0xf5893d,width:3});
        g.rect(-20,115,40,9);g.fill(0xf5893d);
      }} />
    </Container>
    <Graphics draw={(g)=>{
      const phase=clock%6;const lit=phase>.18&&phase<5.1&&!(phase>1.1&&phase<1.22);
      g.clear();g.roundRect(42,335,115,48,7);g.fill(0x121212);g.stroke({color:0x9c5a22,width:4});
      g.roundRect(51,344,97,30,3);g.fill(lit?0xf5893d:0x9c5a22);
      if(lit){g.moveTo(58,352);g.lineTo(139,352);g.stroke({color:0xffc38a,width:3});}
    }} />
    {#each [0,1] as i}
      {@const p=(clock*.15+i/2)%1}
      <Graphics alpha={(1-p)*.24} draw={(g)=>{
        const x=75+Math.sin(clock+i)*12,y=855-p*190;
        g.clear();g.moveTo(x-12,y);g.bezierCurveTo(x-40,y-25,x+30,y-70,x,y-105);g.bezierCurveTo(x+50,y-70,x+15,y-20,x+12,y);g.closePath();g.fill(0xf7f5f0);
      }} />
    {/each}
  {/if}
  <!-- Loose pennants over the neighborhood, visible in the portrait crop too. -->
  <Graphics draw={(g)=>{
    g.clear();g.moveTo(40,26);g.quadraticCurveTo(1000,160,1880,15);g.stroke({color:0x121212,width:3});
    for(let i=0;i<9;i++){
      const x=120+i*200;const y=26+75*Math.sin(x/1920*Math.PI);const flutter=Math.sin(clock*1.7+i*.7);
      g.poly([x,y,x+36,y+3,x+20+flutter*12,y+52+flutter*6]);g.fill(i%2?0xf5893d:0x55585d);g.stroke({color:0x121212,width:2});
    }
  }} />
</Container>
{/if}

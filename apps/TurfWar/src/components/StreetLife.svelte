<script lang="ts">
  import { onMount } from 'svelte';
  import { Container, Graphics } from 'pixi-svelte';
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
  const smooth = (u:number) => {u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
  // A shared, slow gust gives nearby objects a common physical cause.
  const wind = (t:number) => {
    const p=((t%31)+31)%31;
    // Slow modulation prevents successive gusts from being exact copies.
    return p<19?0:Math.sin(Math.PI*(p-19)/12)**2*(.82+.18*Math.sin(t/79*Math.PI*2));
  };
  const bird = $derived.by(() => {
    const phase=clock%48;
    const outward=phase>=12&&phase<17;
    const homeward=phase>=36&&phase<41;
    const walking=outward||homeward;
    const u=outward?(phase-12)/5:homeward?(phase-36)/5:0;
    const walk=outward?smooth(u):homeward?1-smooth(u):phase>=17&&phase<36?1:0;
    const step=walking?Math.sin(u*Math.PI*10)*Math.sin(Math.PI*u):0;
    const peckU=(phase-25)/1.4;
    const peck=peckU>0&&peckU<1?Math.sin(Math.PI*peckU)**2*.22:0;
    return {x:205+walk*90,y:865-walk*8-Math.abs(step)*1.2,face:phase<36?1:-1,step:step*3,peck};
  });
</script>

{#if enabled}
<Container zIndex={-1} x={props.scene.x} y={props.scene.y} scale={scale}>
  {#if props.mode === 'base'}
    <!-- Pigeon feet follow the painted pavement, below the shutter (not a floating ledge). -->
    <Container x={bird.x} y={bird.y} scale={{x:bird.face,y:1}}>
      <Graphics draw={(g)=>{
        g.clear();g.ellipse(0,-19,24,15);g.fill(0x55585d);g.stroke({color:0x121212,width:3});
        g.ellipse(7,-24,15,8);g.fill(0x9a9ca0);g.stroke({color:0x121212,width:2});
        g.poly([-21,-19,-36,-24,-25,-8]);g.fill(0x3a3d42);g.stroke({color:0x121212,width:2});
        const headX=19+bird.peck*22;const headY=-37+bird.peck*32;
        g.circle(headX,headY,11);g.fill(0x3a3d42);g.stroke({color:0x121212,width:3});
        g.poly([headX+8,headY-2,headX+18,headY+2,headX+8,headY+4]);g.fill(0xffc38a);g.circle(headX+4,headY-3,2);g.fill(0xf7f5f0);
        const step=bird.step;
        g.moveTo(-8,-6);g.lineTo(-10+step,1);g.lineTo(-2+step,1);g.moveTo(8,-6);g.lineTo(10-step,1);g.lineTo(18-step,1);g.stroke({color:0x121212,width:3});
      }} />
    </Container>
  {:else}
    <!-- Feature modes: wind-driven warehouse chain and a steady amber lamp. -->
    <Container x={180} y={145} rotation={wind(clock-1.1)*Math.sin((clock-1.1)*.65)*.018}>
      <Graphics draw={(g)=>{
        g.clear();for(let i=0;i<8;i++){g.ellipse(0,i*13,5,9);g.stroke({color:i%2?0x9a9ca0:0x55585d,width:3});}
        g.poly([-26,115,-18,98,18,98,26,115]);g.fill(0x121212);g.stroke({color:0xf5893d,width:3});
        g.rect(-20,115,40,9);g.fill(0xf5893d);
      }} />
    </Container>
    <Graphics draw={(g)=>{
      const warmth=.92+.035*Math.sin(clock*.29)+.02*Math.sin(clock*.17);
      g.clear();g.roundRect(42,335,115,48,7);g.fill(0x121212);g.stroke({color:0x9c5a22,width:4});
      g.roundRect(51,344,97,30,3);g.fill({color:0xf5893d,alpha:warmth});
      {g.moveTo(58,352);g.lineTo(139,352);g.stroke({color:0xffc38a,width:3});}
    }} />
  {/if}
  <!-- Feathered steam: transparent at birth and death, with slow lateral drift.
       Nested low-alpha silhouettes soften the edge without a bright opaque blob. -->
  {#each [0,1,2] as i}
    {@const p=(clock/17+i/3)%1}
    {@const opacity=Math.sin(Math.PI*p)**2*.055}
    <Graphics alpha={opacity} draw={(g)=>{
      const base=props.mode==='base';
      const x=(base?125:75)+p*24+Math.sin(p*Math.PI*2+i)*9;
      const y=(base?970:855)-p*155;
      g.clear();
      for(let layer=0;layer<5;layer++){
        const w=(11+p*24)*(1-layer*.12);
        g.moveTo(x-w*.5,y);
        g.bezierCurveTo(x-w,y-30,x+w*.8,y-63,x+4,y-94);
        g.bezierCurveTo(x+w*1.2,y-62,x+w*.3,y-24,x+w*.5,y);
        g.closePath();g.fill({color:0xd8d6d1,alpha:.22});
      }
    }} />
  {/each}
  <!-- Loose pennants over the neighborhood, visible in the portrait crop too. -->
  <Graphics draw={(g)=>{
    g.clear();g.moveTo(40,26);g.quadraticCurveTo(1000,160,1880,15);g.stroke({color:0x121212,width:3});
    for(let i=0;i<9;i++){
      const u=(80+i*200)/1840;
      const x=(1-u)*(1-u)*40+2*(1-u)*u*1000+u*u*1880;
      const y=(1-u)*(1-u)*26+2*(1-u)*u*160+u*u*15;
      const endU=u+.019;
      const endX=(1-endU)*(1-endU)*40+2*(1-endU)*endU*1000+endU*endU*1880;
      const endY=(1-endU)*(1-endU)*26+2*(1-endU)*endU*160+endU*endU*15;
      const flutter=wind(clock-i*.16)*Math.sin(clock*.85-i*.34);
      const follow=wind(clock-i*.16-.35)*Math.sin((clock-.35)*.85-i*.34);
      const tipX=x+20+follow*4;
      const tipY=y+52+follow*1.5;
      // Both top corners stay on the cable. The cloth belly leads its free tip.
      g.moveTo(x,y);g.lineTo(endX,endY);
      g.quadraticCurveTo(x+30+flutter*3,y+26,tipX,tipY);
      g.quadraticCurveTo(x+9+flutter*2,y+25,x,y);g.closePath();
      g.fill(i%2?0xf5893d:0x55585d);g.stroke({color:0x121212,width:2});
    }
  }} />
</Container>
{/if}

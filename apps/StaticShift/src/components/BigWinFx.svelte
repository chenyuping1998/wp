<script lang="ts">
 import { onMount } from 'svelte';
 import { Container, Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 type Props={x?:number;y?:number;radius?:number;intensity?:number};
 const props:Props=$props();const radius=$derived(props.radius??520);const intensity=$derived(props.intensity??1);
 let elapsed=$state(0);
 onMount(()=>{let id=0;const start=performance.now();const tick=(now:number)=>{elapsed=(now-start)/1000;id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);});
 const draw=(g:PixiGraphics)=>{
  g.clear();const strong=intensity>=1.5;const color=intensity>=1.8?0xb8d080:0xe5e2d6;
  // Ink speed slashes have a readable attack and retreat, not a rotating golden sun.
  const attack=Math.max(0,1-elapsed/.46);const count=strong?18:10;
  for(let i=0;i<count;i++){
   const a=i*Math.PI*2/count+.11;const r=radius*(.70+(i%3)*.06);const d=radius*(.05+attack*(strong?.40:.22));
   g.poly([Math.cos(a-.008)*r,Math.sin(a-.008)*r*.70,Math.cos(a)*(r+d),Math.sin(a)*(r+d)*.70,Math.cos(a+.008)*r,Math.sin(a+.008)*r*.70]).fill({color,alpha:.22+attack*.50});
  }
  // Sparse broken radio-wave arcs: the world is transmitting, not sparkling.
  for(let j=0;j<(strong?3:2);j++){
   const phase=(elapsed*.48+j*.31)%1;const r=radius*(.62+phase*.42);
   for(const side of [0,Math.PI]){g.moveTo(Math.cos(side-.30)*r,Math.sin(side-.30)*r);g.arc(0,0,r,side-.30,side+.30).stroke({width:strong?4:2,color,alpha:(1-phase)*.26});}
  }
 };
</script>
<Container x={props.x??0} y={props.y??0}><Graphics {draw}/></Container>

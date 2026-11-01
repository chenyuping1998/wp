<script lang="ts">
 import { Container,Sprite } from 'pixi-svelte';
 import { onMount } from 'svelte';
 type Props={x?:number;y?:number;radius?:number;intensity?:number};const props:Props=$props();
 const radius=$derived(props.radius??520);let t=$state(0);
 const scraps=Array.from({length:36},(_,i)=>({i,phase:i*.173,x:Math.sin(i*7.31),v:.7+(i%6)*.12,size:14+(i%5)*4}));
 onMount(()=>{let raf=0;const start=performance.now();const tick=(now:number)=>{t=(now-start)/1000;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
</script>
<Container x={props.x??0} y={props.y??0}>
 <Container rotation={t*.045}>
  {#each [0,1,2,3,4,5,6,7] as i}<Sprite key="v8Ray" anchor={{x:.5,y:1}} rotation={i*Math.PI/4} width={radius*.5} height={radius} alpha={.14}/>{/each}
 </Container>
 {#each scraps as p}
  {@const phase=(t*p.v*.22+p.phase)%1}
  <Sprite key={`v8Particle${p.i%16}`} anchor={.5} x={p.x*radius+(phase-.5)*60} y={radius*(phase*2-1)} width={p.size*(props.intensity??1)} height={p.size*(props.intensity??1)} rotation={t*(p.i%2?1:-1)+p.i} alpha={Math.sin(phase*Math.PI)}/>
 {/each}
</Container>

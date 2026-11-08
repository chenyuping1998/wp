<script lang="ts">
 import { Container, Sprite } from 'pixi-svelte';
 import { onMount } from 'svelte';
 const props:{x?:number;y?:number;radius?:number;intensity?:number}=$props();
 const radius=$derived(props.radius??520);let clock=$state(0);
 onMount(()=>{const start=performance.now();const timer=setInterval(()=>clock=(performance.now()-start)/1000,50);return()=>clearInterval(timer);});
</script>
<Container x={props.x??0} y={props.y??0}>
 <Sprite key="mummyRays" anchor={.5} width={radius*4.8} height={radius*2.7} rotation={clock*Math.PI/20} alpha={.2} tint={0x2ec4b6} blendMode="add" />
 <Sprite key="fxGlow" anchor={.5} width={radius*1.8} height={radius*1.2} tint={0xf2e8d0} alpha={.14+Math.min(2,props.intensity??1)*.04} blendMode="add" />
</Container>

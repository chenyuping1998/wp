<script lang="ts">
 import { onMount } from 'svelte';
 import { Sprite } from 'pixi-svelte';
 const {spinning=false,radius=30}: {spinning?:boolean;radius?:number}=$props();
 let angle=$state(0);
 onMount(()=>{let raf=0,prev=performance.now();const tick=(now:number)=>{const dt=Math.min(60,now-prev);prev=now;if(spinning)angle+=dt/750*Math.PI*2;else {const target=Math.ceil(angle/(Math.PI*2))*Math.PI*2;angle=Math.min(target,angle+dt/500*Math.PI*2);if(angle===target)angle=0;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
</script>
<Sprite key="gbIconSpinV2" anchor={.5} rotation={angle} width={radius*2} height={radius*2}/>

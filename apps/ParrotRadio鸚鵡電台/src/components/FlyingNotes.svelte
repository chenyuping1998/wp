<script lang="ts">
 import {onMount} from 'svelte';import {Sprite,Container} from 'pixi-svelte';
 const props:{x:number;y:number;seed:number;oncomplete:()=>void}=$props();let age=$state(0);
 onMount(()=>{let raf=0,done=false;const start=performance.now();const finish=()=>{if(done)return;done=true;props.oncomplete();};const tick=(now:number)=>{age=Math.min(1,(now-start)/350);if(age<1)raf=requestAnimationFrame(tick);else finish();};raf=requestAnimationFrame(tick);const fallback=setTimeout(finish,450);return()=>{done=true;cancelAnimationFrame(raf);clearTimeout(fallback);};});
</script>
<Container x={props.x} y={props.y}>
 {#each [0,1] as n}<Sprite key={['mgL1','mgL2','mgL3','mgL4'][(props.seed+n)%4]} anchor={.5} x={(n?1:-1)*24*age} y={-68*age+15*age*age} rotation={(n?1:-1)*age*.6} width={26*(1-age*.5)} height={32*(1-age*.5)} alpha={1-age}/>{/each}
</Container>

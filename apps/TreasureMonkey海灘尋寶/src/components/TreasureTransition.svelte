<script lang="ts">
 import { onMount } from 'svelte';
 import { getContext } from '../game/context';
 import WaveWipe from './WaveWipe.svelte';
 let {onblack=()=>{},oncomplete}:{onblack?:()=>void;oncomplete:()=>void}=$props();
 const context=getContext();
 const sizes=$derived(context.stateLayoutDerived.canvasSizes());
 onMount(()=>context.eventEmitter.broadcast({type:'soundNeonZap'}));
</script>
<WaveWipe width={sizes.width} height={sizes.height} oncover={onblack} {oncomplete}/>

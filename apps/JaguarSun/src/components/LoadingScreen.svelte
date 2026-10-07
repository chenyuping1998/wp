<script lang="ts">
import { onMount } from 'svelte';
import { getContext } from '../game/context';
let props:{onloaded:()=>void}=$props();
const c=getContext();
onMount(()=>{const id=setInterval(()=>{if(c.stateApp.loaded){clearInterval(id);props.onloaded();}},100);return()=>clearInterval(id);});
</script>

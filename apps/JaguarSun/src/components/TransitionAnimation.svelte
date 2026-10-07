<script lang="ts">
import { onMount } from 'svelte';
import { Rectangle } from 'pixi-svelte';
import { getContext } from '../game/context';
let props:{onblack?:()=>void;oncomplete?:()=>void}=$props();
const c=getContext();let alpha=$state(0);
onMount(()=>{let start=performance.now(),black=false;const id=setInterval(()=>{const t=performance.now()-start;alpha=t<420?t/420:t<750?1:Math.max(0,1-(t-750)/650);if(t>=420&&!black){black=true;props.onblack?.();}if(t>=1400){clearInterval(id);props.oncomplete?.();}},16);return()=>clearInterval(id);});
</script>
<Rectangle {...c.stateLayoutDerived.canvasSizes()} backgroundColor={0x041412} {alpha}/>

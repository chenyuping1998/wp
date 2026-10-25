<script lang="ts">
 import {Sprite} from 'pixi-svelte';
 import {onMount} from 'svelte';
 import {SYMBOL_SIZE} from '../game/constants';
 import type {getSymbolInfo} from '../game/utils';
 const props:$$_Props=$props();
 type $$_Props={x?:number;y?:number;name:string;symbolInfo:ReturnType<typeof getSymbolInfo>;oncomplete?:()=>void;petrify?:boolean};
 let age=$state(0);
 onMount(()=>{let raf=0,done=false;const start=performance.now();const finish=()=>{if(!done){done=true;props.oncomplete?.();}};const tick=(now:number)=>{age=Math.min(1,(now-start)/320);if(age<1)raf=requestAnimationFrame(tick);else finish();};raf=requestAnimationFrame(tick);const timer=setTimeout(finish,420);return()=>{done=true;clearTimeout(timer);cancelAnimationFrame(raf);};});
 const bump=$derived(1+.09*Math.sin(age*Math.PI));
</script>
<Sprite x={props.x} y={(props.y??0)-7*Math.sin(age*Math.PI)} anchor={0.5} key={props.symbolInfo.assetKey} width={SYMBOL_SIZE*props.symbolInfo.sizeRatios.width*bump} height={SYMBOL_SIZE*props.symbolInfo.sizeRatios.height*bump} />

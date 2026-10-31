<script lang="ts">
 import SymbolMeshWin from './SymbolMeshWin.svelte';
 import {Sprite,Container} from 'pixi-svelte';
 import {onMount,onDestroy} from 'svelte';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolInfo} from '../game/utils';
 import {getContext} from '../game/context';
 import type {RawSymbol,SymbolState} from '../game/types';
 const props:{x?:number;y?:number;state:SymbolState;rawSymbol:RawSymbol;oncomplete?:()=>void;blur?:number;impact?:number;loop?:boolean}=$props();
 const info=$derived(getSymbolInfo({rawSymbol:props.rawSymbol,state:props.state}));
 const context=getContext();let arrival=$state(1),flipping=$state(false);
 $effect(()=>{if(props.state!=='land'){arrival=1;return;}flipping=context.stateGame.encored;let raf=0;const start=performance.now(),duration=flipping?200:160;const tick=(now:number)=>{arrival=Math.min(1,(now-start)/duration);if(arrival<1)raf=requestAnimationFrame(tick);else props.oncomplete?.();};raf=requestAnimationFrame(tick);const timer=setTimeout(()=>props.oncomplete?.(),duration+80);return()=>{cancelAnimationFrame(raf);clearTimeout(timer);};});
</script>
{#if props.state==='win'}<SymbolMeshWin name={props.rawSymbol.name} symbolInfo={info} x={props.x} y={props.y} oncomplete={props.oncomplete}/>{:else if props.state!=='explosion'}
 <Container x={props.x??0} y={(props.y??0)+(flipping?0:3*Math.sin(arrival*Math.PI))} scale={{x:flipping?Math.max(.05,Math.abs(Math.cos((1-arrival)*Math.PI/2))):1+.05*Math.sin(arrival*Math.PI),y:flipping?1:1-.06*Math.sin(arrival*Math.PI)}}>
  <Sprite key={info.assetKey} anchor={0.5} width={SYMBOL_SIZE*info.sizeRatios.width} height={SYMBOL_SIZE*info.sizeRatios.height}/>
 </Container>
{/if}

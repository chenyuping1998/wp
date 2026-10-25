<script lang="ts">
 import SymbolMeshWin from './SymbolMeshWin.svelte';
 import {Sprite,Container} from 'pixi-svelte';
 import {onMount,onDestroy} from 'svelte';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolInfo} from '../game/utils';
 import type {RawSymbol,SymbolState} from '../game/types';
 const props:{x?:number;y?:number;state:SymbolState;rawSymbol:RawSymbol;oncomplete?:()=>void;blur?:number;impact?:number;loop?:boolean}=$props();
 const info=$derived(getSymbolInfo({rawSymbol:props.rawSymbol,state:props.state}));
 $effect(()=>{const state=props.state;const timer=setTimeout(()=>{if(state==='land')props.oncomplete?.();},state==='win'?280:150);return()=>clearTimeout(timer);});
</script>
{#if props.state==='win'}<SymbolMeshWin name={props.rawSymbol.name} symbolInfo={info} x={props.x} y={props.y} oncomplete={props.oncomplete}/>{:else if props.state!=='explosion'}
 <Container x={props.x??0} y={props.y??0} >
  <Sprite key={info.assetKey} anchor={0.5} width={SYMBOL_SIZE*info.sizeRatios.width} height={SYMBOL_SIZE*info.sizeRatios.height}/>
 </Container>
{/if}

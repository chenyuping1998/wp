<script lang="ts">
 import { SYMBOL_SIZE } from '../game/constants';
 import { getSymbolInfo } from '../game/utils';
 import TreasureSymbol from './TreasureSymbol.svelte';
 type Props={symbolInfo:ReturnType<typeof getSymbolInfo>;symbolName?:string;mode?:'win'|'land'|'none';t?:number;overlayTint?:number;overlayAlpha?:number;scale?:number;cell?:{reel:number;row:number};big?:boolean;swayT?:number;reduced?:boolean;debugBones?:boolean};
 const props:Props=$props();
 const overlay=$derived((props.overlayAlpha??0)>.01);
 const width=$derived(SYMBOL_SIZE*props.symbolInfo.sizeRatios.width*(props.scale??1));
 const height=$derived(SYMBOL_SIZE*props.symbolInfo.sizeRatios.height*(props.scale??1));
</script>
<TreasureSymbol name={props.symbolName} assetKey={props.symbolInfo.assetKey} {width} {height} mode={props.mode??'none'} time={props.t??0} reduced={props.reduced??false} debugBones={props.debugBones??false} {overlay} tint={overlay?props.overlayTint:undefined} alpha={overlay?props.overlayAlpha:1}/>

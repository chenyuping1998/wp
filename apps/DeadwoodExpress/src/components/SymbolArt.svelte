<script lang="ts">
import { Sprite } from 'pixi-svelte';
import { SYMBOL_SIZE } from '../game/constants';
let props: any = $props();
</script>
<Sprite key={props.symbolInfo.assetKey} anchor={0.5}
 width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * (props.scale ?? 1)}
 height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * (props.scale ?? 1)}
 tint={props.overlayTint ?? 0xffffff} alpha={props.overlayAlpha ?? 1}
 blendMode={props.overlayTint === undefined ? 'normal' : 'add'} />

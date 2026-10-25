<script lang="ts">
 import TreasureBeachBackdrop from './TreasureBeachBackdrop.svelte';
 import { getContext } from '../game/context';
 const context=getContext();
 const size=$derived(context.stateLayoutDerived.canvasSizes());
 const scale=$derived(Math.max(size.width/1920,size.height/1080));
</script>
<TreasureBeachBackdrop x={size.width/2} y={size.height/2} anchor={0.5} width={1920*scale} height={1080*scale} />

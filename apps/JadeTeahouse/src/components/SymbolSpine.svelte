<script lang="ts">
	import { SpineProvider, SpineTrack, type SpineTrackProps } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import SymbolSpineMain from './SymbolSpineMain.svelte';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
	};

	const props: Props = $props();
</script>

<!-- main -->
<SymbolSpineMain
	x={props.x}
	y={props.y}
	symbolInfo={props.symbolInfo}
	listener={props.listener}
	loop={props.loop}
/>


<!-- NOTE: there was a `payframe` spine drawn here whenever a symbol won — a
     thick gold outline around the winning cell. It is gone for two reasons.
     WinWays already frames winning cells, so it was a second gold edge a
     millimetre inside the first; and the frame came from the `anticipation`
     spine, which carries gen-2 art. Framing belongs to WinWays now. -->

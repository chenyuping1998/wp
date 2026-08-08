<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
		// forwarded to SymbolSprite: reel speed 0..1, and how hard this symbol
		// lands (see ReelSymbol, which knows both the reel motion and the tier)
		blur?: number;
		impact?: number;
		/** Pressure gauge reading, forwarded to the win effect. 1 outside the feature. */
		pressure?: number;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
</script>

{#if isSprite && isWin}
	<!-- Win state for sprite symbols: programmatic scale+glow animation -->
	<SymbolWinAnim
		{symbolInfo}
		x={props.x}
		y={props.y}
		pressure={props.pressure}
		oncomplete={props.oncomplete}
	/>
{:else if isSprite}
	<SymbolSprite
		{symbolInfo}
		x={props.x}
		y={props.y}
		blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
		landing={props.state === 'land'}
		impact={props.impact}
		oncomplete={props.oncomplete}
	/>
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		showWinFrame={props.state === 'win' && props.rawSymbol.name !== 'S'}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				if (event.data?.name === 'wildExplode') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				}
			},
		}}
	/>
{/if}

<!-- Nothing is drawn over a symbol here. In this game the per-position value a
     player needs to read is the heat plate UNDER the cell, which GridMultipliers
     owns, and the cluster payout, which ClusterWins puts at the cluster centre.
     Printing anything on the symbol itself would compete with both. -->

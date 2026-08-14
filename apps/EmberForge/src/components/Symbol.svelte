<script lang="ts">
	import SymbolShatter from './SymbolShatter.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';

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
		/** Free-game heat under this cell, forwarded to the win effect. */
		cellMult?: number;
	};

	const props: Props = $props();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
</script>

<!--
	Every state is a sprite now. There is no Spine branch left: the only skeleton
	any symbol ever used was the sample game's `explosion`, and SymbolShatter draws
	that from the symbol's own artwork instead.
-->
{#if props.state === 'explosion'}
	<SymbolShatter {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else if props.state === 'win'}
	<SymbolWinAnim
		{symbolInfo}
		x={props.x}
		y={props.y}
		cellMult={props.cellMult}
		oncomplete={props.oncomplete}
	/>
{:else}
	<SymbolSprite
		{symbolInfo}
		x={props.x}
		y={props.y}
		blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
		landing={props.state === 'land'}
		impact={props.impact}
		oncomplete={props.oncomplete}
	/>
{/if}

<!-- Nothing is drawn over a symbol here. In this game the per-position value a
     player needs to read is the heat plate UNDER the cell, which GridMultipliers
     owns, and the cluster payout, which ClusterWins puts at the cluster centre.
     Printing anything on the symbol itself would compete with both. -->

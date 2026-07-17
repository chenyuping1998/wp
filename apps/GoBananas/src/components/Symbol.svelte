<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import GoldText from './GoldText.svelte';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
</script>

{#if isSprite && isWin}
	<!-- Win state for sprite symbols: programmatic scale+glow animation -->
	<SymbolWinAnim {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else if isSprite}
	<SymbolSprite
		{symbolInfo}
		x={props.x}
		y={props.y}
		spinning={props.state === 'spin'}
		landing={props.state === 'land'}
		oncomplete={props.oncomplete}
	/>
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		showWinFrame={props.state === 'win' && !['S', 'M'].includes(props.rawSymbol.name)}
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

<!-- NOTE: W symbols carry a `multiplier` attribute from the math (always 1 in
     the base game; 2x-50x in the free game). It is deliberately NOT drawn on
     the symbol — the free-game value is already presented by the expanded
     reel's multiplier badge in ExpandingWilds.svelte. -->

{#if props.rawSymbol.prize}
	<!-- superspin coin: show its cash value on the symbol -->
	<GoldText
		x={props.x ?? 0}
		y={(props.y ?? 0) + 8}
		text={bookEventAmountToCurrencyString(props.rawSymbol.prize)}
		fontSize={28}
		maxWidth={SYMBOL_SIZE * 0.86}
	/>
{/if}

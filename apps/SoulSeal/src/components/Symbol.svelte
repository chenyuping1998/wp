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
		// Fired ONLY by the win presentation. Kept separate from oncomplete because
		// SymbolSprite calls that one from an $effect whenever symbolInfo changes -
		// including the change that switches this component over to SymbolWinAnim.
		// Sharing one channel let that stray call land while the symbol was already
		// in the 'win' state, which resolved the win before it had played and tore
		// the animation down in the same frame. Whether it happened depended on the
		// order Svelte flushed each symbol, which tracks the order they were
		// created - so it read as "the later reels never light up".
		onwincomplete?: () => void;
		loop?: boolean;
		// forwarded to SymbolSprite: reel speed 0..1, and how hard this symbol
		// lands (see ReelSymbol, which knows both the reel motion and the tier)
		blur?: number;
		impact?: number;
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
		oncomplete={props.onwincomplete}
		still={props.rawSymbol.name === 'S'}
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

<!-- NOTE: W symbols carry their multiplier value in `multiplier` (always 1 in
     the base game). It is deliberately NOT drawn on the symbol - the value is
     presented by the collect sequence, which flies it into the gourd, so drawing it
     here as well would show the same number twice. -->

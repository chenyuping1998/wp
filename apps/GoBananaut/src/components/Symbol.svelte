<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import {
		SYMBOL_SIZE,
		isBigPrize,
		BIG_PRIZE_FILL,
		BIG_PRIZE_STROKE,
		isMarkedSymbolName,
	} from '../game/constants';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import GoldText from './GoldText.svelte';

	type Props = {
		x?: number;
		y?: number;
		reelIndex?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
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

	// A grow marker rides on an ordinary symbol rather than being one, so the
	// maths sends "H2G" and getSymbolInfo already resolves that to H2's art. What
	// is left is the badge itself, drawn over the cell's TOP-LEFT corner.
	//
	// Top-left is reserved for it by the art spec — no symbol may depend on that
	// corner to be identified — so the badge can be placed by a constant rather
	// than dodging each symbol's composition.
	const isMarked = $derived(isMarkedSymbolName(props.rawSymbol.name));
	// 236x256 source. Sized off the cell so it scales with SYMBOL_SIZE, at the
	// fraction that was checked against every symbol it can land on.
	const MARKER_H = SYMBOL_SIZE * 0.42;
	const MARKER_W = MARKER_H * (236 / 256);

</script>

{#snippet body(oncomplete: (() => void) | undefined)}
	{#if isSprite && isWin}
		<!-- Win state for sprite symbols: programmatic scale+glow animation -->
		<SymbolWinAnim {symbolInfo} x={0} y={0} {oncomplete} />
	{:else if isSprite}
		<SymbolSprite
			{symbolInfo}
			x={0}
			y={0}
			blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
			landing={props.state === 'land'}
			impact={props.impact}
			{oncomplete}
		/>
	{:else}
		<SymbolSpine
			loop={props.loop}
			{symbolInfo}
			x={0}
			y={0}
			listener={{
				complete: oncomplete,
				event: (_, event) => {
					if (event.data?.name === 'wildExplode') {
						context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
					}
				},
			}}
		/>
	{/if}
{/snippet}

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{@render body(props.oncomplete)}
</Container>

{#if isMarked}
	<!--
		The grow marker. Drawn AFTER the symbol body so it sits over it, and
		anchored to the cell's top-left rather than to the artwork's, so it lands in
		the same place whatever is underneath.

		It separates by a hard dark contour and a bright core rather than by hue,
		because it has to stay legible over all six accent colours in the set — a
		coloured glow ring would have disappeared on the ice-cyan comet and the hot
		orange scatter, which are the two it most needs to be visible over.
	-->
	<Sprite
		key="gbGrowMarker"
		anchor={0}
		x={(props.x ?? 0) - SYMBOL_SIZE / 2}
		y={(props.y ?? 0) - SYMBOL_SIZE / 2}
		width={MARKER_W}
		height={MARKER_H}
	/>
{/if}

<!-- NOTE on `multiplier`: the FREE GAME assigns one — every cell of a stretched
     reel carries multiplier = 2, which is why the ways evaluator runs with
     multiplier_strategy="symbol" and why the doubling shows up in the ways
     figure rather than as a separate multiplier field. The base game assigns
     none, so there the path is inert and every cell counts once. -->

{#if props.rawSymbol.prize}
	<!--
		Superspin coin value. This is the copy drawn on the reel as a coin lands;
		StickyPrizes draws the held ones. Both have to grade identically or a coin
		would change colour the instant it sticks — the previous pass only updated
		StickyPrizes, so high-value coins landed in plain gold and only turned
		amber a beat later.
	-->
	<GoldText
		x={props.x ?? 0}
		y={props.y ?? 0}
		text={bookEventAmountToCurrencyString(props.rawSymbol.prize)}
		fontSize={28}
		anchor={0.5}
		fill={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_FILL : undefined}
		stroke={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_STROKE : undefined}
	/>
{/if}

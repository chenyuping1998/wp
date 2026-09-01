<script lang="ts">
	import { Container } from 'pixi-svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, isBigPrize, BIG_PRIZE_FILL, BIG_PRIZE_STROKE } from '../game/constants';
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

	// SPLIT CELLS ARE DRAWN TWICE, HALF WIDTH EACH.
	//
	// The Machete's rule is that every symbol on its reel counts twice, and this
	// is that sentence made literal: the cell shows the symbol twice, side by
	// side, in the space one used to occupy. A marker saying "x2" tells the
	// player the rule; two symbols in the cell SHOW it, and it is the same thing
	// the maths is doing when it counts that cell as two.
	//
	// `multiplier === 2` is the maths' own per-cell flag, set by
	// game_executables.apply_splits and carried through the reveal event. Taking
	// it from the cell rather than from the splitReels event means the picture
	// cannot disagree with the score: a cell drawn twice is a cell that WAS
	// counted twice, by construction.
	//
	// Not `>= 1`: W is registered as a multiplier symbol so it carries 1 by
	// default on every reel, split or not.
	//
	// It is ALSO gated on the blade having passed. The reveal already carries
	// multiplier=2, so without the second condition the halves are on screen
	// before the chop starts and the animation lands after its own result — the
	// cut would appear to confirm something the player already saw happen.
	// stateGame.splitCutReels is filled by ReelSplits as each down-stroke lands,
	// and immediately on a restore where there is no animation to wait for.
	const isSplit = $derived(
		props.rawSymbol.multiplier === 2 &&
			props.reelIndex !== undefined &&
			stateGame.splitCutReels.includes(props.reelIndex),
	);
	const HALF = SYMBOL_SIZE * 0.25;
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

{#if isSplit}
	<!--
		Two half-width copies. ONLY THE LEFT ONE CARRIES oncomplete.

		The board counts win-animation completions to know when a win presentation
		has finished, so a cell that reported twice would let the round move on
		early, and a cell that reported zero times would hang it forever. Gen-2 hit
		both halves of that bug. One reporter per cell, always.
	-->
	<Container x={(props.x ?? 0) - HALF} y={props.y ?? 0} scale={{ x: 0.5, y: 1 }}>
		{@render body(props.oncomplete)}
	</Container>
	<Container x={(props.x ?? 0) + HALF} y={props.y ?? 0} scale={{ x: 0.5, y: 1 }}>
		{@render body(undefined)}
	</Container>
{:else}
	<Container x={props.x ?? 0} y={props.y ?? 0}>
		{@render body(props.oncomplete)}
	</Container>
{/if}

<!-- NOTE: W symbols carry a `multiplier` attribute from the math. In this game
     it is not a win multiplier at all — it is the split flag, and it is
     presented by drawing the cell twice above rather than by printing a number
     on the symbol. -->

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

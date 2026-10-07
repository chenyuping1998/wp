<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import { stateGame, type ReelSymbol } from '../game/stateGame.svelte';
	import type { SymbolState } from '../game/types';
	import { symbolFocus, tierOf } from '../game/anticipationFocus';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);

	// A held hold-and-spin coin is drawn by the StickyPrizes overlay, but the math
	// also leaves it on the board, so the reel carries its own copy of the same
	// coin. That copy was the "ghost" appearing just under a held coin when the
	// reel stopped: the stop bounces the strip 0.3 of a cell past its resting
	// place (reelBounceSizeMulti), which pushes the coin below the one-cell
	// occluder and into view.
	//
	// At rest a symbol's index equals its row, so the duplicate can be dropped
	// once the reel is no longer spinning. Two deliberate exclusions:
	//   · while spinning, indices track scrolling symbols, so hiding one would
	//     punch a hole travelling down the reel
	//   · a symbol in the 'win' state must stay mounted — its oncomplete is what
	//     resolves the win animation, and an unmounted symbol would never fire it
	// Reel speed as a 0..1 blur amount. 'bouncing' is the overshoot-and-settle at
	// the end of a stop: the strip is still moving but far slower, and carrying
	// full-speed blur through it made the symbols snap from heavily smeared to
	// perfectly sharp in a single frame.
	const reelMotion = $derived(stateGame.board[props.reelIndex]?.reelState.motion);
	const blur = $derived(reelMotion === 'spinning' ? 1 : reelMotion === 'bouncing' ? 0.3 : 0);

	// Landing weight by tier. The Scatter and the Wild are the two symbols a
	// player is looking for, so they hit hardest; the card royals make up most of
	// every board and land lightest, which stops the whole grid bouncing as one.
	const LANDING_IMPACT: Record<string, number> = {
		S: 1.25,
		W: 1.2,
		M: 1.15,
		X: 1.15,
		H1: 1,
		H2: 1,
		H3: 0.95,
		H4: 0.95,
		L1: 0.7,
		L2: 0.7,
		L3: 0.7,
		L4: 0.7,
		L5: 0.7,
	};
	const landingImpact = $derived(LANDING_IMPACT[props.reelSymbol.rawSymbol.name] ?? 0.9);

	// A teasing reel is brought forward: its symbols a little larger and
	// brighter than the dead reels' (game/anticipationFocus.ts), harder when the
	// fourth Scatter is already down.
	const focus = $derived(
		stateGame.board[props.reelIndex]?.reelState.anticipating
			? symbolFocus(tierOf(stateGame.scatterCounter))
			: undefined,
	);

	// Built by a function so `forState` is a real argument — a plain value copied
	// at call time — rather than a reference into the template's reactive scope.
	// The version this replaced read a {@const}, which is recomputed whenever
	// symbolState changes, so the guard was comparing the state with itself and
	// never rejected anything. SymbolSprite now cancels at the source as well;
	// this stays as the second line of defence.
	const makeOnComplete = (forState: SymbolState) => () => {
		// a completion from a presentation the symbol has already left
		if (props.reelSymbol.symbolState !== forState) return;
		if (forState === 'win') props.reelSymbol.oncomplete();
		if (forState === 'land') props.reelSymbol.symbolState = 'static';
	};

	const isHeldDuplicate = $derived(
		props.reelSymbol.symbolState !== 'win' &&
			stateGame.board[props.reelIndex]?.reelState.motion !== 'spinning' &&
			stateGame.stickyPrizes.some(
				(prize) => prize.reel === props.reelIndex && prize.row === props.reelSymbol.symbolIndex,
			),
	);
</script>

{#if !isHeldDuplicate}
	<!-- see makeOnComplete, and SymbolSprite's destroyed guard, for why a
	     completion has to be pinned to the presentation that produced it -->
	{@const oncomplete = makeOnComplete(props.reelSymbol.symbolState)}
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY()}
		animating={props.reelSymbol.symbolState === 'win' ||
			(symbolInfo.type === 'spine' && props.reelSymbol.symbolState === 'land')}
	>
		<Symbol
			reelIndex={props.reelIndex}
			state={props.reelSymbol.symbolState}
			rawSymbol={props.reelSymbol.rawSymbol}
			{blur}
			impact={landingImpact}
			row={props.reelSymbol.symbolIndex}
			{focus}
			{oncomplete}
		/>
	</SymbolWrap>
{/if}

<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import { stateGame, type ReelSymbol } from '../game/stateGame.svelte';
	import type { SymbolState } from '../game/types';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);

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
		P: 1.1,
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

</script>

{#if props.reelSymbol}
	<!-- see makeOnComplete, and SymbolSprite's destroyed guard, for why a
	     completion has to be pinned to the presentation that produced it -->
	{@const oncomplete = makeOnComplete(props.reelSymbol.symbolState)}
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY()}
		animating={props.reelSymbol.symbolState === 'win'}
	>
		<Symbol
			reelIndex={props.reelIndex}
			state={props.reelSymbol.symbolState}
			rawSymbol={props.reelSymbol.rawSymbol}
			{blur}
			impact={landingImpact}
			{oncomplete}
		/>
	</SymbolWrap>
{/if}

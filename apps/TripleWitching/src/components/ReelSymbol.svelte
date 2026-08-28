<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import ScatterLandFrame from './ScatterLandFrame.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import { LOSING_SYMBOL_ALPHA } from '../game/constants';
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

	// While a win is on screen every other symbol steps back.
	//
	// "Winning" is read off the symbol's own state, which is what Board sets on
	// exactly the symbols it lit - so the lit set and the dimmed set cannot
	// disagree. Matching board positions against symbolIndex instead, as this
	// used to, breaks in two ways: a single mismatch dims a symbol that is busy
	// playing its win animation (it reads as "that reel never lit"), and during a
	// spin the whole strip is re-indexed, so stale positions alias onto whichever
	// scrolling symbols happen to land on those indices.
	//
	// The motion test is the second half of that: indices and states both belong
	// to a board at rest, so nothing is ever dimmed on a reel that is moving.
	// 'postWinStatic' counts as lit, not as a loser. The symbols in a volley
	// finish a frame or two apart, and dimming each one the moment its own
	// animation ended made the winners go dark one by one at the end of the win.
	const isHighlighted = $derived(
		props.reelSymbol.symbolState === 'win' || props.reelSymbol.symbolState === 'postWinStatic',
	);
	const symbolAlpha = $derived(
		stateGame.highlightActive && reelMotion === 'stopped' && !isHighlighted
			? LOSING_SYMBOL_ALPHA
			: 1,
	);
	const blur = $derived(reelMotion === 'spinning' ? 1 : reelMotion === 'bouncing' ? 0.3 : 0);

	const isScatter = $derived(props.reelSymbol.rawSymbol.name === 'S');

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
	};
	const landingImpact = $derived(LANDING_IMPACT[props.reelSymbol.rawSymbol.name] ?? 0.9);

	// The win is resolved on its own channel, straight from SymbolWinAnim. No
	// state guard is needed or wanted here: only the win presentation can call
	// this, so anything arriving is by definition the win finishing.
	const onWinComplete = () => props.reelSymbol.oncomplete();

	// The sprite's completion callback is pinned to the state it was created for.
	//
	// Reading symbolState at call time instead let a completion from one
	// presentation resolve another's. Concretely: 'land' renders SymbolSprite and
	// runs a ~240ms squash whose promise chain calls oncomplete when it ends. If a
	// win volley set the symbol to 'win' while that squash was still in flight,
	// SymbolSprite unmounted but its chain still finished - and the callback,
	// reading the *current* state, saw 'win' and resolved the win promise straight
	// away. Board then moved the symbol to 'postWinStatic' before the win
	// presentation had played, so it never lit up.
	//
	// That is why it only showed in turbo, only sometimes, and almost always on
	// reel 1: reel 1 lights first, a few frames into the volley, which is the one
	// moment still inside the 240ms squash window - and turbo's slam stop starts
	// every reel's squash at once.
	const onSymbolComplete = (forState: SymbolState) => () => {
		if (props.reelSymbol.symbolState !== forState) return;
		// deliberately does not resolve the win - see onWinComplete
		if (forState === 'land') props.reelSymbol.symbolState = 'static';
	};

</script>

	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY()}
		alpha={symbolAlpha}
		animating={symbolInfo.type === 'spine' &&
			(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win')}
	>
		<!--
			Scatter cells get a hot frame once their reel is at rest. Gated on
			reelMotion, not on the symbol state: a spinning strip carries scatters
			through the window constantly, and framing those would fire the cue
			several times a spin for symbols that never landed.
		-->
		{#if isScatter && reelMotion === 'stopped'}
			<ScatterLandFrame />
		{/if}
		<Symbol
			state={props.reelSymbol.symbolState}
			rawSymbol={props.reelSymbol.rawSymbol}
			{blur}
			impact={landingImpact}
			oncomplete={onSymbolComplete(props.reelSymbol.symbolState)}
			onwincomplete={onWinComplete}
		/>
	</SymbolWrap>

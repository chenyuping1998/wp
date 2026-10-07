<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import { stateGame, type ReelSymbol } from '../game/stateGame.svelte';
	import { symbolFocus } from '../game/anticipationFocus';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);

	// A held superspin coin is drawn by the StickyPrizes overlay, but the math
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
		H5: 0.95,
		L1: 0.7,
		L2: 0.7,
		L3: 0.7,
		L4: 0.7,
	};
	const landingImpact = $derived(LANDING_IMPACT[props.reelSymbol.rawSymbol.name] ?? 0.9);

	// While THIS reel is the one being teased, its symbols are lifted: slightly
	// larger, with an additive copy of their own art over them. The tease used to
	// be drawn entirely outside the reel — a lit column and a dim over the stopped
	// reels — so the reel that mattered was framed but never actually came
	// forward. Read per reel rather than per spin, because on a book with
	// anticipation [0,0,1,2,3] two reels can be teasing at different tiers.
	const focus = $derived(
		stateGame.board[props.reelIndex]?.reelState.anticipating
			? symbolFocus(stateGame.anticipation[props.reelIndex])
			: undefined,
	);

	/**
	 * Stand down while some OTHER cell is paying.
	 *
	 * Not applied to a cell that is itself in the volley, and not while the reel
	 * is moving — a dimmed symbol mid-spin would fight the motion blur and read
	 * as the reel going dark.
	 */
	const dim = $derived(
		stateGame.winningCells.length > 0 &&
			props.reelSymbol.symbolState !== 'win' &&
			stateGame.board[props.reelIndex]?.reelState.motion !== 'spinning' &&
			!stateGame.winningCells.some(
				(cell) => cell.reel === props.reelIndex && cell.row === props.reelSymbol.symbolIndex,
			),
	);

	const isHeldDuplicate = $derived(
		props.reelSymbol.symbolState !== 'win' &&
			stateGame.board[props.reelIndex]?.reelState.motion !== 'spinning' &&
			stateGame.stickyPrizes.some(
				(prize) => prize.reel === props.reelIndex && prize.row === props.reelSymbol.symbolIndex,
			),
	);
</script>

{#if !isHeldDuplicate}
	<!--
		`forState` pins each completion callback to the state it was created for.

		The old version read symbolState at call time, which let a completion from
		one presentation resolve another's. Concretely: 'land' renders SymbolSprite
		and runs a ~240ms squash whose promise chain calls oncomplete when it ends.
		If a win volley set the symbol to 'win' while that squash was still in
		flight, SymbolSprite unmounted but its chain still finished — and the
		callback, reading the *current* state, saw 'win' and resolved the win
		promise straight away. Board then moved the symbol to 'postWinStatic'
		before the win spine had played, so it never lit up.

		That is why it only showed in turbo, only sometimes, and almost always on
		reel 1: the grenade reaches reel 1 first, a few frames into the volley,
		which is the one moment still inside the 240ms squash window — and turbo's
		slam stop starts every reel's squash at once.
	-->
	{@const forState = props.reelSymbol.symbolState}
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY()}
		animating={symbolInfo.type === 'spine' &&
			(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win')}
	>
		<Symbol
			state={props.reelSymbol.symbolState}
			rawSymbol={props.reelSymbol.rawSymbol}
			{blur}
			{focus}
			cell={{ reel: props.reelIndex, row: props.reelSymbol.symbolIndex }}
			impact={landingImpact}
			{dim}
			oncomplete={() => {
				// a completion from a presentation the symbol has already left
				if (props.reelSymbol.symbolState !== forState) return;
				if (forState === 'win') props.reelSymbol.oncomplete();
				if (forState === 'land') props.reelSymbol.symbolState = 'static';
			}}
		/>
	</SymbolWrap>
{/if}

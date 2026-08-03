<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolX } from '../game/utils';
	import { stateGame, stateGameDerived, type ReelSymbol } from '../game/stateGame.svelte';
	import type { SymbolState } from '../game/types';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();

	/**
	 * Which of Board's two layers a symbol draws into: the masked one, or the
	 * unmasked one on top. Anything whose effect overflows its cell has to go
	 * unmasked, or it is clipped at the cell edge.
	 *
	 * This used to test `symbolInfo.type === 'spine'`, which worked only because the
	 * win state happened to be a Spine. It is a plain sprite now (see
	 * SymbolWinAnim), so the type test would silently send every winning symbol
	 * back inside the mask and crop its bloom and embers to the cell.
	 */
	const isOverflowState = (state: SymbolState) => state === 'win' || state === 'explosion';

	// Cascading reels report motion as fallingOut / hanging / fallingIn / stopped
	// rather than the spinning reel's spinning / bouncing. Blur belongs to the
	// drop-out, which is the only genuinely fast movement; the fall-in ends in a
	// bounce and carrying full blur through it made symbols snap from heavily
	// smeared to perfectly sharp in a single frame.
	const reelMotion = $derived(stateGame.board[props.reelIndex]?.reelState.motion);
	const blur = $derived(reelMotion === 'fallingOut' ? 1 : reelMotion === 'fallingIn' ? 0.35 : 0);

	// Landing weight by tier. The Scatter and the Wild are the two symbols a
	// player is looking for, so they hit hardest; the low symbols make up most of
	// every board and land lightest, which stops the whole grid bouncing as one.
	const LANDING_IMPACT: Record<string, number> = {
		S: 1.25,
		W: 1.2,
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

	// symbolIndexOfBoard is slotIndex - 1, and at rest a slot index IS the padded
	// board row the math uses — so this is the heat sitting under this very cell.
	// Only meaningful while the board is settled, which is exactly when a symbol
	// can be in the win state.
	const cellMult = $derived(
		stateGameDerived.gridMultiplierAt({
			reel: props.reelIndex,
			row: props.reelSymbol.symbolIndexOfBoard + 1,
		}),
	);
</script>

<!--
	The snippet parameter `forState` pins each completion callback to the state it
	was rendered for. It has to be a real per-render capture, not a $derived —
	a derived would be re-read at call time and the guard below could never fire.

	Reading symbolState at call time instead lets a completion from one
	presentation resolve another's. Concretely: 'land' renders SymbolSprite and
	runs a ~240ms squash whose promise chain calls oncomplete when it ends. If a
	win volley set the symbol to 'win' while that squash was still in flight,
	SymbolSprite unmounted but its chain still finished — and the callback,
	reading the *current* state, saw 'win' and resolved the win promise straight
	away. Board then moved the symbol to 'postWinStatic' before the win spine had
	played, so it never lit up.
-->
{#snippet symbolAt(forState: SymbolState)}
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY.current}
		animating={isOverflowState(forState)}
	>
		<Symbol
			state={forState}
			rawSymbol={props.reelSymbol.rawSymbol}
			{blur}
			impact={landingImpact}
			{cellMult}
			oncomplete={() => {
				// a completion from a presentation the symbol has already left
				if (props.reelSymbol.symbolState !== forState) return;
				if (forState === 'win') props.reelSymbol.oncomplete();
				if (forState === 'land') props.reelSymbol.symbolState = 'static';
			}}
		/>
	</SymbolWrap>
{/snippet}

{@render symbolAt(props.reelSymbol.symbolState)}

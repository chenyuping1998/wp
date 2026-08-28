<script lang="ts">
	import { Container } from 'pixi-svelte';

	import ReelSymbol from './ReelSymbol.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	// Mid-expansion the board is taller than the symbols the reels are still
	// holding. Board space is measured from the top, so without this the old
	// symbols would ride upward with the top edge and the new space would open
	// underneath them - the opposite of the board growing upward. Offsetting by
	// the difference pins them to the bottom instead, and it falls back to 0 by
	// itself once a reveal fills the taller board.
	const symbolRows = $derived(
		(context.stateGame.board[0]?.reelState.symbols.length ?? 0) - 2,
	);
	// The board no longer changes height, so there is nothing to offset. Kept as
	// a binding rather than deleted so the callers below read unchanged.
	const growthOffset = 0;
</script>

<Container y={growthOffset}>
	{#each context.stateGame.board as reel, reelIndex (reelIndex)}
		{#each reel.reelState.symbols as reelSymbol}
			<ReelSymbol {reelIndex} {reelSymbol} />
		{/each}
	{/each}
</Container>

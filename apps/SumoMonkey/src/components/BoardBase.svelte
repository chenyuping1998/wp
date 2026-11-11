<script lang="ts">
	import ReelSymbol from './ReelSymbol.svelte';
	import ReelMotion from './ReelMotion.svelte';
	import { getContext } from '../game/context';

	const context = getContext();
</script>

{#each context.stateGame.board as reel, reelIndex (reelIndex)}
	<ReelMotion {reelIndex}>
		{#each reel.reelState.symbols as reelSymbol, rowIndex}
			<ReelSymbol {reelIndex} {rowIndex} {reelSymbol} />
		{/each}
	</ReelMotion>
{/each}

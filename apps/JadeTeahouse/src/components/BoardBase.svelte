<script lang="ts">
	import ReelSymbol from './ReelSymbol.svelte';
	// the strip's own speed blur, as Go Bananeon (2026-10-31, user: "轉輪效果要像霓虹的那樣")
	import ReelMotion from './ReelMotion.svelte';
	import { getContext } from '../game/context';

	const context = getContext();
</script>

{#each context.stateGame.board as reel, reelIndex (reelIndex)}
	<ReelMotion {reelIndex}>
		{#each reel.reelState.symbols as reelSymbol}
			<ReelSymbol {reelIndex} {reelSymbol} />
		{/each}
	</ReelMotion>
{/each}

<script lang="ts">
	import ReelSymbol from './ReelSymbol.svelte';
	import ReelMotion from './ReelMotion.svelte';
	import { getContext } from '../game/context';

	const context = getContext();
</script>

<!-- 2026-10-31 (user: 套用霓虹的轉輪效果): one directional blur per falling column, from its real speed (ReelMotion /
     game/reelMotion.ts, GoBananeon's reel blur measured for a tumbling board), instead of a stretched copy per tile. -->
{#each context.stateGame.board as reel, reelIndex (reelIndex)}
	<ReelMotion {reelIndex}>
		{#each reel.reelState.symbols as reelSymbol}
			<ReelSymbol {reelIndex} {reelSymbol} />
		{/each}
	</ReelMotion>
{/each}

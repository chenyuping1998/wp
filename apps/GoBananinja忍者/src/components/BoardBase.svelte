<script lang="ts">
	import ReelSymbol from './ReelSymbol.svelte';
	import ReelMotion from './ReelMotion.svelte';
	import { getContext } from '../game/context';

	const context = getContext();
</script>

<!-- 2026-10-31 (user: 套用霓虹的轉輪效果): each moving reel gets one directional blur measured from its real speed
     (ReelMotion / game/reelMotion.ts, ported from GoBananeon), instead of every tile drawing its own stretched copy
     and two ghosts. -->
{#each context.stateGame.board as reel, reelIndex (reelIndex)}
	<ReelMotion {reelIndex}>
		{#each reel.reelState.symbols as reelSymbol}
			<ReelSymbol {reelIndex} {reelSymbol} />
		{/each}
	</ReelMotion>
{/each}

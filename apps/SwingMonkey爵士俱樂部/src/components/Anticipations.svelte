<script lang="ts">
	import { OnMount } from 'components-shared';
	import { getContext } from '../game/context';
	import Anticipation from './Anticipation.svelte';

	const context = getContext();
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

</script>

{#if hasAnticipation}
	<OnMount
		onmount={() => {
			// The band answers the glowing reel with a short rising jazz phrase.
			context.eventEmitter.broadcast({ type: 'soundReelTensionStart' });

			return () => {
				context.eventEmitter.broadcast({ type: 'soundReelTensionStop' });
			};
		}}
	/>
{/if}

{#each context.stateGame.board as reel}
	{#if reel.reelState.anticipating}
		<Anticipation {reel} oncomplete={() => (reel.reelState.anticipating = false)} />
	{/if}
{/each}

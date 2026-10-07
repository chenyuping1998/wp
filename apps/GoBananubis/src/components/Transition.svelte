<script lang="ts" module>
	// `cover` runs at the blast's white-out, while the screen is fully opaque and
	// with ~160ms of flash still to run. Any scene swap the player must not watch
	// happen belongs there — the scarab spends its first 800ms falling over the
	// live board, so a swap made before broadcasting this event is on screen the
	// whole way down.
	export type EmitterEventTransition = { type: 'transition'; cover?: () => void };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let transitioning = $state(false);
	let oncomplete = $state(() => {});
	let cover = $state<(() => void) | undefined>(undefined);

	context.eventEmitter.subscribeOnMount({
		transition: async (event) => {
			cover = event.cover;
			transitioning = true;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		oncover={() => cover?.()}
		oncomplete={() => {
			oncomplete();
			transitioning = false;
			cover = undefined;
		}}
	/>
{/if}

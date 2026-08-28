<script lang="ts" module>
	export type EmitterEventTransition = {
		type: 'transition';
		/**
		 * Fired while the shutters are shut and the screen shows nothing. Anything
		 * that changes what the player is looking at - swapping the board, resizing
		 * it, tearing the feature down - belongs in here rather than before the
		 * await, or the player watches the change happen and then watches the
		 * transition that was supposed to hide it.
		 */
		oncover?: () => void;
	};
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let transitioning = $state(false);
	let oncomplete = $state(() => {});
	let oncover = $state<(() => void) | undefined>(undefined);

	context.eventEmitter.subscribeOnMount({
		transition: async (event) => {
			oncover = event.oncover;
			transitioning = true;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		oncover={() => oncover?.()}
		oncomplete={() => {
			oncomplete();
			transitioning = false;
			oncover = undefined;
		}}
	/>
{/if}

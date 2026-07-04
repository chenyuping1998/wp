<script lang="ts" module>
	export type EmitterEventTransition = { type: 'transition' };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let transitioning = $state(false);
	let oncovered = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		// resolves as soon as the curtain fully covers the screen, so the scene
		// swaps behind it; the curtain then rains away on top of the new scene
		transition: async () => {
			transitioning = true;
			await waitForResolve((resolve) => (oncovered = resolve));
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		oncovered={() => oncovered()}
		oncomplete={() => {
			transitioning = false;
		}}
	/>
{/if}

<script lang="ts" module>
	// `cover` runs while the bowling ball fully hides the viewport. Swap the
	// base/FG scene and character rig only during that covered beat.
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

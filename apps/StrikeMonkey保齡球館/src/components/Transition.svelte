<script lang="ts" module>
	// `cover` runs while the bowling ball fully hides the viewport. Swap the
	// base/FG scene and character rig only during that covered beat.
	// `noThrow`: the mascot has already bowled (mascotBowl) — do not have him
	// throw again, the wipe starts at once.
	export type EmitterEventTransition = { type: 'transition'; cover?: () => void; noThrow?: boolean };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let transitioning = $state(false);
	let oncomplete = $state(() => {});
	let cover = $state<(() => void) | undefined>(undefined);
	let noThrow = $state(false);

	context.eventEmitter.subscribeOnMount({
		transition: async (event) => {
			cover = event.cover;
			noThrow = event.noThrow ?? false;
			transitioning = true;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		{noThrow}
		oncover={() => cover?.()}
		oncomplete={() => {
			oncomplete();
			transitioning = false;
			cover = undefined;
		}}
	/>
{/if}

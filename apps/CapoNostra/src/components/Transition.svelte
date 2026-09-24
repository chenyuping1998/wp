<script lang="ts" module>
	export type EmitterEventTransition = { type: 'transition' };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let transitioning = $state(false);
	let onblack = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		// Resolves at FULL BLACK, not at the end.
		//
		// The caller's next act is to swap the game over — game type, board,
		// counters — and the Hacksaw spec the transition was re-timed against does
		// exactly that inside the black, then reveals the changed game slowly. If
		// this resolved at the end of the animation the swap would happen in plain
		// sight, which is the cut it is there to hide. The component keeps running
		// its own tail (held black, then a one-second reveal) underneath whatever
		// the caller does next, and unmounts itself when that finishes.
		transition: async () => {
			transitioning = true;
			await waitForResolve((resolve) => (onblack = resolve));
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		onblack={() => onblack()}
		oncomplete={() => (transitioning = false)}
	/>
{/if}

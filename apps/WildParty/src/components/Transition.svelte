<script lang="ts" module>
	// 'enter' = into the Free Spins room (grand ornate doors),
	// 'exit'  = back to base play (quick neon wipe). Defaults to 'exit'.
	export type EmitterEventTransition = { type: 'transition'; variant?: 'enter' | 'exit' };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	// Ceiling on the wait for the curtain to cover the screen. The enter curtain
	// runs well under a second; this is long enough never to cut a real one short.
	const COVERED_TIMEOUT = 3000;

	let transitioning = $state(false);
	let variant = $state<'enter' | 'exit'>('exit');
	let oncovered = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		// resolves as soon as the curtain fully covers the screen, so the scene
		// swaps behind it; the curtain then clears on top of the new scene
		transition: async (emitterEvent) => {
			variant = emitterEvent.variant ?? 'exit';

			// Arm the resolver BEFORE mounting the animation, and bound the wait.
			//
			// This is the same race that froze the free-spin trigger in Board.svelte,
			// in a second place: `transitioning = true` mounts TransitionAnimation
			// and the animation starts running, but `oncovered` used to be assigned
			// on the line after — so a curtain that reached full cover in between
			// called the previous (no-op) callback and the real resolver was never
			// invoked. freeSpinTrigger awaits this immediately after uiHide, so the
			// round stopped dead with the UI hidden and nothing on screen.
			//
			// Found on the replay path, where it reproduces far more often: on a
			// re-run the component tree and the spine are already warm, so the
			// curtain reaches full cover sooner and wins the race more often.
			const covered = waitForResolve<void>((resolve) => {
				oncovered = resolve;
			});
			transitioning = true;
			await Promise.race([
				covered,
				waitForResolve<void>((resolve) => setTimeout(resolve, COVERED_TIMEOUT)),
			]);
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		{variant}
		oncovered={() => oncovered()}
		oncomplete={() => {
			transitioning = false;
		}}
	/>
{/if}

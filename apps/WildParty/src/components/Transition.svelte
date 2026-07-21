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

	let transitioning = $state(false);
	let variant = $state<'enter' | 'exit'>('exit');
	let oncovered = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		// resolves as soon as the curtain fully covers the screen, so the scene
		// swaps behind it; the curtain then clears on top of the new scene
		transition: async (emitterEvent) => {
			variant = emitterEvent.variant ?? 'exit';
			transitioning = true;
			await waitForResolve((resolve) => (oncovered = resolve));
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

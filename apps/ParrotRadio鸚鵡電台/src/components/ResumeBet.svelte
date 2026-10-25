<script lang="ts">
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { onMount } from 'svelte';

	const context = getContext();

	onMount(() => {
		if (stateBet.betToResume?.active && stateBet.betToResume.mode) {
			stateBet.activeBetModeKey = stateBet.betToResume.mode;
		}
		// A replay does not start on its own. ReplayIntro holds the round behind its
		// card and broadcasts this when the viewer presses it — starting here as
		// well would play the round once underneath the card before they ever did.
		if (stateUrlDerived.replay()) return;
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});
</script>

<script lang="ts" module>
	export type EmitterEventTransition = { type: 'transition'; oncover?:()=>void; onreveal?:()=>void; kind?:'portal'; tone?:'violet'|'gold' };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let transitioning = $state(false);
	let oncover=$state<(()=>void)|undefined>();
	let kind=$state<'portal'>('portal');
	let tone=$state<'violet'|'gold'>('violet');
	let onreveal=$state<(()=>void)|undefined>();
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		transition: async (event) => {
			oncover=event.oncover;onreveal=event.onreveal;kind=event.kind??'portal';tone=event.tone??'violet';
			transitioning = true;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		{oncover} {onreveal} {kind} {tone}
		oncomplete={() => {
			oncomplete();
			transitioning = false;
		}}
	/>
{/if}

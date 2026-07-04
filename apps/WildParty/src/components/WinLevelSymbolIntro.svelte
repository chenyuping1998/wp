<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import WinSymbolScene from './WinSymbolScene.svelte';

	type Props = {
		symbolKey: 'wpSpH1' | 'wpSpH2' | 'wpSpH3' | 'wpSpH4';
	};

	const props: Props = $props();

	let tick = $state(0);

	onMount(() => {
		const intervalId = setInterval(() => {
			tick += 1;
		}, 32);

		return () => {
			clearInterval(intervalId);
		};
	});

	// gentle breathing — the themed scene supplies the motion (lid opening,
	// cork popping, glass swaying, rays turning).
	// Base 1.35 compensates for the ×0.5 slot scaling in the big-win spine.
	const scale = $derived(1.35 + 0.04 * Math.sin(tick / 14));
</script>

<Container {scale}>
	<WinSymbolScene symbolKey={props.symbolKey} />
</Container>

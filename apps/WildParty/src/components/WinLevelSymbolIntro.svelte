<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
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

	// gentle breathing instead of the old jitter — the themed scene supplies
	// the motion now (lid opening, cork popping, glass swaying, rays turning).
	// Base 1.35 compensates for the ×0.5 slot scaling in the big-win spine.
	const scale = $derived(1.35 + 0.04 * Math.sin(tick / 14));
	const flashAlpha = $derived(0.35 + 0.45 * (0.5 + 0.5 * Math.sin(tick / 1.4)));
</script>

<Container {scale}>
	<Graphics
		draw={(g) => {
			g.clear();
			g.beginFill(0xfff0a5, 0.08 + 0.15 * flashAlpha);
			g.drawCircle(0, 0, 125);
			g.endFill();

			g.lineStyle(8, 0xffffff, 0.24 + 0.26 * flashAlpha);
			g.drawCircle(0, 0, 102);
			g.lineStyle(2.5, 0xffdf66, 0.25 + 0.4 * flashAlpha);
			g.drawCircle(0, 0, 116);
		}}
	/>

	<WinSymbolScene symbolKey={props.symbolKey} />
</Container>

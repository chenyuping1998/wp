<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { BlurFilter } from 'pixi.js';
	import { Container, getContextApp } from 'pixi-svelte';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { createColumnBlur } from '../game/reelMotion';

	// One directional filter per moving column (GoBananeon's reel blur, measured for a tumbling board): the faster
	// its symbols fall, the longer the vertical smear; it is gone the moment they settle. A winning symbol is not
	// moving, so it measures nothing and stays sharp.
	const props: { reelIndex: number; children: Snippet } = $props();
	const reel = $derived(stateGame.board[props.reelIndex]);
	const app = getContextApp();
	const filter = new BlurFilter({ strengthX: 0, strengthY: 0, quality: 4, kernelSize: 15 });
	const filters = [filter];
	const blur = createColumnBlur(SYMBOL_SIZE);
	let enabled = $state(false);
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		const update = () => {
			const amount = blur.sample({
				now: performance.now(),
				symbols: reel.reelState.symbols.map((s) => ({ key: s, y: s.symbolY.current })),
			});
			filter.strengthY = amount;
			enabled = amount > 0.1;
		};
		ticker?.add(update);
		return () => {
			ticker?.remove(update);
			filter.destroy();
		};
	});
</script>

<Container filters={enabled ? filters : []}>
	{@render props.children()}
</Container>

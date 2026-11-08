<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { BlurFilter } from 'pixi.js';
	import { Container, getContextApp } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { createReelBlur } from '../game/reelMotion';

	const props: { reelIndex: number; children: Snippet } = $props();
	const boardContext = getContextBoard();
	const reel = $derived(stateGame.board[props.reelIndex]);
	const app = getContextApp();
	// One directional filter per moving reel, rather than copies of every tile.
	// Winning symbols live in the unmasked foreground and stay sharp.
	const filter = new BlurFilter({ strengthX: 0, strengthY: 0, quality: 4, kernelSize: 15 });
	const filters = [filter];
	const blur = createReelBlur(SYMBOL_SIZE);
	let enabled = $state(false);
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		const update = () => {
			const symbol = reel.reelState.symbols[0];
			const amount = blur.sample({
				now: performance.now(), key: symbol?.id,
				offset: symbol ? symbol.symbolY() - symbol.symbolIndex * SYMBOL_SIZE : 0,
				motion: boardContext.animate ? 'stopped' : reel.reelState.motion,
			});
			filter.strengthY = amount;
			enabled = amount > 0.1;
		};
		ticker?.add(update);
		return () => { ticker?.remove(update); filter.destroy(); };
	});
</script>

<Container filters={enabled ? filters : []}>
	{@render props.children()}
</Container>

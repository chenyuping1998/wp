<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { Graphics } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let pulse = $state(0);
	let finished = $state(false);

	// Drawn entirely here rather than through the old `anticipation` spine: that
	// asset is template art from a mining game (rocks, dust, sparks) whose
	// artwork sat off-centre — it was the bright block that showed up at the top
	// left — and it was only ~1.6 cells tall, so it never framed the reel.
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);

	onMount(() => {
		// offset per reel: when several reels tease at once, a shared phase makes
		// them strobe as one block instead of shimmering along the board
		const phase = props.reel.reelIndex * 0.9;
		const rate = 145 + props.reel.reelIndex * 11;
		const id = everyFrame(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
		});

		return () => id();
	});

	$effect(() => {
		// Stop immediately when reel stops to avoid the heavy "falling/landing" outro feel.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});
</script>

<BoardContainer>
	<!-- Edge lighting leaves the moving symbol art in its original colours. -->
	<Graphics
		draw={(g) => {
			const h = BOARD_SIZES.height;
			g.clear();
			// The held reel stays clear; the border and themed marks carry the tease.
			g.lineStyle(5, 0xe8433a, 0.65 + 0.25 * pulse);
			g.drawRoundedRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13);
			g.lineStyle(2, 0xe9e1c8, 0.8);
			g.drawRoundedRect(LEFT + 6, 6, SYMBOL_SIZE - 12, h - 12, 10);

			// chevrons converging on the column from above and below
			const chev = 14 + 6 * pulse;
			g.lineStyle(4, 0xe8433a, 0.6 + 0.3 * pulse);
			g.moveTo(x - SYMBOL_SIZE * 0.12, -chev - 10);
			g.lineTo(x, -chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, -chev - 10);
			g.moveTo(x - SYMBOL_SIZE * 0.12, h + chev + 10);
			g.lineTo(x, h + chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, h + chev + 10);
		}}
	/>

</BoardContainer>

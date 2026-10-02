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
	<!-- amber wash over the whole teasing column, brightest at the rails -->
	<Graphics
		draw={(g) => {
			const h = BOARD_SIZES.height;
			g.clear();
			g.beginFill(0xd24a2c, 0.12 + 0.08 * pulse);
			g.drawRoundedRect(LEFT + 3, 3, SYMBOL_SIZE - 6, h - 6, 12);
			g.endFill();

			// full-height frame: three nested strokes so the edge reads as lit metal
			g.lineStyle(5, 0xd24a2c, 0.65 + 0.25 * pulse);
			g.drawRoundedRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13);
			g.lineStyle(2, 0xf2e8d0, 0.8);
			g.drawRoundedRect(LEFT + 6, 6, SYMBOL_SIZE - 12, h - 12, 10);
			g.lineStyle(1.4, 0x1e1b1a, 0.8);
			g.drawRoundedRect(LEFT + 10, 10, SYMBOL_SIZE - 20, h - 20, 8);

			// cell ticks down the column so the frame reads as five slots, not a tube
			g.lineStyle(1.5, 0x1f5c4a, 0.6);
			for (let row = 1; row < BOARD_SIZES.height / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 14, y);
				g.lineTo(LEFT + SYMBOL_SIZE - 14, y);
			}

			// chevrons converging on the column from above and below
			const chev = 14 + 6 * pulse;
			g.lineStyle(4, 0xd24a2c, 0.6 + 0.3 * pulse);
			g.moveTo(x - SYMBOL_SIZE * 0.12, -chev - 10);
			g.lineTo(x, -chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, -chev - 10);
			g.moveTo(x - SYMBOL_SIZE * 0.12, h + chev + 10);
			g.lineTo(x, h + chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, h + chev + 10);
		}}
	/>

</BoardContainer>

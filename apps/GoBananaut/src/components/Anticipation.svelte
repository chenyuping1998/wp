<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BASE_ROWS, reelWindow } from '../game/constants';
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

	// THE COLUMN IS THE REEL, not the box. The box is six rows tall and this reel
	// may be showing four, so a frame drawn from 0 to BOARD_SIZES.height lights up
	// two rows that do not exist — and, now that the gap is a closed shutter, lit
	// up the shutter. The tease has to say "watch THIS reel", and a reel is only
	// as tall as it has grown.
	const win = $derived(reelWindow(context.stateGame.growRows[props.reel.reelIndex] ?? BASE_ROWS));

	onMount(() => {
		// offset per reel: when several reels tease at once, a shared phase makes
		// them strobe as one block instead of shimmering along the board
		const phase = props.reel.reelIndex * 0.9;
		const rate = 145 + props.reel.reelIndex * 11;
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
		}, 24);

		return () => clearInterval(id);
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
			const top = win.top;
			const h = win.height;
			g.clear();
			g.beginFill(0xff9c2e, 0.1 + 0.12 * pulse);
			g.drawRoundedRect(LEFT + 3, top + 3, SYMBOL_SIZE - 6, h - 6, 12);
			g.endFill();

			// frame: three nested strokes so the edge reads as lit metal
			g.lineStyle(7, 0xffd75e, 0.3 + 0.34 * pulse);
			g.drawRoundedRect(LEFT + 2, top + 2, SYMBOL_SIZE - 4, h - 4, 13);
			g.lineStyle(3, 0xffe98a, 0.45 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 6, top + 6, SYMBOL_SIZE - 12, h - 12, 10);
			g.lineStyle(1.4, 0xffffff, 0.25 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 10, top + 10, SYMBOL_SIZE - 20, h - 20, 8);

			// cell ticks down the column so the frame reads as slots, not a tube
			g.lineStyle(1.5, 0xffe98a, 0.16 + 0.2 * pulse);
			for (let row = 1; row < h / SYMBOL_SIZE; row++) {
				const y = top + row * SYMBOL_SIZE;
				g.moveTo(LEFT + 14, y);
				g.lineTo(LEFT + SYMBOL_SIZE - 14, y);
			}

			// chevrons converging on the column from above and below
			const chev = 14 + 6 * pulse;
			g.lineStyle(4, 0xffd75e, 0.5 + 0.4 * pulse);
			g.moveTo(x - SYMBOL_SIZE * 0.12, top - chev - 10);
			g.lineTo(x, top - chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, top - chev - 10);
			g.moveTo(x - SYMBOL_SIZE * 0.12, top + h + chev + 10);
			g.lineTo(x, top + h + chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, top + h + chev + 10);
		}}
	/>

	<!-- additive glow hugging each rail, so the tease has depth over the art -->
	{#each [win.top, win.top + win.height] as railY (railY)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			{x}
			y={railY}
			width={SYMBOL_SIZE * 1.35}
			height={SYMBOL_SIZE * 0.7}
			tint={0xffc65e}
			blendMode="add"
			alpha={0.22 + 0.3 * pulse}
		/>
	{/each}
</BoardContainer>

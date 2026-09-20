<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
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
			const h = BOARD_SIZES.height;
			g.clear();

			// PIXI v8 API — roundRect/fill/stroke, not beginFill/lineStyle.
			//
			// This was written against the v7 shim, and the shim is why the comment
			// below ("three nested strokes so the edge reads as lit metal") did not
			// describe what was on screen: the shim defers, so a run of lineStyle +
			// draw* calls in one Graphics resolves with the LAST style applied to
			// everything, and the three nested rects, the cell ticks and the chevrons
			// were all coming out as one 4px `0xffd75e` line. Which is also why the
			// tease read flat. Each shape now closes its own stroke.
			g.roundRect(LEFT + 3, 3, SYMBOL_SIZE - 6, h - 6, 12);
			g.fill({ color: 0xff9c2e, alpha: 0.1 + 0.12 * pulse });

			// full-height frame: three nested strokes so the edge reads as lit metal
			g.roundRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13);
			g.stroke({ width: 7, color: 0xffd75e, alpha: 0.3 + 0.34 * pulse });
			g.roundRect(LEFT + 6, 6, SYMBOL_SIZE - 12, h - 12, 10);
			g.stroke({ width: 3, color: 0xffe98a, alpha: 0.45 + 0.4 * pulse });
			g.roundRect(LEFT + 10, 10, SYMBOL_SIZE - 20, h - 20, 8);
			g.stroke({ width: 1.4, color: 0xffffff, alpha: 0.25 + 0.4 * pulse });

			// cell ticks down the column so the frame reads as five slots, not a tube
			for (let row = 1; row < BOARD_SIZES.height / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 14, y);
				g.lineTo(LEFT + SYMBOL_SIZE - 14, y);
			}
			g.stroke({ width: 1.5, color: 0xffe98a, alpha: 0.16 + 0.2 * pulse });

			// chevrons converging on the column from above and below
			const chev = 14 + 6 * pulse;
			g.moveTo(x - SYMBOL_SIZE * 0.12, -chev - 10);
			g.lineTo(x, -chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, -chev - 10);
			g.moveTo(x - SYMBOL_SIZE * 0.12, h + chev + 10);
			g.lineTo(x, h + chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, h + chev + 10);
			g.stroke({ width: 4, color: 0xffd75e, alpha: 0.5 + 0.4 * pulse });
		}}
	/>

	<!-- additive glow hugging each rail, so the tease has depth over the art -->
	{#each [0, BOARD_SIZES.height] as railY (railY)}
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

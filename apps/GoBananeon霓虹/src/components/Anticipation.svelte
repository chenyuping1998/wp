<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import { beamAt, pulseRateMs, tierIntensity, tierOf } from '../game/anticipationFocus';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let pulse = $state(0);
	let beamT = $state(0);
	// how hard this tease leans in: harder once the fourth Scatter is down
	const tier = $derived(tierOf(context.stateGame.scatterCounter));
	const intensity = $derived(tierIntensity(tier));
	const beam = $derived(beamAt(beamT, tier));
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
		// FASTER towards the right (game/anticipationFocus.ts). This was
		// 145 + reel * 11 — slower to the right, so the tension drained exactly
		// as the payoff approached.
		const started = Date.now();
		const id = setInterval(() => {
			const now = Date.now();
			pulse = 0.5 + 0.5 * Math.sin(now / pulseRateMs(props.reel.reelIndex, tier) + phase);
			beamT = now - started;
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
			g.beginFill(0xff3fd0, (0.1 + 0.12 * pulse) * intensity);
			g.drawRoundedRect(LEFT + 3, 3, SYMBOL_SIZE - 6, h - 6, 12);
			g.endFill();

			// full-height frame: three nested strokes so the edge reads as lit metal
			g.lineStyle(7, 0x59e3ff, (0.3 + 0.34 * pulse) * intensity);
			g.drawRoundedRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13);
			g.lineStyle(3, 0xb8f4ff, 0.45 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 6, 6, SYMBOL_SIZE - 12, h - 12, 10);
			g.lineStyle(1.4, 0xffffff, 0.25 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 10, 10, SYMBOL_SIZE - 20, h - 20, 8);

			// cell ticks down the column so the frame reads as five slots, not a tube
			g.lineStyle(1.5, 0xb8f4ff, 0.16 + 0.2 * pulse);
			for (let row = 1; row < BOARD_SIZES.height / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 14, y);
				g.lineTo(LEFT + SYMBOL_SIZE - 14, y);
			}

			// chevrons converging on the column from above and below
			const chev = 14 + 6 * pulse;
			g.lineStyle(4, 0x59e3ff, 0.5 + 0.4 * pulse);
			g.moveTo(x - SYMBOL_SIZE * 0.12, -chev - 10);
			g.lineTo(x, -chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, -chev - 10);
			g.moveTo(x - SYMBOL_SIZE * 0.12, h + chev + 10);
			g.lineTo(x, h + chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, h + chev + 10);
		}}
	/>

	<!-- the shaft of light travelling down the column, so it reads as lit from
	     somewhere rather than as a static wash (game/anticipationFocus.ts) -->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		{x}
		y={beam.y * BOARD_SIZES.height}
		width={SYMBOL_SIZE * 1.05}
		height={beam.height * BOARD_SIZES.height}
		tint={0xc58cff}
		blendMode="add"
		alpha={beam.alpha * intensity}
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
			tint={0xd98bff}
			blendMode="add"
			alpha={0.22 + 0.3 * pulse}
		/>
	{/each}
</BoardContainer>

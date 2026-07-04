<script lang="ts">
	import { SpineProvider, SpineTrack, Graphics, Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { REEL_PADDING, SYMBOL_SIZE } from '../game/constants';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let pulse = $state(0);
	let finished = $state(false);
	// dim fade-in for the non-anticipated reels
	let dimFade = $state(0);

	onMount(() => {
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 145);
			dimFade = Math.min(1, dimFade + 0.045);
		}, 32);

		return () => clearInterval(id);
	});

	// sparks drifting up the anticipated reel, phase-offset so they loop seamlessly
	const SPARKS = Array.from({ length: 10 }, (_, i) => ({
		offset: i / 10 + ((i * 0.37) % 0.1),
		xRatio: (i % 5) / 4 - 0.5,
		speed: 2400 + (i % 3) * 600,
		size: 14 + (i % 3) * 8,
		color: i % 2 ? 0xfff07a : 0xff8ede,
	}));

	// textured soft motes instead of hard vector dots (pulse drives re-eval)
	const sparkState = (spark: (typeof SPARKS)[number], _pulse: number) => {
		const now = Date.now();
		const p = (now / spark.speed + spark.offset) % 1;
		return {
			x: spark.xRatio * SYMBOL_SIZE * 0.34 + Math.sin(now / 260 + spark.offset * 12) * 5,
			y: SYMBOL_SIZE * 0.72 - p * SYMBOL_SIZE * 1.44,
			alpha: Math.sin(p * Math.PI) * (0.5 + 0.4 * pulse),
		};
	};

	$effect(() => {
		// Stop immediately when reel stops to avoid the heavy "falling/landing" outro feel.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});
</script>

<!-- focus dim: darken every reel except the anticipated one -->
<Graphics
	draw={(g) => {
		const board = context.stateGameDerived.boardLayout();
		const left = board.x - board.width * 0.5;
		const top = board.y - board.height * 0.5;
		const colLeft = left + props.reel.reelIndex * SYMBOL_SIZE;
		const alpha = 0.42 * dimFade;
		g.clear();
		g.beginFill(0x0d0212, alpha);
		if (colLeft > left) g.drawRect(left, top, colLeft - left, board.height);
		const colRight = colLeft + SYMBOL_SIZE;
		if (colRight < left + board.width) {
			g.drawRect(colRight, top, left + board.width - colRight, board.height);
		}
		g.endFill();
	}}
/>

<SpineProvider
	key="anticipation"
	width={SYMBOL_SIZE * 0.56}
	height={SYMBOL_SIZE * 1.6}
	x={context.stateGameDerived.boardLayout().x -
		context.stateGameDerived.boardLayout().width * 0.5 +
		(props.reel.reelIndex + REEL_PADDING) * SYMBOL_SIZE}
	y={context.stateGameDerived.boardLayout().y - SYMBOL_SIZE * 0.06}
>
	<Graphics
		draw={(g) => {
			const glowAlpha = 0.14 + 0.24 * pulse;
			const coreAlpha = 0.16 + 0.32 * pulse;
			g.clear();
			g.beginFill(0xff66cc, glowAlpha);
			g.drawRoundedRect(-SYMBOL_SIZE * 0.22, -SYMBOL_SIZE * 0.72, SYMBOL_SIZE * 0.44, SYMBOL_SIZE * 1.44, 22);
			g.endFill();
			g.lineStyle(3, 0xfff07a, coreAlpha);
			g.drawRoundedRect(-SYMBOL_SIZE * 0.2, -SYMBOL_SIZE * 0.68, SYMBOL_SIZE * 0.4, SYMBOL_SIZE * 1.36, 20);
			g.lineStyle(1.6, 0xffffff, 0.25 + 0.35 * pulse);
			g.drawRoundedRect(-SYMBOL_SIZE * 0.17, -SYMBOL_SIZE * 0.63, SYMBOL_SIZE * 0.34, SYMBOL_SIZE * 1.26, 18);
			g.lineStyle(0);
		}}
	/>
	{#each SPARKS as spark, index (index)}
		{@const state = sparkState(spark, pulse)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={state.x}
			y={state.y}
			tint={spark.color}
			blendMode="add"
			width={spark.size}
			height={spark.size}
			alpha={state.alpha}
		/>
	{/each}
	<SpineTrack
		trackIndex={0}
		animationName="anticipation_loop"
		loop
		timeScale={stateBetDerived.timeScale()}
	/>
</SpineProvider>

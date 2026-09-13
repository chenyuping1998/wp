<script lang="ts">
	/**
	 * A WINNING SYMBOL, LIT THE WAY THIS GAME LIGHTS THINGS.
	 *
	 * What was here: three concentric gold circles behind the symbol and a scale
	 * pulse. It works, and it is also the single most generic win animation there
	 * is — the same rings would sit just as happily on a fruit machine, a pirate
	 * game or a fishing game, which is exactly the note certification writes up as
	 * generic presentation.
	 *
	 * Every symbol in Go Bananubis is a carving on a stone plate, and the game
	 * already has a language for a carving coming alive: the Buy Bonus button's
	 * eye, the tablet multipliers, the Scatter hold. So a winning symbol does what
	 * those do — the carving itself lights (an additive copy of the same art, so
	 * the glow is the exact shape of the glyph rather than a disc behind it),
	 * corner brackets close on the plate, and sand shakes off the bottom edge on
	 * the first beat.
	 *
	 * No circles anywhere: nothing else in this game is round.
	 */
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import ImpactDust from './ImpactDust.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// pulse 0→1→0 at ~1.4 Hz
	let pulse = $state(0);
	// one puff, on the first beat — a plate does not shed sand continuously
	let dust = $state(true);

	onMount(() => {
		// Signal complete immediately so the game state machine isn't blocked.
		// The visual animation continues looping until the component is destroyed.
		props.oncomplete?.();

		// own phase and a slightly different rate per symbol — pulsing every
		// winning symbol in sync reads as one object breathing, not five
		const phase = Math.random() * Math.PI * 2;
		const rate = 225 * (0.9 + Math.random() * 0.2);
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
		}, 32);

		return () => clearInterval(id);
	});

	const GOLD = 0xffd75e;

	// the brackets: the same corner mark the Scatter hold and the tally slab use
	const drawBrackets = (g: PixiGraphics) => {
		g.clear();
		const half = SYMBOL_SIZE * (0.47 - 0.02 * pulse);
		const arm = SYMBOL_SIZE * (0.14 + 0.03 * pulse);
		for (const [cx, cy] of [
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1],
		]) {
			g.moveTo(cx * half - cx * arm, cy * half);
			g.lineTo(cx * half, cy * half);
			g.lineTo(cx * half, cy * half - cy * arm);
			g.stroke({
				width: 3 + 1.6 * pulse,
				color: GOLD,
				alpha: 0.45 + 0.45 * pulse,
				cap: 'round' as const,
			});
		}
	};
</script>

<Container x={props.x} y={props.y}>
	<!-- a soft bed UNDER the plate, so the light reads on the dark board too -->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		width={SYMBOL_SIZE * 1.45}
		height={SYMBOL_SIZE * 1.45}
		tint={GOLD}
		blendMode="add"
		alpha={0.08 + 0.18 * pulse}
	/>

	<Graphics draw={drawBrackets} />

	<Container scale={1 + 0.1 * pulse}>
		<!-- the plate -->
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
		/>
		<!--
			The carving lighting up: the SAME art again, additively, so what glows
			is the glyph's own shape. A disc behind the symbol would glow around it
			instead, which is what the rings used to do.
		-->
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
			tint={GOLD}
			blendMode="add"
			alpha={0.3 + 0.5 * pulse}
		/>
	</Container>

	{#if dust}
		<ImpactDust y={SYMBOL_SIZE * 0.44} oncomplete={() => (dust = false)} />
	{/if}
</Container>

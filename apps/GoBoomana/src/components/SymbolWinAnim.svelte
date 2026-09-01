<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// DIVISION OF LABOUR WITH WinWays
	//
	// WinWays owns "which cells won": it dims every non-winning cell and frames
	// the winning ones. This component owns "this symbol is the one" — the tile
	// itself reacting. So there is deliberately NO outline here. Gen-2 drew a
	// golden ring per symbol, which on this board would put a second gold edge
	// inside WinWays' frame on every winning cell, a millimetre apart.
	//
	// The ring also could not work here for a second reason: gen-1's symbols were
	// transparent cut-outs, so a circle behind them read as a halo. Delta's are
	// opaque square tiles in a wall with no gaps, and a circle behind a square
	// tile is simply invisible.
	//
	// What replaces it is a warm bloom drawn OVER the tile, following the tile's
	// own shape, plus a small scale pulse.

	// A tile is the full cell, and its neighbours are touching it. Gen-2 pulsed to
	// 1.18, which on a wall of tiles pushes a winning symbol under the four around
	// it — the symbol appears to sink rather than lift. 1.055 is as far as this
	// board can go before the overlap shows.
	const PULSE_SCALE = 0.055;
	const BLOOM_ALPHA = 0.3;
	const TICK_MS = 32;

	let pulse = $state(0);

	onMount(() => {
		// Signal complete immediately so the game state machine is not blocked.
		// The visual continues looping until the component is destroyed.
		props.oncomplete?.();

		// Own phase and a slightly different rate per symbol — pulsing every
		// winning symbol in sync reads as one object breathing, not five.
		const phase = Math.random() * Math.PI * 2;
		const rate = 225 * (0.9 + Math.random() * 0.2);
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
		}, TICK_MS);

		return () => clearInterval(id);
	});

	const w = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const h = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);

	// pixi v8 API. The previous version used beginFill/drawCircle/lineStyle,
	// which are the v7 shims and part of this app's type-error baseline.
	const drawBloom = (g: PixiGraphics) => {
		g.clear();
		// Inset so the bloom sits inside the tile's own painted border rather than
		// bleeding over the neighbouring tile.
		const inset = SYMBOL_SIZE * 0.06;
		g.roundRect(-w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, SYMBOL_SIZE * 0.06);
		g.fill({ color: 0xffe27a, alpha: BLOOM_ALPHA * pulse });
	};
</script>

<!--
	Win state for sprite symbols. Rendered at local 0,0 inside whatever container
	Symbol.svelte places — which on a split cell is a half-width one, so this
	scales with the halves automatically and needs no knowledge of the split.
-->
<Container x={props.x} y={props.y} scale={1 + PULSE_SCALE * pulse}>
	<Sprite anchor={0.5} key={props.symbolInfo.assetKey} width={w} height={h} />
	<!-- over the tile, not behind it: the tile is opaque -->
	<Graphics draw={drawBloom} />
</Container>

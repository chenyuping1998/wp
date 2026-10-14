<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS } from '../game/constants';
	import FxBurst from './FxBurst.svelte';

	// Entry reveal, played once when the loading screen hands over: a quick
	// white pop and a gold burst over the board, then the five reels uncover
	// left→right in a wave.
	const COLUMN_DELAY = 0.08;
	const COLUMN_FADE = 0.24;
	const FIRST_COLUMN_AT = 0.12;
	const T_TOTAL = 1.1;

	const context = getContext();

	let t = $state(0);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / 1000;
			if (t >= T_TOTAL) return;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const flashAlpha = $derived(t < 0.16 ? 0.45 * (1 - t / 0.16) : 0);

	const drawCovers = (g: PixiGraphics) => {
		// The board is drawn at boardLayout().scale (1.22 landscape, 1.12
		// portrait). These covers used the unscaled BOARD_SIZES / SYMBOL_SIZE, so
		// until 2026-09-30 the "reels uncovering" was a smaller grey box floating
		// off-centre over the reels — the first thing on screen after loading.
		const board = context.stateGameDerived.boardLayout();
		const w = board.width * board.scale;
		const h = board.height * board.scale;
		const left = board.x - w * 0.5;
		const top = board.y - h * 0.5;
		const column = w / BOARD_DIMENSIONS.x;
		g.clear();
		for (let c = 0; c < BOARD_DIMENSIONS.x; c++) {
			const begin = FIRST_COLUMN_AT + c * COLUMN_DELAY;
			const alpha = 0.95 * (1 - Math.min(1, Math.max(0, (t - begin) / COLUMN_FADE)));
			if (alpha <= 0.01) continue;
			// the housing's own interior colour (was 0x0a1508, an olive leftover)
			g.rect(left + c * column, top, column, h).fill({ color: 0x071714, alpha });
		}
	};
</script>

{#if t < T_TOTAL}
	<MainContainer>
		<Graphics draw={drawCovers} />
		{#if t > 0.03}
			<FxBurst
				x={context.stateGameDerived.boardLayout().x}
				y={context.stateGameDerived.boardLayout().y}
				scale={1.4}
				flavour="neon"
			/>
		{/if}
	</MainContainer>
	{#if flashAlpha > 0}
		<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flashAlpha} />
	{/if}
{/if}

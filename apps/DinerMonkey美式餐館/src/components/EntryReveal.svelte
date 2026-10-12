<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import FxBurst from './FxBurst.svelte';

	// Loading handover: five ink covers lift in sequence while the themed
	// paper pieces frame the board. No full-screen flash over the prize art.
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

	const drawCovers = (g: PixiGraphics) => {
		const board = context.stateGameDerived.boardLayout();
		const left = board.x - board.width * 0.5;
		const top = board.y - board.height * 0.5;
		g.clear();
		for (let column = 0; column < BOARD_DIMENSIONS.x; column++) {
			const begin = FIRST_COLUMN_AT + column * COLUMN_DELAY;
			const alpha = 0.85 * (1 - Math.min(1, Math.max(0, (t - begin) / COLUMN_FADE)));
			if (alpha <= 0.01) continue;
			g.beginFill(0x322b2a, alpha);
			g.drawRect(left + column * SYMBOL_SIZE, top, SYMBOL_SIZE, board.height);
			g.endFill();
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
			/>
		{/if}
	</MainContainer>
{/if}

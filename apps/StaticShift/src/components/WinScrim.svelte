<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS } from '../game/constants';

	// THE WIN DIMMING, DRAWN BETWEEN THE TWO BOARD LAYERS.
	//
	// Board draws resting tiles on one layer and animating ones on another above
	// it, and a winning symbol is on the animating one. Drawn here, between them,
	// the dimming covers every tile that did not win and none of the ones that
	// did — including the parts of a winning tile that have grown out across a
	// losing neighbour during its win move. Drawn over the whole board, as it
	// used to be from WinWays, it dimmed those parts too, so a symbol swelling
	// into its neighbour looked like it was sliding under a shadow.
	//
	// Which cells are lit is WinWays' decision (stateGame.winLitCells); this only
	// draws it. Rendered inside Board's BoardContainer, so it is already in board
	// coordinates.
	const SCRIM = 0x05070a;
	// 0.62 blacked the losing cells out; the idle replay then switched that on
	// and off every pass, which read as the board flashing. Lighter, and faded.
	const SCRIM_ALPHA = 0.45;
	const FADE_IN_MS = 160;
	const FADE_OUT_MS = 240;

	// The scrim fades in and out instead of switching. While it fades out it
	// keeps drawing the last lit set, since winLitCells is already cleared.
	let fade = $state(0);
	let shownLit: string[] | null = null;
	let raf = 0;
	const fadeTo = (target: number) => {
		cancelAnimationFrame(raf);
		let last = performance.now();
		const tick = (now: number) => {
			const dt = now - last;
			last = now;
			const step = dt / (target > fade ? FADE_IN_MS : FADE_OUT_MS);
			fade = target > fade ? Math.min(target, fade + step) : Math.max(target, fade - step);
			if (fade !== target) raf = requestAnimationFrame(tick);
			else if (target === 0) shownLit = null;
		};
		raf = requestAnimationFrame(tick);
	};
	$effect(() => {
		const lit = stateGame.winLitCells;
		const on = !!lit && lit.length > 0 && !stateGame.winCelebrationShow;
		if (on) shownLit = [...lit!];
		fadeTo(on ? 1 : 0);
	});
	onDestroy(() => cancelAnimationFrame(raf));

	// same formula as getSymbolX in utils.ts
	const cellX = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING) - SYMBOL_SIZE / 2;
	// board rows are 1..numRows in the padded array; row 0 and numRows+1 are the
	// padding cells either side and are never lit
	const cellY = (row: number) => -SYMBOL_SIZE + row * SYMBOL_SIZE;

	const draw = (g: PixiGraphics) => {
		g.clear();
		const a = fade;
		const lit = shownLit;
		if (!lit || a <= 0) return;
		const set = new Set(lit);
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				if (set.has(`${reel},${row}`)) continue;
				g.rect(cellX(reel), cellY(row), SYMBOL_SIZE, SYMBOL_SIZE);
			}
		}
		g.fill({ color: SCRIM, alpha: SCRIM_ALPHA * a });
	};
</script>

<Graphics {draw} />

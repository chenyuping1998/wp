<script lang="ts">
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
	const SCRIM_ALPHA = 0.62;

	// same formula as getSymbolX in utils.ts
	const cellX = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING) - SYMBOL_SIZE / 2;
	// board rows are 1..numRows in the padded array; row 0 and numRows+1 are the
	// padding cells either side and are never lit
	const cellY = (row: number) => -SYMBOL_SIZE + row * SYMBOL_SIZE;

	const draw = (g: PixiGraphics) => {
		g.clear();
		const lit = stateGame.winLitCells;
		if (!lit) return;
		const set = new Set(lit);
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				if (set.has(`${reel},${row}`)) continue;
				g.rect(cellX(reel), cellY(row), SYMBOL_SIZE, SYMBOL_SIZE);
			}
		}
		g.fill({ color: SCRIM, alpha: SCRIM_ALPHA });
	};
</script>

<Graphics {draw} />

<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BASE_ROWS, BOARD_CELL_COLOR, NUM_REELS, SYMBOL_SIZE, reelYOffset } from '../game/constants';
	import { getSymbolX } from '../game/utils';

	const context = getContext();
	const S = SYMBOL_SIZE;

	// A quiet socket behind each visible symbol. The low-pay metal plates still
	// cover it completely; cut-out subjects expose the same cell boundary instead
	// of appearing to float in an unstructured dark gap.
	const draw = (g: PixiGraphics) => {
		g.clear();
		for (let reel = 0; reel < NUM_REELS; reel += 1) {
			const rows = context.stateGame.growRows[reel] ?? BASE_ROWS;
			const x = getSymbolX(reel) - S / 2;
			const top = reelYOffset(rows);
			for (let row = 0; row < rows; row += 1) {
				const y = top + row * S;
				g.rect(x, y, S, S).fill({ color: BOARD_CELL_COLOR, alpha: 0.62 });
				g.roundRect(x + 3, y + 3, S - 6, S - 6, 7).stroke({
					width: 1.5,
					color: 0x8aa9b5,
					alpha: 0.2,
				});
			}
		}
	};
</script>

<BoardContainer>
	<Graphics {draw} />
</BoardContainer>

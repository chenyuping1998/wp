<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { BOARD_DIMENSIONS, REEL_PADDING, SYMBOL_SIZE } from '../game/constants';

	// The art now has transparent silhouettes. Quiet recessed beds give the
	// symbols a shared stage without baking a noisy metal frame into each one.
	const draw = (g: PixiGraphics) => {
		g.clear();
		const gap = SYMBOL_SIZE * 0.025;
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
			for (let row = 0; row < BOARD_DIMENSIONS.y; row++) {
				const x = SYMBOL_SIZE * (reel + REEL_PADDING - 0.5) + gap;
				const y = row * SYMBOL_SIZE + gap;
				const size = SYMBOL_SIZE - gap * 2;
				g.roundRect(x, y, size, size, 12).fill({ color: 0x080c23, alpha: (reel + row) % 2 ? 0.32 : 0.22 });
				g.roundRect(x, y, size, size, 12).stroke({ color: 0x7c79ba, alpha: 0.1, width: 1 });
				g.moveTo(x + 14, y + 2).lineTo(x + size - 14, y + 2).stroke({ color: 0xc7caff, alpha: 0.045, width: 1 });
			}
		}
	};
</script>

<Graphics {draw} />

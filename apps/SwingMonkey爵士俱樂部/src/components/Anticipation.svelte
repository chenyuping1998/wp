<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { Graphics } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	let beat = $state(0);
	let finished = false;

	// Drawn entirely here rather than through the old `anticipation` spine: that
	// asset is template art from a mining game (rocks, dust, sparks) whose
	// artwork sat off-centre — it was the bright block that showed up at the top
	// left — and it was only ~1.6 cells tall, so it never framed the reel.
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const left = $derived(x - SYMBOL_SIZE / 2);

	onMount(() => {
		// offset per reel: when several reels tease at once, a shared phase makes
		// them strobe as one block instead of shimmering along the board
		const start = performance.now();
		const id = everyFrame(() => {
			beat = (performance.now() - start) / 410 + props.reel.reelIndex * 0.5;
		});

		return () => id();
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
	<Graphics
		draw={(g) => {
			const h = BOARD_SIZES.height;
			g.clear();
			const x0 = left + 6;
			const x1 = left + SYMBOL_SIZE - 6;
			const y0 = 8;
			const y1 = h - 8;
			const pulse = 0.5 + 0.5 * Math.sin(beat * Math.PI * 2);
			// One complete frame in board coordinates. All four edges stay inside
			// this reel, and the transparent middle keeps the moving symbols legible.
			g.rect(x0, y0, x1 - x0, y1 - y0)
				.stroke({ color: 0x161412, width: 14, alpha: 0.78 });
			g.rect(x0, y0, x1 - x0, y1 - y0)
				.stroke({ color: 0xf2b632, width: 6, alpha: 0.85 + pulse * 0.15 });
			g.rect(x0 + 5, y0 + 5, x1 - x0 - 10, y1 - y0 - 10)
				.stroke({ color: 0xf3e9d2, width: 2, alpha: 0.65 + pulse * 0.25 });
			for (const side of [x0, x1]) {
				for (let row = 0; row < 8; row++) {
					const light = 0.2 + 0.8 * Math.max(0, Math.sin(beat * Math.PI * 2 - row * 0.85));
					g.circle(side, (row + 0.5) * h / 8, 3 + light * 2)
						.fill({ color: light > 0.55 ? 0xf3e9d2 : 0xd9342b, alpha: 0.82 + light * 0.18 });
				}
			}
			for (const y of [y0, y1]) {
				for (let col = 1; col <= 3; col++) {
					const light = 0.2 + 0.8 * Math.max(0, Math.sin(beat * Math.PI * 2 - col * 1.25));
					g.circle(x0 + (x1 - x0) * col / 4, y, 3 + light * 2)
						.fill({ color: light > 0.55 ? 0xf3e9d2 : 0xd9342b, alpha: 0.82 + light * 0.18 });
				}
			}
		}}
	/>

</BoardContainer>

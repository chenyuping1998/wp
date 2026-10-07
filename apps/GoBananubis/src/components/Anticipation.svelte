<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let pulse = $state(0);
	// ms since this tease began: drives the sand and the ankhs lighting in turn
	let clock = $state(0);
	let finished = $state(false);

	// Drawn entirely here rather than through the old `anticipation` spine: that
	// asset is template art from a mining game (rocks, dust, sparks) whose
	// artwork sat off-centre — it was the bright block that showed up at the top
	// left — and it was only ~1.6 cells tall, so it never framed the reel.
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);

	onMount(() => {
		// offset per reel: when several reels tease at once, a shared phase makes
		// them strobe as one block instead of shimmering along the board
		const phase = props.reel.reelIndex * 0.9;
		const rate = 145 + props.reel.reelIndex * 11;
		const born = Date.now();
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
			clock = Date.now() - born;
		}, 24);

		return () => clearInterval(id);
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
	<!-- amber wash over the whole teasing column, brightest at the rails -->
	<Graphics
		draw={(g) => {
			const h = BOARD_SIZES.height;
			g.clear();
			g.beginFill(0xff9c2e, 0.1 + 0.12 * pulse);
			g.drawRoundedRect(LEFT + 3, 3, SYMBOL_SIZE - 6, h - 6, 12);
			g.endFill();

			// full-height frame: three nested strokes so the edge reads as lit metal
			g.lineStyle(7, 0xffd75e, 0.3 + 0.34 * pulse);
			g.drawRoundedRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13);
			g.lineStyle(3, 0xffe98a, 0.45 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 6, 6, SYMBOL_SIZE - 12, h - 12, 10);
			g.lineStyle(1.4, 0xffffff, 0.25 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 10, 10, SYMBOL_SIZE - 20, h - 20, 8);

			// cell ticks down the column so the frame reads as five slots, not a tube
			g.lineStyle(1.5, 0xffe98a, 0.16 + 0.2 * pulse);
			for (let row = 1; row < BOARD_SIZES.height / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 14, y);
				g.lineTo(LEFT + SYMBOL_SIZE - 14, y);
			}

			// chevrons converging on the column from above and below
			const chev = 14 + 6 * pulse;
			g.lineStyle(4, 0xffd75e, 0.5 + 0.4 * pulse);
			g.moveTo(x - SYMBOL_SIZE * 0.12, -chev - 10);
			g.lineTo(x, -chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, -chev - 10);
			g.moveTo(x - SYMBOL_SIZE * 0.12, h + chev + 10);
			g.lineTo(x, h + chev);
			g.lineTo(x + SYMBOL_SIZE * 0.12, h + chev + 10);
		}}
	/>

	<!--
		THE TOMB HOLDING ITS BREATH. The frame above only pulsed, the same beat for
		as long as the reel took, so the tease had no rising edge. Two things now
		run inside it:
		  · sand pours down both sides of the column, as it does from a ceiling
		    that is about to give — the same image as the trigger's rockfall, a
		    beat earlier and much quieter
		  · a small ankh at every row on both rails lights in turn, top to bottom,
		    and the sweep quickens the longer the reel spins, so waiting reads as
		    something building rather than something stuck
		Drawn with the v8 API: this is its own Graphics so it cannot pick up the
		fill colour the beginFill shim above leaves behind.
	-->
	<Graphics
		draw={(g) => {
			g.clear();
			const h = BOARD_SIZES.height;
			const rows = Math.round(h / SYMBOL_SIZE);
			// sand
			const GRAINS = 16;
			for (const [side, seed] of [
				[LEFT + 7, 0.37],
				[LEFT + SYMBOL_SIZE - 7, 0.71],
			] as const) {
				for (let k = 0; k < GRAINS; k++) {
					const f = ((clock * 0.00042 + k / GRAINS + seed) % 1 + 1) % 1;
					const y = 8 + f * (h - 16);
					const x = side + Math.sin(k * 12.9 + seed * 40) * 2.2;
					const edge = Math.min(1, f / 0.08, (1 - f) / 0.08);
					g.circle(x, y, 1.6 + (k % 3) * 0.5).fill({ color: 0xf2d59a, alpha: 0.75 * edge });
				}
			}
			// ankhs: one lit at a time, the sweep period shrinking from 900ms to 380ms
			const period = Math.max(380, 900 - clock * 0.25);
			const lit = (clock / (period / rows)) % rows;
			for (let row = 0; row < rows; row++) {
				const cy = (row + 0.5) * SYMBOL_SIZE;
				const d = Math.min(Math.abs(row - lit), rows - Math.abs(row - lit));
				const glow = Math.max(0, 1 - d / 1.2);
				const a = 0.22 + 0.78 * glow;
				const col = glow > 0.5 ? 0xfff3c4 : 0xffd75e;
				for (const ax of [LEFT + 13, LEFT + SYMBOL_SIZE - 13]) {
					const w = 2 + glow;
					g.ellipse(ax, cy - 8, 3.6, 4.6).stroke({ width: w, color: col, alpha: a });
					g.moveTo(ax - 6, cy - 2).lineTo(ax + 6, cy - 2).stroke({ width: w, color: col, alpha: a });
					g.moveTo(ax, cy - 2).lineTo(ax, cy + 11).stroke({ width: w, color: col, alpha: a });
				}
			}
		}}
	/>

	<!-- additive glow hugging each rail, so the tease has depth over the art -->
	{#each [0, BOARD_SIZES.height] as railY (railY)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			{x}
			y={railY}
			width={SYMBOL_SIZE * 1.35}
			height={SYMBOL_SIZE * 0.7}
			tint={0xffc65e}
			blendMode="add"
			alpha={0.22 + 0.3 * pulse}
		/>
	{/each}
</BoardContainer>

<script lang="ts">
	import { Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_DIMENSIONS,
		GRID_BADGE_WIDTH,
		GRID_BADGE_HEIGHT,
		gridTierFor,
		type GridTier,
	} from '../game/constants';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	/**
	 * The multiplier readout for the free game's heat grid: one small pill in the
	 * bottom-right corner of each heated cell.
	 *
	 * Separate from GridMultipliers, and mounted AFTER the board, purely because of
	 * draw order. The heat itself — the cell edge and the additive bloom — has to
	 * be under the symbols. The number has to be over them, or the artwork covers
	 * it. One component cannot be on both sides of the board.
	 *
	 * The corner is the only part of a cell where a symbol's silhouette reliably
	 * has nothing in it. Earlier versions put the value on a tinted plate covering
	 * the whole cell, which is what kept washing the symbols out: any covering
	 * lowers the artwork's contrast, however transparent it is made.
	 *
	 * Colour comes from GRID_TIERS, which is banded by how often a value is really
	 * seen rather than by even steps — see the note there. 1x and 2x stay the quiet
	 * dark ember they have always been; every value from 3x up gets its own colour,
	 * and the two rarest bands also breathe.
	 */
	const context = getContext();

	const grid = $derived(context.stateGame.gridMultipliers);
	// The grid is populated at the free-game trigger and emptied by the next base
	// spin, so its presence is a sufficient signal on its own.
	const show = $derived(grid.length > 0);

	const slotY = (row: number) => (row - 1 + 0.5) * SYMBOL_SIZE;
	const PLATE = SYMBOL_SIZE * 0.94;
	const BADGE_W = SYMBOL_SIZE * GRID_BADGE_WIDTH;
	const BADGE_H = SYMBOL_SIZE * GRID_BADGE_HEIGHT;

	const litCells = $derived.by(() => {
		if (!show) return [];
		const out: { key: string; reel: number; row: number; value: number; tier: GridTier }[] = [];
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel += 1) {
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row += 1) {
				const value = grid[reel]?.[row] ?? 0;
				const tier = gridTierFor(value);
				if (tier) out.push({ key: `${reel},${row}`, reel, row, value, tier });
			}
		}
		return out;
	});

	// Only the top two bands breathe, and they occur on about 1% of lit cells — so
	// the clock is started only when one is actually on the board. A rAF loop left
	// running for the other 99% of the feature would be pure waste.
	const hasPulse = $derived(litCells.some((cell) => cell.tier.pulse > 0));
	let clock = $state(0);

	$effect(() => {
		if (!hasPulse) return;
		let raf = 0;
		let last = 0;
		const tick = (now: number) => {
			// 40ms sampling: below ~25fps a slow glow starts to look stepped, above it
			// there is nothing left to see.
			if (now - last >= 40) {
				last = now;
				clock = now;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// Per-cell phase so several high cells never breathe in lockstep.
	const breathOf = (cell: { reel: number; row: number; tier: GridTier }) => {
		if (cell.tier.pulse <= 0) return 0;
		const phase = ((cell.reel * 5 + cell.row * 3) % 7) / 7;
		return (
			cell.tier.pulse * (0.5 + 0.5 * Math.sin((clock / 1000) * 2.6 + phase * Math.PI * 2))
		);
	};

	/** Bottom-right of the cell, inset so it does not touch the edge stroke. */
	const badgeAt = (reel: number, row: number) => ({
		x: getSymbolX(reel) + PLATE * 0.5 - BADGE_W - 3,
		y: slotY(row) + PLATE * 0.5 - BADGE_H - 3,
	});

	const drawBadges = (graphics: PixiGraphics) => {
		graphics.clear();
		for (const cell of litCells) {
			const badge = badgeAt(cell.reel, cell.row);
			const breath = breathOf(cell);
			// The rare bands also grow a little, so they are findable by movement on a
			// board where every cell is already lit.
			const grow = breath * 3;
			const x = badge.x - grow * 0.5;
			const y = badge.y - grow * 0.5;
			const w = BADGE_W + grow;
			const h = BADGE_H + grow;
			const radius = h * 0.4;

			if (breath > 0) {
				graphics
					.roundRect(x - 3, y - 3, w + 6, h + 6, radius + 3)
					.fill({ color: cell.tier.glow, alpha: 0.18 + breath * 0.3 });
			}
			graphics.roundRect(x, y, w, h, radius).fill({ color: cell.tier.fill, alpha: 0.96 });
			graphics.roundRect(x, y, w, h, radius).stroke({
				width: 1.5 + cell.tier.heat * 1.5,
				color: cell.tier.glow,
				alpha: 0.9 + breath * 0.1,
			});
		}
	};
</script>

{#if show}
	<BoardContainer>
		<Graphics draw={drawBadges} />
		{#each litCells as cell (cell.key)}
			{@const badge = badgeAt(cell.reel, cell.row)}
			<Text
				text={`${cell.value}x`}
				x={badge.x + BADGE_W * 0.5}
				y={badge.y + BADGE_H * 0.5}
				anchor={{ x: 0.5, y: 0.5 }}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: BADGE_H * 0.66,
					fill: cell.tier.text,
					// Paired with the fill in GRID_TIERS rather than inferred here: the
					// numeral needs an edge at both ends of the ladder, and deriving it
					// by comparing against literal colours breaks the moment a palette
					// value is tweaked.
					stroke: { color: cell.tier.textStroke, width: 2.5 },
				}}
			/>
		{/each}
	</BoardContainer>
{/if}

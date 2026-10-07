<script lang="ts">
	/**
	 * The opening board in miniature, for the Buy Bonus cards and their
	 * confirmation: five reels of six slots. The baseline rows are gunmetal; a
	 * reel that opens stretched is lit ice with its x2 above it; the slots it has
	 * not reached are dashed outlines, so the picture reads as "how far up it
	 * starts". Sized by the parent through --board-w / --board-h.
	 */
	import { REELS, maxRows, baseRows, reelMultiplier } from './buyCards';

	type Props = { rows: number };
	const props: Props = $props();

	const W = 13, H = 6, G = 3;
	const REEL_IDX = Array.from({ length: REELS }, (_, i) => i);
	const ROW_IDX = Array.from({ length: maxRows }, (_, i) => i);
</script>

<svg class="board" viewBox={`0 0 ${REELS * (W + G) - G} ${maxRows * (H + 1.4) + 9}`} aria-hidden="true">
	{#each REEL_IDX as reel (reel)}
		{@const tall = reel === 0 ? props.rows : baseRows}
		{@const x = reel * (W + G)}
		{#each ROW_IDX as k (k)}
			{@const y = 9 + (maxRows - 1 - k) * (H + 1.4)}
			{#if k < tall}
				<rect {x} {y} width={W} height={H} rx="1.2" class={tall > baseRows ? 'cell lit' : 'cell'} style:animation-delay={`${k * 0.08}s`} />
			{:else}
				<rect x={x + 0.4} y={y + 0.4} width={W - 0.8} height={H - 0.8} rx="1" class="cell empty" />
			{/if}
		{/each}
		{#if tall > baseRows}
			<text x={x + W / 2} y="6.6" class="x2">x{reelMultiplier}</text>
		{/if}
	{/each}
</svg>

<style>
	.board {
		width: var(--board-w, 124px);
		height: var(--board-h, 56px);
		overflow: visible;
	}
	.cell {
		fill: #3a4d5e;
		stroke: #8aa3b5;
		stroke-width: 0.6;
	}
	.cell.lit {
		fill: #3fb2d4;
		stroke: #e6f8ff;
		filter: drop-shadow(0 0 1.5px #8fe4ff);
		animation: charge 1.6s ease-in-out infinite;
	}
	.cell.empty {
		fill: none;
		stroke: #62798a;
		stroke-width: 0.5;
		stroke-dasharray: 1.4 1;
	}
	@keyframes charge {
		50% {
			fill: #8fe4ff;
		}
	}
	.x2 {
		font: 800 7px 'Segoe UI', Arial, sans-serif;
		fill: #c4f1ff;
		text-anchor: middle;
	}
	@media (prefers-reduced-motion: reduce) {
		.cell.lit {
			animation: none;
		}
	}
</style>

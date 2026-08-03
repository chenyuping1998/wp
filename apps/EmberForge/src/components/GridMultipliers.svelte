<script lang="ts" module>
	export type EmitterEventGridMultipliers =
		| { type: 'gridMultipliersShow' }
		| { type: 'gridMultipliersHide' }
		| { type: 'gridMultipliersClear' }
		| { type: 'gridMultipliersRestore'; grid: number[][] }
		| { type: 'gridMultipliersUpdate'; grid: number[][]; previous: number[][] };
</script>

<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_DIMENSIONS,
		gridTierFor,
		type GridTier,
	} from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	/**
	 * The free game's heat grid: a plate under every board position that lights
	 * once the position has paid, and climbs the colour ladder each time it pays
	 * again. Drawn BELOW the symbols — it is the anvil they sit on, not a badge
	 * over them.
	 *
	 * The ladder in constants.ts is calibrated to what the math actually produces
	 * (top cell observed across 20,000 books: 47), not to the 512 safety cap, so
	 * every step of it is a step a player will really see.
	 *
	 * Rows here are board rows (1..7). The shift from the math's unpadded grid
	 * happens once, in the book event handler.
	 */
	const context = getContext();

	let show = $state(false);
	// Per-cell flare, keyed "reel,row": 1 right after the cell gains heat, decaying
	// to 0. Drives the pop that says "this one just went up".
	let flares = $state<Record<string, number>>({});
	let clock = $state(0);

	const grid = $derived(context.stateGame.gridMultipliers);

	const slotY = (row: number) => (row - 1 + 0.5) * SYMBOL_SIZE;
	const PLATE = SYMBOL_SIZE * 0.94;

	// Each cell breathes on its own phase and rate. A shared Math.sin(Date.now())
	// would put all 49 plates in lockstep, which reads as the whole board
	// flickering rather than as heat.
	const phaseFor = (reel: number, row: number) => ((reel * 7 + row * 3) % 11) / 11;
	const rateFor = (reel: number, row: number) => 0.9 + (((reel * 5 + row) % 7) / 7) * 0.35;

	// How long a flare takes to fade, in ms. Decay is computed from elapsed time
	// rather than subtracted per frame: a fixed per-frame step makes the effect run
	// at half speed on a 30fps device and at twice the speed on a 144Hz monitor,
	// which is the same class of bug as sharing one sine phase across instances.
	const FLARE_MS = 900;
	// The breathing redraw repaints 49 plates, so it is sampled rather than run
	// every frame. Below ~25fps a slow glow starts to look stepped; above it there
	// is nothing to see, so this is the cheapest rate that still looks continuous.
	const BREATHE_SAMPLE_MS = 40;

	$effect(() => {
		if (!show) return;
		let raf = 0;
		let lastFrame = 0;
		let lastSample = 0;
		const tick = (now: number) => {
			const dt = lastFrame ? now - lastFrame : 16;
			lastFrame = now;

			if (now - lastSample >= BREATHE_SAMPLE_MS) {
				lastSample = now;
				clock = now;
			}

			const entries = Object.entries(flares);
			if (entries.length > 0) {
				const step = dt / FLARE_MS;
				const next: Record<string, number> = {};
				for (const [key, value] of entries) {
					const decayed = value - step;
					if (decayed > 0) next[key] = decayed;
				}
				flares = next;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	/** Lit cells only, in board space, for both the plates and the bloom sprites. */
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

	const heatOf = (cell: { key: string; tier: GridTier }) =>
		Math.min(1, cell.tier.heat + (flares[cell.key] ?? 0) * 0.5);

	const breatheOf = (reel: number, row: number) =>
		0.5 +
		0.5 * Math.sin((clock / 1000) * rateFor(reel, row) * Math.PI + phaseFor(reel, row) * Math.PI * 2);

	const drawPlates = (graphics: PixiGraphics) => {
		graphics.clear();
		if (!show) return;

		// Cold cells are not drawn at all, and hot ones are not filled. This layer
		// contributes the cell edge and the additive bloom; the number lives in a
		// corner badge drawn by GridMultiplierBadges, which has to sit ABOVE the
		// symbols to stay readable while these two have to sit below them.
		for (const cell of litCells) {
			const { reel, row, tier } = cell;
			const x = getSymbolX(reel) - PLATE / 2;
			const y = slotY(row) - PLATE / 2;
			const heat = heatOf(cell);
			const breathe = breatheOf(reel, row);

			graphics.roundRect(x, y, PLATE, PLATE, 8).stroke({
				width: 2 + heat * 3,
				color: tier.glow,
				alpha: 0.55 + heat * 0.4 * (0.75 + breathe * 0.25),
			});

		}
	};

	context.eventEmitter.subscribeOnMount({
		gridMultipliersShow: () => (show = true),
		gridMultipliersHide: () => (show = false),
		gridMultipliersClear: () => {
			show = false;
			flares = {};
		},
		gridMultipliersRestore: () => {
			show = true;
			flares = {};
		},
		gridMultipliersUpdate: async ({ grid: next, previous }) => {
			show = true;
			// Flare only the cells that actually changed. Comparing against the
			// previous grid rather than tracking wins separately means a restored
			// session lights nothing, which is correct: nothing just happened.
			const lit: Record<string, number> = { ...flares };
			let any = false;
			next.forEach((column, reel) => {
				column.forEach((value, row) => {
					if (value > (previous[reel]?.[row] ?? 0)) {
						lit[`${reel},${row}`] = 1;
						any = true;
					}
				});
			});
			if (any) {
				flares = lit;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
			}
		},
	});
</script>

{#if show}
	<BoardContainer>
		<Graphics draw={drawPlates} />

		<!--
			Additive bloom, one per lit cell. This is what actually separates a 20x
			plate from a 1x one: an alpha fill can only ever darken what is under it,
			so tier contrast built from fills alone forces the low tiers to go dark.
			Adding light instead means the hot cells get brighter while everything
			else is simply left alone.
		-->
		{#each litCells as cell (cell.key)}
			{@const heat = heatOf(cell)}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={getSymbolX(cell.reel)}
				y={slotY(cell.row)}
				width={SYMBOL_SIZE * (1.05 + heat * 0.45)}
				height={SYMBOL_SIZE * (1.05 + heat * 0.45)}
				tint={cell.tier.glow}
				blendMode="add"
				alpha={0.16 + heat * 0.4 * (0.8 + breatheOf(cell.reel, cell.row) * 0.2)}
			/>
		{/each}

	</BoardContainer>
{/if}

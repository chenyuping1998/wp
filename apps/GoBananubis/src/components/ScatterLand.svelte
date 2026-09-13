<script lang="ts" module>
	export type EmitterEventScatterLand =
		| {
				type: 'scatterLand';
				reel: number;
				// padded row index, as the reel reports it
				row: number;
				// how many Scatters are on the board including this one, 1..5
				count: number;
		  }
		// raised as a spin begins, not as it ends: the hold is meant to last until
		// the board it belongs to is spun away
		| { type: 'scatterLandClear' };
</script>

<script lang="ts">
	/**
	 * A SCATTER LANDING, SHOWN.
	 *
	 * The sound for this was already right — five samples, climbing a step per
	 * Scatter (SCATTER_LAND_SOUND_MAP) — and the picture was missing entirely.
	 * The first Scatter of a spin landed with a rising note and no light; the
	 * second the same; and the board only did anything once the third had turned
	 * up and ScatterBurst fired for the trigger. The half of the tease a player
	 * actually watches was not there.
	 *
	 * Two parts, the same two every slot uses for this and for good reason:
	 *
	 *   · a hit on the cell as it lands — a hot flash, a ring thrown off it and
	 *     a puff of the same sand the reels kick up (ImpactDust)
	 *   · a hold: the cell keeps a slow red-gold breath for the rest of the spin,
	 *     so two Scatters sitting on the board are visibly two Scatters sitting
	 *     on the board while the remaining reels are still turning
	 *
	 * The hit gets harder with the count, because by the third one the spin is
	 * about to become a feature and the presentation should already know it.
	 */
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import ImpactDust from './ImpactDust.svelte';

	const context = getContext();

	const HIT_MS = 420;

	// Scarab red into tomb gold: the Scatter's own two colours, and the pair the
	// transition burst and the free-game plaques already run on.
	const HOT = 0xffe6a8;
	const RING = 0xff7a33;
	const HOLD_TINT = 0xffb347;

	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	type Landed = { id: number; reel: number; row: number; count: number; at: number };

	let landed = $state<Landed[]>([]);
	let dust = $state<{ id: number; x: number; y: number }[]>([]);
	let nextId = 0;
	let now = $state(0);
	let raf = 0;

	const running = $derived(landed.length > 0);

	$effect(() => {
		if (!running) {
			cancelAnimationFrame(raf);
			raf = 0;
			return;
		}
		if (raf) return;
		const step = () => {
			now = Date.now();
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => {
			cancelAnimationFrame(raf);
			raf = 0;
		};
	});

	context.eventEmitter.subscribeOnMount({
		scatterLand: ({ reel, row, count }) => {
			// PADDING ROWS ARE NOT ON THE BOARD.
			//
			// The reel reports the row it landed on including its padding symbols —
			// row 0 sits above the top rail and row 6 below the bottom one — and a
			// Scatter that lands in padding is a symbol the player never sees. Its
			// brackets were being drawn anyway, a whole cell outside the housing.
			if (row < 1 || row > BOARD_DIMENSIONS.y) return;

			const id = nextId++;
			now = Date.now();
			landed = [...landed, { id, reel, row, count, at: now }];
			dust = [...dust, { id, x: getSymbolX(reel), y: rowCenterY(row) + SYMBOL_SIZE * 0.42 }];

			// The housing answers it, harder each time — the same knock the reels'
			// own stops and the chest beat use, so a Scatter landing is felt in the
			// same place the rest of the game is felt. The sound was already
			// climbing a step per Scatter and the board was not moving at all.
			context.eventEmitter.broadcast({
				type: 'boardFrameImpact',
				strength: 0.2 + 0.12 * Math.min(count, 5),
			});
		},
		// The hold belongs to the board it landed on: the next spin clears it as
		// it starts, and a torn-down board takes it too.
		scatterLandClear: () => (landed = []),
		boardHide: () => (landed = []),
	});

	const easeOut = (p: number) => 1 - (1 - p) ** 3;

	const drawHits = (g: PixiGraphics) => {
		now;
		g.clear();
		for (const hit of landed) {
			const x = getSymbolX(hit.reel);
			const y = rowCenterY(hit.row);
			// the count makes it harder, not different: same shape, more of it
			const force = 0.7 + 0.16 * Math.min(hit.count, 5);
			const p = Math.min(1, (now - hit.at) / HIT_MS);

			if (p < 1) {
				// the ring thrown off the plate
				const r = SYMBOL_SIZE * (0.3 + 0.42 * easeOut(p)) * force;
				g.rect(x - r, y - r, r * 2, r * 2).stroke({
					width: 6 * (1 - p) * force,
					color: RING,
					alpha: 0.9 * (1 - p),
				});
				// the plate itself going hot for a frame or two
				const flash = Math.max(0, 1 - p * 3);
				if (flash > 0) {
					g.rect(
						x - SYMBOL_SIZE * 0.46,
						y - SYMBOL_SIZE * 0.46,
						SYMBOL_SIZE * 0.92,
						SYMBOL_SIZE * 0.92,
					).fill({ color: HOT, alpha: 0.5 * flash * force });
				}
			}

			// The hold: four corner brackets, breathing.
			//
			// It was a plain square outline first, and a thin orange box around a
			// cell is the one thing on this board that looks drawn by a program
			// rather than made. Brackets are the game's own mark — the corner studs
			// on every symbol plate, the buy cards and the tally slab — and they
			// frame the symbol instead of boxing it in.
			const breath = 0.5 + 0.5 * Math.sin((now - hit.at) / 340);
			const half = SYMBOL_SIZE * 0.44;
			const arm = SYMBOL_SIZE * (0.15 + 0.02 * breath);
			const width = 3 + 1.2 * breath;
			const alpha = (0.5 + 0.35 * breath) * force;
			for (const [cx, cy] of [
				[-1, -1],
				[1, -1],
				[-1, 1],
				[1, 1],
			]) {
				g.moveTo(x + cx * half - cx * arm, y + cy * half);
				g.lineTo(x + cx * half, y + cy * half);
				g.lineTo(x + cx * half, y + cy * half - cy * arm);
				g.stroke({ width, color: HOLD_TINT, alpha, cap: 'round' as const });
			}
		}
	};
</script>

{#if running}
	<BoardContainer>
		<Container zIndex={6}>
			<Graphics draw={drawHits} />

			<!-- the glow under the hold, which a stroke cannot give on its own -->
			{#each landed as hit (hit.id)}
				{@const breath = 0.5 + 0.5 * Math.sin((now - hit.at) / 320)}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					x={getSymbolX(hit.reel)}
					y={rowCenterY(hit.row)}
					width={SYMBOL_SIZE * 1.5}
					height={SYMBOL_SIZE * 1.5}
					tint={HOLD_TINT}
					blendMode="add"
					alpha={0.1 + 0.12 * breath}
				/>
			{/each}

			<!-- sand knocked off the plate as it lands -->
			{#each dust as puff (puff.id)}
				<ImpactDust
					x={puff.x}
					y={puff.y}
					oncomplete={() => (dust = dust.filter((d) => d.id !== puff.id))}
				/>
			{/each}
		</Container>
	</BoardContainer>
{/if}

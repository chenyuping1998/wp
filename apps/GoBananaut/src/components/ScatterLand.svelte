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
	 * A SCATTER LANDING, SHOWN — ported from Go Bananubis (same file name).
	 *
	 * The sound was already right — five samples climbing a step per Scatter
	 * (SCATTER_LAND_SOUND_MAP) — and the picture had nothing: the first and
	 * second Scatter of a spin landed like any other symbol, and the board only
	 * reacted once the third had decided it. Now:
	 *
	 *   · a hit on the cell as it lands — a hot flash, a ring thrown off it and a
	 *     knock through the housing — HARDER with each Scatter the spin has shown
	 *     (the symbol's own landing climbs with it: ReelSymbol's weight)
	 *   · a hold: the cell keeps a breathing LOCK-ON for the rest of the spin —
	 *     four corner brackets, the targeting reticle a capsule's HUD would put
	 *     on it — so two Scatters on the board are visibly two Scatters while the
	 *     remaining reels are still turning
	 *
	 * Hot orange throughout: the Scatter's colour and nothing else's in this game
	 * (palette.ts).
	 */
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BASE_ROWS, cellCenterY } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	const HIT_MS = 420;
	const HOT = 0xffe0b0;
	const RING = 0xff8a2a;
	const HOLD_TINT = 0xffa640;

	type Landed = { id: number; reel: number; row: number; count: number; at: number };

	let landed = $state<Landed[]>([]);
	// when the Free Spins trigger began, for the brackets' burst (0: none)
	let triggerAt = 0;
	$effect(() => {
		if (context.stateGame.scatterTrigger) triggerAt = Date.now();
	});
	let nextId = 0;
	let now = $state(0);
	let raf = 0;

	const running = $derived(landed.length > 0);
	// Through cellCenterY, which knows the reels are bottom-anchored inside a
	// six-row box: a reel still at four rows would otherwise put the hold two
	// cells above its Scatter.
	const rowsOf = (reel: number) => context.stateGame.growRows[reel] ?? BASE_ROWS;
	const centre = (hit: { reel: number; row: number }) => ({
		x: getSymbolX(hit.reel),
		y: cellCenterY(rowsOf(hit.reel), hit.row),
	});

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
			// Padding rows are not on the board: the reel reports the row including
			// its padding, and a Scatter landing there is one the player never sees.
			if (row < 1 || row > rowsOf(reel)) return;
			now = Date.now();
			landed = [...landed, { id: nextId++, reel, row, count, at: now }];
			// the housing answers it, harder each time — the same knock the reel
			// stops and the chest beat use
			context.eventEmitter.broadcast({
				type: 'boardFrameImpact',
				strength: 0.2 + 0.12 * Math.min(count, 5),
				reel,
			});
		},
		scatterLandClear: () => (landed = []),
		boardHide: () => (landed = []),
	});

	const easeOut = (p: number) => 1 - (1 - p) ** 3;

	const drawHits = (g: PixiGraphics) => {
		now;
		g.clear();
		for (const hit of landed) {
			const { x, y } = centre(hit);
			// the count makes it harder, not different: same shape, more of it
			const force = 0.7 + 0.16 * Math.min(hit.count, 5);
			const p = Math.min(1, (now - hit.at) / HIT_MS);

			if (p < 1) {
				// the ring thrown off the cell
				const r = SYMBOL_SIZE * (0.3 + 0.42 * easeOut(p)) * force;
				g.circle(x, y, r).stroke({ width: 6 * (1 - p) * force, color: RING, alpha: 0.9 * (1 - p) });
				// the cell going hot for a frame or two
				const flash = Math.max(0, 1 - p * 3);
				if (flash > 0) {
					g.circle(x, y, SYMBOL_SIZE * 0.44).fill({ color: HOT, alpha: 0.45 * flash * force });
				}
			}

			// the hold: a lock-on reticle, four corner brackets, breathing.
			// ELASTIC (2026-10-02): the brackets SNAP in from wide on a spring and
			// overshoot, their arms bowing out like rubber and ringing straight; on
			// the trigger every bracket bursts out and springs back.
			const breath = 0.5 + 0.5 * Math.sin((now - hit.at) / 340);
			const since = now - hit.at;
			const snap = 1 + 0.55 * Math.exp(-since / 90) * Math.cos(since / 55);
			const burst = triggerAt ? 0.45 * Math.exp(-(now - triggerAt) / 220) * Math.sin((now - triggerAt) / 60) : 0;
			const sag = SYMBOL_SIZE * 0.05 * Math.exp(-since / 140) * Math.sin(since / 45) + SYMBOL_SIZE * 0.04 * burst;
			const half = SYMBOL_SIZE * 0.45 * (snap + Math.abs(burst));
			const arm = SYMBOL_SIZE * (0.15 + 0.02 * breath);
			const width = 3 + 1.2 * breath;
			const alpha = Math.min(1, (0.5 + 0.35 * breath) * force);
			for (const [cx, cy] of [
				[-1, -1],
				[1, -1],
				[-1, 1],
				[1, 1],
			]) {
				const kx = x + cx * half, ky = y + cy * half;
				g.moveTo(kx - cx * arm, ky);
				g.quadraticCurveTo(kx - (cx * arm) / 2, ky + cy * sag, kx, ky);
				g.quadraticCurveTo(kx + cx * sag, ky - (cy * arm) / 2, kx, ky - cy * arm);
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
				{@const at = centre(hit)}
				{@const breath = 0.5 + 0.5 * Math.sin((now - hit.at) / 320)}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					x={at.x}
					y={at.y}
					width={SYMBOL_SIZE * 1.5}
					height={SYMBOL_SIZE * 1.5}
					tint={HOLD_TINT}
					blendMode="add"
					alpha={0.1 + 0.12 * breath}
				/>
			{/each}
		</Container>
	</BoardContainer>
{/if}

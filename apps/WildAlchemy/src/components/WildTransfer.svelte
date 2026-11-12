<script lang="ts" module>
	import type { WildTransferPosition } from '../game/typesBookEvent';

	export type EmitterEventWildTransfer =
		/**
		 * Fog spreads from `centre` over every person cell (590 ref-px/s) and
		 * churns; resolves once every cell is covered and the hold is over, which
		 * is when the caller may swap the hidden cells to their converted art.
		 */
		| { type: 'wildTransferCover'; positions: WildTransferPosition[]; centre: { reel: number; row: number } }
		/**
		 * The fog opens ONE cell at a time, nearest the centre first: each cell
		 * charges (the reference's per-cell "In", 0.45 s) and then shows a WILD
		 * with the gold flame ring, or the person with the red seal. Resolves
		 * once the last cell's outcome has had a moment to read.
		 */
		| { type: 'wildTransferReveal' }
		| { type: 'wildTransferClear' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { REF_TIMING, refCellDistance } from '../game/refTiming';
	import { featureScaled } from '../game/timeScale';
	import type { SoundEffectName } from '../game/sound';

	const context = getContext();

	/**
	 * One cell at a time (Stone 2026-11-11: 「施法變wild要像星城那樣一格一格揭曉才有
	 * 期待感」). The reference clears its fog outward at 295 px/s, so cells the same
	 * distance from the centre open together and a full board resolves in ~1.7 s;
	 * here the same outward order is kept but every cell gets its own turn, at
	 * least STEP apart, and its own charge before the outcome. The whole sequence
	 * is capped so a free-game board full of persons still moves.
	 */
	const REVEAL = {
		/** seconds between one cell's charge and the next */
		step: { basegame: 0.42, freegame: 0.32 },
		minStep: 0.2,
		/** the charge-to-charge spread never exceeds this many seconds */
		spreadCap: { basegame: 4.0, freegame: 3.2 },
		/** the reference's per-cell In clip */
		charge: REF_TIMING.reveal.in,
		/** covered and churning before the first cell charges (reference 1.1 s; the per-cell charge now carries the suspense) */
		hold: 0.6,
		/** after the last outcome, before the line pays start */
		settle: 0.35,
		success: 0.4,
		fail: 0.5,
		/** the seal stays this long after it lands, then fades */
		sealHold: 0.6,
		ringHold: 0.9,
	};

	type Phase = 'cover' | 'charge' | 'success' | 'fail' | 'done';
	type Cell = {
		key: string;
		reel: number;
		row: number;
		size: number;
		success: boolean;
		phase: Phase;
		/** performance.now() when the current phase started */
		at: number;
		/** performance.now() when the fog reached it */
		coveredAt: number;
		/** per-cell swirl offset so neighbouring patches do not turn in step */
		spin: number;
	};

	let cells = $state<Cell[]>([]);
	let now = $state(performance.now());
	let tint = 0;
	let raf = 0;
	let tintRaf = 0;
	let generation = 0;

	const tick = (t: number) => {
		now = t;
		raf = requestAnimationFrame(tick);
	};
	const startTicker = () => {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(tick);
	};
	onDestroy(() => {
		cancelAnimationFrame(raf);
		cancelAnimationFrame(tintRaf);
	});

	const visibleRows = (row: number, size: number) => {
		const top = Math.max(0, row);
		const bottom = Math.min(BOARD_DIMENSIONS.y, row + size);
		return { top, height: Math.max(0, bottom - top) };
	};

	const pause = (seconds: number) => waitForTimeout(featureScaled(seconds * 1000));
	const sound = (name: SoundEffectName) => context.eventEmitter.broadcast({ type: 'soundOnce', name });

	const animateTint = (to: number, seconds: number) =>
		new Promise<void>((resolve) => {
			const from = tint;
			const start = performance.now();
			const ms = featureScaled(seconds * 1000);
			cancelAnimationFrame(tintRaf);
			const step = (t: number) => {
				const p = Math.min(1, (t - start) / ms);
				tint = from + (to - from) * p;
				// drawn by Game.svelte in screen space: this component lives inside the
				// board's MainContainer, where a canvas-sized rectangle lands skewed
				context.stateGame.fogTint = tint;
				if (p < 1) tintRaf = requestAnimationFrame(step);
				else resolve();
			};
			tintRaf = requestAnimationFrame(step);
		});

	const setPhase = (cell: Cell, phase: Phase) => {
		cell.phase = phase;
		cell.at = performance.now();
	};

	const centreOf = (c: { reel: number; row: number; size: number }) => ({
		reel: c.reel + (c.size - 1) / 2,
		row: c.row + (c.size - 1) / 2,
	});

	let revealOrder: number[] = [];

	// ── drawing helpers (all in seconds since a phase began) ─────────────────
	const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
	const easeOut = (p: number) => 1 - (1 - p) ** 3;
	const since = (cell: Cell) => Math.max(0, (now - cell.at) / 1000);
	const coverP = (cell: Cell) => (cell.coveredAt > 0 ? clamp01((now - cell.coveredAt) / 1000 / 0.3) : 0);

	/** 0..1 how much fog is left on the cell */
	const fogOf = (cell: Cell) => {
		const s = since(cell);
		if (cell.phase === 'cover' || cell.phase === 'charge') return coverP(cell);
		if (cell.phase === 'success') return 1 - clamp01(s / 0.22);
		if (cell.phase === 'fail') return 1 - clamp01(s / 0.3);
		return 0;
	};
	/** mist patch scale: pops in, breathes while covered, swells on the charge, blows out on the result */
	const mistScaleOf = (cell: Cell) => {
		const s = since(cell);
		const breathe = 1 + 0.03 * Math.sin(now / 260 + cell.spin * 6);
		if (cell.phase === 'cover') return (0.55 + 0.45 * easeOut(coverP(cell))) * breathe;
		if (cell.phase === 'charge') return breathe * (1 + 0.14 * easeOut(clamp01(s / REVEAL.charge)) + 0.04 * Math.sin(s * 40));
		if (cell.phase === 'success') return 1.14 + 0.5 * easeOut(clamp01(s / 0.22));
		if (cell.phase === 'fail') return 1.0 + 0.15 * clamp01(s / 0.3);
		return 1;
	};
	/** additive glow building through the charge, the white flash on success */
	const glowOf = (cell: Cell) => {
		const s = since(cell);
		if (cell.phase === 'charge') return 0.85 * clamp01(s / REVEAL.charge) ** 1.5;
		if (cell.phase === 'success') return 1 - clamp01(s / 0.35);
		return 0;
	};
	const ringOf = (cell: Cell) => {
		if (!cell.success || (cell.phase !== 'success' && cell.phase !== 'done')) return null;
		const s = cell.phase === 'success' ? since(cell) : since(cell) + REVEAL.success;
		const inP = easeOut(clamp01(s / 0.2));
		const out = clamp01((s - REVEAL.ringHold) / 0.35);
		return { scale: 1.3 - 0.3 * inP, alpha: inP * (1 - out) };
	};
	const sealOf = (cell: Cell) => {
		if (cell.success || (cell.phase !== 'fail' && cell.phase !== 'done')) return null;
		const s = cell.phase === 'fail' ? since(cell) : since(cell) + REVEAL.fail;
		// the seal slams down as the fog lifts
		const land = clamp01((s - 0.08) / 0.12);
		const out = clamp01((s - 0.2 - REVEAL.sealHold) / 0.3);
		return { scale: 1.8 - 0.8 * easeOut(land), alpha: (s < 0.08 ? 0 : 1) * (1 - out) };
	};

	context.eventEmitter.subscribeOnMount({
		wildTransferCover: async ({ positions, centre }) => {
			const mine = ++generation;
			startTicker();
			// one fog patch per block (a 2x2 person converts as one unit)
			const random = context.stateGame.spinRandom;
			cells = positions.map((p, i) => ({
				key: `${p.reel}:${p.row}:${p.size}`,
				reel: p.reel,
				row: p.row,
				size: p.size,
				success: p.success,
				phase: 'cover' as Phase,
				at: performance.now(),
				coveredAt: 0,
				spin: (i * 0.618) % 1,
			}));
			const distance = cells.map((c) => refCellDistance(centreOf(c), centre));
			// nearest the centre first; equal distances in a seeded order, so a
			// replay opens the same cells in the same order
			const tie = cells.map(() => random());
			revealOrder = cells.map((_, i) => i).sort((a, b) => distance[a] - distance[b] || tie[a] - tie[b]);

			void animateTint(1, REF_TIMING.tint.in);
			await Promise.all(
				cells.map(async (c, i) => {
					await pause(distance[i] / REF_TIMING.fog.inSpeed);
					if (mine !== generation) return;
					c.coveredAt = performance.now();
				}),
			);
			// everything covered: the fog churns and the player cannot tell yet
			await pause(0.3 + REVEAL.hold);
		},
		wildTransferReveal: async () => {
			const mine = ++generation;
			const shown = cells;
			const n = revealOrder.length;
			if (n === 0) return;
			const mode = context.stateGame.gameType === 'freegame' ? 'freegame' : 'basegame';
			const step = n > 1 ? Math.max(REVEAL.minStep, Math.min(REVEAL.step[mode], REVEAL.spreadCap[mode] / (n - 1))) : 0;
			let successes = 0;

			await Promise.all(
				revealOrder.map(async (index, k) => {
					await pause(k * step);
					const cell = shown[index];
					if (mine !== generation || !cell) return;
					setPhase(cell, 'charge');
					await pause(REVEAL.charge);
					if (mine !== generation) return;
					if (cell.success) {
						setPhase(cell, 'success');
						successes += 1;
						// a rising chime per WILD in this reveal
						sound(`sfx_scatter_stop_${Math.min(5, successes)}` as SoundEffectName);
						await pause(REVEAL.success);
					} else {
						setPhase(cell, 'fail');
						sound('sfx_symbols_landing');
						await pause(REVEAL.fail);
					}
					if (mine !== generation) return;
					setPhase(cell, 'done');
				}),
			);
			if (mine !== generation) return;
			void animateTint(0, REF_TIMING.tint.out);
			await pause(REVEAL.settle);
			// the seals and rings finish on their own while the line pays begin
			void pause(Math.max(REVEAL.ringHold + 0.35, REVEAL.sealHold + 0.5)).then(() => {
				if (cells === shown) {
					cells = [];
					cancelAnimationFrame(raf);
				}
			});
		},
		wildTransferClear: () => {
			generation += 1;
			cancelAnimationFrame(raf);
			cancelAnimationFrame(tintRaf);
			cells = [];
			revealOrder = [];
			tint = 0;
			context.stateGame.fogTint = 0;
		},
	});
</script>

<BoardContainer>
	<Container>
		<BoardMask />
		{#each cells as cell (cell.key)}
			{@const v = visibleRows(cell.row, cell.size)}
			{#if v.height > 0}
				{@const w = cell.size * SYMBOL_SIZE}
				{@const h = v.height * SYMBOL_SIZE}
				{@const fog = fogOf(cell)}
				{@const mist = Math.max(w, h) * mistScaleOf(cell)}
				{@const glow = glowOf(cell)}
				{@const ring = ringOf(cell)}
				{@const seal = sealOf(cell)}
				<!-- centred on the part of the block that is on the board: a block cut
				     by the top edge keeps its patch, ring and seal in view -->
				<Container x={cell.reel * SYMBOL_SIZE + w / 2} y={v.top * SYMBOL_SIZE + h / 2}>
					{#if fog > 0}
						<!-- opaque under-fog: the converted card is already swapped in
						     underneath, so nothing of it may show before its turn -->
						<Rectangle
							x={-w / 2 + 3}
							y={-h / 2 + 3}
							width={w - 6}
							height={h - 6}
							backgroundColor={0x2f6b55}
							alpha={Math.min(1, fog * 1.4)}
						/>
						<Sprite
							key="fxMist"
							anchor={0.5}
							rotation={now / 4000 + cell.spin * 6.28}
							width={mist * 1.18}
							height={mist * 1.18}
							alpha={fog}
						/>
						<Sprite
							key="fxMist"
							anchor={0.5}
							rotation={-now / 5600 + cell.spin * 3.1 + 1.2}
							width={mist * 0.92}
							height={mist * 0.92}
							alpha={fog * 0.9}
						/>
					{/if}
					{#if glow > 0}
						<Sprite
							key="fxGlow"
							anchor={0.5}
							tint={cell.phase === 'success' ? 0xffffff : 0xfff0b0}
							blendMode="add"
							width={Math.max(w, h) * (cell.phase === 'success' ? 2.2 : 1.6)}
							height={Math.max(w, h) * (cell.phase === 'success' ? 2.2 : 1.6)}
							alpha={glow}
						/>
					{/if}
					{#if ring && ring.alpha > 0}
						<Sprite
							key="fxSuccessRing"
							anchor={0.5}
							width={w * 1.06 * ring.scale}
							height={h * 1.06 * ring.scale}
							alpha={ring.alpha}
						/>
					{/if}
					{#if seal && seal.alpha > 0}
						<Sprite
							key="fxSeal"
							anchor={0.5}
							width={Math.min(w, h, SYMBOL_SIZE * 2) * 0.62 * seal.scale}
							height={Math.min(w, h, SYMBOL_SIZE * 2) * 0.62 * seal.scale}
							alpha={seal.alpha * 0.95}
						/>
					{/if}
				</Container>
			{/if}
		{/each}
	</Container>
</BoardContainer>

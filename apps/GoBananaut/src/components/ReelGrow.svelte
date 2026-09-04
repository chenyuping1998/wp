<script lang="ts" module>
	import type { SymbolName } from '../game/types';

	export type EmitterEventReelGrow =
		// The markers let go. Awaited, because what they reveal is the board the
		// round was scored on and the win presentation must not start before the
		// player has seen it.
		| {
				type: 'growMarkersLift';
				markers: { reel: number; row: number; symbol: SymbolName }[];
		  }
		// The stretch. `rows` is where the board is GOING — this component applies
		// it, at the moment the plume has the reel covered.
		| {
				type: 'reelsGrow';
				rows: number[];
				newCells: { reel: number; row: number; symbol: SymbolName }[];
				multipliers: number[];
				steps: number;
				maxSteps: number;
				full: boolean;
		  }
		| { type: 'reelGrowClear' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, MAX_ROWS, BASE_ROWS, reelYOffset } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import type { RawSymbol } from '../game/types';

	const context = getContext();

	// THE STRETCH, IN FOUR BEATS.
	//
	// Structurally this is Boomana's detonation and deliberately so: the one thing
	// that animation got right, after shipping a version that got it wrong, is
	// that THE COVER MUST BE TOTAL. Its note is worth keeping in front of you —
	// the earlier version swapped symbols behind a white flash, a flash is
	// transparent for most of its life, and a change seen happening reads as one
	// graphic replacing another rather than as an event leaving something behind.
	//
	// What is NOT borrowed is the shape of it. A detonation goes OUT; this goes
	// UP. Smoke billows outward and settles; in low gravity a released column
	// drifts, elongates and leaves. So the cover here is a plume of motes rising
	// off the reel, densest at the top — which is exactly where the two new cells
	// are about to appear, so the cover falls where the change is by construction
	// rather than by being aimed there.
	//
	//   SURGE     a bright line sweeps up the reel from its foot, motes lifting
	//             off each cell as it passes — the field letting go, bottom to top
	//   PLUME     the motes gather above the reel's old top edge and close over
	//             the band the new cells will occupy
	//   HOLD      fully covered — the board is re-shaped and the new symbols
	//             settled in here, unseen
	//   DISPERSE  the plume rises out of frame and thins, leaving a taller reel
	const SURGE_MS = 260;
	const PLUME_MS = 220;
	const HOLD_MS = 140;
	const DISPERSE_MS = 520;
	const TOTAL_MS = SURGE_MS + PLUME_MS + HOLD_MS + DISPERSE_MS;

	// A full 6x5 board is what the whole feature climbs towards, so it is held
	// longer. Not a different animation — the same one, given room.
	const FULL_BOARD_HOLD_MS = 700;

	// The markers letting go is its own, quieter beat, and it runs BEFORE the
	// stretch: the marker is the cause and the stretch is the effect, so they must
	// not overlap or the causation is lost.
	const LIFT_MS = 400;

	// TURBO DOES NOT SHORTEN EITHER OF THESE, for the reason Boomana gives about
	// its detonation: every other part of a turbo spin is the player skipping
	// something they already understand, and this is the one moment that is not
	// routine. It is the verb the game is named for. Turbo still drops the
	// pre-spin, the win-line volley and the reel wind-up.

	let clock = $state(-1);
	let liftClock = $state(-1);
	let growingFrom = $state<number[]>([]);
	let growingTo = $state<number[]>([]);
	let lifting = $state<{ reel: number; row: number }[]>([]);
	let raf = 0;
	let liftRaf = 0;

	// A cleared stretch must not be able to write to the board afterwards.
	//
	// This handler awaits across four phases and only THEN reshapes the board. If
	// a clear lands in one of those gaps — the round ending, a resume, the next
	// spin's reveal — the promise still wakes and settles a board that has moved
	// on, stamping the previous spin's shape onto the current one. Guarded by
	// construction rather than waited for; gen-3 shipped three separate fixes for
	// this shape of bug in its split animation before the cause was understood.
	let generation = 0;

	onDestroy(() => {
		cancelAnimationFrame(raf);
		cancelAnimationFrame(liftRaf);
	});

	// Motes are generated FROM THE INDICES, never from Math.random. A cluster that
	// re-rolls its lumps every frame boils instead of drifting — the same reason
	// Boomana seeds its smoke puffs off the reel index.
	const MOTES_PER_REEL = 14;
	const hash = (a: number, b: number, c: number) => {
		const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
		return v - Math.floor(v);
	};

	const motesOf = (reel: number, rows: number) =>
		Array.from({ length: MOTES_PER_REEL }, (_, i) => {
			const r1 = hash(reel, i, 1);
			const r2 = hash(reel, i, 2);
			const r3 = hash(reel, i, 3);
			return {
				// spread down the reel's own window, so a short reel's motes start at
				// its foot rather than at the top of the six-row box
				startY: reelYOffset(rows) + SYMBOL_SIZE * rows * (0.04 + 0.92 * (i / (MOTES_PER_REEL - 1))),
				x: (r1 - 0.5) * SYMBOL_SIZE * 0.78,
				// At least a third of a cell, so the cluster closes over the column
				// rather than leaving gaps down the edges for the change to show
				// through. The cover has to be total or the reshape is visible.
				r: SYMBOL_SIZE * (0.34 + 0.26 * r2),
				// each mote rises at its own rate, so the plume does not travel as one
				// object
				lag: r3 * 0.3,
				drift: (r2 - 0.5) * 0.5,
			};
		});

	const easeOut = (t: number) => 1 - (1 - t) ** 2;

	const draw = (g: PixiGraphics) => {
		g.clear();

		// --- the doubling, drawn always ------------------------------------
		// A stretched reel counts double in the free game, and that is worth far
		// more than the extra rows are. It is STATE, not a moment, so it is a
		// standing edge-light rather than anything that plays: the player has to be
		// able to look at the board at any time and see which reels are doubling.
		for (let reel = 0; reel < stateGame.growMultipliers.length; reel++) {
			if (stateGame.growMultipliers[reel] <= 1) continue;
			const rows = stateGame.growRows[reel] ?? BASE_ROWS;
			const cx = getSymbolX(reel);
			const top = reelYOffset(rows);
			const height = SYMBOL_SIZE * rows;
			for (const side of [-1, 1]) {
				g.rect(cx + (side * SYMBOL_SIZE) / 2 - (side > 0 ? 4 : 0), top, 4, height);
				g.fill({ color: 0x8fe4ff, alpha: 0.5 });
			}
		}

		if (clock < 0 || growingTo.length === 0) return;

		const t = clock;
		const surge = Math.min(1, t / SURGE_MS);
		const plume = t < SURGE_MS ? 0 : Math.min(1, (t - SURGE_MS) / PLUME_MS);
		const disperse =
			t < SURGE_MS + PLUME_MS + HOLD_MS
				? 0
				: Math.min(1, (t - SURGE_MS - PLUME_MS - HOLD_MS) / DISPERSE_MS);

		for (let reel = 0; reel < growingTo.length; reel++) {
			const from = growingFrom[reel] ?? BASE_ROWS;
			const to = growingTo[reel] ?? from;
			if (to <= from) continue;

			const cx = getSymbolX(reel);
			const left = cx - SYMBOL_SIZE / 2;
			const oldTop = reelYOffset(from);
			const newTop = reelYOffset(to);
			const foot = oldTop + SYMBOL_SIZE * from;

			// SURGE — a bright line running up the reel. It BRIGHTENS where Boomana
			// darkens: a detonation needs somewhere for the smoke to come from, and
			// this needs the opposite read, a column being released rather than
			// compressed.
			if (surge > 0 && disperse === 0) {
				const headY = foot - (foot - newTop) * easeOut(surge);
				g.rect(left, headY, SYMBOL_SIZE, foot - headY);
				g.fill({ color: 0x6fd4ff, alpha: 0.16 * surge });
				g.rect(left, headY - 3, SYMBOL_SIZE, 6);
				g.fill({ color: 0xd8f4ff, alpha: 0.85 * surge });
			}

			if (plume <= 0) continue;

			// PLUME — the cover. Denser the higher it goes, because the band between
			// newTop and oldTop is where the two new cells are about to appear.
			for (const m of motesOf(reel, from)) {
				const grow = Math.min(1, Math.max(0, (plume - m.lag) / (1 - m.lag)));
				if (grow <= 0) continue;
				const rise = (m.startY - newTop + SYMBOL_SIZE) * (0.55 * grow + 0.75 * disperse);
				const y = m.startY - rise;
				const scale = grow * (1 + 0.5 * disperse);
				const dx = m.x + m.drift * disperse * SYMBOL_SIZE;
				// fully opaque while covered, thinning only once it is leaving
				const alpha = (1 - disperse) ** 1.3;
				g.circle(cx + dx, y, m.r * scale);
				g.fill({ color: 0x2d6c8f, alpha: alpha * 0.92 });
				// a brighter core offset upward — what makes a flat circle read as a
				// volume, and upward because the light source in this fiction is the
				// thing rising
				g.circle(cx + dx, y - m.r * scale * 0.24, m.r * scale * 0.58);
				g.fill({ color: 0xa9e8ff, alpha: alpha * 0.8 });
			}

			// the band the new cells land in, filled solid under the plume so no
			// seam can open between motes at the moment of the reshape
			if (disperse < 0.5) {
				g.rect(left, newTop, SYMBOL_SIZE, oldTop - newTop + SYMBOL_SIZE * 0.2);
				g.fill({ color: 0x2d6c8f, alpha: plume * (1 - disperse * 2) * 0.95 });
			}
		}
	};

	// --- the markers letting go ---------------------------------------------
	const drawLift = (g: PixiGraphics) => {
		g.clear();
		if (liftClock < 0 || lifting.length === 0) return;
		const p = Math.min(1, liftClock / LIFT_MS);

		for (const mark of lifting) {
			const rows = stateGame.growRows[mark.reel] ?? BASE_ROWS;
			const cx = getSymbolX(mark.reel);
			// padded row -> the cell's centre inside this reel's own window
			const cy = reelYOffset(rows) + (mark.row - 0.5) * SYMBOL_SIZE;
			const rise = SYMBOL_SIZE * 1.5 * easeOut(p);
			const alpha = (1 - p) ** 1.5;

			// the trail it leaves — a stretched streak, because in low gravity the
			// thing that reads is elongation, not a spark
			g.rect(cx - 3, cy - rise, 6, rise);
			g.fill({ color: 0x9ce9ff, alpha: alpha * 0.45 });
			// the marker itself, opening as it goes
			g.circle(cx, cy - rise, SYMBOL_SIZE * (0.16 + 0.22 * p));
			g.fill({ color: 0xd8f6ff, alpha: alpha * 0.9 });
		}
	};

	const runClock = () => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const step = (now: number) => {
			clock = now - t0;
			if (clock < TOTAL_MS + FULL_BOARD_HOLD_MS) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	const runLiftClock = () => {
		cancelAnimationFrame(liftRaf);
		const t0 = performance.now();
		const step = (now: number) => {
			liftClock = now - t0;
			if (liftClock < LIFT_MS) liftRaf = requestAnimationFrame(step);
		};
		liftRaf = requestAnimationFrame(step);
	};

	/**
	 * Reshape the board and settle the new symbols in. This is what actually
	 * applies the stretch, and it runs while the plume has the reel covered.
	 *
	 * Goes through enhancedBoard.settle rather than writing into reelState
	 * directly: utils-slots owns the symbol array and its indices, and splicing
	 * two entries into the middle of one would leave every symbol below them
	 * laid out against the wrong index. settle is the sanctioned way to hand it a
	 * whole board, and it is the same call the resume path makes.
	 */
	const applyGrowth = (rows: number[], newCells: { reel: number; row: number; symbol: SymbolName }[]) => {
		const board = stateGameDerived.boardRaw().map((reel) => [...reel]) as RawSymbol[][];
		for (const cell of newCells) {
			const column = board[cell.reel];
			if (!column) continue;
			// spliced, not appended: a padded reel is [topPad, ...rows, bottomPad]
			// and a new cell belongs inside that, above the bottom padding. newCells
			// arrives in ascending row order per reel, so each splice lands after the
			// one before it and the padding stays last.
			column.splice(cell.row, 0, { name: cell.symbol });
		}
		stateGame.growRows = [...rows];
		stateGameDerived.enhancedBoard.settle(board);
	};

	context.eventEmitter.subscribeOnMount({
		growMarkersLift: async ({ markers }) => {
			if (markers.length === 0) return;
			lifting = markers;
			liftClock = 0;
			runLiftClock();
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			await waitForTimeout(LIFT_MS);
			lifting = [];
			liftClock = -1;
		},

		reelsGrow: async ({ rows, newCells, multipliers, steps, full: isFull }) => {
			const mine = ++generation;
			growingFrom = stateGame.growRows.map((r) => r ?? BASE_ROWS);
			growingTo = [...rows];
			clock = 0;
			runClock();

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_explosion_b' });
			await waitForTimeout(SURGE_MS);

			// The plume is closing. Wait for it to cover the reel before touching the
			// board.
			await waitForTimeout(PLUME_MS);
			if (mine !== generation) return;

			// Fully covered. Reshape here and the player never sees it happen.
			applyGrowth(rows, newCells);
			stateGame.growMultipliers = [...multipliers];
			stateGame.growSteps = steps;
			if (isFull) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
			}
			await waitForTimeout(HOLD_MS);

			await waitForTimeout(DISPERSE_MS);
			if (mine !== generation) return;
			if (isFull) await waitForTimeout(FULL_BOARD_HOLD_MS);
			growingFrom = [];
			growingTo = [];
			clock = -1;
		},

		reelGrowClear: () => {
			generation += 1;
			cancelAnimationFrame(raf);
			cancelAnimationFrame(liftRaf);
			growingFrom = [];
			growingTo = [];
			lifting = [];
			clock = -1;
			liftClock = -1;
		},
	});
</script>

<BoardContainer>
	<Container>
		<Graphics {draw} />
		<Graphics draw={drawLift} />
	</Container>
</BoardContainer>

<!--
	MAX_ROWS is the box every offset above is measured against; referenced so a
	future edit that changes it cannot leave this file silently laying out against
	a different board.
-->
{#if false}{MAX_ROWS}{/if}

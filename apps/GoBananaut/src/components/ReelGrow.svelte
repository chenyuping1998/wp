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
	import { Graphics, Container, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { getContext } from '../game/context';
	import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, MAX_ROWS, BASE_ROWS, NUM_REELS, reelYOffset } from '../game/constants';
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
	// ONE CELL AT A TIME, and that is the whole shape of this animation.
	//
	// A spin can earn several steps at once, and the first version spent them in a
	// single reshape under one plume: the board went from 4-4-4-4-4 to 6-5-4-4-4
	// on one frame and the player was told only the result. The mechanic is a
	// COUNT — one marker, one row — so the animation has to be a count too, or the
	// arithmetic the whole game is built on is invisible.
	//
	// Each cell gets its own four beats, and the cover is over that ONE cell's
	// band rather than the whole reel. A reel-wide plume was right when the reshape
	// was reel-wide; here it would hide four rows that are not changing.
	//
	//   REACH   a bright line pushes up out of the reel's current top edge into
	//           the empty space the new row will occupy
	//   COVER   motes close over that one cell's band
	//   HOLD    covered — the single cell is spliced in here, unseen
	//   SETTLE  the motes rise away, leaving the reel one row taller
	//
	// REWEIGHTED TOWARDS SETTLE. The split was 150/110/70/200, which spent 49% of
	// the step getting ready and left the shutter 270ms to make its climb in —
	// less than that once the run compresses. SETTLE is the only phase anything is
	// VISIBLE moving in: the cover is opening, the new row is arriving and the
	// shutter is seating, all of it in that window. The total is unchanged, so
	// nothing downstream shifts; the time just moved to where the event is.
	const REACH_MS = 120;
	const COVER_MS = 95;
	const HOLD_MS = 60;
	const SETTLE_MS = 255;
	const STEP_MS = REACH_MS + COVER_MS + HOLD_MS + SETTLE_MS;
	// What the shutter has to travel in: everything from the splice to the end of
	// the step. Published rather than re-derived in ReelLid, so the phase weights
	// above stay the single place they are decided.
	const TRAVEL_MS = HOLD_MS + SETTLE_MS;

	// Ten steps at full length would be five seconds, which is a different problem
	// from the one this solves. Past three, each step gets quicker — the count is
	// still legible, it just stops being a ceremony.
	const runScale = (n: number) => (n <= 3 ? 1 : Math.max(0.42, 3.2 / n));

	// AND THE RUN HAS A SHAPE, which is most of what "it does not feel natural"
	// was. Every step used to be the identical length, so six rows arrived as six
	// evenly spaced clicks — a metronome, and a metronome is the one rhythm
	// nothing alive produces. It also meant the last row, the one that finishes
	// the reel, was indistinguishable from the third.
	//
	// So the run accelerates and then LANDS: each step is a little quicker than
	// the one before it, and the final step gets its full length back with a
	// quarter more on top. That is the shape of a drum fill, and it is the shape
	// for the same reason — it tells you the count is ending before it ends.
	const stepShape = (i: number, n: number) => {
		if (n === 1) return 1;
		if (i === n - 1) return 1.25;
		return 1 - 0.35 * (i / Math.max(1, n - 2));
	};

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

	// The cell currently growing: which reel, and the band it is opening into.
	// Null between steps and outside a stretch.
	let step = $state<{ reel: number; top: number; bottom: number } | null>(null);
	let clock = $state(-1);
	let stepMs = $state(STEP_MS);
	let liftClock = $state(-1);
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

	// Seeded off the reel and the band's own position, so each cell's cluster is
	// stable for its whole step and two cells on the same reel do not get the
	// identical cloud.
	const motesOf = (reel: number, bandTop: number) =>
		Array.from({ length: MOTES_PER_REEL }, (_, i) => {
			const k = Math.round(bandTop / SYMBOL_SIZE);
			const r1 = hash(reel + k * 7, i, 1);
			const r2 = hash(reel + k * 7, i, 2);
			const r3 = hash(reel + k * 7, i, 3);
			return {
				x: (r1 - 0.5) * SYMBOL_SIZE * 0.78,
				// At least a third of a cell, so the cluster closes over the column
				// rather than leaving gaps down the edges for the change to show
				// through. The cover has to be total or the reshape is visible.
				r: SYMBOL_SIZE * (0.34 + 0.26 * r2),
				// each mote rises at its own rate, so the cloud does not travel as one
				// object
				lag: r3 * 0.3,
				drift: (r2 - 0.5) * 0.5,
			};
		});

	const easeOut = (t: number) => 1 - (1 - t) ** 2;

	// --- the x2 plate ---------------------------------------------------------
	//
	// The wash and edge light below already say "these reels are doubling", and
	// they say it well enough to READ but not well enough to be UNDERSTOOD: a
	// cyan column is a thing a player has to be told the meaning of once. The
	// plate states the number, and after that the wash carries it.
	//
	// GATED ON THE MULTIPLIER THE MATHS SENT, never on the row count, and that
	// distinction is the reason this is worth writing down:
	//
	//   · a reel doubles as soon as it stands ABOVE the baseline — at FIVE rows
	//     already, not only at six. Half the ladder's rungs are five-row reels
	//     (steps 1, 3, 5, 7, 9 each take a reel from 4 to 5), so a plate that
	//     only appeared at six would be missing from a doubling reel about half
	//     the time the feature is running.
	//   · the doubling is FREE SPINS ONLY. growMultipliers arrives from the book
	//     and is all 1s in the base game, so a base-game reel stretched to six
	//     correctly gets no plate — which a row-count test would have got wrong
	//     in the other direction, promising a double the maths does not pay.
	//
	// Both of those are already true of stateGame.growMultipliers, which is the
	// same array the ways figure on screen is built from. Deriving the plate from
	// anything else is how the badge and the payout start disagreeing.
	const DOUBLE_TINT = 0x8fe4ff;
	const BADGE_W = SYMBOL_SIZE * 0.52;
	const BADGE_H = SYMBOL_SIZE * 0.3;

	// Centred ON the reel's top edge rather than inside it. Half of the plate
	// hangs above the reel, into the frame's inner bevel on a full-height reel and
	// onto the shutter's brass sill on a five-row one — which is where a plate
	// bolted to the top of a door would actually be, and it halves how much of the
	// topmost symbol is covered.
	//
	// The reels grow to different heights, so these sit at different heights too:
	// the plates step down from reel 1 exactly as the skyline does, which is the
	// progress meter this board deliberately has instead of a counter UI.
	const badges = $derived.by(() => {
		const mult = stateGame.growMultipliers;
		const out: { reel: number; cx: number; cy: number; label: string }[] = [];
		for (let reel = 0; reel < NUM_REELS; reel++) {
			const m = mult[reel] ?? 1;
			if (m <= 1) continue;
			const rows = stateGame.growRows[reel] ?? BASE_ROWS;
			out.push({
				reel,
				cx: getSymbolX(reel),
				cy: reelYOffset(rows),
				// 'x2', not the multiplication sign: the plate is set in Titan One and
				// U+00D7 is not in that face's subset, so it would arrive from a
				// fallback and sit at a different weight from the numeral beside it.
				label: `x${m}`,
			});
		}
		return out;
	});

	/** A chamfered plate per doubling reel. Text is drawn over it in the markup. */
	const drawBadges = (g: PixiGraphics) => {
		g.clear();
		for (const badge of badges) {
			const x = badge.cx - BADGE_W / 2;
			const y = badge.cy - BADGE_H / 2;
			const c = BADGE_H * 0.3;
			const plate = () => {
				g.moveTo(x + c, y);
				g.lineTo(x + BADGE_W - c, y);
				g.lineTo(x + BADGE_W, y + c);
				g.lineTo(x + BADGE_W, y + BADGE_H - c);
				g.lineTo(x + BADGE_W - c, y + BADGE_H);
				g.lineTo(x + c, y + BADGE_H);
				g.lineTo(x, y + BADGE_H - c);
				g.lineTo(x, y + c);
				g.closePath();
			};
			// a soft halo, so the plate sits in the same light as the column under it
			// rather than looking pasted on
			g.roundRect(x - 5, y - 5, BADGE_W + 10, BADGE_H + 10, BADGE_H * 0.5);
			g.fill({ color: DOUBLE_TINT, alpha: 0.1 });
			plate();
			g.fill({ color: 0x081620, alpha: 0.95 });
			plate();
			g.stroke({ width: 2, color: DOUBLE_TINT, alpha: 0.9 });
			// lit top lip: the plate is a physical thing under the board's own light
			g.rect(x + c, y + 2, BADGE_W - c * 2, 1.5);
			g.fill({ color: 0xffffff, alpha: 0.35 });
		}
	};

	const draw = (g: PixiGraphics) => {
		g.clear();

		// --- the doubling, drawn always ------------------------------------
		// A stretched reel counts double in the free game, and that is worth far
		// more than the extra rows are. It is STATE, not a moment, so it is a
		// standing light rather than anything that plays: the player has to be able
		// to look at the board at any time and see which reels are doubling.
		//
		// DRAWN PER RUN, NOT PER REEL, and that is the whole of this rewrite. It
		// used to put a hard 4px bar down BOTH sides of every doubling reel, so two
		// adjacent doubling reels — which is what the ladder produces, since growth
		// is depth first and fills reel 1 before reel 2 — stacked two bars into an
		// 8px cyan stripe between them. On screen that reads as a blue BORDER
		// somebody drew around the reels, not as those reels being worth double.
		//
		// A run gets one light down each of its outer edges, and a wash across the
		// whole run. The wash is what carries the meaning — the column is lit — and
		// the edges only give it a boundary.
		const mult = stateGame.growMultipliers;
		let runStart = -1;
		for (let reel = 0; reel <= NUM_REELS; reel++) {
			const on = reel < NUM_REELS && (mult[reel] ?? 1) > 1;
			if (on && runStart < 0) runStart = reel;
			if (on || runStart < 0) continue;

			// the run is [runStart, reel - 1]
			const first = runStart;
			const last = reel - 1;
			runStart = -1;

			// Each reel keeps its own window: a run can straddle reels of different
			// heights, and a wash drawn to the tallest would spill over the shutter
			// standing on the shorter one.
			for (let r = first; r <= last; r++) {
				const rows = stateGame.growRows[r] ?? BASE_ROWS;
				const top = reelYOffset(rows);
				const height = SYMBOL_SIZE * rows;
				const cx = getSymbolX(r);
				g.rect(cx - SYMBOL_SIZE / 2, top, SYMBOL_SIZE, height);
				g.fill({ color: 0x8fe4ff, alpha: 0.07 });
			}

			// and one edge down each side of the run, softened over a few steps so
			// it reads as light coming off the column rather than as a drawn line
			for (const [edgeReel, side] of [
				[first, -1],
				[last, 1],
			] as const) {
				const rows = stateGame.growRows[edgeReel] ?? BASE_ROWS;
				const top = reelYOffset(rows);
				const height = SYMBOL_SIZE * rows;
				const edge = getSymbolX(edgeReel) + (side * SYMBOL_SIZE) / 2;
				for (let i = 0; i < 5; i++) {
					const w = 3;
					const x = side < 0 ? edge + i * w : edge - (i + 1) * w;
					g.rect(x, top, w, height);
					g.fill({ color: 0x8fe4ff, alpha: 0.34 * (1 - i / 5) ** 1.6 });
				}
			}
		}

		if (clock < 0 || !step) return;

		const t = clock;
		const reach = Math.min(1, t / (REACH_MS * (stepMs / STEP_MS)));
		const cover =
			t < REACH_MS * (stepMs / STEP_MS)
				? 0
				: Math.min(1, (t - REACH_MS * (stepMs / STEP_MS)) / (COVER_MS * (stepMs / STEP_MS)));
		const settleAt = (REACH_MS + COVER_MS + HOLD_MS) * (stepMs / STEP_MS);
		const settle =
			t < settleAt ? 0 : Math.min(1, (t - settleAt) / (SETTLE_MS * (stepMs / STEP_MS)));

		const cx = getSymbolX(step.reel);
		const left = cx - SYMBOL_SIZE / 2;
		const band = step.bottom - step.top;

		// REACH — a line pushing up out of the reel into the space it is about to
		// occupy. It BRIGHTENS where Boomana's charge darkened: a detonation needs
		// somewhere for smoke to come from, this needs the opposite read, a column
		// being released.
		if (reach > 0 && settle === 0) {
			const headY = step.bottom - band * easeOut(reach);
			g.rect(left, headY, SYMBOL_SIZE, step.bottom - headY);
			g.fill({ color: 0x6fd4ff, alpha: 0.18 * reach });
			g.rect(left, headY - 3, SYMBOL_SIZE, 6);
			g.fill({ color: 0xd8f4ff, alpha: 0.9 * reach });
		}

		if (cover <= 0) return;

		// COVER — motes closing over this one cell. Seeded off the reel and the row
		// so a given cell's cluster is the same shape every frame of its step; a
		// cluster that re-rolls each frame boils instead of drifting.
		for (const m of motesOf(step.reel, step.top)) {
			const grow = Math.min(1, Math.max(0, (cover - m.lag) / (1 - m.lag)));
			if (grow <= 0) continue;
			const rise = band * (0.35 * grow + 1.1 * settle);
			const y = step.bottom - band * 0.5 - rise;
			const scale = grow * (1 + 0.5 * settle);
			const dx = m.x + m.drift * settle * SYMBOL_SIZE;
			const alpha = (1 - settle) ** 1.3;
			g.circle(cx + dx, y, m.r * scale);
			g.fill({ color: 0x2d6c8f, alpha: alpha * 0.92 });
			g.circle(cx + dx, y - m.r * scale * 0.24, m.r * scale * 0.58);
			g.fill({ color: 0xa9e8ff, alpha: alpha * 0.8 });
		}

		// and the band filled solid underneath, so no seam can open between motes
		// at the moment the cell is spliced in
		if (settle < 0.5) {
			g.rect(left, step.top, SYMBOL_SIZE, band);
			g.fill({ color: 0x2d6c8f, alpha: cover * (1 - settle * 2) * 0.95 });
		}
	};

	// --- the markers letting go ---------------------------------------------
	//
	// The charge itself is the PAINTED BURST (gbBurst0..7), the same eight frames
	// the transition throws at full screen. That is deliberate: a marker letting
	// go and the mascot's thrown charge are the same event at two scales, and
	// drawing them with the same art is what says so.
	//
	// Only the trail stays procedural — a sprite cannot stretch between two points
	// the way an elongating streak has to, and elongation is the thing that reads
	// as low gravity.
	const liftProgress = $derived(liftClock < 0 ? -1 : Math.min(1, liftClock / LIFT_MS));

	const markerAt = (mark: { reel: number; row: number }) => {
		const rows = stateGame.growRows[mark.reel] ?? BASE_ROWS;
		return {
			// padded row -> the cell's centre inside this reel's own window
			cx: getSymbolX(mark.reel),
			cy: reelYOffset(rows) + (mark.row - 0.5) * SYMBOL_SIZE,
		};
	};

	const drawLift = (g: PixiGraphics) => {
		g.clear();
		if (liftProgress < 0 || lifting.length === 0) return;
		const p = liftProgress;

		for (const mark of lifting) {
			const { cx, cy } = markerAt(mark);
			const rise = SYMBOL_SIZE * 1.5 * easeOut(p);
			// the trail it leaves — a stretched streak, because in low gravity the
			// thing that reads is elongation, not a spark
			g.rect(cx - 3, cy - rise, 6, rise);
			g.fill({ color: 0x9ce9ff, alpha: (1 - p) ** 1.5 * 0.45 });
		}
	};

	const runClock = (ms: number) => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const tick = (now: number) => {
			clock = now - t0;
			if (clock < ms) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
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
	 * Splice in ONE cell and raise that one reel by one row.
	 *
	 * Goes through enhancedBoard.settle rather than writing into reelState
	 * directly: utils-slots owns the symbol array and its indices, and splicing an
	 * entry into the middle of one would leave every symbol below it laid out
	 * against the wrong index. settle is the sanctioned way to hand it a whole
	 * board, and it is the same call the resume path makes.
	 *
	 * Called with the cover closed over exactly this cell's band, so the splice is
	 * never seen happening.
	 */
	const applyCell = (cell: { reel: number; row: number; symbol: SymbolName }) => {
		const board = stateGameDerived.boardRaw().map((reel) => [...reel]) as RawSymbol[][];
		const column = board[cell.reel];
		if (!column) return;
		// A padded reel is [topPad, ...rows, bottomPad] and `cell.row` is already
		// padded (game_events.py adds the offset), so this splices at the index the
		// maths named.
		//
		// The maths now names row 0 — the TOP of the reel — every time. It used to
		// append to the bottom of its own array, and with the board anchored on its
		// FOOT that meant every symbol already on the reel shifted up a row to make
		// space while the new one dropped in underneath them. Inserting at the top
		// is what makes the existing symbols hold still: their index goes up by one
		// and the reel's offset comes down by one, and the two cancel exactly.
		column.splice(cell.row, 0, { name: cell.symbol });

		const rows = [...stateGame.growRows];
		rows[cell.reel] = (rows[cell.reel] ?? BASE_ROWS) + 1;
		stateGame.growRows = rows;
		stateGameDerived.enhancedBoard.settle(board);
	};

	/**
	 * Put the freshly spliced cell into its landing state.
	 *
	 * Without this a new row simply EXISTS the moment the cover opens: every other
	 * symbol on the board arrived with a landing bounce and this one did not, so
	 * the row the whole mechanic is about was the only one that appeared by
	 * assignment. It is the cheapest single thing that makes the growth read as
	 * something arriving rather than as a number changing.
	 *
	 * It lands on the cell the maths named, which is now the reel's TOP row. When
	 * the maths appended instead, this put the bounce at the FOOT of the reel —
	 * under four symbols that had not changed — which read as the whole reel
	 * shaking a second time after it had already stopped.
	 *
	 * Guarded rather than assumed: settle() rebuilds the reel's symbol array, and
	 * a clear landing in the same tick can leave the index empty.
	 */
	const landCell = (cell: { reel: number; row: number }) => {
		const reelSymbol = stateGame.board[cell.reel]?.reelState.symbols[cell.row];
		if (reelSymbol) reelSymbol.symbolState = 'land';
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
			if (newCells.length === 0) return;

			// newCells arrives in LADDER ORDER — the maths fills each reel to the top
			// before moving right, and emits ascending rows within a reel — so walking
			// it in order is walking the ladder, and no sort is needed. A sort here
			// would be a second implementation of rows_for_steps, free to disagree
			// with it.
			const n = newCells.length;
			const run = runScale(n);

			for (let i = 0; i < n; i += 1) {
				const cell = newCells[i];
				if (mine !== generation) return;

				const scale = run * stepShape(i, n);
				stepMs = STEP_MS * scale;
				// The shutter reads this to size its own spring, so the two are one
				// mechanism at any pace rather than a lid that always takes half a
				// second regardless of how fast the board is growing.
				stateGame.growTravelMs = TRAVEL_MS * scale;

				const from = stateGame.growRows[cell.reel] ?? BASE_ROWS;
				// the band this one row opens into, directly above the reel's top edge
				const bottom = reelYOffset(from);
				step = { reel: cell.reel, top: bottom - SYMBOL_SIZE, bottom };
				clock = 0;
				runClock(stepMs);

				// THE RELEASE. Quiet on purpose — it is the upbeat, and the weight is
				// on the arrival below. See generate_audio_space.mjs.
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
				await waitForTimeout((REACH_MS + COVER_MS) * scale);
				if (mine !== generation) return;

				// covered — splice this one cell in and let the reel relayout unseen
				applyCell(cell);
				await waitForTimeout(HOLD_MS * scale);
				if (mine !== generation) return;

				// THE ARRIVAL, on the frame the cover starts to open: the shutter seats
				// and the new row is there. Pitched up one step per row, so a long run
				// climbs instead of hammering the same note ten times — capped, because
				// past about a fourth the sample stops sounding like metal.
				context.eventEmitter.broadcast({
					type: 'soundOnce',
					name: 'sfx_multiplier_up',
					rate: 1 + Math.min(i, 8) * 0.045,
				});
				// and the symbol itself lands rather than simply being there
				landCell(cell);
				await waitForTimeout(SETTLE_MS * scale);
			}

			if (mine !== generation) return;
			step = null;
			clock = -1;

			// The multiplier and the counter are set only once the whole climb is on
			// screen. Setting them per cell would make the doubling edge-light
			// flicker on mid-animation, before the row that earned it exists.
			stateGame.growRows = [...rows];
			stateGame.growMultipliers = [...multipliers];
			stateGame.growSteps = steps;

			if (isFull) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
				await waitForTimeout(FULL_BOARD_HOLD_MS);
			}
		},

		reelGrowClear: () => {
			generation += 1;
			cancelAnimationFrame(raf);
			cancelAnimationFrame(liftRaf);
			step = null;
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

		<!--
			The x2 plates, over everything else this component draws: they sit on the
			reel's top edge and must not be washed out by the doubling tint under
			them.
		-->
		<Graphics draw={drawBadges} />
		{#each badges as badge (badge.reel)}
			<Text
				anchor={0.5}
				x={badge.cx}
				y={badge.cy}
				text={badge.label}
				style={{
					fontFamily: GAME_FONT,
					fontSize: BADGE_H * 0.62,
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 0.5,
					fill: DOUBLE_TINT,
					// A dark outline rather than a glow. The plate behind it is already
					// dark and the tint is already cyan; a cyan glow on cyan type over a
					// cyan wash is three of the same thing and reads as blur.
					stroke: { color: 0x04101a, width: 3, join: 'round' as const },
				}}
			/>
		{/each}

		<!--
			The charge going off on the cell it was riding. Additive and still on its
			black ground, for the same reason the transition draws it that way: the
			burst is a light source, and keying a soft glow to alpha would destroy the
			falloff that makes it read as light.
		-->
		{#if liftProgress >= 0}
			{@const frame = Math.min(7, Math.floor(liftProgress * 8))}
			{#each lifting as mark (`${mark.reel}-${mark.row}`)}
				{@const at = markerAt(mark)}
				<Sprite
					key={`gbBurst${frame}`}
					anchor={0.5}
					x={at.cx}
					y={at.cy - SYMBOL_SIZE * 1.5 * easeOut(liftProgress)}
					width={SYMBOL_SIZE * 1.6 * (366 / 352)}
					height={SYMBOL_SIZE * 1.6}
					blendMode="add"
					alpha={(1 - liftProgress) ** 0.8}
				/>
			{/each}
		{/if}
	</Container>
</BoardContainer>

<!--
	MAX_ROWS is the box every offset above is measured against; referenced so a
	future edit that changes it cannot leave this file silently laying out against
	a different board.
-->
{#if false}{MAX_ROWS}{/if}

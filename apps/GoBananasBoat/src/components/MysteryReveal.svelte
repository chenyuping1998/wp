<script lang="ts" module>
	import type { SymbolName, Position } from '../game/types';

	export type EmitterEventMysteryReveal = {
		type: 'mysteryReveal';
		// SymbolName, not string. It is what gets written into rawSymbol.name, and
		// SymbolName is derived from the generated config — so a symbol the maths
		// starts emitting that the client has no entry for fails here rather than
		// rendering as an empty cell.
		symbol: SymbolName;
		positions: Position[];
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, SPECIAL_SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import ImpactDust from './ImpactDust.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { REVEAL_MS, RATTLE_END as MESH_RATTLE_END, HEAVE_MS } from '../game/meshWin/mReveal';

	// The tarps come off, and every crate is the same cargo.
	//
	// WHY THIS COMPONENT OWNS THE SWAP RATHER THAN THE BOOK HANDLER
	//
	// The maths sends two events: `reveal`, whose board still contains M, and
	// `mysteryReveal`, which says what they turned out to be. The gap between
	// them is the whole mechanic — the player has to see a crated board before it
	// opens — so the swap is a timed animation, not a state update, and it
	// belongs next to its timing rather than in a map of book handlers.
	//
	// THE SHAPE OF THE ANIMATION
	//
	// Each crate that opens THIS spin gets its own entry with its own start time,
	// staggered left-to-right / top-to-bottom in reading order — a wall of
	// crates popping on one frame reads as a glitch, not as cargo being
	// unloaded. Per entry: the crate rattles as the rope takes strain, the tarp
	// (the SAME gbM sprite Symbol.svelte draws for a sealed cell, at the same
	// size, so the frame before it moves and the frame it was sitting in are one
	// picture) is yanked up and off with a puff of dust, and the board's symbol swaps
	// underneath it at the moment the tarp is roughly half clear, so the cargo
	// looks like it was under the canvas the whole time rather than appearing
	// out of nowhere.
	//
	// EVERY CRATE ON THE BOARD IS ONE OF THIS SPIN'S.
	//
	// There used to be a second list on the event, `held`, carrying cells opened
	// on earlier spins of the run that were still showing the cargo — those were
	// re-stamped here silently while only this spin's crates were animated.
	// Crates no longer persist, so the event's `positions` is the whole board's
	// worth and all of it is animated.
	//
	// The board is mutated in place: reelSymbol is a $state object (see
	// utils-slots/createReelForSpinning), so assigning rawSymbol is what makes
	// the symbol on screen change. Rebuilding the board through boardSettle
	// would work too and would also restart every reel's landing animation,
	// which on a board that has already settled reads as a second spin.
	//
	// WHY THE POSITIONS COME FROM THE EVENT
	//
	// After the swap there are no M left to find. Anything that re-scans the
	// board to work out what to animate gets an empty list on the second call
	// and, worse, gets it silently. The event's list is the only record.

	const context = getContext();
	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE — same convention the
	// held-coin overlay in StickyPrizes uses, so a crate and a coin on the same
	// cell would land on the same point.
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	// Per-cell timeline, in fractions of DURATION:
	//   0 -> RATTLE_END   the crate shakes; nothing has come loose yet
	//   RATTLE_END        the rope gives: the board symbol underneath is swapped
	//                     on this exact frame, while the tarp still covers it
	//   RATTLE_END -> 1   the tarp is pulled up and off, fading and turning
	//
	// The swap is ON the frame the tarp starts to move, not partway through the
	// lift. It used to be at 0.5 — halfway up — and that was wrong: the board's
	// own Symbol.svelte keeps drawing the sealed crate until this fires, so a
	// tarp lifting off a cell that still held a crate uncovered an identical
	// crate underneath. Swapping behind cover, on the frame before anything has
	// moved, is what makes the tarp look like it was hiding the cargo.
	//
	// TURBO IS ONLY A LITTLE FASTER, NOT A DIFFERENT ANIMATION.
	//
	// It used to be 170/22 — nearly three times the speed — which is what turbo
	// does to a spin, and it is the wrong rule for this one. The reveal is the
	// thing the player is here to watch: it is the moment the cargo is named,
	// and at 170ms with a 22ms stagger the whole board came off in one frame and
	// the crates simply cut to symbols. Turbo should shorten the WAITING, not
	// the payoff.
	//
	// So it keeps the same shape at about 80% of the length: still a rattle,
	// still a stagger you can read left to right, just tighter.
	// THE TARP IS A MESH (game/meshWin/mReveal.ts). It strains against its
	// ropes, is yanked up by the knot — the top of the canvas stretching toward
	// the pull before the rest follows — and flies off turning. It used to be the
	// whole M tile, steel panel and all, shaken, lifted and squashed, which read
	// as a floor tile flying away. Only the tarp moves now; what it uncovers is
	// the new symbol's own tile. The timeline below is unchanged, and the mesh
	// plays it: DURATION is its length, RATTLE_END the frame the rope gives.
	const DURATION = REVEAL_MS;
	const DURATION_TURBO = 380;
	// THE STAGGER IS PER REEL, NOT PER CRATE, and that is the whole shape of this
	// animation.
	//
	// Crates arrive in STACKS — the strips place them in runs of two to four and
	// the maths pads any lone one (pad_lone_crates), so what lands is columns of
	// cargo, not scattered lids. Opening them cell by cell was fighting that:
	// twenty cells is twenty beats, and at 70ms each that is 1.4 seconds of tarps
	// before the win can even be read, eight times a feature. The previous fix
	// was to shrink the gap as the batch grew, which kept the length down and
	// turned a big board into a blur.
	//
	// A column at a time fixes both. A full board is FIVE beats instead of
	// twenty, so the gap can stay at its full width and still finish sooner; and
	// a whole reel's stack coming off together is what unloading a ship actually
	// looks like. The count now sets how MUCH happens, not how fast.
	const STAGGER = 110;
	const STAGGER_TURBO = 78;
	// Inside a column the tarps still peel top-down rather than lifting as one
	// rigid slab. Small enough that the column still reads as one event.
	const ROW_LAG = 34;
	const ROW_LAG_TURBO = 22;
	const RATTLE_END = MESH_RATTLE_END;

	// ── FULL SHIPMENT: THE HEAVE, THEN A CRESCENDO (2026-10-02) ───────────────
	//
	// When the board that stops is ALL crates (FullShipment's beat fires first,
	// while the reels are still spinning), the unload does not start straight
	// away. Every tarp HEAVES twice first (mReveal.ts M_HEAVE) — the cargo
	// shoving under the cloth — rolling across the board a reel at a time; then
	// the columns are pulled with the gap SHRINKING each time, so five pulls
	// read as one accelerating phrase rather than five equal beats.
	const HEAVE_WAVE = 55;
	const FULL_GAPS = [150, 122, 96, 74];
	let fullNext = false;
	const speed_ = () => (stateBet.isTurbo ? 0.78 : 1);
	type Heave = { reel: number; row: number; bornAt: number };
	let heaves = $state<Heave[]>([]);

	// NO WIN-STYLE HIGHLIGHT WHEN THE CARGO IS NAMED.
	//
	// There was a pass here that lit the opened cells with a warm band travelling
	// left to right, to say the thing the reveal never says out loud: every crate
	// on a board holds the SAME symbol. It was removed, and the reason is worth
	// keeping so it does not come back a third time.
	//
	// It looked like a win. This board already has a language for "these cells
	// paid" — WinWays dims the losers and frames the winners, and SymbolWinAnim
	// pulses the tiles — and a warm sweep over freshly opened cells is close
	// enough to that to be read as a payout that is not there. The same mistake
	// in a different place cost a per-symbol motion pass earlier in this game's
	// history.
	//
	// The stacks and the shared symbol are legible from the board itself. The
	// reveal's job is to open the crates.

	type RevealEntry = {
		reel: number;
		row: number;
		bornAt: number;
		durationMs: number;
		swapped: boolean;
	};

	type DustPuff = { id: number; reel: number; row: number };

	let entries = $state<RevealEntry[]>([]);
	// Each swap spawns one ImpactDust instance, which manages its own lifetime
	// and removes itself via oncomplete — same idiom ReelDust uses for a reel's
	// landing puff. This array only tracks WHICH cells currently have one on
	// screen, not their animation state.
	let dustPuffs = $state<DustPuff[]>([]);
	let nextDustId = 0;
	let clock = $state(0);
	let rafId = 0;
	let loopRunning = false;



	// One rAF loop drives every crate currently in flight, the same shape
	// StickyPrizes uses for its landing shake — cheaper than a promise chain
	// per entry, and it is what lets several crates opening on different reels
	// animate independently without stepping on each other. The dust each one
	// kicks up is a separate ImpactDust instance with its own lifetime (see
	// dustPuffs below), not something this loop has to drive too.
	const ensureLoop = () => {
		if (loopRunning) return;
		loopRunning = true;
		const tick = (now: number) => {
			clock = now;
			for (const entry of entries) {
				if (entry.swapped) continue;
				if ((now - entry.bornAt) / entry.durationMs < RATTLE_END) continue;
				entry.swapped = true;
				const reelSymbol = context.stateGame.board[entry.reel]?.reelState.symbols[entry.row];
				if (reelSymbol) {
					reelSymbol.rawSymbol = { ...reelSymbol.rawSymbol, name: pendingSymbol };
				}
				dustPuffs = [...dustPuffs, { id: nextDustId++, reel: entry.reel, row: entry.row }];
			}
			entries = entries.filter((entry) => now - entry.bornAt < entry.durationMs);
			if (entries.length > 0) {
				rafId = requestAnimationFrame(tick);
			} else {
				loopRunning = false;
			}
		};
		rafId = requestAnimationFrame(tick);
	};

	onDestroy(() => cancelAnimationFrame(rafId));

	// Set for the run of the current batch, read by the rAF loop above. A field
	// on the entry would work too, but every entry in one batch always reveals
	// the same symbol (see the maths' assign_mystery_symbols — one draw per
	// board), so one shared value is simpler and cannot drift between entries.
	let pendingSymbol: SymbolName = 'L1';

	const crateState = (entry: RevealEntry) => {
		// the strain, the yank and the flight are the mesh's (mReveal.ts); this
		// only fades the tarp through the second half of its flight
		const p = Math.max(0, Math.min(1, (clock - entry.bornAt) / entry.durationMs));
		if (p < RATTLE_END) return { alpha: 1 };
		const liftT = (p - RATTLE_END) / (1 - RATTLE_END);
		return { alpha: liftT < 0.5 ? 1 : 1 - (liftT - 0.5) / 0.5 };
	};


	context.eventEmitter.subscribeOnMount({
		fullShipment: () => {
			fullNext = true;
		},
		mysteryReveal: async (event) => {
			if (event.positions.length === 0) return;
			pendingSymbol = event.symbol;
			const full = fullNext;
			fullNext = false;

			const durationMs = stateBet.isTurbo ? DURATION_TURBO : DURATION;

			const stagger = stateBet.isTurbo ? STAGGER_TURBO : STAGGER;
			const rowLag = stateBet.isTurbo ? ROW_LAG_TURBO : ROW_LAG;

			// Grouped into columns, left to right, each column's cells top to
			// bottom. See the note on STAGGER — the beat is the reel, not the cell.
			const byReel = new Map<number, number[]>();
			for (const position of event.positions) {
				const rows = byReel.get(position.reel);
				if (rows) rows.push(position.row);
				else byReel.set(position.reel, [position.row]);
			}
			const columns = [...byReel.entries()]
				.sort((a, b) => a[0] - b[0])
				.map(([reel, rows]) => ({ reel, rows: rows.sort((a, b) => a - b) }));

			// Rope taking the load, under the rattle — see design/generate_audio_jungle.
			// This used to be `sfx_multiplier_update`, a marimba ding written for a
			// multiplier re-roll, which made the reveal sound like a menu.
			context.eventEmitter.broadcast({ type: 'soundCrateStrain' });
			// The housing rattles once for the whole batch, scaled by how many
			// REELS are opening — one column is a tap, the whole board is a slam.
			// Scaled by reels rather than by cells and no longer capped: the cap
			// was at seven crates, which meant a full board of twenty landed with
			// exactly the weight of a small one.
			context.eventEmitter.broadcast({
				type: 'boardFrameImpact',
				strength: 0.15 + 0.17 * columns.length,
			});

			// the heave first, on a full board
			const speed = speed_();
			if (full) {
				const h0 = performance.now();
				heaves = columns.flatMap((column, index) =>
					column.rows.map((row) => ({ reel: column.reel, row, bornAt: h0 + index * HEAVE_WAVE * speed })),
				);
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.5 });
				await waitForTimeout((HEAVE_MS + (columns.length - 1) * HEAVE_WAVE) * speed);
				heaves = [];
			}

			// when each column is pulled: an even beat, or on a full board the
			// shrinking gaps
			const gapBefore = (i: number) =>
				i === 0 ? 0 : full ? FULL_GAPS[Math.min(i - 1, FULL_GAPS.length - 1)] * speed : stagger;
			const columnAt: number[] = [];
			for (let i = 0, at = 0; i < columns.length; i++) columnAt.push((at += gapBefore(i)));

			const start = performance.now();
			entries = [
				...entries,
				...columns.flatMap((column, index) =>
					column.rows.map((row, rowIndex) => ({
						reel: column.reel,
						row,
						bornAt: start + columnAt[index] + rowIndex * rowLag,
						durationMs,
						swapped: false,
					})),
				),
			];
			ensureLoop();

			for (let i = 0; i < columns.length; i++) {
				// One pull per COLUMN, on its own beat. Pitched by its place in the
				// run, so a five-reel board is a rising phrase — which is the one
				// thing that tells a big unload from a small one by ear.
				await waitForTimeout(gapBefore(i));
				context.eventEmitter.broadcast({ type: 'soundTarpPull', step: i });
			}

			// Ride out the last column's own animation before the cargo call. The
			// last column starts (columns-1)*stagger in and its own last row a
			// further rowLag after that; clamped at zero because with enough
			// columns the batch outlasts one tarp's animation, and a negative wait
			// does not return early, it throws.
			const lastColumn = columns[columns.length - 1];
			const tail = (lastColumn.rows.length - 1) * rowLag;
			await waitForTimeout(
				Math.max(0, durationMs + tail - columnAt[columns.length - 1]),
			);

		},
	});
</script>

<BoardContainer>
	<!-- Full Shipment: the heave, on every crate, before the pulls -->
	{#each heaves as heave (`h${heave.reel},${heave.row}`)}
		<Container x={getSymbolX(heave.reel)} y={rowCenterY(heave.row)}>
			<SymbolMeshWin
				heave
				symbolName="M"
				width={SYMBOL_SIZE * SPECIAL_SYMBOL_SIZE}
				height={SYMBOL_SIZE * SPECIAL_SYMBOL_SIZE}
				speed={1 / speed_()}
				delay={Math.max(0, heave.bornAt - performance.now())}
			/>
		</Container>
	{/each}
	{#each entries as entry (`${entry.reel},${entry.row}`)}
		{@const s = crateState(entry)}
		{#if s.alpha > 0.01}
			<Container x={getSymbolX(entry.reel)} y={rowCenterY(entry.row)} alpha={s.alpha}>
				<!--
					The tarp, cut off gbM at SPECIAL_RATIOS like Symbol.svelte draws
					it, so at rest it lies exactly on the crate the board is showing
					and the frame before it moves is one picture with the cell.
				-->
				<SymbolMeshWin
					reveal
					symbolName="M"
					width={SYMBOL_SIZE * SPECIAL_SYMBOL_SIZE}
					height={SYMBOL_SIZE * SPECIAL_SYMBOL_SIZE}
					speed={DURATION / entry.durationMs}
					delay={Math.max(0, entry.bornAt - performance.now())}
				/>
			</Container>
		{/if}
	{/each}

	{#each dustPuffs as puff (puff.id)}
		<ImpactDust
			x={getSymbolX(puff.reel)}
			y={rowCenterY(puff.row)}
			oncomplete={() => (dustPuffs = dustPuffs.filter((p) => p.id !== puff.id))}
		/>
	{/each}
</BoardContainer>

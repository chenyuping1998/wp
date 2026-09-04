<script lang="ts" module>
	import type { SymbolName, Position } from '../game/types';

	export type EmitterEventMysteryReveal = {
		type: 'mysteryReveal';
		held: Position[];
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
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import { drawCrateFace } from '../game/crateArt';
	import BoardContainer from './BoardContainer.svelte';
	import ImpactDust from './ImpactDust.svelte';

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
	// (the same shape Symbol.svelte draws for a sealed cell — see crateArt.ts)
	// is yanked up and off with a puff of dust, and the board's symbol swaps
	// underneath it at the moment the tarp is roughly half clear, so the cargo
	// looks like it was under the canvas the whole time rather than appearing
	// out of nowhere.
	//
	// THE HOLD IS APPLIED WITHOUT ANIMATION.
	//
	// `held` carries every cell the run has already opened, including the ones
	// this spin just added. Those older cells are re-stamped silently: the maths
	// re-stamps them on every spin (assign_mystery_symbols), so after a fresh
	// reveal the board would otherwise show whatever the strips happened to land
	// there. Only `positions` — this spin's crates — is animated.
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
	//   0    -> RATTLE_END   the crate shakes; nothing has come loose yet
	//   RATTLE_END -> 1      the tarp is pulled up and off, fading and turning
	//   SWAP_AT               the board symbol underneath is swapped — placed at
	//                         the point the tarp is roughly half gone, so the
	//                         cargo looks uncovered rather than conjured
	const DURATION = 460;
	const DURATION_TURBO = 170;
	const STAGGER = 70;
	const STAGGER_TURBO = 22;
	const RATTLE_END = 0.22;
	const SWAP_AT = 0.5;

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

	const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

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
				const p = (now - entry.bornAt) / entry.durationMs;
				if (p < SWAP_AT) continue;
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
		const p = Math.max(0, Math.min(1, (clock - entry.bornAt) / entry.durationMs));
		if (p < RATTLE_END) {
			// RATTLE: decaying jitter, nothing has lifted yet
			const shakeT = p / RATTLE_END;
			const amp = SYMBOL_SIZE * 0.02 * (1 - shakeT);
			return {
				x: Math.sin(shakeT * 26) * amp,
				y: Math.cos(shakeT * 19) * amp * 0.6,
				rot: 0,
				scaleY: 1,
				alpha: 1,
			};
		}
		// LIFT: the tarp rides up and off, shrinking in Y as if being yanked by
		// one corner, rotating slightly, fading through the second half
		const liftT = (p - RATTLE_END) / (1 - RATTLE_END);
		const eased = easeOutCubic(liftT);
		return {
			x: eased * SYMBOL_SIZE * 0.3,
			y: -eased * SYMBOL_SIZE * 0.55,
			rot: eased * 0.5,
			scaleY: 1 - eased * 0.75,
			alpha: liftT < 0.5 ? 1 : 1 - (liftT - 0.5) / 0.5,
		};
	};

	const drawTarp = (g: PixiGraphics) => drawCrateFace(g, SYMBOL_SIZE * 0.86);

	context.eventEmitter.subscribeOnMount({
		mysteryReveal: async (event) => {
			// The hold first, silently — see the note above.
			for (const position of event.held) {
				const reelSymbol =
					context.stateGame.board[position.reel]?.reelState.symbols[position.row];
				if (!reelSymbol) continue;
				reelSymbol.rawSymbol = { ...reelSymbol.rawSymbol, name: event.symbol };
			}

			if (event.positions.length === 0) return;
			pendingSymbol = event.symbol;

			const stagger = stateBet.isTurbo ? STAGGER_TURBO : STAGGER;
			const durationMs = stateBet.isTurbo ? DURATION_TURBO : DURATION;

			// Reading order — left to right, top to bottom — so several crates
			// opening at once read as cargo being unloaded down the line rather
			// than as a scattershot pop.
			const ordered = [...event.positions].sort((a, b) => a.reel - b.reel || a.row - b.row);

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
			// The housing rattles once for the whole batch, scaled by how many
			// crates are opening — one crate is a tap, half the board is a slam.
			context.eventEmitter.broadcast({
				type: 'boardFrameImpact',
				strength: 0.15 + Math.min(0.5, ordered.length * 0.08),
			});

			const start = performance.now();
			entries = [
				...entries,
				...ordered.map((position, index) => ({
					reel: position.reel,
					row: position.row,
					bornAt: start + index * stagger,
					durationMs,
					swapped: false,
				})),
			];
			ensureLoop();

			for (let i = 0; i < ordered.length; i++) {
				// One click per crate, on its own beat, rather than a chord — see
				// the stagger above.
				await waitForTimeout(i === 0 ? 0 : stagger);
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			}
			// Ride out the last entry's own animation before handing back — the
			// win read that follows has to see the board fully settled.
			await waitForTimeout(durationMs - (ordered.length - 1) * stagger);
		},
	});
</script>

<BoardContainer>
	{#each entries as entry (`${entry.reel},${entry.row}`)}
		{@const s = crateState(entry)}
		{#if s.alpha > 0.01}
			<Container
				x={getSymbolX(entry.reel) + s.x}
				y={rowCenterY(entry.row) + s.y}
				rotation={s.rot}
				scale={{ x: 1, y: s.scaleY }}
				alpha={s.alpha}
			>
				<Graphics draw={drawTarp} />
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

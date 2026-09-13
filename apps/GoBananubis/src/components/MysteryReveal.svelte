<script lang="ts" module>
	import type { SymbolName, Position } from '../game/types';

	export type EmitterEventMysteryReveal = {
		type: 'mysteryReveal';
		held: (Position & { mult: number })[];
		// SymbolName, not string. It is what gets written into rawSymbol.name, and
		// SymbolName is derived from the generated config - so a symbol the maths
		// starts emitting that the client has no entry for fails here rather than
		// rendering as an empty cell.
		symbol: SymbolName;
		positions: Position[];
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import ImpactDust from './ImpactDust.svelte';

	// The sealed tablets crack open, and every one of them is the same symbol.
	//
	// WHY THIS COMPONENT OWNS THE SWAP RATHER THAN THE BOOK HANDLER
	//
	// The maths sends two events: `reveal`, whose board still contains M, and
	// `mysteryReveal`, which says what they turned out to be. The gap between
	// them is the whole mechanic — the player has to see a sealed board before
	// it opens — so the swap is a timed animation, not a state update, and it
	// belongs next to its timing rather than in a map of book handlers.
	//
	// THE SHAPE OF THE ANIMATION
	//
	// Built to the same plan as Go Bananas Boat's crate reveal, and deliberately
	// NOT the same motion. A tarp is light and gets yanked UP and away; a stone
	// slab breaks in two and the halves FALL. Same beats, opposite gravity —
	// which is most of what makes the two games feel like different games rather
	// than one game in two costumes.
	//
	// Per tablet: it shudders as the seal strains, the seal gives, and the two
	// halves tip apart and drop out of frame while gold sand pours from the
	// break (ImpactDust — the same puff a reel throws on landing, whose sandy
	// palette is already the right colour here). Several tablets on one board
	// are staggered in reading order; a whole board cracking on one frame reads
	// as a glitch rather than as seals giving way.
	//
	// WHEN THE SYMBOL UNDERNEATH CHANGES
	//
	// On the frame the halves START to move, not partway through the fall. The
	// tablet is still exactly covering its cell at that instant, so the swap
	// happens behind cover and what the halves uncover as they fall is the cargo
	// that was always under them. Swapping later leaves an intact tablet sitting
	// under two separating halves — the board's own Symbol.svelte is still
	// drawing the sealed face until this fires, and it is the same face.
	//
	// The board is mutated in place: reelSymbol is a $state object (see
	// utils-slots/createReelForSpinning), so assigning rawSymbol is what makes
	// the symbol on screen change. Rebuilding the board through boardSettle
	// would work too and would also restart every reel's landing animation,
	// which on a board that has already settled reads as a second spin.
	//
	// THE HOLD IS APPLIED WITHOUT ANIMATION
	//
	// `held` carries every cell the run has already opened, this spin's included,
	// each with the multiplier it shows THIS spin. The maths re-stamps both on
	// every free spin (assign_mystery_symbols), so after a fresh reveal the board
	// would otherwise show whatever the strips landed there with no value on it.
	// They are re-stamped here silently; only `positions` — the tablets that
	// cracked on THIS spin — is animated.
	//
	// The multipliers move EVERY SPIN, high and low. That is the mechanic, not a
	// glitch: a cell showing 50x can show 2x next spin. Nothing here should try
	// to smooth or animate that transition into a climb, because it is not one.
	//
	// WHY THE POSITIONS COME FROM THE EVENT
	//
	// After the swap there are no M left to find. Anything that re-scans the
	// board to work out what to animate gets an empty list on the second call
	// and, worse, gets it silently. The event's list is the only record.

	const context = getContext();
	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE — the convention every
	// board overlay in this game uses.
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	// Per-tablet timeline, in fractions of DURATION:
	//   0 -> STRAIN_END   the tablet shudders; the seal is holding
	//   STRAIN_END        the seal gives: the symbol underneath is swapped on
	//                     this exact frame, while the halves still cover it
	//   STRAIN_END -> 1   the two halves tip apart and fall away, fading
	//
	// TURBO IS ONLY A LITTLE FASTER, NOT A DIFFERENT ANIMATION.
	//
	// It used to be 170/22 — nearly three times the speed — which is what turbo
	// does to a spin, and it is the wrong rule for this one. The seals giving way
	// is the thing the player is here to watch: it is the moment the symbol is
	// named, and at 170ms with a 22ms stagger the whole board cracked on one
	// frame and the tablets simply cut to symbols. Turbo should shorten the
	// WAITING, not the payoff.
	//
	// So it keeps the same shape at 70% of the length — the same ratio the
	// multiplier wheel in front of it uses, so turbo scales the whole tablet
	// sequence by one number rather than two: still a strain,
	// still a stagger you can read left to right, just tighter. Same numbers as
	// Go Bananas Boat's crate reveal, deliberately — the two games' reveals are
	// paced as one mechanic in two costumes.
	//
	// SLOWED AGAIN (and turbo with it). The re-roll of the held tablets now plays
	// in front of this — the wheel, then the seals — and at the old pace the two
	// ran into each other: the crack started while the last wheel was still
	// settling, so the board was doing two things at once at the exact moment
	// both of them matter. There is no part of a free spin worth hurrying more
	// than these two.
	const DURATION = 620;
	const DURATION_TURBO = 434;
	const STAGGER = 95;
	const STAGGER_TURBO = 67;
	const STRAIN_END = 0.22;

	type RevealEntry = {
		reel: number;
		row: number;
		bornAt: number;
		durationMs: number;
		swapped: boolean;
	};

	type SandPuff = { id: number; reel: number; row: number };

	// The multiplier each held cell showed on the PREVIOUS free spin. Plain state
	// rather than $state: nothing renders from it, it only decides what the
	// re-roll wheels start from.
	let lastMults = new Map<string, number>();
	// what the tablets breaking right now are hiding, applied as each one gives
	let pendingMults = new Map<string, number>();

	let entries = $state<RevealEntry[]>([]);
	// Each break spawns one ImpactDust, which manages its own lifetime and
	// removes itself via oncomplete — the idiom ReelDust uses for a reel's
	// landing puff. This array only tracks WHICH cells currently have one.
	let sandPuffs = $state<SandPuff[]>([]);
	let nextSandId = 0;
	let clock = $state(0);
	let rafId = 0;
	let loopRunning = false;

	const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

	// One rAF loop drives every tablet currently breaking. The sand each one
	// throws is a separate ImpactDust with its own lifetime, not something this
	// loop has to drive too.
	const ensureLoop = () => {
		if (loopRunning) return;
		loopRunning = true;
		const tick = (now: number) => {
			clock = now;
			for (const entry of entries) {
				if (entry.swapped) continue;
				if ((now - entry.bornAt) / entry.durationMs < STRAIN_END) continue;
				entry.swapped = true;
				const reelSymbol = context.stateGame.board[entry.reel]?.reelState.symbols[entry.row];
				if (reelSymbol) {
					reelSymbol.rawSymbol = {
						...reelSymbol.rawSymbol,
						name: pendingSymbol,
						// the multiplier arrives with the symbol, not before it
						multiplier: pendingMults.get(`${entry.reel},${entry.row}`),
					};
				}
				sandPuffs = [...sandPuffs, { id: nextSandId++, reel: entry.reel, row: entry.row }];
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

	// Set for the run of the current batch, read by the rAF loop above. Every
	// entry in one batch always reveals the same symbol (the maths draws once per
	// board — see assign_mystery_symbols), so one shared value is simpler than a
	// field per entry and cannot drift between them.
	let pendingSymbol: SymbolName = 'L1';

	const tabletState = (entry: RevealEntry) => {
		const p = Math.max(0, Math.min(1, (clock - entry.bornAt) / entry.durationMs));
		if (p < STRAIN_END) {
			// STRAIN: the seal is still holding. Decaying jitter, no break yet.
			const strainT = p / STRAIN_END;
			const amp = SYMBOL_SIZE * 0.022 * (1 - strainT);
			return {
				whole: true,
				shake: {
					x: Math.sin(strainT * 27) * amp,
					y: Math.cos(strainT * 21) * amp * 0.6,
				},
				fall: 0,
				alpha: 1,
			};
		}
		// FALL: stone, so it drops. Sideways motion eases out (the halves are
		// pushed apart once, by the break) while the vertical accelerates (they
		// are not pushed down, they are let go).
		const fallT = (p - STRAIN_END) / (1 - STRAIN_END);
		return {
			whole: false,
			shake: { x: 0, y: 0 },
			fall: fallT,
			alpha: fallT < 0.45 ? 1 : 1 - (fallT - 0.45) / 0.55,
		};
	};

	const shardOffset = (fallT: number, side: -1 | 1) => ({
		x: side * easeOutCubic(fallT) * SYMBOL_SIZE * 0.34,
		y: fallT * fallT * SYMBOL_SIZE * 0.9,
		rot: side * fallT * 0.6,
	});

	// The two halves are sprites cut from the tablet's own texture by
	// design/generate_symbols_gen2.mjs, not vector stand-ins. Each is a full-tile
	// image with the other half transparent, so both draw at the same centre and
	// the pair reassembles into the intact face pixel for pixel.
	//
	// They were vector while there was no art for the tablet. Leaving them that
	// way once the face became a painting would have meant a painted slab shedding
	// two flat-shaded pieces, on the one frame the player is looking straight at
	// it.
	const SHARD = SYMBOL_SIZE * 0.86;

	context.eventEmitter.subscribeOnMount({
		mysteryReveal: async (event) => {
			// A hold belongs to one run: a reveal outside the free game (the base
			// game's own tablets) shares nothing with the last feature's values.
			if (context.stateGame.gameType !== 'freegame') lastMults.clear();

			// ── the wheels first ────────────────────────────────────────────────
			//
			// Cells that were ALREADY open and are being given a new value this
			// spin: those are a re-roll, and MultiplierRoll draws them as one. A
			// cell opening on this spin is not in this list — its number arrives
			// with its seal breaking, which is its own moment.
			//
			// `from` COMES FROM THE LAST EVENT, NOT FROM THE BOARD.
			//
			// The first version read it off the board cell, which worked in
			// isolation and never once fired in a real game: by the time this event
			// arrives the reels have already spun, so those cells hold whatever the
			// strip landed in them and the multiplier the player was looking at a
			// second ago is gone. The overlay (HeldTablets) is what kept it on
			// screen, and that is state, not the board.
			//
			// So the previous spin's values are remembered here, which is also the
			// only record that survives a spin at all.
			const opening = new Set(event.positions.map((p) => `${p.reel},${p.row}`));
			const rerolled = event.held
				.filter((cell) => !opening.has(`${cell.reel},${cell.row}`))
				.map((cell) => ({
					reel: cell.reel,
					row: cell.row,
					from: lastMults.get(`${cell.reel},${cell.row}`) ?? 0,
					to: cell.mult,
				}))
				// EVERY open tablet spins, including the ones that land back on the
				// value they already had. A cell that stayed at 5X did not sit out
				// the draw — it was drawn again and came up 5X — and freezing it
				// while its neighbours spin says the opposite: that some cells are
				// locked and others are live. `from > 0` is only excluding cells
				// with no previous value at all, which are the ones opening on this
				// spin and get their number with their seal.
				.filter((cell) => cell.from > 0);

			// ── ORDER OF THE SPIN ───────────────────────────────────────────────
			//
			//   1. the cells already open take this spin's symbol, keeping the
			//      multiplier they were showing
			//   2. the tablets that landed this spin crack open
			//   3. only then do the open cells re-roll their multipliers
			//
			// Seal first, wheels after. The wheels used to run first, which put a
			// second and a half between a tablet landing and its seal breaking —
			// and since the overlay was already drawing it open, the break then
			// played on a cell that had been showing the answer the whole time. It
			// read as the tablet opening twice.
			context.eventEmitter.broadcast({
				type: 'heldTabletsPending',
				positions: event.positions,
			});

			// 1 — the symbol, silently, on the cells that are already open. The
			// multiplier stays at LAST spin's value: it is the wheel's job to
			// change it, and writing the answer here would hand it over early.
			for (const position of event.held) {
				if (opening.has(`${position.reel},${position.row}`)) continue;
				const reelSymbol =
					context.stateGame.board[position.reel]?.reelState.symbols[position.row];
				if (!reelSymbol) continue;
				reelSymbol.rawSymbol = {
					...reelSymbol.rawSymbol,
					name: event.symbol,
					// the spin wiped the board, so the old value has to be put back
					multiplier: lastMults.get(`${position.reel},${position.row}`) ?? position.mult,
				};
			}
			context.eventEmitter.broadcast({
				type: 'heldTabletsShow',
				symbol: event.symbol,
				cells: event.held.map((cell) => ({
					reel: cell.reel,
					row: cell.row,
					mult: lastMults.get(`${cell.reel},${cell.row}`) ?? cell.mult,
				})),
			});

			// 2 — the tablets opening this spin are stamped by the break itself, at
			// the frame the halves start to move (see ensureLoop), so nothing about
			// them is on screen before the seal gives.
			pendingMults = new Map(
				event.held
					.filter((cell) => opening.has(`${cell.reel},${cell.row}`))
					.map((cell) => [`${cell.reel},${cell.row}`, cell.mult]),
			);

			// 3 — the wheels, once the seals are done. Deferred so the sequence can
			// be read in the order it happens; runs after the crack below.
			const rollAndSettle = async () => {
				if (rerolled.length > 0) {
					await context.eventEmitter.broadcastAsync({ type: 'multiplierRoll', cells: rerolled });
				}
				for (const cell of event.held) {
					const reelSymbol =
						context.stateGame.board[cell.reel]?.reelState.symbols[cell.row];
					if (!reelSymbol) continue;
					reelSymbol.rawSymbol = {
						...reelSymbol.rawSymbol,
						name: event.symbol,
						multiplier: cell.mult,
					};
				}
				context.eventEmitter.broadcast({
					type: 'heldTabletsShow',
					symbol: event.symbol,
					cells: event.held.map((cell) => ({ reel: cell.reel, row: cell.row, mult: cell.mult })),
				});
				// What this spin ends up showing, for the next spin to roll away from.
				lastMults = new Map(event.held.map((cell) => [`${cell.reel},${cell.row}`, cell.mult]));
			};

			if (event.positions.length === 0) {
				context.eventEmitter.broadcast({ type: 'heldTabletsOpened' });
				await rollAndSettle();
				return;
			}
			pendingSymbol = event.symbol;

			const stagger = stateBet.isTurbo ? STAGGER_TURBO : STAGGER;
			const durationMs = stateBet.isTurbo ? DURATION_TURBO : DURATION;

			// Reading order — left to right, top to bottom — so several tablets
			// giving way at once read as a sequence rather than a scattershot pop.
			const ordered = [...event.positions].sort((a, b) => a.reel - b.reel || a.row - b.row);

			// Stone taking the strain, under the shudder — see
			// design/generate_audio_jungle. This used to be `sfx_multiplier_update`,
			// a marimba ding written for a multiplier re-roll, which made the reveal
			// sound like a menu.
			context.eventEmitter.broadcast({ type: 'soundSealStrain' });
			// The housing takes one knock for the whole batch, scaled by how many
			// seals are giving — one tablet is a tap, half the board is a slam.
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
				// One crack per tablet, on its own beat, rather than a chord — see
				// the stagger above.
				await waitForTimeout(i === 0 ? 0 : stagger);
				// One seal giving, pitched by its place in the run.
				context.eventEmitter.broadcast({ type: 'soundStoneCrack', step: i });
			}
			// Ride out the last tablet's own fall before handing back — the line
			// read that follows has to see the board fully settled.
			await waitForTimeout(durationMs - (ordered.length - 1) * stagger);
			// The overlay can have these cells now: the board is drawing them.
			context.eventEmitter.broadcast({ type: 'heldTabletsOpened' });

			// …and now the cells that were already open re-draw their values.
			await rollAndSettle();
		},
	});
</script>

<BoardContainer>
	{#each entries as entry (`${entry.reel},${entry.row}`)}
		{@const s = tabletState(entry)}
		{#if s.alpha > 0.01}
			{@const cx = getSymbolX(entry.reel)}
			{@const cy = rowCenterY(entry.row)}
			{#if s.whole}
				<!--
					Still sealed. Drawn as the two halves in their resting positions
					rather than as the intact face: they are cut from the tablet's own
					texture along one shared fracture (design/generate_symbols_gen2.mjs)
					so they interlock exactly, this is the same picture, and it
					means nothing has to be swapped out on the frame the break
					starts — the halves simply begin to move.
				-->
				<Container x={cx + s.shake.x} y={cy + s.shake.y}>
					<Sprite key="gbMShardL" anchor={0.5} width={SHARD} height={SHARD} />
					<Sprite key="gbMShardR" anchor={0.5} width={SHARD} height={SHARD} />
				</Container>
			{:else}
				{@const l = shardOffset(s.fall, -1)}
				{@const r = shardOffset(s.fall, 1)}
				<Container x={cx + l.x} y={cy + l.y} rotation={l.rot} alpha={s.alpha}>
					<Sprite key="gbMShardL" anchor={0.5} width={SHARD} height={SHARD} />
				</Container>
				<Container x={cx + r.x} y={cy + r.y} rotation={r.rot} alpha={s.alpha}>
					<Sprite key="gbMShardR" anchor={0.5} width={SHARD} height={SHARD} />
				</Container>
			{/if}
		{/if}
	{/each}

	{#each sandPuffs as puff (puff.id)}
		<ImpactDust
			x={getSymbolX(puff.reel)}
			y={rowCenterY(puff.row)}
			oncomplete={() => (sandPuffs = sandPuffs.filter((p) => p.id !== puff.id))}
		/>
	{/each}
</BoardContainer>

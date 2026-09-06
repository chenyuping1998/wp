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
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import { drawTabletShard } from '../game/tabletArt';
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
	const DURATION = 460;
	const DURATION_TURBO = 170;
	const STAGGER = 70;
	const STAGGER_TURBO = 22;
	const STRAIN_END = 0.22;

	type RevealEntry = {
		reel: number;
		row: number;
		bornAt: number;
		durationMs: number;
		swapped: boolean;
	};

	type SandPuff = { id: number; reel: number; row: number };

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
					reelSymbol.rawSymbol = { ...reelSymbol.rawSymbol, name: pendingSymbol };
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

	const drawLeft = (g: PixiGraphics) => drawTabletShard(g, SYMBOL_SIZE * 0.86, -1);
	const drawRight = (g: PixiGraphics) => drawTabletShard(g, SYMBOL_SIZE * 0.86, 1);

	context.eventEmitter.subscribeOnMount({
		mysteryReveal: async (event) => {
			// The hold first, silently — see the note above.
			for (const position of event.held) {
				const reelSymbol =
					context.stateGame.board[position.reel]?.reelState.symbols[position.row];
				if (!reelSymbol) continue;
				reelSymbol.rawSymbol = {
					...reelSymbol.rawSymbol,
					name: event.symbol,
					multiplier: position.mult,
				};
			}

			if (event.positions.length === 0) return;
			pendingSymbol = event.symbol;

			const stagger = stateBet.isTurbo ? STAGGER_TURBO : STAGGER;
			const durationMs = stateBet.isTurbo ? DURATION_TURBO : DURATION;

			// Reading order — left to right, top to bottom — so several tablets
			// giving way at once read as a sequence rather than a scattershot pop.
			const ordered = [...event.positions].sort((a, b) => a.reel - b.reel || a.row - b.row);

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
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
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			}
			// Ride out the last tablet's own fall before handing back — the line
			// read that follows has to see the board fully settled.
			await waitForTimeout(durationMs - (ordered.length - 1) * stagger);
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
					rather than as the intact face: they interlock exactly (see
					FRACTURE in tabletArt.ts), so this is the same picture, and it
					means nothing has to be swapped out on the frame the break
					starts — the halves simply begin to move.
				-->
				<Container x={cx + s.shake.x} y={cy + s.shake.y}>
					<Graphics draw={drawLeft} />
					<Graphics draw={drawRight} />
				</Container>
			{:else}
				{@const l = shardOffset(s.fall, -1)}
				{@const r = shardOffset(s.fall, 1)}
				<Container x={cx + l.x} y={cy + l.y} rotation={l.rot} alpha={s.alpha}>
					<Graphics draw={drawLeft} />
				</Container>
				<Container x={cx + r.x} y={cy + r.y} rotation={r.rot} alpha={s.alpha}>
					<Graphics draw={drawRight} />
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

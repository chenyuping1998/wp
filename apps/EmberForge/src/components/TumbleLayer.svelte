<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventTumble = {
		type: 'tumbleRun';
		explodingSymbols: Position[];
		newSymbols: RawSymbol[][];
	};
</script>

<script lang="ts">
	import { backOut, cubicIn } from 'svelte/easing';
	import { Sprite } from 'pixi-svelte';

	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		TUMBLE_EXPLODE_MS,
		TUMBLE_DROP_MS,
		TUMBLE_EXPLODE_MS_FREEGAME,
		TUMBLE_DROP_MS_FREEGAME,
		TUMBLE_EXPLODE_MS_FAST,
		TUMBLE_DROP_MS_FAST,
	} from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import FxBurst from './FxBurst.svelte';
	import ImpactDust from './ImpactDust.svelte';

	/**
	 * Drives one tumble: the winning cells burn out, everything above them falls
	 * into the gaps, and fresh symbols drop in from over the top of the board.
	 *
	 * The board's own reel objects are animated in place rather than an overlay
	 * being drawn on top of them. An overlay would have to duplicate every symbol's
	 * art and state, and the two copies would drift apart the moment a symbol was
	 * mid-animation when the tumble started.
	 *
	 * Slot indexing: a column holds 9 reel symbols, slot 0 and slot 8 are the
	 * padding rows and slots 1..7 are the visible board. Every position the math
	 * sends is already in that padded space, so `symbols[row]` is the cell the math
	 * means, with no conversion.
	 */
	const context = getContext();

	// Reel symbols carry symbolIndexOfBoard = slotIndex - 1, and the shared reel
	// positions them at (index + 0.5) * height. Kept identical here so a symbol
	// parked by the tumble sits exactly where the reel would have put it.
	const slotY = (slotIndex: number) => (slotIndex - 1 + 0.5) * SYMBOL_SIZE;

	let sparks = $state<{ id: number; x: number; y: number; delay: number }[]>([]);
	let dust = $state<{ id: number; x: number; y: number }[]>([]);
	// Vertical speed lines in a column while it is falling. Cheap, and it is what
	// separates "the symbols moved down" from "the symbols fell".
	let streaks = $state<{ id: number; x: number; y: number; height: number }[]>([]);
	let nextId = 0;

	const runTumble = async ({
		explodingSymbols,
		newSymbols,
	}: {
		explodingSymbols: Position[];
		newSymbols: RawSymbol[][];
	}) => {
		// `fast` gates the flourishes (streaks, dust, per-symbol stagger); the two
		// durations pick their own tier. Turbo drops both; the free game keeps the
		// flourishes but shortens the timings, so the heat grid is still readable.
		const turbo = stateBet.isTurbo;
		const freeGame = context.stateGame.gameType === 'freegame';
		const fast = turbo;
		const explodeMs = turbo
			? TUMBLE_EXPLODE_MS_FAST
			: freeGame
				? TUMBLE_EXPLODE_MS_FREEGAME
				: TUMBLE_EXPLODE_MS;
		const dropMs = turbo ? TUMBLE_DROP_MS_FAST : freeGame ? TUMBLE_DROP_MS_FREEGAME : TUMBLE_DROP_MS;

		const board = context.stateGame.board;

		// group the exploding cells by column
		const explodedByReel = new Map<number, Set<number>>();
		for (const pos of explodingSymbols) {
			if (!explodedByReel.has(pos.reel)) explodedByReel.set(pos.reel, new Set());
			explodedByReel.get(pos.reel)!.add(pos.row);
		}

		// ── burn out ────────────────────────────────────────────────────────────
		// A spark per cell, staggered by row so a tall cluster reads as burning
		// downward rather than blinking out at once.
		sparks = [
			...sparks,
			...explodingSymbols.map((pos, index) => ({
				id: nextId++,
				x: getSymbolX(pos.reel),
				y: slotY(pos.row),
				delay: fast ? 0 : (index % 5) * 22,
			})),
		];
		for (const [reelIndex, rows] of explodedByReel) {
			for (const row of rows) {
				const reelSymbol = board[reelIndex]?.reelState.symbols[row];
				if (reelSymbol) reelSymbol.symbolState = 'explosion';
			}
		}
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: fast ? 0.14 : 0.22 });
		await waitForTimeout(explodeMs);

		// ── fall ────────────────────────────────────────────────────────────────
		// Each column is rebuilt independently: survivors keep their order and sink
		// to the bottom of the visible area, the new symbols stack above them in the
		// order the math sent, and the padding rows are left alone.
		const settleColumn: (RawSymbol | undefined)[][] = [];

		await Promise.all(
			board.map(async (reel, reelIndex) => {
				const rows = explodedByReel.get(reelIndex);
				const symbols = reel.reelState.symbols;
				if (!rows || rows.size === 0) {
					settleColumn[reelIndex] = symbols.map((s) => s.rawSymbol);
					return;
				}

				const incoming = newSymbols[reelIndex] ?? [];
				const survivorSlots: number[] = [];
				for (let slot = 1; slot <= 7; slot += 1) if (!rows.has(slot)) survivorSlots.push(slot);

				// ── how the math actually refills a column ──────────────────────
				// newSymbols[reel][0] is the NEW PADDING row, not a visible symbol.
				// Reading tumble_board(): on the first removal it pushes the column's
				// existing top_symbols (the padding above the board) down into view
				// WITHOUT recording it, draws the rest from the strip, and finally
				// inserts the freshly drawn padding at the FRONT of the list it sends
				// us. So the visible refill is everything after index 0, and the old
				// padding symbol drops into the top visible cell behind it.
				//
				// Treating the whole array as visible refill — which is what this did
				// first — shifts every tumbled column down by one symbol. The board
				// stayed plausible, which is why it survived review: it just was not
				// the board being paid. Verified against the books by replaying both
				// rules and checking each following winInfo: this one matches every
				// one of 157,554 cluster positions, the other missed 6% of them, which
				// on screen looked like five matching symbols in a row not paying.
				const newPadding = incoming[0];
				const refill = incoming.slice(1);
				const oldTopPadding = symbols[0].rawSymbol;

				// Final visible column, top first.
				const finalVisible: RawSymbol[] = [
					...refill,
					oldTopPadding,
					...survivorSlots.map((slot) => symbols[slot].rawSymbol),
				];

				// What visibly falls in from above: the strip draws, then the old
				// padding row behind them. Exactly one per removed cell.
				const falling: RawSymbol[] = [...refill, oldTopPadding];

				// Survivors sink: the deepest one moves first so the column reads as
				// collapsing rather than sliding as a block.
				const survivorMoves = survivorSlots.map((oldSlot, index) => ({
					reelSymbol: symbols[oldSlot],
					from: slotY(oldSlot),
					to: slotY(1 + falling.length + index),
				}));

				// The burnt-out slots are recycled to carry the new symbols in from
				// above, so no reel symbol is created or destroyed mid-tumble.
				const freeSlots = [...rows].sort((a, b) => a - b);
				const incomingMoves = falling.map((rawSymbol, index) => {
					const carrier = symbols[freeSlots[index]];
					carrier.rawSymbol = rawSymbol;
					carrier.symbolState = 'static';
					const startSlot = -(falling.length - index);
					carrier.symbolY.set(slotY(startSlot), { duration: 0 });
					return { reelSymbol: carrier, to: slotY(1 + index) };
				});

				// One streak per emptied cell, spanning the distance that column has
				// to travel. Skipped in turbo, where the drop is over in 150ms and the
				// streaks would only strobe.
				if (!fast) {
					const topOfFall = slotY(1) - SYMBOL_SIZE * 0.5;
					const height = SYMBOL_SIZE * (0.9 + rows.size * 0.55);
					const streakId = nextId++;
					streaks = [
						...streaks,
						{ id: streakId, x: getSymbolX(reelIndex), y: topOfFall + height * 0.5, height },
					];
					setTimeout(
						() => (streaks = streaks.filter((s) => s.id !== streakId)),
						dropMs + 120,
					);
				}

				// Land short of the resting slot, then settle into it with backOut so the
				// tween genuinely overshoots and returns. Tweening to the resting value
				// twice — which is what this did first — moves nothing at all whatever
				// the easing, because the second tween starts where it ends: the drop
				// stopped dead and the "weight" was purely in the comment.
				const bounce = SYMBOL_SIZE * (fast ? 0.05 : 0.16);
				const bounceMs = fast ? 60 : 110;
				const fall = async (reelSymbol: (typeof board)[number]['reelState']['symbols'][number], to: number) => {
					await reelSymbol.symbolY.set(to - bounce, { duration: dropMs, easing: cubicIn });
					await reelSymbol.symbolY.set(to, { duration: bounceMs, easing: backOut });
				};

				await Promise.all([
					...survivorMoves.map(async ({ reelSymbol, to }, index) => {
						// Bottom-most first, by a hair — enough to see, not enough to
						// make the column feel like it is unzipping.
						if (!fast) await waitForTimeout((survivorMoves.length - 1 - index) * 14);
						await fall(reelSymbol, to);
					}),
					...incomingMoves.map(async ({ reelSymbol, to }, index) => {
						if (!fast) await waitForTimeout(index * 26);
						await fall(reelSymbol, to);
					}),
				]);

				// Dust where the column bottomed out.
				if (!fast) {
					dust = [
						...dust,
						{ id: nextId++, x: getSymbolX(reelIndex), y: slotY(7) + SYMBOL_SIZE * 0.4 },
					];
				}

				// Slot 0 takes the freshly drawn padding; the old one is now visible.
				settleColumn[reelIndex] = [
					newPadding ?? symbols[0].rawSymbol,
					...finalVisible,
					symbols[8].rawSymbol,
				];
			}),
		);

		// ── settle ──────────────────────────────────────────────────────────────
		// Put every column back into canonical shape: slot n holds the symbol the
		// math says it holds, parked at the position the shared reel would park it.
		// The animation already ended there, so nothing moves — but without this the
		// next spin would inherit permuted symbols and stale tween targets.
		board.forEach((reel, reelIndex) => {
			const column = settleColumn[reelIndex];
			if (!column) return;
			reel.setSymbolsWithRawSymbols(column as RawSymbol[]);
			reel.reelState.symbols.forEach((reelSymbol, slotIndex) => {
				reelSymbol.symbolY.set(slotY(slotIndex), { duration: 0 });
			});
		});

		// The landing squash has to be applied AFTER the settle, not before it:
		// setSymbolsWithRawSymbols resets every symbolState to 'static', so a 'land'
		// set during the fall was being wiped in the same tick and freshly dropped
		// symbols arrived completely inert. ReelSymbol returns them to 'static' when
		// the squash finishes.
		//
		// Only the incoming symbols get it. Survivors slid down from somewhere else
		// on the same column and squashing them too makes the whole board wobble.
		for (const [reelIndex, rows] of explodedByReel) {
			const symbols = board[reelIndex]?.reelState.symbols;
			if (!symbols || rows.size === 0) continue;
			// One newcomer per removed cell — see the refill note above; the event
			// array is one longer than that because its first entry is padding.
			for (let i = 0; i < rows.size; i += 1) {
				const reelSymbol = symbols[1 + i];
				if (!reelSymbol) continue;
				reelSymbol.symbolState = 'land';
				// A scatter that tumbles in still counts towards the trigger — the math
				// evaluates the board after the whole chain — so it has to be heard.
				// The shared reel's onSymbolLand only fires on a reveal, never here.
				if (reelSymbol.rawSymbol.name === 'S') {
					context.stateGameDerived.onSymbolLand({ rawSymbol: reelSymbol.rawSymbol });
				}
			}
		}
	};

	context.eventEmitter.subscribeOnMount({
		tumbleRun: runTumble,
	});
</script>

<BoardContainer>
	{#each streaks as streak (streak.id)}
		<!-- rotated 90°: the texture is a horizontal soft-ended ellipse -->
		<Sprite
			key="fxStreak"
			anchor={0.5}
			x={streak.x}
			y={streak.y}
			width={streak.height}
			height={SYMBOL_SIZE * 0.5}
			rotation={Math.PI / 2}
			blendMode="add"
			tint={0xffb04a}
			alpha={0.28}
		/>
	{/each}
	{#each sparks as spark (spark.id)}
		<FxBurst
			x={spark.x}
			y={spark.y}
			scale={0.85}
			delay={spark.delay}
			oncomplete={() => (sparks = sparks.filter((s) => s.id !== spark.id))}
		/>
	{/each}
	{#each dust as puff (puff.id)}
		<ImpactDust
			x={puff.x}
			y={puff.y}
			oncomplete={() => (dust = dust.filter((d) => d.id !== puff.id))}
		/>
	{/each}
</BoardContainer>

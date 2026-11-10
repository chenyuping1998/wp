<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';
	import type { WinPace } from './ScatterWins.svelte';
	export type EmitterEventTumble = {
		type: 'tumbleRun';
		explodingSymbols: Position[];
		newSymbols: RawSymbol[][];
		/** an applied throw's multipliers: this refill carries the watches in */
		watches?: number[];
		pace?: WinPace;
	};
</script>

<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { tumbleTiming } from '../game/animationTimeline';
	import { watchDropTiming } from '../game/hypnoWatchTiming';
	import { planCascadeColumn, gravityProgress, fallDuration, recordSymbolTravel, LANDING_OVERSHOOT, landingOvershoot } from '../game/symbolMotion';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldBurst from './GoldBurst.svelte';
	import ImpactDust from './ImpactDust.svelte';

	const context = getContext();
	let alive = true, generation = 0, nextId = 0;
	const waits = new Set<{ timer: ReturnType<typeof setTimeout>; resolve: () => void }>();
	const sleep = (ms: number) => new Promise<void>((resolve) => {
		const wait = { timer: undefined as unknown as ReturnType<typeof setTimeout>, resolve };
		wait.timer = setTimeout(() => { waits.delete(wait); resolve(); }, ms); waits.add(wait);
	});
	onDestroy(() => {
		alive = false; generation++;
		for (const wait of waits) { clearTimeout(wait.timer); wait.resolve(); } waits.clear();
		for (const reel of context.stateGame.board) for (const symbol of reel.reelState.symbols) void symbol.symbolY.set(symbol.symbolY.current, { duration: 0 });
	});
	const slotY = (slot: number) => (slot - 0.5) * SYMBOL_SIZE;
	type Break = { id: number; x: number; y: number; durationMs: number; seed: number };
	let crumbles = $state<Break[]>([]), contacts = $state<{ id: number; x: number; y: number; durationMs: number }[]>([]);
	// ATG 戰神賽特: each winner turns into a white light ball that swells and
	// throws a halo before it bursts
	let flash = $state<{ cells: { x: number; y: number }[]; alpha: number; swell: number } | null>(null);
	const drawFlash = (g: PixiGraphics) => {
		g.clear();
		if (!flash) return;
		const { alpha, swell } = flash;
		for (const cell of flash.cells) {
			if (swell > 0) g.circle(cell.x, cell.y, SYMBOL_SIZE * (0.5 + 0.28 * swell)).fill({ color: 0xffffff, alpha: alpha * 0.35 * swell });
			g.circle(cell.x, cell.y, SYMBOL_SIZE * (0.44 + 0.08 * swell)).fill({ color: 0xffffff, alpha });
		}
	};

	/**
	 * Cells for the watches: the highest fresh cell of a refilled column that is
	 * not a scatter, spread across the columns. Top-row cells come first: the
	 * settlement readout covers the middle rows. Each watch owns a fresh slot before the refill begins.
	 */
	const watchCells = (removed: Map<number, number[]>, newSymbols: RawSymbol[][], count: number) => {
		const board = context.stateGame.board;
		const top: { reel: number; row: number; rows: number; rank: number }[] = [];
		const lower: typeof top = [];
		for (const [reel, rows] of [...removed].sort((a, b) => a[0] - b[0])) {
			const plan = planCascadeColumn(board[reel].reelState.symbols.map((s) => s.rawSymbol), rows, newSymbols[reel] ?? [], BOARD_DIMENSIONS.y);
			for (let row = 1; row <= rows.length; row++) {
				// refill order among the incoming symbols only: survivors drop earlier
				const rank = plan.moves.filter((move) => move.incoming && move.from !== move.to && move.to > row).length;
				if (plan.column[row].name !== 'S') (row === 1 ? top : lower).push({ reel, row, rows: rows.length, rank });
			}
		}
		// Top-row cells first; a lower one only when there are not enough.
		const pool = top.length >= count ? top : [...top, ...lower];
		if (pool.length < count) return [];
		return Array.from({ length: count }, (_, i) => pool[Math.round(((i + 0.5) * pool.length) / count - 0.5)]);
	};

	const runTumble = async ({ explodingSymbols, newSymbols, watches = [], pace = 'normal' }: { explodingSymbols: Position[]; newSymbols: RawSymbol[][]; watches?: number[]; pace?: WinPace }) => {
		let bookPearlCells: { reel: number; row: number; rows: number; rank: number; value: number }[] = [];
		const run = ++generation, current = () => alive && run === generation;
		const timing = tumbleTiming({ chain: context.stateGame.tumbleChain, turbo: stateBet.isTurbo, turboLevel: stateBet.turboLevel });
		const board = context.stateGame.board;
		const removed = new Map<number, number[]>();
		for (const pos of explodingSymbols) {
			if (!removed.has(pos.reel)) removed.set(pos.reel, []);
			removed.get(pos.reel)!.push(pos.row);
		}
		const pieces = explodingSymbols.map((pos) => ({ id: nextId++, x: getSymbolX(pos.reel), y: slotY(pos.row), durationMs: timing.crumbleMs, seed: pos.reel * 13 + pos.row * 7 }));
		// Dragon Tide: the book says exactly where each pearl lands — a pearl in newSymbols,
		// or the pearl that sat in the hidden row above the reel and now falls in. Each is
		// the incoming symbol in its cell, so it drops in with the refill, at that cell.
		if (!watches.length) {
			const bookCells: { reel: number; row: number; rows: number; rank: number; value: number }[] = [];
			for (const [reel, rows] of [...removed].sort((a, b) => a[0] - b[0])) {
				const plan = planCascadeColumn(board[reel].reelState.symbols.map((s) => s.rawSymbol), rows, newSymbols[reel] ?? [], BOARD_DIMENSIONS.y);
				for (const move of plan.moves) {
					const value = move.rawSymbol.watchValue ?? (move.rawSymbol.name === 'M' ? move.rawSymbol.multiplier : undefined);
					if (!move.incoming || value === undefined) continue;
					const rank = plan.moves.filter((m) => m.incoming && m.from !== m.to && m.to > move.to).length;
					bookCells.push({ reel, row: move.to, rows: rows.length, rank, value });
				}
			}
			if (bookCells.length) {
				watches = bookCells.map((cell) => cell.value);
				bookPearlCells = bookCells;
			}
		}
		const cells = bookPearlCells.length ? bookPearlCells : watches.length ? watchCells(removed, newSymbols, watches.length) : [];
		// landings 2-3 frames apart, bottom first (GoO 1000 refill)
		const spawnGapMs = 40 * (timing.dropMs / 550);
		let gapMs = 0;
		if (cells.length) {
			const fall = (cell: (typeof cells)[number]) => fallDuration(cell.rows, timing.dropMs);
			const first = cells.reduce((a, b) => (a.reel * timing.columnStaggerMs + fall(a) <= b.reel * timing.columnStaggerMs + fall(b) ? a : b));
			const drop = watchDropTiming({
				freegame: pace === 'freegame' || pace === 'turboFreegame',
				turbo: pace === 'turbo' || pace === 'turboFreegame',
				crumbleMs: timing.clearMs,
				fallMs: fall(first),
				columnDelayMs: first.reel * timing.columnStaggerMs,
				// the caster acts at the burst, in the same beat as the winners blow
				castDelayMs: timing.restMs + timing.flashMs,
			});
			gapMs = drop.gapMs;
			// A multiplier is the incoming symbol in its slot, sharing the refill clock.
			context.eventEmitter.broadcast({
				type: 'hypnoWatchDrop',
				animation: drop.animation,
				castDelayMs: drop.castDelayMs,
				releaseMs: drop.releaseMs,
				pace,
				drops: cells.map((cell, i) => ({
					value: watches[i],
					x: getSymbolX(cell.reel),
					fromY: slotY(cell.row - cell.rows),
					toY: slotY(cell.row),
					delayMs: timing.clearMs + gapMs + cell.reel * timing.columnStaggerMs + cell.rank * spawnGapMs,
					durationMs: fall(cell),
				})),
			});
		}
		// hold, then each winner turns into a white light ball that swells while
		// its frame fades, then bursts gold
		if (timing.restMs > 0) { await sleep(timing.restMs); if (!current()) return; }
		const lit = explodingSymbols.map((pos) => ({ x: getSymbolX(pos.reel), y: slotY(pos.row) }));
		const glowIn = timing.flashMs / 3;
		for (let i = 1; i <= 3; i++) { flash = { cells: lit, alpha: i / 3, swell: 0 }; await sleep(glowIn / 3); if (!current()) return; }
		context.eventEmitter.broadcast({ type: 'scatterWinsHide' });
		for (let i = 1; i <= 4; i++) { flash = { cells: lit, alpha: 1, swell: i / 4 }; await sleep((timing.flashMs - glowIn) / 4); if (!current()) return; }
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		for (const pos of explodingSymbols) board[pos.reel].reelState.symbols[pos.row].symbolState = 'explosion';
		crumbles = pieces;
		void (async () => { for (let i = 1; i <= 3 && flash; i++) { await sleep(25); if (flash) flash = { ...flash, alpha: 1 - i / 3 }; } flash = null; })();
		const burstAt = performance.now();
		const refillAt = burstAt + timing.crumbleMs + timing.emptyMs + gapMs;

		const land = async (symbol: (typeof board)[number]['reelState']['symbols'][number], to: number, duration: number) => {
			await Promise.race([symbol.symbolY.set(to, { duration, easing: gravityProgress }), sleep(duration + 80)]);
			if (!current()) return;
			const bounce = LANDING_OVERSHOOT * SYMBOL_SIZE;
			await Promise.race([symbol.symbolY.set(to + bounce, { duration: 150, easing: (t: number) => landingOvershoot(t) }), sleep(230)]);
			if (current()) await symbol.symbolY.set(to, { duration: 0 });
		};
		await Promise.all(board.map(async (reel, reelIndex) => {
			const rows = removed.get(reelIndex); if (!rows?.length) return;
			const symbols = reel.reelState.symbols;
			const plan = planCascadeColumn(symbols.map((s) => s.rawSymbol), rows, newSymbols[reelIndex] ?? [], BOARD_DIMENSIONS.y);
			// the watch rides this column's refill as the symbol that lands in its cell
			for (const cell of cells.filter((cell) => cell.reel === reelIndex)) {
				const move = plan.moves.find((move) => move.to === cell.row)!;
				const raw = { ...move.rawSymbol, watchValue: watches[cells.indexOf(cell)] ?? move.rawSymbol.watchValue };
				move.rawSymbol = raw;
				plan.column[cell.row] = raw;
			}
			const moving = plan.moves.filter((move) => move.from !== move.to);
			const survivors = moving.filter((move) => !move.incoming).sort((a, b) => b.to - a.to);
			const incoming = moving.filter((move) => move.incoming).sort((a, b) => b.to - a.to);
			// survivors drop into the holes while the burst motes are still rising
			await sleep(timing.survivorsAtMs); if (!current()) return;
			// the burst carriers go above the board now, carrying the new symbols
			for (const move of plan.moves) {
				const symbol = symbols[move.carrier];
				if (move.incoming) { symbol.rawSymbol = move.rawSymbol; void symbol.symbolY.set(slotY(move.from), { duration: 0 }); }
				if (move.from !== move.to) { recordSymbolTravel(symbol, slotY(move.from), slotY(move.to)); symbol.symbolState = 'spin'; }
			}
			await Promise.all(survivors.map((move) => land(symbols[move.carrier], slotY(move.to), fallDuration(move.to - move.from, timing.dropMs))));
			if (!current()) return;
			// a look at the gaps at the top, then the refill left to right
			await sleep(Math.max(0, refillAt - performance.now()) + reelIndex * timing.columnStaggerMs); if (!current()) return;
			// bottom first, one spawn gap apart; each overshoots 0.12 cell and settles
			await Promise.all(incoming.map(async (move, rank) => {
				if (rank) await sleep(rank * spawnGapMs);
				if (!current()) return;
				await land(symbols[move.carrier], slotY(move.to), fallDuration(move.to - move.from, timing.dropMs));
			}));
			if (!current()) return;
			// Settle THIS column when it arrives. Waiting for all six columns made
			// every landing squash start together and removed the staggered impact.
			reel.setSymbolsWithRawSymbols(plan.column);
			reel.reelState.symbols.forEach((symbol, slot) => { void symbol.symbolY.set(slotY(slot), { duration: 0 }); });
			for (const move of moving) {
				const symbol = reel.reelState.symbols[move.to]; symbol.symbolState = 'land';
				if (move.incoming && symbol.rawSymbol.name === 'S') context.stateGameDerived.onSymbolLand({ rawSymbol: symbol.rawSymbol });
			}
			if (moving.length) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_symbols_landing' });
				if (!stateBet.isTurbo) contacts = [...contacts, { id: nextId++, x: getSymbolX(reelIndex), y: slotY(Math.max(...moving.map((move) => move.to))) + SYMBOL_SIZE * 0.4, durationMs: timing.settleMs }];
			}
			await sleep(timing.settleMs);
		}));
	};
	context.eventEmitter.subscribeOnMount({ tumbleRun: runTumble });
</script>

<BoardContainer>
	<Graphics draw={drawFlash} />
	{#each crumbles as piece (piece.id)}
		<GoldBurst {...piece} oncomplete={() => { if (alive) crumbles = crumbles.filter((p) => p.id !== piece.id); }} />
	{/each}
	{#each contacts as contact (contact.id)}
		<ImpactDust {...contact} oncomplete={() => { if (alive) contacts = contacts.filter((p) => p.id !== contact.id); }} />
	{/each}
</BoardContainer>

<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';
	export type EmitterEventTumble = { type: 'tumbleRun'; explodingSymbols: Position[]; newSymbols: RawSymbol[][] };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { ColorMatrixFilter } from 'pixi.js';
	import { onDestroy } from 'svelte';
	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { tumbleTiming } from '../game/animationTimeline';
	import { planCascadeColumn, gravityProgress, fallDuration, recordSymbolTravel } from '../game/symbolMotion';
	import { getSymbolX, getSymbolInfo } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import Crumble from './Crumble.svelte';
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
	type Break = { id: number; x: number; y: number; durationMs: number; assetKey: string; width: number; height: number; seed: number };
	let crumbles = $state<Break[]>([]), contacts = $state<{ id: number; x: number; y: number; durationMs: number }[]>([]);
	const stoneFilter = new ColorMatrixFilter(); stoneFilter.brightness(1, false);stoneFilter.resolution='inherit';stoneFilter.antialias='inherit';
	const stoneFilters = [stoneFilter];

	const runTumble = async ({ explodingSymbols, newSymbols }: { explodingSymbols: Position[]; newSymbols: RawSymbol[][] }) => {
		const run = ++generation, current = () => alive && run === generation;
		const timing = tumbleTiming({ chain: context.stateGame.tumbleChain, turbo: stateBet.isTurbo, turboLevel: stateBet.turboLevel });
		const board = context.stateGame.board;
        explodingSymbols=[...new Map(explodingSymbols.map(p=>[p.reel+':'+p.row,p])).values()];
        context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_swipe'});
		const removed = new Map<number, number[]>();
		for (const pos of explodingSymbols) {
			if (!removed.has(pos.reel)) removed.set(pos.reel, []);
			removed.get(pos.reel)!.push(pos.row);
		}
		crumbles = explodingSymbols.map((pos) => {
			const raw = board[pos.reel].reelState.symbols[pos.row].rawSymbol;
			const info = getSymbolInfo({ rawSymbol: raw, state: 'static' });
			return { id: nextId++, x: getSymbolX(pos.reel), y: slotY(pos.row), durationMs: timing.crumbleMs,
				assetKey: info.assetKey, width: SYMBOL_SIZE * info.sizeRatios.width, height: SYMBOL_SIZE * info.sizeRatios.height, seed: pos.reel * 13 + pos.row * 7 };
		});
		for (const pos of explodingSymbols) board[pos.reel].reelState.symbols[pos.row].symbolState = 'explosion';
		await sleep(timing.crumbleMs);
		if (!current()) return;

		await Promise.all(board.map(async (reel, reelIndex) => {
			const rows = removed.get(reelIndex); if (!rows?.length) return;
			await sleep(reelIndex * timing.columnStaggerMs); if (!current()) return;
			const symbols = reel.reelState.symbols;
			const plan = planCascadeColumn(symbols.map((s) => s.rawSymbol), rows, newSymbols[reelIndex] ?? [], BOARD_DIMENSIONS.y);
			for (const move of plan.moves) {
				const symbol = symbols[move.carrier];
				if (move.incoming) { symbol.rawSymbol = move.rawSymbol; void symbol.symbolY.set(slotY(move.from), { duration: 0 }); }
				if (move.from !== move.to) { recordSymbolTravel(symbol, slotY(move.from), slotY(move.to)); symbol.symbolState = 'spin'; }
			}
			await Promise.all(plan.moves.map(async (move) => {
				if (move.from === move.to) return;
				const symbol = symbols[move.carrier], to = slotY(move.to);
				const duration = fallDuration(move.to - move.from, timing.dropMs);
				await Promise.race([symbol.symbolY.set(to, { duration, easing: gravityProgress }), sleep(duration + 80)]);
				if (current()) await symbol.symbolY.set(to, { duration: 0 });
			}));
			if (!current()) return;
			// Settle THIS column when it arrives. Waiting for all six columns made
			// every landing squash start together and removed the staggered impact.
			reel.setSymbolsWithRawSymbols(plan.column);
			reel.reelState.symbols.forEach((symbol, slot) => { void symbol.symbolY.set(slotY(slot), { duration: 0 }); });
			const landed = plan.moves.filter((move) => move.from !== move.to);
			for (const move of landed) {
				const symbol = reel.reelState.symbols[move.to]; symbol.symbolState = 'land';
				if (move.incoming && symbol.rawSymbol.name === 'S') context.stateGameDerived.onSymbolLand({ rawSymbol: symbol.rawSymbol });
			}
			if (landed.length) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_symbols_landing' });
				if (!stateBet.isTurbo) contacts = [...contacts, { id: nextId++, x: getSymbolX(reelIndex), y: slotY(Math.max(...landed.map((move) => move.to))) + SYMBOL_SIZE * 0.4, durationMs: timing.settleMs }];
			}
			await sleep(timing.settleMs);
		}));
	};
	context.eventEmitter.subscribeOnMount({ tumbleRun: runTumble });
</script>

<BoardContainer>
	<Container filters={stoneFilters}>
		{#each crumbles as piece (piece.id)}
			<Crumble {...piece} oncomplete={() => { if (alive) crumbles = crumbles.filter((p) => p.id !== piece.id); }} />
		{/each}
	</Container>
	{#each contacts as contact (contact.id)}
		<ImpactDust {...contact} oncomplete={() => { if (alive) contacts = contacts.filter((p) => p.id !== contact.id); }} />
	{/each}
</BoardContainer>

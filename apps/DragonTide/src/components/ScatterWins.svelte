<script lang="ts" module>
	import type { ScatterWinDatum } from '../game/bookEventHandlerMap';
	export type WinPace = 'normal' | 'freegame' | 'turbo' | 'turboFreegame';
	export type EmitterEventScatterWins = { type: 'scatterWinsShow'; wins: ScatterWinDatum[]; pace?: WinPace } | { type: 'scatterWinsHide' };
</script>
<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { tumbleTiming } from '../game/animationTimeline';
	import { smooth } from '../game/symbolMotion';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	const context = getContext();
	let wins = $state<ScatterWinDatum[]>([]);
	let visible = $state(false);
	let age = $state(0);
	let markMs = $state(1);
	let raf = 0, generation = 0, alive = true;
	onDestroy(() => { alive = false; generation++; cancelAnimationFrame(raf); });
	const slotY = (row: number) => (row - 0.5) * SYMBOL_SIZE;
	// Stone 11-04: one number per win (no pop, no lift) — quick fade in, hold, fade
	// out before the winners burst.
	const amountAlpha = $derived(Math.min(smooth(age / markMs / 0.12), 1 - smooth((age / markMs - 0.68) / 0.32)));
	context.eventEmitter.subscribeOnMount({
		scatterWinsHide: () => { generation++; visible = false; wins = []; cancelAnimationFrame(raf); },
		scatterWinsShow: async ({ wins: incoming, pace = 'normal' }) => {
			const run = ++generation; cancelAnimationFrame(raf);
			wins = incoming; age = 0; visible = incoming.length > 0; if (!visible) return;
			const chain = context.stateGame.tumbleChain;
			const timing = tumbleTiming({ chain, turbo: pace === 'turbo' || pace === 'turboFreegame', turboLevel: stateBet.turboLevel });
			markMs = timing.markMs;
			for (const pos of incoming.flatMap((win) => win.positions)) {
				if (pos.row < 1 || pos.row > BOARD_DIMENSIONS.y) continue;
				const symbol = context.stateGame.board[pos.reel]?.reelState.symbols[pos.row];
				if (symbol) symbol.symbolState = 'win';
			}
			const start = performance.now();
			const tick = (now: number) => { if (!alive || run !== generation) return; age = Math.min(timing.markMs, now - start); if (age < timing.markMs) raf = requestAnimationFrame(tick); };
			raf = requestAnimationFrame(tick);
			await waitForTimeout(timing.highlightMs);
			if (!alive || run !== generation) return;
			context.eventEmitter.broadcast({ type: 'soundTumbleHit', chain });
			await waitForTimeout(timing.stoneMs + timing.crackMs);
		},
	});
</script>
{#if visible}
	<BoardContainer>
		<Graphics draw={(g) => {
			g.clear();
			const winning = new Set(wins.flatMap((win) => win.positions.map((p) => `${p.reel}:${p.row}`)));
			for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				if (!winning.has(`${reel}:${row}`)) g.rect(getSymbolX(reel) - SYMBOL_SIZE / 2, slotY(row) - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE).fill({ color: 0x000000, alpha: 0.4 });
			}
		}} />
		<!-- the gold win frame (reference: a gold frame round every winner for the whole mark) -->
		<Graphics draw={(g) => {
			g.clear();
			const entrance = smooth(age / markMs / 0.1);
			const pulse = 0.5 + 0.5 * Math.sin(age / 95);
			const heat = Math.min(3, Math.max(0, context.stateGame.tumbleChain - 1));
			for (const win of wins) for (const pos of win.positions) {
				if (pos.row < 1 || pos.row > BOARD_DIMENSIONS.y) continue;
				const x = getSymbolX(pos.reel) - SYMBOL_SIZE * 0.46;
				const y = slotY(pos.row) - SYMBOL_SIZE * 0.46;
				g.roundRect(x, y, SYMBOL_SIZE * 0.92, SYMBOL_SIZE * 0.92, 10)
					.stroke({ color: 0xe8b84a, width: 6 + heat, alpha: entrance * (0.2 + pulse * 0.15) });
				g.roundRect(x, y, SYMBOL_SIZE * 0.92, SYMBOL_SIZE * 0.92, 10)
					.stroke({ color: heat >= 2 ? 0xffd75e : 0xfff1c4, width: 2, alpha: entrance * (0.65 + pulse * 0.3) });
			}
		}} />
		{#each wins as win, index (index)}
			<Container x={getSymbolX(win.overlay.reel)} y={slotY(win.overlay.row)} alpha={amountAlpha}>
				<GoldText text={bookEventAmountToCurrencyString(win.win)} fontSize={SYMBOL_SIZE * 0.36} anchor={0.5} maxWidth={SYMBOL_SIZE * 1.9} />
			</Container>
		{/each}
	</BoardContainer>
{/if}

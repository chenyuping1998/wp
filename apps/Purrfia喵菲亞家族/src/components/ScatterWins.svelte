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
	let clockScale = $state(1);
	let raf = 0, generation = 0, alive = true;
	onDestroy(() => { alive = false; generation++; cancelAnimationFrame(raf); });
	const slotY = (row: number) => (row - 0.5) * SYMBOL_SIZE;
	const amountAlpha = $derived(smooth((age / clockScale - 95) / 75));
	const amountLift = $derived(8 * smooth(age / clockScale / 270));
	context.eventEmitter.subscribeOnMount({
		scatterWinsHide: () => { generation++; visible = false; wins = []; cancelAnimationFrame(raf); },
		scatterWinsShow: async ({ wins: incoming, pace = 'normal' }) => {
			const run = ++generation; cancelAnimationFrame(raf);
			wins = incoming; age = 0; visible = incoming.length > 0; if (!visible) return;
			const chain = context.stateGame.tumbleChain;
			const timing = tumbleTiming({ chain, turbo: pace === 'turbo' || pace === 'turboFreegame', turboLevel: stateBet.turboLevel });
			clockScale = timing.scale;
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
		{#each wins as win, index (index)}
			<Graphics draw={(g) => {
				g.clear();
				const cells=new Set(win.positions.map(p=>`${p.reel}:${p.row}`));
				const color=index%2===0?0xf2c14e:0xffe6a0;
				for(const p of win.positions){
					const x=getSymbolX(p.reel)-SYMBOL_SIZE/2;
					const y=(p.row-1)*SYMBOL_SIZE;
					if(!cells.has(`${p.reel}:${p.row-1}`))g.moveTo(x,y).lineTo(x+SYMBOL_SIZE,y).stroke({color,width:4});
					if(!cells.has(`${p.reel}:${p.row+1}`))g.moveTo(x,y+SYMBOL_SIZE).lineTo(x+SYMBOL_SIZE,y+SYMBOL_SIZE).stroke({color,width:4});
					if(!cells.has(`${p.reel-1}:${p.row}`))g.moveTo(x,y).lineTo(x,y+SYMBOL_SIZE).stroke({color,width:4});
					if(!cells.has(`${p.reel+1}:${p.row}`))g.moveTo(x+SYMBOL_SIZE,y).lineTo(x+SYMBOL_SIZE,y+SYMBOL_SIZE).stroke({color,width:4});
				}
			}} />
			<Container x={getSymbolX(win.overlay.reel)} y={slotY(win.overlay.row) + 8 - amountLift} alpha={amountAlpha}>
				<GoldText text={bookEventAmountToCurrencyString(win.win)} fontSize={SYMBOL_SIZE * 0.30} anchor={0.5} maxWidth={SYMBOL_SIZE * 1.9} />
			</Container>
		{/each}
	</BoardContainer>
{/if}

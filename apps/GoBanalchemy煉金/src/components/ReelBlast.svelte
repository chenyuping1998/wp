<script lang="ts" module>
	export type EmitterEventReelBlast =
		| {
				type: 'reelBlast';
				reels: number[];
				symbols: SymbolName[];
				level: number;
				maxLevel: number;
				full: boolean;
		  }
		| { type: 'reelBlastClear' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';
	import BoardContainer from './BoardContainer.svelte';
	import PotionBoil from './PotionBoil.svelte';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX, getSymbolInfo } from '../game/utils';
	import type { SymbolName } from '../game/types';
	import { reactionTiming, vaporParticles, vaporPose, coverOpacity } from '../game/potionVapor';
	const context = getContext();
	let reels = $state<number[]>([]);
	let reagents = $state<{ x: number; y: number; size: number }[]>([]);
	let clock = $state(-1);
	let timing = $state(reactionTiming(1));
	let generation = 0;
	let raf = 0;
	const HEIGHT = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	const particles = $derived(reels.flatMap((reel) => vaporParticles(reel)));
	const clouds = $derived(particles.map((p) => ({ p, pose: vaporPose(p, clock, timing) })));
	const draw = (g: PixiGraphics) => {
		g.clear();
		if (clock < 0) return;
		const alpha = coverOpacity(clock, timing);
		for (const reel of reels) {
			const left = getSymbolX(reel) - SYMBOL_SIZE / 2;
			g.rect(left, 0, SYMBOL_SIZE, HEIGHT).fill({ color: 0x315e54, alpha });
			for (let i = 0; i < 12; i++) {
				const age = clock - i * 23;
				if (age < 0 || age > timing.swap) continue;
				const x = left + SYMBOL_SIZE * (0.16 + ((i * 7) % 11) / 15);
				const y = HEIGHT * (0.16 + (i % 4) * 0.22) - age * 0.055;
				const a = Math.sin(Math.min(1, age / timing.swap) * Math.PI) * 0.35;
				g.circle(x, y, 2 + (i % 3)).stroke({
					width: 1,
					color: 0xbad9b0,
					alpha: a,
				});
			}
		}
	};
	const clear = () => {
		reagents = [];
		generation++;
		cancelAnimationFrame(raf);
		reels = [];
		clock = -1;
	};
	onDestroy(clear);
	context.eventEmitter.subscribeOnMount({
		reelBlast: async ({ reels: covered, symbols, full }) => {
			const mine = ++generation;
			cancelAnimationFrame(raf);
			reels = covered;
			reagents = covered.flatMap((reel) => {
				const column = stateGame.board[reel]?.reelState.symbols;
				return Array.from({ length: BOARD_DIMENSIONS.y }, (_, i) => i + 1).flatMap((row) => {
					const raw = column?.[row]?.rawSymbol;
					if (raw?.name !== 'B') return [];
					const info = getSymbolInfo({ rawSymbol: raw, state: 'static' });
					return [
						{
							x: getSymbolX(reel),
							y: (row - 0.5) * SYMBOL_SIZE,
							size: SYMBOL_SIZE * info.sizeRatios.height,
						},
					];
				});
			});
			timing = reactionTiming(covered.length);
			clock = 0;
			const started = performance.now();
			const tick = () => {
				if (mine !== generation) return;
				clock = performance.now() - started;
				if (clock < timing.end) raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
			context.eventEmitter.broadcast({ type: 'soundBlastFuse' });
			await waitForTimeout(timing.charge);
			if (mine !== generation) return;
			context.eventEmitter.broadcast({ type: 'soundBlastDetonate', full });
			context.eventEmitter.broadcast({ type: 'soundBlastSmoke' });
			await waitForTimeout(timing.swap - timing.charge);
			if (mine !== generation) return;
			// Force cover in the same update as the swap, including a late RAF.
			clock = timing.swap;
			for (const [index, reel] of covered.entries()) {
				if (!symbols[index]) continue;
				const column = stateGame.board[reel]?.reelState.symbols;
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					const cell = column?.[row];
					if (!cell || cell.rawSymbol?.name === 'S') continue;
					cell.rawSymbol = { ...cell.rawSymbol, name: symbols[index] };
				}
			}
			await waitForTimeout(timing.reveal - timing.swap);
			if (mine !== generation) return;
			context.eventEmitter.broadcast({ type: 'soundBlastReveal' });
			await waitForTimeout(timing.end - timing.reveal + timing.settle);
			if (mine !== generation) return;
			clock = timing.end;
		},
		reelBlastClear: clear,
	});
</script>

<BoardContainer>
	<Container>
		{#if clock >= 0 && clock < timing.swap}
			{#each reagents as reagent}
				<PotionBoil
					x={reagent.x}
					y={reagent.y}
					width={reagent.size}
					height={reagent.size}
					intensity={Math.min(1, 0.4 + (0.6 * clock) / timing.charge)}
					alpha={Math.max(
						0,
						1 - Math.max(0, clock - timing.charge) / (timing.swap - timing.charge),
					)}
				/>
			{/each}
		{/if}
	</Container>
	<Graphics {draw} />
	{#each clouds as { p, pose }}
		{#if pose.alpha > 0.001}
			<Sprite
				key="gbPotionVapor"
				anchor={0.5}
				x={getSymbolX(p.reel) + pose.x * SYMBOL_SIZE}
				y={pose.y * SYMBOL_SIZE}
				width={pose.size * SYMBOL_SIZE}
				height={pose.size * SYMBOL_SIZE * pose.aspect}
				rotation={pose.rotation}
				alpha={pose.alpha}
			/>
		{/if}
	{/each}
</BoardContainer>

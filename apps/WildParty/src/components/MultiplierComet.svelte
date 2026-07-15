<script lang="ts" module>
	export type EmitterEventMultiplierComet = {
		type: 'multiplierComet';
		reel: number;
		row: number;
	};
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();
	// must match GlobalMultiplier.svelte's panel placement
	const PANEL_WIDTH = SYMBOL_SIZE * 0.641;

	type Comet = { id: number; t: number; from: { x: number; y: number } };
	let comets = $state<Comet[]>([]);
	let nextId = 0;

	const target = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		return context.stateLayoutDerived.isStacked()
			? { x: board.width - PANEL_WIDTH * 1.5, y: -SYMBOL_SIZE * 0.55 }
			: { x: board.width - PANEL_WIDTH * 1.3, y: -SYMBOL_SIZE * 0.47 };
	});

	// rising arc from the Wild toward the multiplier panel
	const bezier = (from: { x: number; y: number }, to: { x: number; y: number }, p: number) => {
		const cx = (from.x + to.x) / 2;
		const cy = Math.min(from.y, to.y) - SYMBOL_SIZE * 1.6;
		const q = 1 - p;
		return {
			x: q * q * from.x + 2 * q * p * cx + p * p * to.x,
			y: q * q * from.y + 2 * q * p * cy + p * p * to.y,
		};
	};
	const smooth = (p: number) => p * p * (3 - 2 * p);

	context.eventEmitter.subscribeOnMount({
		multiplierComet: ({ reel, row }) =>
			new Promise<void>((resolve) => {
				const id = nextId++;
				// visible rows are 1..3 of the padded reel state
				const from = { x: (reel + 0.5) * SYMBOL_SIZE, y: (row - 1 + 0.5) * SYMBOL_SIZE };
				comets = [...comets, { id, t: 0, from }];
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_combine_a' });
				const duration = 450 / stateBetDerived.timeScale();
				const start = performance.now();
				const tick = (now: number) => {
					const t = Math.min(1, (now - start) / duration);
					comets = comets.map((comet) => (comet.id === id ? { ...comet, t } : comet));
					if (t >= 1) {
						comets = comets.filter((comet) => comet.id !== id);
						resolve();
						return;
					}
					requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			}),
	});
</script>

<BoardContainer>
	{#each comets as comet (comet.id)}
		{@const head = bezier(comet.from, target, smooth(comet.t))}
		<!-- trail ghosts sampled behind the head along the same path -->
		{#each [1, 2, 3, 4, 5, 6] as k (k)}
			{@const pos = bezier(comet.from, target, smooth(Math.max(0, comet.t - k * 0.045)))}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={pos.x}
				y={pos.y}
				tint={0xffd75e}
				blendMode="add"
				width={54 - k * 6}
				height={54 - k * 6}
				alpha={(1 - k / 7) * 0.5}
			/>
		{/each}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={head.x}
			y={head.y}
			tint={0xfff3c0}
			blendMode="add"
			width={80}
			height={80}
			alpha={0.95}
		/>
		<Sprite
			key="fxStar"
			anchor={0.5}
			x={head.x}
			y={head.y}
			rotation={comet.t * 7}
			tint={0xffd75e}
			blendMode="add"
			width={52}
			height={52}
			alpha={0.95}
		/>
	{/each}
</BoardContainer>

<script lang="ts" module>
	export type EmitterEventBoardExpandFx = { type: 'boardExpandPlay'; rows: number };
</script>

<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		NUM_REELS,
		BASE_ROWS,
		BOARD_EXPAND_MS,
		MULTIPLIER_FILL,
	} from '../game/constants';
	import { displayRows } from '../game/stateGame.svelte';

	const context = getContext();

	// Debris falling through the space the board is opening. Sized and seeded once
	// per run so a shard keeps its identity all the way down instead of flickering
	// into a different rock every frame.
	type Shard = {
		x: number;
		size: number;
		delay: number;
		speed: number;
		spin: number;
		drift: number;
	};

	const SHARD_COUNT = 26;
	let shards = $state<Shard[]>([]);
	let t = $state(0);
	let running = $state(false);
	let raf = 0;

	const boardWidth = SYMBOL_SIZE * NUM_REELS;

	const spawn = () =>
		Array.from({ length: SHARD_COUNT }, () => ({
			x: Math.random() * boardWidth,
			size: 7 + Math.random() * 17,
			// Staggered over most of the growth so debris keeps arriving while the
			// frame is still moving, rather than one burst at the start.
			delay: Math.random() * 0.62,
			speed: 0.8 + Math.random() * 0.9,
			spin: (Math.random() - 0.5) * 7,
			drift: (Math.random() - 0.5) * 26,
		}));

	// The band the board is opening up: from the top edge it is growing towards,
	// down to where the basegame board used to end.
	const openedTop = $derived(-(displayRows.current - BASE_ROWS) * SYMBOL_SIZE);

	context.eventEmitter.subscribeOnMount({
		boardExpandPlay: async () => {
			shards = spawn();
			running = true;
			const start = performance.now();
			await new Promise<void>((resolve) => {
				const step = (now: number) => {
					t = Math.min(1, (now - start) / BOARD_EXPAND_MS);
					if (t < 1) {
						raf = requestAnimationFrame(step);
					} else {
						running = false;
						shards = [];
						resolve();
					}
				};
				raf = requestAnimationFrame(step);
			});
		},
	});

	onDestroy(() => cancelAnimationFrame(raf));

	const shardState = (shard: Shard) => {
		const local = Math.max(0, (t - shard.delay) / Math.max(0.001, 1 - shard.delay));
		// Accelerating fall - gravity, not a linear slide.
		const fall = local * local * shard.speed;
		return {
			y: openedTop + fall * (BASE_ROWS * SYMBOL_SIZE + 220),
			x: shard.x + shard.drift * local,
			rotation: shard.spin * local,
			alpha: local <= 0 ? 0 : Math.min(1, local * 4) * (1 - local * 0.75),
		};
	};
</script>

{#if running}
	<Container>
		<!--
			A hot seam along the edge that is opening, so the growth has a leading
			line rather than just being an area that got taller.
		-->
		<Graphics
			draw={(g) => {
				g.clear();
				const glow = 1 - Math.abs(t - 0.35) * 1.6;
				if (glow <= 0) return;
				g.lineStyle(6, MULTIPLIER_FILL[1], 0.75 * glow);
				g.moveTo(0, openedTop);
				g.lineTo(boardWidth, openedTop);
				g.lineStyle(18, MULTIPLIER_FILL[1], 0.16 * glow);
				g.moveTo(0, openedTop);
				g.lineTo(boardWidth, openedTop);
			}}
		/>

		{#each shards as shard, index (index)}
			{@const s = shardState(shard)}
			{#if s.alpha > 0}
				<Sprite
					key="fxTick"
					anchor={0.5}
					x={s.x}
					y={s.y}
					width={shard.size}
					height={shard.size}
					rotation={s.rotation}
					alpha={s.alpha}
					tint={0x8fe6b0}
				/>
			{/if}
		{/each}
	</Container>
{/if}

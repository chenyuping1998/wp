<script lang="ts" module>
	import type { Position } from '../game/types';

	export type EmitterEventScatterTrigger =
		| { type: 'scatterTriggerShow'; positions: Position[] }
		| { type: 'scatterTriggerHide' };
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	// TRIPLE WITCHING red. The scatter is the only alarm in the game and this is the
	// only place the alarm colour is used at this size, so it cannot be mistaken
	// for a win (which is green).
	const ALARM = 0xff5566;

	let positions = $state<Position[]>([]);
	let clock = $state(0);
	let raf = 0;

	const start = () => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const step = (now: number) => {
			clock = (now - t0) / 1000;
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		scatterTriggerShow: ({ positions: next }) => {
			positions = next;
			clock = 0;
			start();
		},
		scatterTriggerHide: () => {
			positions = [];
			cancelAnimationFrame(raf);
		},
	});

	onDestroy(() => cancelAnimationFrame(raf));

	// Three rings staggered a third of a cycle apart, each expanding and fading.
	// A single ring reads as a decoration; a train of them reads as a siren.
	const RING_COUNT = 3;
	const CYCLE = 1.15;
</script>

{#if positions.length > 0}
	<Container>
		{#each positions as position (`${position.reel},${position.row}`)}
			{@const cx = getSymbolX(position.reel)}
			{@const cy = getSymbolY(position.row)}
			<Graphics
				draw={(g) => {
					g.clear();

					// steady pool under the symbol so the cell itself reads as live
					const breathe = 0.5 + 0.5 * Math.sin((clock / CYCLE) * Math.PI * 2);
					g.beginFill(ALARM, 0.14 + 0.16 * breathe);
					g.drawCircle(cx, cy, SYMBOL_SIZE * 0.62);
					g.endFill();

					for (let i = 0; i < RING_COUNT; i++) {
						const phase = ((clock / CYCLE + i / RING_COUNT) % 1 + 1) % 1;
						const radius = SYMBOL_SIZE * (0.34 + phase * 0.95);
						const alpha = (1 - phase) ** 1.6;
						if (alpha <= 0.01) continue;
						g.lineStyle(5 * (1 - phase * 0.5), ALARM, 0.85 * alpha);
						g.drawCircle(cx, cy, radius);
					}

					// hard bracket on the cell - the alarm is pinned to a board
					// position, not floating over it
					const k = SYMBOL_SIZE * 0.44;
					const arm = SYMBOL_SIZE * 0.18;
					g.lineStyle(4, ALARM, 0.55 + 0.35 * breathe);
					for (const [sx, sy] of [
						[-1, -1],
						[1, -1],
						[-1, 1],
						[1, 1],
					]) {
						g.moveTo(cx + sx * k, cy + sy * k - sy * arm);
						g.lineTo(cx + sx * k, cy + sy * k);
						g.lineTo(cx + sx * k - sx * arm, cy + sy * k);
					}
				}}
			/>
		{/each}
	</Container>
{/if}

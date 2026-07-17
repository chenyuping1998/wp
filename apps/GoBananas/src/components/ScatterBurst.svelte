<script lang="ts" module>
	export type EmitterEventScatterBurst = {
		type: 'scatterBurst';
		positions: { reel: number; row: number }[];
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	// Free-game trigger celebration: expanding gold rings + sparks bursting out
	// of every scatter, fired alongside the trigger bell.
	type Ring = { x: number; y: number; age: number; life: number; delay: number };
	type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number };

	const context = getContext();

	let rings = $state<Ring[]>([]);
	let sparks = $state<Spark[]>([]);
	let rafId = 0;
	let running = false;

	// padded book rows: visible row r center sits at r*SYMBOL_SIZE - SYMBOL_SIZE/2
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	context.eventEmitter.subscribeOnMount({
		scatterBurst: ({ positions }) => {
			for (const pos of positions) {
				const x = getSymbolX(pos.reel);
				const y = rowCenterY(pos.row);
				for (let k = 0; k < 3; k++) {
					rings.push({ x, y, age: 0, life: 620, delay: k * 150 });
				}
				for (let i = 0; i < 10; i++) {
					const a = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
					const speed = 1.6 + Math.random() * 2.4;
					sparks.push({
						x,
						y,
						vx: Math.cos(a) * speed,
						vy: Math.sin(a) * speed - 0.6,
						age: 0,
						life: 480 + Math.random() * 260,
					});
				}
			}
			if (!running) startLoop();
		},
	});

	const startLoop = () => {
		running = true;
		let last = performance.now();
		const step = (now: number) => {
			const dt = now - last;
			last = now;
			for (const ring of rings) ring.age += dt;
			for (const s of sparks) {
				s.age += dt;
				s.x += s.vx * (dt / 16);
				s.y += s.vy * (dt / 16);
				s.vy += 0.03 * (dt / 16);
			}
			rings = rings.filter((r) => r.age < r.life + r.delay);
			sparks = sparks.filter((s) => s.age < s.life);
			if (rings.length > 0 || sparks.length > 0) {
				rafId = requestAnimationFrame(step);
			} else {
				running = false;
			}
		};
		rafId = requestAnimationFrame(step);
	};

	onMount(() => () => cancelAnimationFrame(rafId));

	const draw = (g: PixiGraphics) => {
		g.clear();
		for (const ring of rings) {
			const t = (ring.age - ring.delay) / ring.life;
			if (t < 0 || t > 1) continue;
			const radius = SYMBOL_SIZE * (0.2 + t * 0.85);
			g.lineStyle(6 * (1 - t) + 1.5, 0xffd75e, 0.85 * (1 - t));
			g.drawCircle(ring.x, ring.y, radius);
		}
		g.lineStyle(0);
		for (const s of sparks) {
			const t = s.age / s.life;
			g.beginFill(0xfff2b0, 0.9 * (1 - t));
			g.drawCircle(s.x, s.y, 3.2 * (1 - t * 0.6));
			g.endFill();
		}
	};
</script>

{#if rings.length > 0 || sparks.length > 0}
	<BoardContainer>
		<Graphics {draw} />
	</BoardContainer>
{/if}

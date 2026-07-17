<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	// Impact dust: when a reel slams to a stop (spinning → bouncing), a puff of
	// sandy jungle dust kicks up from the bottom of that reel.
	type Particle = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		r: number;
		age: number;
		life: number;
	};

	const context = getContext();

	let particles = $state<Particle[]>([]);
	let tick = $state(0);
	let rafId = 0;
	let running = false;

	const spawn = (reelIndex: number) => {
		const cx = getSymbolX(reelIndex);
		const groundY = BOARD_SIZES.height - 4;
		for (let i = 0; i < 9; i++) {
			const side = i % 2 === 0 ? 1 : -1;
			particles.push({
				x: cx + (Math.random() - 0.5) * SYMBOL_SIZE * 0.5,
				y: groundY - Math.random() * 8,
				vx: side * (0.4 + Math.random() * 1.6),
				vy: -(0.8 + Math.random() * 1.8),
				r: 3 + Math.random() * 6,
				age: 0,
				life: 320 + Math.random() * 220,
			});
		}
		if (!running) startLoop();
	};

	const startLoop = () => {
		running = true;
		let last = performance.now();
		const step = (now: number) => {
			const dt = now - last;
			last = now;
			for (const p of particles) {
				p.age += dt;
				p.x += p.vx * (dt / 16);
				p.y += p.vy * (dt / 16);
				p.vy += 0.05 * (dt / 16); // light gravity pulls the puff back down
				p.vx *= 0.985;
			}
			particles = particles.filter((p) => p.age < p.life);
			tick++;
			if (particles.length > 0) {
				rafId = requestAnimationFrame(step);
			} else {
				running = false;
			}
		};
		rafId = requestAnimationFrame(step);
	};

	onMount(() => () => cancelAnimationFrame(rafId));

	// watch every reel for the slam moment
	const prevMotion: string[] = [];
	$effect(() => {
		context.stateGame.board.forEach((reel, i) => {
			const motion = reel.reelState.motion;
			if (prevMotion[i] === 'spinning' && motion === 'bouncing') spawn(i);
			prevMotion[i] = motion;
		});
	});

	const draw = (g: PixiGraphics) => {
		tick;
		g.clear();
		for (const p of particles) {
			const t = p.age / p.life;
			const alpha = 0.34 * (1 - t);
			g.beginFill(0xd9c9a0, alpha);
			g.drawCircle(p.x, p.y, p.r * (0.7 + t * 0.9));
			g.endFill();
		}
	};
</script>

{#if particles.length > 0}
	<BoardContainer>
		<Graphics {draw} />
	</BoardContainer>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { BOARD_SIZES, SYMBOL_SIZE } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';

	/**
	 * THE BOARD SHEDS SAND WHEN THE REELS LAUNCH.
	 *
	 * A spin ENDED with weight — each reel slams and kicks dust off the floor
	 * (ReelDust) — and began with nothing at all: the symbols simply started
	 * moving. The two halves of the same action did not match.
	 *
	 * So the housing is knocked at the start too: sand jarred loose off the top
	 * lintel, falling in a thin curtain and fading before the first symbols have
	 * crossed the window. Small on purpose — this happens on every single spin,
	 * several times a minute for a long session, so it has to read once and then
	 * get out of the way. The knock the frame itself takes is sent by ReelDust,
	 * which is what decides a spin has started.
	 */
	type Props = {
		oncomplete?: () => void;
	};
	const props: Props = $props();

	const DURATION = 620;
	const SAND = [0xf2d59a, 0xd9c49a, 0xe8c98a];

	// seeded, so every spin sheds the same sand and nothing re-rolls per frame
	const grains = Array.from({ length: 30 }, (_, i) => {
		const h = Math.sin((i + 1) * 43.7) * 8123.7;
		const r = h - Math.floor(h);
		const h2 = Math.sin((i + 1) * 91.3) * 5123.9;
		const r2 = h2 - Math.floor(h2);
		return {
			x: 0.02 + (i / 30) * 0.96 + (r - 0.5) * 0.03,
			delay: r2 * 180,
			speed: 0.9 + r * 0.8,
			size: 1.6 + r2 * 2.2,
			color: SAND[i % 3],
		};
	});

	let t = $state(0);
	onMount(() => {
		const born = Date.now();
		const id = setInterval(() => {
			t = Date.now() - born;
			if (t >= DURATION) {
				clearInterval(id);
				props.oncomplete?.();
			}
		}, 16);
		return () => clearInterval(id);
	});

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (t <= 0 || t >= DURATION) return;
		const width = SYMBOL_SIZE * 5;
		for (const grain of grains) {
			const dt = t - grain.delay;
			if (dt <= 0) continue;
			const s = dt / 1000;
			// gravity, in board units: a grain crosses about a cell in 0.4s
			const y = (700 * s * s + 120 * s) * grain.speed;
			if (y > BOARD_SIZES.height * 0.45) continue;
			const fade = Math.max(0, 1 - dt / (DURATION - grain.delay));
			g.circle(grain.x * width, y, grain.size).fill({ color: grain.color, alpha: 0.8 * fade });
		}
	};
</script>

<BoardContainer>
	<!-- in FRONT of the symbols: the sand falls past the face of the board, and
	     drawn behind them the opaque plates swallowed it entirely -->
	<Container zIndex={40}>
		<Graphics {draw} />
	</Container>
</BoardContainer>

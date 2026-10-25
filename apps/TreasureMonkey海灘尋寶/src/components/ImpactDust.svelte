<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	// Reel-stop impact: a low, wide cone of sandy dust hugging the floor. Reads
	// as weight landing, not as a celebration — hence the flat fan and the
	// squashed floor flash.
	type Props = {
		x?: number;
		y?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 360;
	const DUST_COLORS = [0xd9c9a0, 0xe8dcb8, 0xc2ae82];

	type Puff = { angle: number; speed: number; size: number; color: number };

	const puffs: Puff[] = Array.from({ length: 8 }, (_, i) => {
		const side = i % 2 === 0 ? 1 : -1;
		return {
			angle: -Math.PI / 2 + side * (0.75 + Math.random() * 0.65),
			speed: 120 + Math.random() * 110,
			size: 14 + Math.random() * 16,
			color: DUST_COLORS[i % DUST_COLORS.length],
		};
	});

	let t = $state(0);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = Math.min(1, (now - start) / DURATION);
			if (t >= 1) {
				props.oncomplete?.();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeOut = (p: number) => 1 - (1 - p) ** 3;

	const puffState = (puff: Puff) => {
		const dist = puff.speed * easeOut(t) * 0.32;
		return {
			x: Math.cos(puff.angle) * dist,
			// the floor blocks downward motion: clamp above the impact line
			y: Math.min(0, Math.sin(puff.angle) * dist) - 4,
			size: puff.size * (1 - t * 0.4),
			alpha: (1 - t) ** 1.4 * 0.85,
		};
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if t < 1}
		<!-- squashed floor flash -->
		<Sprite
			key="fxGlow"
			anchor={0.5}
			y={-6}
			tint={0xe8dcb8}
			blendMode="add"
			width={130 * easeOut(Math.min(1, t * 2.5))}
			height={34 * easeOut(Math.min(1, t * 2.5))}
			alpha={(1 - t) ** 1.5 * 0.7}
		/>
		{#each puffs as puff, index (index)}
			{@const state = puffState(puff)}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={state.x}
				y={state.y}
				tint={puff.color}
				width={state.size}
				height={state.size}
				alpha={state.alpha}
			/>
		{/each}
	{/if}
</Container>

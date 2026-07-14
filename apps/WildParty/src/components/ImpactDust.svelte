<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	type Props = {
		x?: number;
		y?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 360;
	const DUST_COLORS = [0xffe9a8, 0xfff7d1, 0xffd75e];

	type Puff = {
		angle: number; // radians, fanned out of the floor
		speed: number;
		size: number;
		color: number;
	};

	// low, wide cone hugging the floor — reads as dust kicked out sideways,
	// not a celebration burst
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
			// floor blocks downward motion: clamp above the impact line
			y: Math.min(0, Math.sin(puff.angle) * dist) - 4,
			size: puff.size * (1 - t * 0.4),
			alpha: (1 - t) ** 1.4,
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
			tint={0xffe9a8}
			blendMode="add"
			width={130 * easeOut(Math.min(1, t * 2.5))}
			height={34 * easeOut(Math.min(1, t * 2.5))}
			alpha={(1 - t) ** 1.5}
		/>
		{#each puffs as puff, index (index)}
			{@const state = puffState(puff)}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={state.x}
				y={state.y}
				tint={puff.color}
				blendMode="add"
				width={state.size}
				height={state.size}
				alpha={state.alpha}
			/>
		{/each}
	{/if}
</Container>

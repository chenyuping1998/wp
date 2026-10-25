<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { FEATURE_ACCENT } from '../game/constants';

	
	const context = getContext();

	const TOTAL_MS = 1100;
	const VEIL_FROM = 0.1;
	const VEIL_TO = 0.6;

	let t = $state(0);

	onMount(() => {
		context.eventEmitter.broadcast({ type: 'soundEntryReveal' });
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / TOTAL_MS;
			if (t >= 1) return;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		// rAF stops in a hidden tab; never leave the veil over the board
		const fallback = setTimeout(() => (t = 1), TOTAL_MS + 400);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(fallback);
		};
	});

	const smooth = (v: number) => {
		const c = Math.max(0, Math.min(1, v));
		return c * c * (3 - 2 * c);
	};

	const veil = $derived(1 - smooth((t - VEIL_FROM) / (VEIL_TO - VEIL_FROM)));
	const sweep = $derived(smooth(t / 0.75));
	const sizes = $derived(context.stateLayoutDerived.canvasSizes());

	const drawVeil = (graphics: PixiGraphics) => {
		graphics.clear();
		if (veil <= 0) return;
		graphics.rect(0, 0, sizes.width, sizes.height).fill({ color: 0x0b0d14, alpha: veil });
	};
</script>

{#if t < 1}
	<MainContainer>
		<Container>
			<Graphics draw={drawVeil} />
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={sizes.width * 0.5}
				y={sizes.height * (1.1 - sweep * 1.3)}
				width={sizes.width * 1.6}
				height={sizes.height * 0.45}
				tint={FEATURE_ACCENT}
				blendMode="add"
				alpha={0.55 * (1 - t)}
			/>
		</Container>
	</MainContainer>
{/if}

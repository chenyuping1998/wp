<script lang="ts" module>
	export type EmitterEventQuenchFlash = { type: 'quenchFlash' };
</script>

<script lang="ts">
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';

	/**
	 * The rarest tier: the board is quenched.
	 *
	 * A white flash across the whole canvas and a bloom of steam. The pause that
	 * goes with it is held by ClusterWins, not here — this is only the picture.
	 *
	 * Reserved for clusterMult >= QUENCH_FROM, which the books put at 0.68% of
	 * clusters. That rarity is the whole design: stopping the game dead is a
	 * reward when it happens once in a session and a fault when it happens every
	 * other spin.
	 */
	const context = getContext();

	const DURATION = 620;
	let t = $state(-1);

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());

	const STEAM = 9;
	const steam = Array.from({ length: STEAM }, (_, i) => ({
		x: (i + 0.5) / STEAM,
		delay: Math.abs(Math.sin(i * 33.7)) * 0.25,
		drift: Math.sin(i * 12.3) * 0.06,
		size: 0.5 + Math.abs(Math.sin(i * 8.1)) * 0.7,
	}));

	$effect(() => {
		if (t !== 0) return;
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			const elapsed = (now - start) / DURATION;
			t = elapsed >= 1 ? -1 : elapsed;
			if (t >= 0) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// Hard in, slow out: a quench is instant and the steam lingers.
	const flash = $derived(t < 0 ? 0 : t < 0.08 ? 1 : Math.max(0, 1 - (t - 0.08) / 0.5));

	const drawFlash = (graphics: PixiGraphics) => {
		graphics.clear();
		if (flash <= 0) return;
		graphics.rect(0, 0, sizes.width, sizes.height).fill({ color: 0xfffdf4, alpha: flash * 0.85 });
	};

	context.eventEmitter.subscribeOnMount({
		quenchFlash: () => {
			t = 0;
		},
	});
</script>

{#if t >= 0}
	<Container>
		{#each steam as puff, index (index)}
			{@const p = Math.max(0, Math.min(1, (t - puff.delay) / (1 - puff.delay)))}
			{#if p > 0}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					x={sizes.width * (puff.x + puff.drift * p)}
					y={sizes.height * (0.72 - p * 0.55)}
					width={sizes.width * 0.26 * puff.size * (0.5 + p)}
					height={sizes.width * 0.26 * puff.size * (0.5 + p)}
					tint={0xdcefff}
					blendMode="add"
					alpha={(1 - p) * 0.5}
				/>
			{/if}
		{/each}
		<Graphics draw={drawFlash} />
	</Container>
{/if}

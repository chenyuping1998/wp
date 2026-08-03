<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	/**
	 * Free-game transition: the furnace is opened and its fire takes the screen.
	 *
	 * Three beats — the draught draws in and the room dims, a seam of light appears
	 * as the door gives, then the flame front erupts from the bottom and washes
	 * past the top edge. The cut to the next scene lands on the white-hot peak, so
	 * the screen is at its brightest exactly when the board changes underneath.
	 *
	 * The flame front is a stack of soft glow sprites moving at different speeds
	 * rather than one drawn shape. Fire has no silhouette; anything with an outline
	 * reads as a coloured blob climbing the screen. Layering a slow dark body under
	 * fast bright tongues gives it depth for very little cost.
	 */
	type Props = {
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const DRAW_MS = 380; // the forge inhales — everything dims and pulls down
	const CRACK_MS = 180; // the door gives, a seam of light along the floor
	const ERUPT_MS = 620; // the flame front takes the screen
	const TOTAL_MS = DRAW_MS + CRACK_MS + ERUPT_MS;
	const ERUPT_AT = DRAW_MS + CRACK_MS;

	// Tongues of flame. Seeded per mount so two transitions in a session are not
	// frame-identical, but fixed within one play so nothing flickers.
	const TONGUES = 14;
	const tongues = Array.from({ length: TONGUES }, (_, i) => ({
		xFrac: (i + 0.5) / TONGUES + (Math.random() - 0.5) * 0.05,
		speed: 0.78 + Math.random() * 0.5,
		width: 0.18 + Math.random() * 0.22,
		delay: Math.random() * 0.22,
		warm: Math.random(),
	}));

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let eruptFired = false;

	let t = $state(0);

	onMount(() => {
		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			elapsed += now - last;
			last = now;
			t = elapsed;

			if (!eruptFired && elapsed >= ERUPT_AT) {
				eruptFired = true;
				context.eventEmitter.broadcast({ type: 'soundTransitionBlast' });
				// the blast rattles the housing as it passes
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.4 });
			}

			if (elapsed >= TOTAL_MS) {
				if (!completed) {
					completed = true;
					props.oncomplete();
				}
				return;
			}
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});

	const easeOutCubic = (v: number) => 1 - (1 - Math.min(Math.max(v, 0), 1)) ** 3;

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());

	const draw = $derived(Math.min(1, t / DRAW_MS));
	const crack = $derived(Math.max(0, Math.min(1, (t - DRAW_MS) / CRACK_MS)));
	const erupt = $derived(Math.max(0, Math.min(1, (t - ERUPT_AT) / ERUPT_MS)));

	// The room darkens as the draught pulls the fire back, which is what makes the
	// eruption read as a release rather than as a light simply being switched on.
	const dim = $derived(draw * 0.55 * (1 - erupt));
	const flash = $derived(erupt > 0.55 ? Math.min(1, (erupt - 0.55) / 0.3) * 0.92 : 0);

	const drawSeam = (g: PixiGraphics) => {
		g.clear();
		if (crack <= 0 || erupt > 0.25) return;
		const h = sizes.height;
		const seam = h * 0.012 * crack;
		g.rect(0, h - seam, sizes.width, seam).fill({ color: 0xfff0c0, alpha: 0.85 * crack });
	};

	const drawDim = (g: PixiGraphics) => {
		g.clear();
		if (dim <= 0) return;
		g.rect(0, 0, sizes.width, sizes.height).fill({ color: 0x000000, alpha: dim });
	};

	const drawFlash = (g: PixiGraphics) => {
		g.clear();
		if (flash <= 0) return;
		g.rect(0, 0, sizes.width, sizes.height).fill({ color: 0xfff2c0, alpha: flash });
	};
</script>

<Container>
	<Graphics draw={drawDim} />
	<Graphics draw={drawSeam} />

	{#if erupt > 0}
		<!--
			Body of the fire: one wide, slow, dark-orange mass. This is what stops the
			tongues above it from reading as separate objects floating up the screen.
		-->
		{@const bodyRise = easeOutCubic(erupt) * sizes.height * 1.5}
		<Sprite
			key="fxGlow"
			anchor={{ x: 0.5, y: 1 }}
			x={sizes.width * 0.5}
			y={sizes.height + sizes.height * 0.25 - bodyRise}
			width={sizes.width * 1.6}
			height={sizes.height * 1.5}
			tint={0xc23a12}
			blendMode="add"
			alpha={0.75 * Math.min(1, erupt * 3)}
		/>

		{#each tongues as tongue, index (index)}
			{@const local = Math.max(0, Math.min(1, (erupt - tongue.delay) / (1 - tongue.delay)))}
			{#if local > 0}
				{@const rise = easeOutCubic(local) * sizes.height * 1.35 * tongue.speed}
				<Sprite
					key="fxGlow"
					anchor={{ x: 0.5, y: 1 }}
					x={sizes.width * tongue.xFrac}
					y={sizes.height + sizes.height * 0.15 - rise}
					width={sizes.width * tongue.width}
					height={sizes.height * (0.55 + local * 0.6)}
					tint={tongue.warm > 0.5 ? 0xffb04a : 0xff7a18}
					blendMode="add"
					alpha={0.85 * (1 - local * 0.25)}
				/>
			{/if}
		{/each}

		<!-- white-hot core arriving last, so the peak is a colour shift and not just more orange -->
		{@const corePhase = Math.max(0, (erupt - 0.2) / 0.8)}
		<Sprite
			key="fxGlow"
			anchor={{ x: 0.5, y: 1 }}
			x={sizes.width * 0.5}
			y={sizes.height + sizes.height * 0.1 - easeOutCubic(corePhase) * sizes.height * 1.3}
			width={sizes.width * 0.9}
			height={sizes.height * 0.9}
			tint={0xfff0c0}
			blendMode="add"
			alpha={0.8 * corePhase}
		/>

		<!-- sparks carried up in the draught -->
		{#each tongues as tongue, index (index)}
			{@const local = Math.max(0, Math.min(1, erupt - tongue.delay * 0.5))}
			{#if local > 0.1}
				<Sprite
					key="fxStar"
					anchor={0.5}
					x={sizes.width * tongue.xFrac + Math.sin(local * 6 + index) * sizes.width * 0.04}
					y={sizes.height * (1.05 - local * 1.4 * tongue.speed)}
					width={sizes.width * 0.02 * (1 - local * 0.4)}
					height={sizes.width * 0.02 * (1 - local * 0.4)}
					tint={0xffe6a0}
					blendMode="add"
					alpha={(1 - local) * 0.9}
				/>
			{/if}
		{/each}
	{/if}

	<Graphics draw={drawFlash} />
</Container>

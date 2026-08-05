<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import FireFront from './FireFront.svelte';

	/**
	 * Opening: the forge lights and the fire washes the screen clear.
	 *
	 * This replaced a pair of iron doors that swung open. The doors worked, but
	 * they made the arrival a different idea from the free-game transition, and
	 * the game only has one idea worth opening on — the fire. Both now use the
	 * same FireFront; this one is a quick flare that CLEARS to reveal the board,
	 * the feature is a bigger, slower eruption that COVERS before the cut.
	 *
	 * The veil is what makes it a reveal rather than a flame drawn over a board
	 * that was already visible: the screen starts dark and is uncovered as the
	 * front passes over it.
	 */
	const context = getContext();

	const TOTAL_MS = 1500;
	// The flame finishes its climb before the end, so the last stretch is the fire
	// dying down rather than a hard cut.
	const CLIMB = 0.68;
	const VEIL_FROM = 0.12;
	const VEIL_TO = 0.58;

	let t = $state(0);

	onMount(() => {
		context.eventEmitter.broadcast({ type: 'soundEntryFire' });
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / TOTAL_MS;
			if (t >= 1) return;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const smooth = (v: number) => {
		const c = Math.max(0, Math.min(1, v));
		return c * c * (3 - 2 * c);
	};

	const fireT = $derived(Math.min(1, t / CLIMB));
	// Fades as the front leaves the top of the screen.
	const fireIntensity = $derived(t < 0.62 ? 1 : Math.max(0, 1 - (t - 0.62) / 0.38));
	const veil = $derived(1 - smooth((t - VEIL_FROM) / (VEIL_TO - VEIL_FROM)));

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());

	const drawVeil = (graphics: PixiGraphics) => {
		graphics.clear();
		if (veil <= 0) return;
		graphics.rect(0, 0, sizes.width, sizes.height).fill({ color: 0x05070a, alpha: veil });
	};
</script>

{#if t < 1}
	<MainContainer>
		<Container>
			<Graphics draw={drawVeil} />
			<FireFront t={fireT} intensity={fireIntensity} reach={1.3} tongues={14} />
		</Container>
	</MainContainer>
{/if}

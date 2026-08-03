<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import FireFront from './FireFront.svelte';

	/**
	 * Free-game transition: the furnace is opened and its fire takes the screen.
	 *
	 * Three beats — the draught draws in and the room dims, a seam of light appears
	 * as the door gives, then the flame front erupts and washes past the top edge.
	 * The cut to the next scene lands on the white-hot peak, so the screen is at
	 * its brightest exactly when the board changes underneath.
	 *
	 * Shares FireFront with the opening. This one is deliberately the bigger of the
	 * two: wider reach, more tongues, higher intensity and a noticeably longer
	 * eruption, because entering the feature is the moment the game most wants to
	 * sell. The opening is the same flame played quick and thin.
	 */
	type Props = {
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const DRAW_MS = 380; // the forge inhales — everything dims and pulls down
	const CRACK_MS = 180; // the door gives, a seam of light along the floor
	const ERUPT_MS = 1050; // the flame front takes the screen
	const HOLD_MS = 220; // stay in the fire a beat before the cut
	const TOTAL_MS = DRAW_MS + CRACK_MS + ERUPT_MS + HOLD_MS;
	const ERUPT_AT = DRAW_MS + CRACK_MS;

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

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());

	const draw = $derived(Math.min(1, t / DRAW_MS));
	const crack = $derived(Math.max(0, Math.min(1, (t - DRAW_MS) / CRACK_MS)));
	const erupt = $derived(Math.max(0, Math.min(1, (t - ERUPT_AT) / ERUPT_MS)));

	// The room darkens as the draught pulls the fire back, which is what makes the
	// eruption read as a release rather than as a light simply being switched on.
	const dim = $derived(draw * 0.55 * (1 - erupt));
	const flash = $derived(erupt > 0.62 ? Math.min(1, (erupt - 0.62) / 0.26) * 0.92 : 0);

	const drawSeam = (graphics: PixiGraphics) => {
		graphics.clear();
		if (crack <= 0 || erupt > 0.25) return;
		const h = sizes.height;
		const seam = h * 0.012 * crack;
		graphics.rect(0, h - seam, sizes.width, seam).fill({ color: 0xfff0c0, alpha: 0.85 * crack });
	};

	const drawDim = (graphics: PixiGraphics) => {
		graphics.clear();
		if (dim <= 0) return;
		graphics.rect(0, 0, sizes.width, sizes.height).fill({ color: 0x000000, alpha: dim });
	};

	const drawFlash = (graphics: PixiGraphics) => {
		graphics.clear();
		if (flash <= 0) return;
		graphics.rect(0, 0, sizes.width, sizes.height).fill({ color: 0xfff2c0, alpha: flash });
	};
</script>

<Container>
	<Graphics draw={drawDim} />
	<Graphics draw={drawSeam} />
	<FireFront t={erupt} intensity={1.25} reach={1.65} tongues={18} />
	<Graphics draw={drawFlash} />
</Container>

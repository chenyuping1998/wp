<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, Graphics, type Sizes } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, NUM_REELS } from '../game/constants';

	// The award plate, powering on.
	//
	// It used to drop in from a screen and a half above and then swing like a
	// tavern sign on chains, four tweens over about 1.6 seconds. Two things were
	// wrong with that. A swing is the idiom of a board hanging off hooks, and this
	// is a milled steel plate — the motion belonged to the game this component was
	// inherited from. And it fought the transition: the circuit-breaker shutters
	// have just retracted upward and downward, so an object dropping in from above
	// a beat later is a second large vertical move in the opposite direction.
	//
	// Now the plate is already in position when the shutters open (the caller
	// mounts it during the covered frame) and what plays is the hardware coming
	// up: it seats with a jolt, a charge line traces the bezel, and a scan band
	// runs down the readout. Nothing translates across the screen.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
		/** shorter, lighter treatment for a retrigger */
		compact?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	// Art is 1280x1002 with the panel at FS_PANEL in generate_theme.mjs. Both
	// numbers below are read off that, not guessed: the panel spans 94% of the
	// image width and 70% of its height, and the content box is that inset far
	// enough to clear the chamfer and the rivet line.
	const SIGN_RATIO = 1280 / 1002;
	const SIGN_WIDTH = SYMBOL_SIZE * NUM_REELS * 1.35;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// inner plank area (in sign source pixels 100..820 × 130..670) mapped to sprite space
	const TEXT_AREA = {
		width: SIGN_SIZES.width * 0.84,
		height: SIGN_SIZES.height * 0.58,
	};

	const SEAT_MS = 260;
	const TRACE_MS = 620;
	const SCAN_MS = 700;

	let clock = $state(0);
	let shake = $state({ x: 0, y: 0 });

	onMount(() => {
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.1 });
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			clock = now - start;
			// the jolt of the plate seating, decaying over SEAT_MS
			const s = Math.max(0, 1 - clock / SEAT_MS);
			const amp = (props.compact ? 5 : 9) * s * s;
			shake = amp > 0.05
				? { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp }
				: { x: 0, y: 0 };
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
	const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;

	// Seats with a short overshoot instead of arriving from off-screen.
	const seat = $derived.by(() => {
		const p = clamp01(clock / SEAT_MS);
		return 1 + 0.06 * (1 - easeOut(p)) - 0.02 * Math.sin(easeOut(p) * Math.PI);
	});
	/** self-additive flash as it powers on — the plate lights its own edge */
	const powerFlash = $derived(Math.exp(-clock / 150) * 0.7);

	const halfW = SIGN_SIZES.width * 0.47;
	const halfH = SIGN_SIZES.height * 0.35;

	const drawFx = (g: PixiGraphics) => {
		g.clear();

		// ── charge tracing the bezel ─────────────────────────────────────────
		// A bright run chasing once round the plate. Pixi v8 has no dashed stroke
		// and no path-following, so the perimeter is parameterised directly and
		// the lit arc is drawn as a short polyline sampled along it.
		const tp = clamp01(clock / TRACE_MS);
		if (tp > 0 && tp < 1) {
			const w2 = halfW * 2;
			const h2 = halfH * 2;
			const perim = (w2 + h2) * 2;
			/** u in 0..1 -> a point on the rectangle, starting at the top-left */
			const at = (u: number): [number, number] => {
				let d = (u % 1) * perim;
				if (d < w2) return [-halfW + d, -halfH];
				d -= w2;
				if (d < h2) return [halfW, -halfH + d];
				d -= h2;
				if (d < w2) return [halfW - d, halfH];
				d -= w2;
				return [-halfW, halfH - d];
			};
			const RUN = 0.2;
			const STEPS = 20;
			for (let i = 0; i < STEPS; i++) {
				const [x0, y0] = at(tp + (RUN * i) / STEPS);
				const [x1, y1] = at(tp + (RUN * (i + 1)) / STEPS);
				g.moveTo(x0, y0);
				g.lineTo(x1, y1);
				// brightest at the head of the run, fading back along the tail
				g.stroke({
					width: 5,
					color: 0xeafff2,
					alpha: 0.9 * (i / STEPS) ** 2 * Math.sin(tp * Math.PI) ** 0.5,
					cap: 'round',
				});
			}
		}

		// ── scan band running down the readout ───────────────────────────────
		const sp = clamp01((clock - 120) / SCAN_MS);
		if (sp > 0 && sp < 1) {
			const y = -halfH + sp * halfH * 2;
			for (const [half, alpha] of [
				[halfH * 0.42, 0.05],
				[halfH * 0.18, 0.09],
				[halfH * 0.05, 0.2],
			] as [number, number][]) {
				const top = Math.max(-halfH, y - half);
				const bottom = Math.min(halfH, y + half);
				if (bottom <= top) continue;
				g.rect(-halfW, top, halfW * 2, bottom - top);
				g.fill({ color: 0x4bd67f, alpha: alpha * Math.sin(sp * Math.PI) });
			}
			g.moveTo(-halfW, y);
			g.lineTo(halfW, y);
			g.stroke({ width: 2, color: 0xeafff2, alpha: 0.4 * Math.sin(sp * Math.PI) });
		}
	};
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x + shake.x}
		y={context.stateGameDerived.boardLayout().y + shake.y}
		scale={seat}
	>
		<Sprite key="mcFsSign" anchor={0.5} {...SIGN_SIZES} />
		<!-- the plate lighting itself: an additive copy, same trick the symbols use -->
		{#if powerFlash > 0.01}
			<Sprite key="mcFsSign" anchor={0.5} {...SIGN_SIZES} blendMode="add" alpha={powerFlash} />
		{/if}
		<Graphics draw={drawFx} />
		<!-- the panel is symmetrical, so the text block only needs a hair of drop to
		     sit optically centred; 0.06 pushed AWARDED onto the lower rivet line -->
		<Container y={SIGN_SIZES.height * 0.02}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

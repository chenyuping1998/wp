<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';

	import { SYMBOL_SIZE, WIN_HOLD_MS, WIN_HOLD_TURBO_MS, winFxFor } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** which symbol this is, so the presentation can be scaled to its worth */
		symbolName?: string;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const fx = $derived(winFxFor(props.symbolName ?? 'H5'));

	// Elapsed time, 0..1 over the hold.
	let t = $state(0);

	onMount(() => {
		// oncomplete is deliberately NOT called here.
		//
		// It used to be, "so the state machine isn't blocked" - but Board awaits
		// exactly that callback and then moves the symbol to 'postWinStatic', which
		// unmounts this component. Firing it on mount meant every win animation was
		// created and destroyed inside a single frame: the glow existed for about
		// 16ms and players could not tell which symbols had paid. The hold below is
		// the animation; oncomplete goes at the end of it.
		//
		// Board awaits this, so the hold is also the pace of the spin. Turbo gets a
		// much shorter one - a base game hits about one spin in three, and a full
		// second of held highlight on every one of them is what makes turbo stop
		// feeling like turbo.
		const hold = stateBet.isTurbo ? WIN_HOLD_TURBO_MS : WIN_HOLD_MS;
		const start = performance.now();
		let raf = 0;
		const step = (now: number) => {
			t = Math.min(1, (now - start) / hold);
			if (t < 1) {
				raf = requestAnimationFrame(step);
			} else {
				props.oncomplete?.();
			}
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});

	// ── the beats ─────────────────────────────────────────────────────────────
	// CHARGE the tile draws in; SNAP it pops, relights itself and throws a
	// shockwave; SETTLE everything decays and the symbol breathes until the hold
	// ends. Same shape as the baked proof-of-concept, expressed as transforms and
	// vector FX so it costs no new art and stays sharp at any board scale.
	const SNAP = 0.16;

	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
	const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;

	/** 0 before the snap, then 0..1 through the decay */
	const p = $derived(t < SNAP ? -1 : (t - SNAP) / (1 - SNAP));

	const scale = $derived.by(() => {
		if (p < 0) {
			const u = t / SNAP;
			return { x: 1 - 0.09 * u * u, y: 1 - 0.09 * u * u };
		}
		const s = 1 + fx.pop * Math.exp(-4.5 * p) * Math.cos(p * 7.5);
		// wide and flat on the hit, so the pop has weight rather than just size
		const squash = 0.09 * Math.exp(-7 * p);
		return { x: s * (1 + squash), y: s * (1 - squash) };
	});

	// The artwork relighting ITSELF: an additive copy of the same sprite. Adding
	// the art to itself blows out the bright neon strokes and leaves the dark
	// tile almost untouched, which is exactly the "the glyph fires" look and
	// needs no mask, no shader and no second asset. An additive WHITE overlay
	// would have washed the tile out along with the strokes.
	const relight = $derived(p < 0 ? 0.25 * (t / SNAP) : fx.flash * Math.exp(-9 * p));

	const halo = $derived(
		p < 0 ? fx.halo * 0.5 * (t / SNAP) : fx.halo * Math.exp(-3.2 * p) + fx.halo * 0.35 * (1 - p),
	);

	// Deterministic spark field: a win that throws a different shape every time
	// reads as noise. Biased upward — on this board everything of value travels
	// toward the meter above it.
	const SPARKS = $derived.by(() => {
		let seed = 613 + fx.sparks * 97;
		const rand = () => {
			seed = (seed * 1103515245 + 12345) % 2147483648;
			return seed / 2147483648;
		};
		return Array.from({ length: fx.sparks }, () => ({
			a: -Math.PI / 2 + (rand() - 0.5) * 2.6,
			speed: 0.55 + rand() * 0.75,
			len: SYMBOL_SIZE * (0.05 + rand() * 0.09),
			w: 1.2 + rand() * 1.4,
		}));
	});

	const half = SYMBOL_SIZE * 0.5;

	const draw = (g: PixiGraphics) => {
		g.clear();

		// halo — a rounded rect, because the tiles are rounded squares. A disc
		// behind a square tile reads as the wrong object.
		if (halo > 0.004) {
			for (const [grow, a] of [
				[half * 0.5, 0.35],
				[half * 0.28, 0.5],
				[half * 0.1, 0.7],
			] as [number, number][]) {
				const r = half + grow;
				g.roundRect(-r, -r, r * 2, r * 2, r * 0.3);
				g.fill({ color: fx.color, alpha: halo * a });
			}
		}

		// charge ring, closing onto the tile
		if (t < SNAP + 0.02) {
			const u = clamp01(t / SNAP);
			const r = half * (1.7 - 0.55 * easeOut(u));
			g.roundRect(-r, -r, r * 2, r * 2, r * 0.3);
			g.stroke({ width: 1.2 + 1.8 * u, color: 0xeafff2, alpha: (0.08 + 0.4 * u) * fx.flash });
		}

		// shockwave
		for (let i = 0; i < fx.rings; i++) {
			const rp = clamp01((p - i * 0.11) / 0.55);
			if (p < 0 || rp <= 0 || rp >= 1) continue;
			const r = half * (0.95 + 0.9 * easeOut(rp));
			g.roundRect(-r, -r, r * 2, r * 2, r * 0.3);
			g.stroke({
				width: (i === 0 ? 5 : 3) * (1 - rp) + 0.7,
				color: i === 0 ? 0xeafff2 : fx.color,
				alpha: 0.75 * (1 - rp) ** 1.3,
			});
		}

		// sparks
		const sp = clamp01(p / 0.75);
		if (p >= 0 && sp < 1) {
			for (const s of SPARKS) {
				const d = half * (0.85 + s.speed * easeOut(sp) * 1.1);
				const x = Math.cos(s.a) * d;
				const y = Math.sin(s.a) * d - sp * SYMBOL_SIZE * 0.11;
				g.moveTo(x, y);
				g.lineTo(x + Math.cos(s.a) * s.len * (1 - sp), y + Math.sin(s.a) * s.len * (1 - sp));
			}
			g.stroke({
				width: 1.8 * (1 - sp * 0.6),
				color: sp < 0.35 ? 0xeafff2 : fx.color,
				alpha: 0.85 * (1 - sp) ** 0.8,
				cap: 'round',
			});
		}
	};
</script>

<Container x={props.x} y={props.y}>
	<Graphics {draw} />
	<Container scale={{ x: scale.x, y: scale.y }}>
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
		/>
		{#if relight > 0.01}
			<Sprite
				anchor={0.5}
				key={props.symbolInfo.assetKey}
				width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
				height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
				blendMode="add"
				alpha={Math.min(1, relight)}
			/>
		{/if}
	</Container>
</Container>

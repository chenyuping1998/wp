<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { CHROME_LIGHT, LIME, MAGENTA, symbolNeon } from '../game/palette';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 240;
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

	// squash on impact → stretch rebound → settle (amplified for a heavier
	// thud: deeper flatten, taller overshoot)
	const squash = $derived.by(() => {
		if (t < 0.35) {
			const p = t / 0.35;
			return { x: 1 + 0.16 * p, y: 1 - 0.26 * p };
		}
		if (t < 0.7) {
			const p = (t - 0.35) / 0.35;
			return { x: 1.16 - 0.25 * p, y: 0.74 + 0.36 * p };
		}
		const p = (t - 0.7) / 0.3;
		return { x: 0.91 + 0.09 * p, y: 1.1 - 0.1 * p };
	});

	// A hard-edged band of light rakes across the cell as the symbol sets, the way
	// a spotlight crosses a chrome surface. It runs over the first 55% of the land
	// so it reads as part of the impact rather than a separate effect, and it is
	// tinted to the symbol's own hue at low alpha so a full board of landings does
	// not turn into a wall of white.
	const sweep = $derived.by(() => {
		const p = t / 0.55;
		if (p >= 1) return null;
		// eased so it enters fast and trails out
		const e = 1 - (1 - p) * (1 - p);
		return { offset: (e - 0.5) * SYMBOL_SIZE * 2.1, alpha: Math.sin(p * Math.PI) };
	});

	const neon = $derived(symbolNeon(props.symbolInfo.assetKey));

	// The two symbols that change what a spin is worth get their own landing
	// beat, so the player registers them before reading the rest of the board.
	// Both are shaped to finish inside the existing 240ms land: the state machine
	// waits on this component's oncomplete, so stretching the envelope for two
	// symbols would desync the reel-stop cadence for the sake of a flourish.
	const isWild = $derived(props.symbolInfo.assetKey === 'wpW');
	const isScatter = $derived(props.symbolInfo.assetKey === 'wpS');

	// Wild: a ring of chrome light expands out of the cell — liquid metal
	// spreading — fading as it goes.
	const ripple = $derived.by(() => {
		if (!isWild || t >= 1) return null;
		const e = 1 - (1 - t) * (1 - t);
		return { radius: SYMBOL_SIZE * (0.18 + 0.5 * e), alpha: (1 - t) * 0.9 };
	});

	// Scatter: the lime starburst behind the vinyl spins up a quarter turn and
	// throws spokes outward.
	const burst = $derived.by(() => {
		if (!isScatter || t >= 1) return null;
		const e = 1 - (1 - t) * (1 - t);
		return { rotation: e * Math.PI * 0.5, reach: SYMBOL_SIZE * (0.3 + 0.34 * e), alpha: Math.sin(t * Math.PI) };
	});
</script>

<!--
	Ordinary alpha, not blendMode 'add': this draws inside the masked
	BoardContainer, where an additive child composites against an empty isolated
	render target and vanishes entirely. See SymbolWinAnim for the longer note.
-->
<Container
	x={props.x}
	y={(props.y ?? 0) + (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * (1 - squash.y)) / 2}
>
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * squash.x}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * squash.y}
	/>
	{#if sweep}
		<Graphics
			draw={(g) => {
				g.clear();
				const h = SYMBOL_SIZE * 0.62;
				const w = SYMBOL_SIZE * 0.16;
				g.beginFill(neon, 0.16 * sweep.alpha);
				g.drawRect(sweep.offset - w, -h, w * 2.2, h * 2);
				g.endFill();
				g.beginFill(0xffffff, 0.3 * sweep.alpha);
				g.drawRect(sweep.offset - w * 0.28, -h, w * 0.56, h * 2);
				g.endFill();
			}}
		/>
	{/if}

	{#if ripple}
		<Graphics
			draw={(g) => {
				g.clear();
				// two concentric rings from the chrome stops, so the ripple reads as
				// metal catching light rather than a coloured shockwave
				g.lineStyle(4.5, CHROME_LIGHT, ripple.alpha);
				g.drawCircle(0, 0, ripple.radius);
				g.lineStyle(2, MAGENTA, ripple.alpha * 0.7);
				g.drawCircle(0, 0, ripple.radius * 0.82);
				g.lineStyle(0);
			}}
		/>
	{/if}

	{#if burst}
		<Graphics
			draw={(g) => {
				g.clear();
				g.beginFill(LIME, burst.alpha * 0.5);
				// twelve spokes, matching the twelve-point starburst in the art
				for (let i = 0; i < 12; i++) {
					const a = burst.rotation + (i * Math.PI * 2) / 12;
					const a2 = a + Math.PI / 34;
					const inner = SYMBOL_SIZE * 0.26;
					g.drawPolygon([
						Math.cos(a) * inner,
						Math.sin(a) * inner,
						Math.cos(a) * burst.reach,
						Math.sin(a) * burst.reach,
						Math.cos(a2) * burst.reach,
						Math.sin(a2) * burst.reach,
						Math.cos(a2) * inner,
						Math.sin(a2) * inner,
					]);
				}
				g.endFill();
			}}
		/>
	{/if}
</Container>

<script lang="ts">
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';
	import { ColorMatrixFilter } from 'pixi.js';
	import { SYMBOL_SIZE, HYPNO_TINT, TIDE_TEAL } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { getContext } from '../game/context';
	import { tumbleTiming } from '../game/animationTimeline';
	import { clamp01 } from '../game/symbolMotion';
	import SymbolArtMesh from './SymbolArtMesh.svelte';
	type Props = { x?: number; y?: number; name: string; symbolInfo: ReturnType<typeof getSymbolInfo>; oncomplete?: () => void; petrify?: boolean };
	const props: Props = $props(), context = getContext();
	const timing = tumbleTiming({ chain: context.stateGame.tumbleChain, turbo: stateBet.isTurbo, turboLevel: stateBet.turboLevel });
	const duration = props.petrify === false ? 360 : timing.markMs;
	const stoneFilter = new ColorMatrixFilter(), stoneFilters = [stoneFilter];
	let elapsed = $state(0);
	onMount(() => {
		if (props.petrify !== false) props.oncomplete?.(); // ScatterWins owns the shared hold.
		let raf = 0, done = false;
		const start = performance.now();
		const finish = () => { if (!done) { done = true; if (props.petrify === false) props.oncomplete?.(); } };
		const tick = (now: number) => { elapsed = Math.min(duration, now - start); if (elapsed < duration) raf = requestAnimationFrame(tick); else finish(); };
		raf = requestAnimationFrame(tick);
		const fallback = setTimeout(finish, duration + 100);
		return () => { done = true; cancelAnimationFrame(raf); clearTimeout(fallback); };
	});
	const action = $derived(clamp01(elapsed / (props.petrify === false ? duration : timing.highlightMs)));
	const stone = $derived(props.petrify === false ? 0 : clamp01((elapsed - timing.highlightMs) / timing.stoneMs));
	const crackProgress = $derived(props.petrify === false ? 0 : clamp01((elapsed - timing.highlightMs - timing.stoneMs) / timing.crackMs));
	// Taken by the tide: the symbol washes toward sea foam and a teal whirl
	// winds up over it before the tumble washes it away.
	const tint = $derived(
		(Math.round(255 + (((HYPNO_TINT >> 16) & 255) - 255) * stone) << 16)
		| (Math.round(255 + (((HYPNO_TINT >> 8) & 255) - 255) * stone) << 8)
		| Math.round(255 + ((HYPNO_TINT & 255) - 255) * stone),
	);
	$effect(() => { stoneFilter.saturate(-0.45 * stone, false); stoneFilter.brightness(1 + 0.06 * stone, true); });
	const drawSpiral = (g: PixiGraphics) => {
		g.clear();
		const turns = 3, steps = 90, r = Math.min(width, height) * 0.5;
		const reach = stone * (0.55 + 0.45 * crackProgress);
		g.moveTo(0, 0);
		for (let i = 1; i <= steps * reach; i++) {
			const a = (i / steps) * turns * Math.PI * 2;
			g.lineTo(Math.cos(a) * r * (i / steps), Math.sin(a) * r * (i / steps));
		}
		g.stroke({ color: TIDE_TEAL, width: 5, alpha: 0.85 * stone, cap: 'round' });
	};
	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
</script>

<Container x={props.x} y={props.y}>
	<Container filters={stoneFilters}>
		<SymbolArtMesh name={props.name} assetKey={props.symbolInfo.assetKey} progress={action} {width} {height} {tint} />
	</Container>
	{#if stone > 0}
		<Container>
			<Sprite isMask anchor={0.5} key={props.symbolInfo.assetKey} {width} {height} />
			<Graphics draw={drawSpiral} rotation={-(stone + crackProgress) * Math.PI * 1.6} />
		</Container>
	{/if}
</Container>

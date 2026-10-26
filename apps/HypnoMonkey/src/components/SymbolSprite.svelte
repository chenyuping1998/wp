<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { untrack } from 'svelte';
	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';
	import { tumbleTiming } from '../game/animationTimeline';
	import { landingPose } from '../game/symbolMotion';
	type Props = { x?: number; y?: number; symbolInfo: ReturnType<typeof getSymbolInfo>; blur?: number; landing?: boolean; impact?: number; oncomplete?: () => void };
	const props: Props = $props(), context = getContext();
	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
	const blur = $derived(Math.max(0, Math.min(1, props.blur ?? 0)));
	let progress = $state(1);
	const pose = $derived(landingPose(progress, props.impact ?? 1));
	$effect(() => {
		props.symbolInfo.assetKey;
		if (!props.landing) { progress = 1; untrack(() => props.oncomplete?.()); return; }
		const duration = tumbleTiming({ chain: context.stateGame.tumbleChain, turbo: stateBet.isTurbo, turboLevel: stateBet.turboLevel }).settleMs;
		let raf = 0, done = false; const start = performance.now(); progress = 0;
		const finish = () => { if (done) return; done = true; progress = 1; untrack(() => props.oncomplete?.()); };
		const tick = (now: number) => { if (done) return; progress = Math.min(1, (now - start) / duration); if (progress < 1) raf = requestAnimationFrame(tick); else finish(); };
		raf = requestAnimationFrame(tick); const fallback = setTimeout(finish, duration + 80);
		return () => { done = true; cancelAnimationFrame(raf); clearTimeout(fallback); };
	});
</script>

{#if blur > 0.01}
	<Sprite x={props.x} y={(props.y ?? 0) - height * 0.21 * blur} anchor={0.5} key={props.symbolInfo.assetKey} width={width * 0.98} height={height * (1 + 0.16 * blur)} alpha={0.16 * blur} />
{/if}
<Sprite x={props.x} y={(props.y ?? 0) + height * pose.y} anchor={0.5} key={props.symbolInfo.assetKey} width={width * pose.sx} height={height * pose.sy * (1 + 0.15 * blur)} alpha={1 - 0.07 * blur} />

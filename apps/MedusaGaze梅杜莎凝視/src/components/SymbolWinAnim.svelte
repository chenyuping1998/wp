<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { getContext } from '../game/context';
	import { tumbleTiming } from '../game/animationTimeline';
	import { clamp01,winHopPose } from '../game/symbolMotion';
	import SymbolArtMesh from './SymbolArtMesh.svelte';
	type Props = { x?: number; y?: number; name: string; symbolInfo: ReturnType<typeof getSymbolInfo>; oncomplete?: () => void; petrify?: boolean };
	const props: Props = $props(), context = getContext();
	const timing = tumbleTiming({ chain: context.stateGame.tumbleChain, turbo: stateBet.isTurbo, turboLevel: stateBet.turboLevel });
	const duration = props.petrify === false ? 360 : timing.markMs;
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
	const crack = $derived(crackProgress <= 0 ? 0 : crackProgress < 1 / 3 ? 1 : crackProgress < 2 / 3 ? 2 : 3);
	const hop=$derived(winHopPose(action, props.name));
	const tension=$derived(Math.sin(crackProgress*Math.PI*5)*Math.sin(crackProgress*Math.PI)*1.7);
	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
</script>

<Container x={(props.x??0)+tension} y={(props.y??0)+hop.y*height} scale={{x:hop.sx,y:hop.sy}}>
	<SymbolArtMesh name={props.name} assetKey={props.symbolInfo.assetKey} progress={action} {width} {height} {stone} />
	{#if crack > 0}
		<Container>
			<Sprite isMask anchor={0.5} key={props.symbolInfo.assetKey} {width} {height} />
			<Sprite anchor={0.5} key={crack === 1 ? 'fxCrack1' : crack === 2 ? 'fxCrack2' : 'fxCrack3'} {width} {height} />
		</Container>
	{/if}
</Container>

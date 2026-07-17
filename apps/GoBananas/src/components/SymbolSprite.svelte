<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		// reel is in motion: draw a cheap motion blur (vertical stretch + ghosts)
		spinning?: boolean;
		// symbol just landed: impact squash before settling to static
		landing?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);

	// landing squash: hammer down, rebound, settle (~240ms)
	const sx = new Tween(1);
	const sy = new Tween(1);
	let squashing = false;
	const runSquash = async () => {
		if (squashing) return;
		squashing = true;
		sx.set(1.12, { duration: 70, easing: cubicOut });
		await sy.set(0.82, { duration: 70, easing: cubicOut });
		sx.set(0.97, { duration: 90, easing: cubicOut });
		await sy.set(1.06, { duration: 90, easing: cubicOut });
		sx.set(1, { duration: 80, easing: cubicOut });
		await sy.set(1, { duration: 80, easing: cubicOut });
		squashing = false;
		props.oncomplete?.();
	};

	$effect(() => {
		props.symbolInfo;
		if (props.landing) {
			runSquash();
		} else {
			props.oncomplete?.();
		}
	});
</script>

{#if props.spinning}
	<!-- ghost trail: same art, offset and faded, sells the motion blur -->
	<Sprite
		x={props.x}
		y={(props.y ?? 0) - height * 0.42}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * 1.18}
		alpha={0.22}
	/>
	<Sprite
		x={props.x}
		y={(props.y ?? 0) + height * 0.42}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * 1.18}
		alpha={0.22}
	/>
{/if}

<Sprite
	x={props.x}
	y={props.y}
	anchor={0.5}
	key={props.symbolInfo.assetKey}
	width={width * sx.current}
	height={props.spinning ? height * 1.3 : height * sy.current}
	alpha={props.spinning ? 0.85 : 1}
/>

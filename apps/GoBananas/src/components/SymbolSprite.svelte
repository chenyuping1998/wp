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
		// How fast the reel is travelling, 0..1, driving a cheap motion blur
		// (vertical stretch + ghosts). Continuous rather than a boolean so the
		// blur eases off through the bounce instead of snapping away the instant
		// the reel changes state.
		blur?: number;
		// symbol just landed: impact squash before settling to static
		landing?: boolean;
		// 0..1 — how heavily this symbol hits. Scatter and Wild land hardest, the
		// card royals barely at all, so weight reads as importance rather than
		// every tile bouncing identically.
		impact?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
	const blur = $derived(Math.max(0, Math.min(1, props.blur ?? 0)));

	// landing squash: hammer down, rebound, settle (~240ms). Amplitude scales with
	// `impact`, timings do not — a lighter symbol should look lighter, not slower,
	// and keeping the duration fixed means every reel still settles together.
	const sx = new Tween(1);
	const sy = new Tween(1);
	let squashing = false;
	const runSquash = async () => {
		if (squashing) return;
		squashing = true;
		// Ceiling is 1.5, not 1: the point of the tier is that Scatter and Wild hit
		// HARDER than a high-pay, and they are passed 1.25 / 1.2. Clamping at 1
		// would have flattened them back to the default and silently undone this.
		const k = Math.max(0, Math.min(1.5, props.impact ?? 1));
		const at = (v: number) => 1 + (v - 1) * k;
		sx.set(at(1.12), { duration: 70, easing: cubicOut });
		await sy.set(at(0.82), { duration: 70, easing: cubicOut });
		sx.set(at(0.97), { duration: 90, easing: cubicOut });
		await sy.set(at(1.06), { duration: 90, easing: cubicOut });
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

{#if blur > 0.01}
	<!-- ghost trail: same art, offset and faded, sells the motion blur. Offset,
	     opacity and stretch all scale with speed, so the trail shortens and fades
	     as the reel brakes rather than vanishing in one frame. -->
	<Sprite
		x={props.x}
		y={(props.y ?? 0) - height * 0.42 * blur}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * (1 + 0.18 * blur)}
		alpha={0.22 * blur}
	/>
	<Sprite
		x={props.x}
		y={(props.y ?? 0) + height * 0.42 * blur}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * (1 + 0.18 * blur)}
		alpha={0.22 * blur}
	/>
{/if}

<Sprite
	x={props.x}
	y={props.y}
	anchor={0.5}
	key={props.symbolInfo.assetKey}
	width={width * sx.current}
	height={blur > 0.01 ? height * (1 + 0.3 * blur) : height * sy.current}
	alpha={1 - 0.15 * blur}
/>

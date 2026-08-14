<script lang="ts">
	import { onMount } from 'svelte';
	import { Sprite } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { getSymbolInfo } from '../game/utils';
	import { idleClock } from '../game/idleClock.svelte';
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

	// ── idle breathing ────────────────────────────────────────────────────────
	//
	// Every symbol in this game is a still PNG, so a settled board was completely
	// motionless — which is most of the time a player spends looking at it, and it
	// is the single clearest tell that a slot has no animation in it.
	//
	// The motion is deliberately almost invisible: about one percent of scale and
	// a faint warm glow, on a slow cycle. It should never be noticed as an effect,
	// only missed when it is removed.
	onMount(() => idleClock.acquire());

	// Phase comes from the symbol's own position on the board. Neighbouring cells
	// land far apart in the cycle, so the grid never breathes as one block — which
	// is what it would do with a shared phase, and that reads as the whole board
	// being one pulsing sheet rather than forty-nine hot objects.
	const phase = $derived((props.x ?? 0) * 0.0131 + (props.y ?? 0) * 0.0207);

	// Only at rest. During a drop the blur ghosts own the look, and during the
	// landing squash this would fight the Tween for the same scale.
	const idle = $derived(blur <= 0.01 && !props.landing);
	const breath = $derived(idle ? Math.sin(idleClock.time * 0.9 + phase) : 0);
	// Two cycles that do not divide each other, so the glow is not simply the
	// scale again in another channel.
	const emberGlow = $derived(idle ? 0.5 + 0.5 * Math.sin(idleClock.time * 0.61 + phase * 1.7) : 0);
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
	width={width * sx.current * (1 + 0.012 * breath)}
	height={blur > 0.01
		? height * (1 + 0.3 * blur)
		: height * sy.current * (1 + 0.012 * breath)}
	alpha={1 - 0.15 * blur}
/>

{#if idle}
	<!--
		A trace of heat still in the metal. The same artwork drawn over itself with
		additive blending, exactly as SymbolWinAnim does it — it follows the
		symbol's own silhouette, so it needs no mask and no per-symbol authoring,
		and it keeps working for whatever art is dropped in next.

		Held at a fraction of the win effect's strength on purpose: this is a symbol
		sitting on the board, not a symbol that has just paid.
	-->
	<Sprite
		x={props.x}
		y={props.y}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * sx.current * (1 + 0.012 * breath)}
		height={height * sy.current * (1 + 0.012 * breath)}
		blendMode="add"
		tint={0xffb066}
		alpha={0.035 + 0.045 * emberGlow}
	/>
{/if}

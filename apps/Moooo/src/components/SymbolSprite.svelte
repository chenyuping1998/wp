<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolLandMotion, LAND_MS } from '../game/symbolLandMotion';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** which symbol this is — selects its landing motion */
		symbolName?: string;
		// How fast the reel is travelling, 0..1, driving a cheap motion blur
		// (vertical stretch + ghosts). Continuous rather than a boolean so the
		// blur eases off through the bounce instead of snapping away the instant
		// the reel changes state.
		blur?: number;
		// symbol just landed: impact squash before settling to static
		landing?: boolean;
		// 0..1 — how heavily this symbol hits. Scatter and Wild land hardest, the
		// fair tokens barely at all, so weight reads as importance rather than
		// every tile bouncing identically.
		impact?: number;
		// Set only while this symbol's reel is being teased for a scatter: it is
		// drawn slightly larger with an additive copy of its own art over it, so
		// the teasing reel comes forward out of the board instead of merely being
		// outlined. Values come from game/anticipationFocus.ts.
		focus?: { scale: number; bloom: number };
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
	const blur = $derived(Math.max(0, Math.min(1, props.blur ?? 0)));
	const focusScale = $derived(props.focus?.scale ?? 1);
	const focusBloom = $derived(props.focus?.bloom ?? 0);

	// ── landing ────────────────────────────────────────────────────────────────
	//
	// This used to be one shared squash — hammer to 1.12/0.82, rebound, settle —
	// run by every symbol on the board, with only its amplitude varying by tier.
	// That is the same fault three reviewers rejected the game for in the win
	// state ("poor animation": all twelve symbols moving identically), one beat
	// earlier and seen far more often, because every symbol lands on every spin
	// and only a few ever win.
	//
	// The motion now comes from game/symbolLandMotion.ts, one function per
	// symbol, and design/check_symbol_motion.mjs fails the build if any two are
	// too alike — or if a landing is too close to that symbol's own win motion,
	// which would make a win read as a second landing.
	//
	// What stays shared is the TIMING: 240ms for everyone, same as the tweens
	// this replaced. Reels stop in a cascade, so a longer settle on one symbol
	// would run into the next reel's arrival — and a lighter symbol should look
	// lighter, not slower.
	const motion = $derived(getSymbolLandMotion(props.symbolName ?? ''));
	// Elapsed milliseconds since touchdown; -1 when not landing, which is what
	// keeps a static symbol at exactly rest rather than at frame(0).
	let landT = $state(-1);
	const landing = $derived(landT >= 0 ? motion.frame(landT) : null);

	// Tier weight, applied to every deviation from rest. The table describes
	// shape at weight 1; ReelSymbol grades the symbols (Scatter 1.25 … tokens
	// 0.7). Ceiling is 1.5, not 1: the point of the tier is that Scatter and Wild
	// hit HARDER than a high-pay, and clamping at 1 would flatten them back to
	// the default and silently undo it.
	const weight = $derived(Math.max(0, Math.min(1.5, props.impact ?? 1)));
	const at = (v: number) => 1 + (v - 1) * weight;

	// rAF rather than the tween chain this replaced. The whole landing is 240ms,
	// and motions like the hay bale's second thud or the bucket's rock
	// need real frames to read as beats rather than as one blurred wobble.
	// `landT` is measured from a start timestamp, not accumulated, so a dropped
	// frame shifts nothing.
	let raf = 0;
	const runLanding = () => {
		cancelAnimationFrame(raf);
		const started = performance.now();
		const tick = (now: number) => {
			const t = now - started;
			if (t >= LAND_MS) {
				// Land exactly on rest before reporting done: ReelSymbol flips the
				// symbol to 'static' on this callback, and any residual transform
				// would snap away in the following frame.
				landT = -1;
				raf = 0;
				props.oncomplete?.();
				return;
			}
			landT = t;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	};

	$effect(() => {
		props.symbolInfo;
		if (props.landing) {
			runLanding();
		} else {
			// Not landing (spinning, static): make sure nothing is left mid-motion
			// from a landing this symbol was interrupted out of.
			cancelAnimationFrame(raf);
			raf = 0;
			landT = -1;
			props.oncomplete?.();
		}
		return () => cancelAnimationFrame(raf);
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
		width={width * 0.96 * focusScale}
		height={height * (1 + 0.18 * blur) * focusScale}
		alpha={0.22 * blur}
	/>
	<Sprite
		x={props.x}
		y={(props.y ?? 0) + height * 0.42 * blur}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96 * focusScale}
		height={height * (1 + 0.18 * blur) * focusScale}
		alpha={0.22 * blur}
	/>
{/if}

{#if landing && blur <= 0.01}
	<!--
		Landing. Wrapped in a Container so the symbol can rotate and offset about
		its own centre; the plain Sprite path below is kept for the spinning and
		static cases, which are the overwhelming majority of frames.
	-->
	<Container
		x={(props.x ?? 0) + landing.dx * SYMBOL_SIZE * weight}
		y={(props.y ?? 0) + landing.dy * SYMBOL_SIZE * weight}
		rotation={landing.rotation * weight}
	>
		<!-- dust, shockwave, converging stars: drawn behind the symbol -->
		{#each landing.overlays.filter((o) => o.behind) as overlay, i (i)}
			<Sprite
				anchor={0.5}
				key={overlay.key}
				x={overlay.x * SYMBOL_SIZE}
				y={overlay.y * SYMBOL_SIZE}
				width={overlay.width * SYMBOL_SIZE}
				height={overlay.height * SYMBOL_SIZE}
				rotation={overlay.rotation}
				alpha={overlay.alpha * Math.min(1, weight)}
				tint={overlay.tint}
				blendMode="add"
			/>
		{/each}
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={width * at(landing.scaleX)}
			height={height * at(landing.scaleY)}
		/>
		<!--
			Neon-tube ignition: an additive copy of the symbol's own art in the
			letter's colour, for the four royals — a tube seating into the sign
			lights up rather than bouncing. Zero for every other symbol, so it costs
			nothing where it is not wanted.
		-->
		{#if landing.bloomAlpha > 0.01}
			<Sprite
				anchor={0.5}
				key={props.symbolInfo.assetKey}
				width={width * at(landing.scaleX)}
				height={height * at(landing.scaleY)}
				tint={landing.bloomTint}
				alpha={landing.bloomAlpha * Math.min(1, weight)}
				blendMode="add"
			/>
		{/if}
		{#each landing.overlays.filter((o) => !o.behind) as overlay, i (i)}
			<Sprite
				anchor={0.5}
				key={overlay.key}
				x={overlay.x * SYMBOL_SIZE}
				y={overlay.y * SYMBOL_SIZE}
				width={overlay.width * SYMBOL_SIZE}
				height={overlay.height * SYMBOL_SIZE}
				rotation={overlay.rotation}
				alpha={overlay.alpha * Math.min(1, weight)}
				tint={overlay.tint}
				blendMode="add"
			/>
		{/each}
	</Container>
{:else}
	<Sprite
		x={props.x}
		y={props.y}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * focusScale}
		height={(blur > 0.01 ? height * (1 + 0.3 * blur) : height) * focusScale}
		alpha={1 - 0.15 * blur}
	/>
	<!-- focus bloom: additive copy of the same art, so the teased reel reads as
	     lit rather than just bigger -->
	{#if focusBloom > 0.01}
		<Sprite
			x={props.x}
			y={props.y}
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={width * focusScale}
			height={(blur > 0.01 ? height * (1 + 0.3 * blur) : height) * focusScale}
			tint={0xffd6f4}
			alpha={focusBloom}
			blendMode="add"
		/>
	{/if}
{/if}

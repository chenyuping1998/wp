<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import SceneLife from './SceneLife.svelte';
	import type { BonusTier } from '../game/typesBookEvent';

	const context = getContext();
	// The Don gets its own backdrop. The tier comes from the bonusTier book event,
	// which is the only thing that distinguishes the three tiers.
	//
	// This background has now failed to display TWICE for the same shape of
	// reason: first it keyed on a SUPERSPIN bet mode carried over from a sibling
	// app that this game does not have, and then — after the tiers were renamed
	// soldier/capo/don — it went on comparing against the old 'ocean_drive'
	// string, which nothing emits any more. Both times every guard stayed green,
	// because a comparison against a dead string is perfectly valid code.
	//
	// If the tiers are ever renamed again, this line and featureTiers.ts move
	// together. `BonusTier` is imported so the compiler catches it next time.
	const isBreakout = $derived(
		context.stateGame.bonusTier === ('breakout' satisfies BonusTier) &&
			context.stateGame.gameType === 'freegame',
	);
	const isRiot = $derived(
		context.stateGame.bonusTier === ('riot' satisfies BonusTier) &&
			context.stateGame.gameType === 'freegame',
	);
	const isLockdown = $derived(
		context.stateGame.bonusTier === ('lockdown' satisfies BonusTier) &&
			context.stateGame.gameType === 'freegame',
	);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');

	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still backdrop art
	// breathes instead of sitting dead behind the reels ────────────────────────
	const OVERSCAN = 1.08;
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const w = width * OVERSCAN;
		const h = height * OVERSCAN;
		const slackX = w - width;
		const slackY = h - height;
		return {
			width: w,
			height: h,
			x: -slackX * 0.5 + Math.sin(clock * 0.06) * slackX * 0.5,
			y: -slackY * 0.5 + Math.sin(clock * 0.041 + 1.1) * slackY * 0.5,
		};
	});

	onMount(() => {
		// frame clock, same rates as the old 16 ms interval (0.004 phase and
		// 0.016 s per 16 ms), without the stutter an interval gives on 120 Hz
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			clock += dt;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<!--
	Letterbox fill behind every scene, seen wherever the backdrop sprite does not
	reach the canvas edge. Was 0x0d0f05 — R13 G15 B5, a near-black OLIVE, and the
	single largest surface in the game still carrying GoBananas' hue. Now the same
	deep indigo-black uiTheme uses for valueShadow.
-->
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x14100d} zIndex={-3} />

<!-- base-game background: neon sunset -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="hmBgBase" {...parallax} />
	<SceneLife assetKey="hmBgBase" mode="base" {...parallax} time={clock} />
</FadeContainer>

<!-- LOCKDOWN: power-out cell block -->
<FadeContainer show={isLockdown} duration={SECOND} zIndex={-1}>
	<Sprite key="hmBgFeature" {...parallax} />
	<SceneLife assetKey="hmBgFeature" mode="lockdown" {...parallax} time={clock} />
</FadeContainer>

<!-- RIOT: mess hall disorder and firelight -->
<FadeContainer show={isRiot} duration={SECOND} zIndex={-1}>
	<Sprite key="hmBgRiot" {...parallax} />
	<SceneLife assetKey="hmBgRiot" mode="riot" {...parallax} time={clock} />
</FadeContainer>

<!-- BREAKOUT: the only exterior scene -->
<FadeContainer show={isBreakout} duration={SECOND} zIndex={-1}>
	<Sprite key="hmBgEpic" {...parallax} />
	<SceneLife assetKey="hmBgEpic" mode="breakout" {...parallax} time={clock} />
</FadeContainer>

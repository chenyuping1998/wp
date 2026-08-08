<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE, GAUGE_REDLINE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** Pressure gauge reading this symbol is being crushed at. 1 outside the feature. */
		pressure?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	/**
	 * A winning symbol being consumed by the forge: it is struck, heats through to
	 * white, throws off embers, then burns out as the tumble takes it.
	 *
	 * Built as a one-shot timeline rather than the endless pulse this used to be.
	 * A loop is right for a lines game, where the symbol survives and keeps
	 * flashing while the player reads the line. Here every winning symbol is
	 * destroyed a few hundred milliseconds later, so the effect has somewhere to
	 * go: it should hand over to the explosion, not be cut off mid-breath.
	 *
	 * The heat is a second copy of the symbol drawn over itself with additive
	 * blending. That lights the artwork from within and follows its silhouette
	 * exactly — no mask, no per-symbol authoring, and it keeps working for whatever
	 * art is dropped in next.
	 */
	// Past the redline the press is working hard enough to heat what it crushes:
	// the symbol goes past white and holds a beat before the tumble takes it.
	//
	// Deliberately the SAME threshold the gauge draws its redline at, rather than
	// a second number tuned independently. The gauge is the only place the player
	// can read the pressure, so if the board starts burning hotter at a reading the
	// dial still shows as amber, the two are telling different stories.
	const whiteHot = $derived((props.pressure ?? 1) >= GAUGE_REDLINE);
	const DURATION = $derived(whiteHot ? 900 : 620);

	let t = $state(0);

	// Deterministic per-instance variation. Twelve winning symbols running the
	// identical curve is the thing that reads as machinery; a small spread in ember
	// direction and timing is enough to break it.
	const seed = Math.random();
	const EMBERS = $derived(whiteHot ? 9 : 5);
	const embers = $derived(Array.from({ length: EMBERS }, (_, i) => ({
		angle: -Math.PI / 2 + (i - (EMBERS - 1) / 2) * 0.42 + (seed - 0.5) * 0.5,
		speed: 0.55 + ((i * 7 + seed * 13) % 10) / 22,
		size: 0.1 + ((i * 5 + seed * 11) % 7) / 60,
		delay: 0.06 * i + seed * 0.05,
	})));

	onMount(() => {
		// Resolve immediately: ClusterWins owns how long the board holds on a win,
		// and blocking it on this animation is what made a nine-link chain take
		// twenty-five seconds.
		props.oncomplete?.();

		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = Math.min(1, (now - start) / DURATION);
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeOut = (v: number) => 1 - (1 - v) ** 3;

	// Struck: a fast overshoot in the first sixth, then a slow settle. The squash
	// is vertical only, so it reads as a blow landing from above.
	const punch = $derived(t < 0.16 ? easeOut(t / 0.16) : 1 - (t - 0.16) / 0.84);
	const scaleX = $derived(1 + 0.2 * punch);
	const scaleY = $derived(1 + 0.2 * punch - 0.07 * (t < 0.16 ? punch : 0));

	// Heat builds to white through the first half and holds, so the symbol is at
	// its hottest exactly when the tumble comes for it...
	const heat = $derived(Math.min(1, t / 0.45));
	// ...then the whole thing dims as it is consumed.
	const burn = $derived(t < 0.72 ? 1 : Math.max(0, 1 - (t - 0.72) / 0.28));

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
</script>

<Container x={props.x} y={props.y}>
	<!-- bloom behind, so the symbol sits in its own light -->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		width={SYMBOL_SIZE * (1.1 + heat * (whiteHot ? 1.05 : 0.7))}
		height={SYMBOL_SIZE * (1.1 + heat * (whiteHot ? 1.05 : 0.7))}
		tint={whiteHot ? 0xfff0c8 : 0xff9b32}
		blendMode="add"
		alpha={(whiteHot ? 0.8 : 0.5) * heat * burn}
	/>

	<Container scale={{ x: scaleX, y: scaleY }}>
		<Sprite anchor={0.5} key={props.symbolInfo.assetKey} {width} {height} alpha={burn} />

		<!--
			The same sprite again, additive. It follows the artwork's own silhouette,
			so the symbol glows from the inside instead of gaining a pasted-on shape.
		-->
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			{width}
			{height}
			blendMode="add"
			tint={whiteHot ? 0xfffdf4 : 0xffd9a0}
			alpha={(whiteHot ? 1 : 0.75) * heat * burn}
		/>
	</Container>

	<!-- embers lifting off the strike -->
	{#each embers as ember, index (index)}
		{@const et = Math.max(0, Math.min(1, (t - ember.delay) / (1 - ember.delay)))}
		{#if et > 0}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={Math.cos(ember.angle) * SYMBOL_SIZE * ember.speed * easeOut(et)}
				y={Math.sin(ember.angle) * SYMBOL_SIZE * ember.speed * easeOut(et) +
					SYMBOL_SIZE * 0.35 * et * et}
				width={SYMBOL_SIZE * ember.size * (1 - et * 0.5)}
				height={SYMBOL_SIZE * ember.size * (1 - et * 0.5)}
				tint={0xffc46a}
				blendMode="add"
				alpha={(1 - et) * 0.9}
			/>
		{/if}
	{/each}
</Container>

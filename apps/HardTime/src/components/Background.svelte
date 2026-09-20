<script lang="ts">
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
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

	let beamPhase = $state(0);
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

	/**
	 * The near-camera band, drifting further than the plate behind it.
	 *
	 * The whole picture moving as one block is a pan, not parallax: depth is the
	 * thing CLOSE to camera travelling further. The round-2 background finally
	 * has something close to camera — the yacht deck on the right — so it is cut
	 * out (design/build_background_layers.py) and drawn back over the plate on
	 * its own, larger drift.
	 *
	 * NEAR_GAIN is what the depth actually is, and it is bounded by the crop.
	 *
	 * The band carries about 90px of dark plate in front of the railing, and the
	 * near layer must not slide further than that or it stops covering its own
	 * original and the deck doubles. The plate's own amplitude is half its
	 * overscan slack — 72px on a 1800-wide canvas — so the extra travel is
	 * 72 * (GAIN - 1): at the 2.4 first tried that is 100px, past the margin.
	 * Measured on the first build, the near band moved 30px+ while the city moved
	 * 0, which is separation, but bought at the price of an artefact nobody had
	 * looked for yet. 1.5 gives 36px of extra travel — half again as far as the
	 * plate, comfortably inside the margin.
	 */
	const NEAR_FRACTION = 0.36;
	const NEAR_GAIN = 1.5;
	const nearLayer = $derived.by(() => {
		const far = parallax;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const w = width * OVERSCAN;
		const h = height * OVERSCAN;
		const slackX = w - width;
		const slackY = h - height;
		// The same two sines the plate uses, so the two layers stay in phase and
		// read as one scene at different depths rather than as two things
		// wandering independently.
		const extraX = Math.sin(clock * 0.06) * slackX * 0.5 * (NEAR_GAIN - 1);
		const extraY = Math.sin(clock * 0.041 + 1.1) * slackY * 0.5 * (NEAR_GAIN - 1);
		return {
			width: w * NEAR_FRACTION,
			height: h,
			x: far.x + w * (1 - NEAR_FRACTION) + extraX,
			y: far.y + extraY,
		};
	});

	// ── floating bokeh: neon haze drifting up with a gentle sway. Soft textured
	// motes (fxGlow), never hard vector circles ────────────────────────────────
	// Was the jungle pollen/firefly set; 0xd9e88a is pale olive and these motes
	// are on screen on EVERY spin, not just during a feature. Swapped for pink.
	const MOTE_COLORS = [0x8e9499, 0xb8ad95, 0x76513b, 0x6b7278];
	const NIGHT_COLORS = [0xb8c7cf, 0xd6d8d8, 0x8fb4c8, 0x6b7278];
	const motes = Array.from({ length: 22 }, (_, i) => ({
		seedX: Math.random(),
		seedY: Math.random(),
		size: 12 + Math.random() * 46,
		colorIndex: i % 4,
		phase: Math.random() * Math.PI * 2,
		riseSpeed: 0.012 + Math.random() * 0.022,
		swayAmp: 18 + Math.random() * 46,
		alpha: 0.1 + Math.random() * 0.22,
	}));

	const moteState = (mote: (typeof motes)[number]) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// wrap upward: y walks from below the canvas to above it, then repeats
		const progress = (mote.seedY + clock * mote.riseSpeed) % 1;
		return {
			x: mote.seedX * width + Math.sin(clock * 0.7 + mote.phase) * mote.swayAmp,
			y: height * (1.05 - progress * 1.15),
			// fade in and out at the ends of the run so nothing pops
			alpha: mote.alpha * Math.sin(progress * Math.PI) ** 0.6,
		};
	};

	const drawSoftBeams = (g: PixiGraphics, phaseShift = 0) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const beamReachY = Math.min(height * 0.42, 340);
		const centerX = width * 0.5 + Math.sin(beamPhase + phaseShift) * width * 0.15;

		g.clear();

		// Keep beams very subtle and in the upper area so they don't distract from
		// reels. Were 0xfff0b8 / 0xffd43b — warm gold god-rays, described in the
		// old comment as keeping "the still jungle art" breathing. They are now
		// pink and cyan: over a synthwave sunset a warm shaft reads as daylight
		// through a canopy, which is the wrong world entirely.
		g.beginFill(0x8e9499, 0.035);
		g.drawPolygon([
			centerX - width * 0.018,
			0,
			centerX + width * 0.018,
			0,
			centerX + width * 0.22,
			beamReachY,
			centerX - width * 0.22,
			beamReachY,
		]);
		g.endFill();

		g.beginFill(0xe6dfd1, 0.022);
		g.drawPolygon([
			centerX + width * 0.11,
			0,
			centerX + width * 0.135,
			0,
			centerX + width * 0.32,
			beamReachY * 0.9,
			centerX + width * 0.26,
			beamReachY * 0.9,
		]);
		g.endFill();
	};

	onMount(() => {
		const id = setInterval(() => {
			beamPhase += 0.004;
			clock += 0.016;
		}, 16);
		return () => clearInterval(id);
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
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
</FadeContainer>

<!-- LOCKDOWN: power-out cell block -->
<FadeContainer show={isLockdown} duration={SECOND} zIndex={-1}>
	<Sprite key="hmBgFeature" {...parallax} />
</FadeContainer>

<!-- RIOT: mess hall disorder and firelight -->
<FadeContainer show={isRiot} duration={SECOND} zIndex={-1}>
	<Sprite key="hmBgRiot" {...parallax} />
</FadeContainer>

<!-- BREAKOUT: the only exterior scene -->
<FadeContainer show={isBreakout} duration={SECOND} zIndex={-1}>
	<Sprite key="hmBgEpic" {...parallax} />
</FadeContainer>

<!-- ambient bokeh drifting in front of whichever scene is showing -->
<Container zIndex={-1}>
	{#each motes as mote, index (index)}
		{@const state = moteState(mote)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={state.x}
			y={state.y}
			tint={(isBreakout ? NIGHT_COLORS : MOTE_COLORS)[mote.colorIndex]}
			blendMode="add"
			width={mote.size}
			height={mote.size}
			alpha={state.alpha}
		/>
	{/each}
</Container>

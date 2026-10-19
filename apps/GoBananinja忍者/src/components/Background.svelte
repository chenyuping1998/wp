<script lang="ts">
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import GridMesh from './GridMesh.svelte';

	const context = getContext();
	const isSuperspin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame' && !isSuperspin);
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame' && !isSuperspin);

	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still jungle art
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

	// ── a few cherry petals drifting down through the night (2026-10-16) ──
	//
	// This used to be the jungle game's leftovers: 22 additive pollen blobs up to
	// 58px wide and two sun shafts swinging across the top of a MOONLIT village
	// that has no sun. Big soft blobs over the art are exactly what makes a
	// board look out of focus, and a light the painting does not have reads as a
	// template nobody removed. Now: nine small, sharp-edged petals, falling
	// slowly on a diagonal and tumbling as they go (the flip is the leaf's own
	// width narrowing, not a wobble) — the one thing that moves in the scene.
	const PETAL_TINTS = [0xf4b6c6, 0xf8cdd8, 0xeaa2b6];
	const SPARK_TINTS = [0xcfe4ff, 0xe8f2ff, 0xb8d4ff];
	const petals = Array.from({ length: 9 }, (_, i) => ({
		seedX: Math.random(),
		seedY: Math.random(),
		size: 13 + Math.random() * 9,
		tint: i % 3,
		// one fall across the screen takes 26-40 s
		fallSpeed: 0.025 + Math.random() * 0.013,
		drift: 0.18 + Math.random() * 0.14,
		tumble: 0.9 + Math.random() * 0.8,
		phase: Math.random() * Math.PI * 2,
		spin: (Math.random() - 0.5) * 0.9,
	}));

	const petalState = (petal: (typeof petals)[number]) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const progress = (petal.seedY + clock * petal.fallSpeed) % 1;
		const flip = Math.cos(clock * petal.tumble + petal.phase);
		return {
			// falls left to right, the way the headband tails blow
			x: ((petal.seedX + progress * petal.drift) % 1.1) * width - width * 0.05,
			y: height * (-0.05 + progress * 1.1),
			rotation: petal.phase + clock * petal.spin,
			// the petal turning over: its width narrows through edge-on and back
			scaleX: 0.25 + 0.75 * Math.abs(flip),
			alpha: 0.75 * Math.min(1, progress * 8, (1 - progress) * 8),
		};
	};

	onMount(() => {
		const id = setInterval(() => {
			clock += 0.016;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x0d0f05} zIndex={-3} />

<!-- 金色日出叢林 base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<GridMesh assetKey="gbBgBase" kind="background" name="base" seconds={clock} {...parallax} />
</FadeContainer>

<!-- 烈日突擊 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<GridMesh assetKey="gbBgFeature" kind="background" name="feature" seconds={clock} {...parallax} />
</FadeContainer>

<!-- 夜襲 superspin background -->
<FadeContainer show={isSuperspin} duration={SECOND} zIndex={-1}>
	<GridMesh assetKey="gbBgSuperspin" kind="background" name="superspin" seconds={clock} {...parallax} />
</FadeContainer>

<!-- the petals, in front of whichever scene is showing (silver sparks in the
     treasure room, which has no tree) -->
<Container zIndex={-1}>
	{#each petals as petal, index (index)}
		{@const state = petalState(petal)}
		<Sprite
			key="fxLeaf"
			anchor={0.5}
			x={state.x}
			y={state.y}
			rotation={state.rotation}
			tint={(isSuperspin ? SPARK_TINTS : PETAL_TINTS)[petal.tint]}
			width={petal.size * state.scaleX}
			height={petal.size * 1.25}
			alpha={state.alpha}
		/>
	{/each}
</Container>

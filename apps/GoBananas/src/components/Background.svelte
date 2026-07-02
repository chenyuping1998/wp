<script lang="ts">
	import { Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame' && !isSuperspin);
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame' && !isSuperspin);

	let sway = $state(0);
	let beamPhase = $state(0);

	const drawSoftBeams = (g: PixiGraphics, phaseShift = 0) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const beamReachY = Math.min(height * 0.42, 340);
		const centerX = width * 0.5 + Math.sin(beamPhase + phaseShift) * width * 0.15;

		g.clear();

		// Keep beams very subtle and in the upper area so they don't distract from reels.
		g.beginFill(0xfff0b8, 0.05);
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

		g.beginFill(0xffd43b, 0.035);
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
			sway += 0.016;
			beamPhase += 0.004;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x160505} zIndex={-3} />

<!-- 青綠山水 base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...context.stateLayoutDerived.canvasSizes()} />
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
	<!-- swaying red lantern -->
	<Sprite
		key="gbH2"
		anchor={{ x: 0.5, y: 0.08 }}
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={40}
		width={130}
		height={130}
		alpha={0.85}
		rotation={Math.sin(sway) * 0.09}
	/>
</FadeContainer>

<!-- 紅金慶典 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...context.stateLayoutDerived.canvasSizes()} />
	<Graphics draw={(g) => drawSoftBeams(g, 1.2)} />
	<Sprite
		key="gbH2"
		anchor={{ x: 0.5, y: 0.08 }}
		x={120}
		y={36}
		width={120}
		height={120}
		alpha={0.85}
		rotation={Math.sin(sway + 0.8) * 0.11}
	/>
</FadeContainer>

<!-- 月夜 superspin background -->
<FadeContainer show={isSuperspin} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgSuperspin" {...context.stateLayoutDerived.canvasSizes()} />
</FadeContainer>

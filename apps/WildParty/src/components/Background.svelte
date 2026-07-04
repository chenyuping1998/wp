<script lang="ts">
	import { Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	let beamPhase = $state(0);
	let tick = $state(0);

	// deterministic pseudo-random layout so the ambient layers are stable
	let seed = 1337;
	const rand = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};

	const BOKEH_COLORS = [0xfff0b8, 0xff8ede, 0x9ef3ff, 0xffffff];
	// two depths: big slow blurry orbs at low alpha + small brighter motes
	const BOKEH = Array.from({ length: 24 }, (_, i) => ({
		x: rand(),
		phase: rand(),
		rise: i < 10 ? 6 + rand() * 6 : 14 + rand() * 12,
		size: i < 10 ? 9 + rand() * 8 : 2.5 + rand() * 4,
		swayAmp: 12 + rand() * 22,
		swayFreq: 0.4 + rand() * 0.7,
		alpha: i < 10 ? 0.05 + rand() * 0.05 : 0.1 + rand() * 0.14,
		color: BOKEH_COLORS[i % BOKEH_COLORS.length],
	}));

	const CONFETTI_COLORS = [0xffd75e, 0xff8ede, 0x9ef3ff, 0xc59bff, 0x9effb0];
	const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
		x: rand(),
		phase: rand(),
		fall: 42 + rand() * 55,
		size: 6 + rand() * 5,
		swayAmp: 18 + rand() * 26,
		swayFreq: 0.5 + rand() * 0.9,
		rotSpeed: (rand() - 0.5) * 6,
		color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
	}));

	const drawSoftBeams = (g: PixiGraphics, phaseShift = 0) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const beamReachY = Math.min(height * 0.58, 480);
		const centerX = width * 0.5 + Math.sin(beamPhase + phaseShift) * width * 0.15;
		const counterX = width * 0.5 - Math.sin(beamPhase * 0.8 + phaseShift + 1.1) * width * 0.19;
		// concert-style flicker so the spotlights feel alive
		const flicker = 1 + 0.3 * Math.sin(beamPhase * 7 + phaseShift * 3);

		g.clear();

		g.beginFill(0xfff0b8, 0.13 * flicker);
		g.drawPolygon([
			centerX - width * 0.02,
			0,
			centerX + width * 0.02,
			0,
			centerX + width * 0.24,
			beamReachY,
			centerX - width * 0.24,
			beamReachY,
		]);
		g.endFill();

		g.beginFill(0xff8bd8, 0.1 * flicker);
		g.drawPolygon([
			centerX + width * 0.11,
			0,
			centerX + width * 0.14,
			0,
			centerX + width * 0.34,
			beamReachY * 0.9,
			centerX + width * 0.27,
			beamReachY * 0.9,
		]);
		g.endFill();

		// counter-sweeping cyan beam for depth
		g.beginFill(0x9ef3ff, 0.09 * flicker);
		g.drawPolygon([
			counterX - width * 0.016,
			0,
			counterX + width * 0.016,
			0,
			counterX - width * 0.26,
			beamReachY * 0.95,
			counterX - width * 0.32,
			beamReachY * 0.95,
		]);
		g.endFill();

		// hot cores inside the main beams
		g.beginFill(0xffffff, 0.07 * flicker);
		g.drawPolygon([
			centerX - width * 0.008,
			0,
			centerX + width * 0.008,
			0,
			centerX + width * 0.09,
			beamReachY * 0.85,
			centerX - width * 0.09,
			beamReachY * 0.85,
		]);
		g.endFill();
	};

	// party balloons swaying as they drift slowly upward
	const BALLOON_COLORS = [0xff6b9d, 0xffd75e, 0x9ef3ff, 0xc59bff, 0x9effb0, 0xff9d6b];
	const BALLOONS = Array.from({ length: 6 }, (_, i) => ({
		x: 0.06 + rand() * 0.88,
		phase: rand(),
		rise: 9 + rand() * 9,
		size: 24 + rand() * 12,
		swayAmp: 20 + rand() * 22,
		swayFreq: 0.45 + rand() * 0.5,
		color: BALLOON_COLORS[i % BALLOON_COLORS.length],
	}));

	const drawBalloons = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const seconds = tick / 62.5;
		g.clear();
		for (const balloon of BALLOONS) {
			const travel = height + balloon.size * 6;
			const y =
				height + balloon.size * 3 -
				((seconds * balloon.rise + balloon.phase * travel) % travel);
			const swayPhase = seconds * balloon.swayFreq + balloon.phase * 8;
			const x = balloon.x * width + Math.sin(swayPhase) * balloon.swayAmp;
			const edge = Math.min(1, (height - y) / 110, (y + balloon.size * 3) / 110);
			if (edge <= 0) continue;
			const alpha = 0.82 * edge;
			const rx = balloon.size * 0.82;
			const ry = balloon.size;

			// wavy string, bending opposite to the sway direction
			const lean = Math.cos(swayPhase) * balloon.swayAmp * 0.35;
			g.lineStyle(1.6, 0xffffff, alpha * 0.5);
			g.moveTo(x, y + ry + 6);
			g.quadraticCurveTo(x - lean, y + ry + 34, x - lean * 0.4, y + ry + 62);
			g.lineStyle(0);

			// body + knot + highlight
			g.beginFill(balloon.color, alpha);
			g.drawEllipse(x, y, rx, ry);
			g.drawPolygon([x - 5, y + ry + 7, x + 5, y + ry + 7, x, y + ry - 2]);
			g.endFill();
			g.beginFill(0xffffff, alpha * 0.4);
			g.drawEllipse(x - rx * 0.35, y - ry * 0.38, rx * 0.26, ry * 0.32);
			g.endFill();
		}
	};

	// floating party bokeh, drifting up with a gentle sway
	const drawBokeh = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const seconds = tick / 62.5;
		g.clear();
		for (const orb of BOKEH) {
			const travel = height + orb.size * 4;
			const y = height + orb.size * 2 - ((seconds * orb.rise + orb.phase * travel) % travel);
			const x =
				orb.x * width + Math.sin(seconds * orb.swayFreq + orb.phase * 9) * orb.swayAmp;
			// fade near top and bottom edges
			const edge = Math.min(1, (height - y) / 90, (y + orb.size * 2) / 90);
			if (edge <= 0) continue;
			g.beginFill(orb.color, orb.alpha * edge);
			g.drawCircle(x, y, orb.size);
			g.endFill();
		}
	};

	// feature only: confetti raining down over the party
	const drawConfetti = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const seconds = tick / 62.5;
		g.clear();
		for (const piece of CONFETTI) {
			const travel = height + 60;
			const y = ((seconds * piece.fall + piece.phase * travel) % travel) - 30;
			const x =
				piece.x * width + Math.sin(seconds * piece.swayFreq + piece.phase * 7) * piece.swayAmp;
			const rot = seconds * piece.rotSpeed + piece.phase * 6;
			const cos = Math.cos(rot);
			const sin = Math.sin(rot);
			// flutter: the strip narrows as it "turns" in the air
			const w = piece.size * (0.35 + 0.65 * Math.abs(Math.sin(seconds * 2 + piece.phase * 11)));
			const h = piece.size * 0.55;
			g.beginFill(piece.color, 0.75);
			g.drawPolygon([
				x + cos * w - sin * h,
				y + sin * w + cos * h,
				x - cos * w - sin * h,
				y - sin * w + cos * h,
				x - cos * w + sin * h,
				y - sin * w - cos * h,
				x + cos * w + sin * h,
				y + sin * w - cos * h,
			]);
			g.endFill();
		}
	};

	onMount(() => {
		const id = setInterval(() => {
			beamPhase += 0.004;
			tick += 1;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x120016} zIndex={-3} />

<!-- Wild Party base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="wildPartyBgBase" {...context.stateLayoutDerived.canvasSizes()} />
	<Graphics draw={drawBokeh} />
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
	<Graphics draw={drawBalloons} />
	<Graphics draw={drawConfetti} />
</FadeContainer>

<!-- Wild Party free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="wildPartyBgFeature" {...context.stateLayoutDerived.canvasSizes()} />
	<Graphics draw={drawBokeh} />
	<Graphics draw={(g) => drawSoftBeams(g, 1.2)} />
	<Graphics draw={drawBalloons} />
	<Graphics draw={drawConfetti} />
</FadeContainer>

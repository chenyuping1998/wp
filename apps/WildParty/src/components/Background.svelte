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

	// bg-art palette: gold / magenta / violet / hot pink (matches the club scene)
	const CONFETTI_COLORS = [0xffb833, 0xff2fa0, 0x4fc3ff, 0xb04ef0, 0xffe066];
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

	// lighten/darken a hex color so flat Graphics shapes can fake the bg's
	// glossy rendered shading
	const shade = (color: number, factor: number) => {
		const r = Math.min(255, Math.round(((color >> 16) & 255) * factor));
		const g = Math.min(255, Math.round(((color >> 8) & 255) * factor));
		const b = Math.min(255, Math.round((color & 255) * factor));
		return (r << 16) | (g << 8) | b;
	};

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

	// glossy metallic party balloons (matching the bg art's rendered look)
	const BALLOON_COLORS = [0xffb833, 0xe0218a, 0x8a2be2, 0xff4fc3, 0xd4a017, 0xb04ef0];
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
			const alpha = 0.9 * edge;
			const rx = balloon.size * 0.82;
			const ry = balloon.size;

			// bloom halo so it sits in the same glowing atmosphere as the bg art
			g.beginFill(balloon.color, alpha * 0.1);
			g.drawEllipse(x, y, rx * 2.1, ry * 2.0);
			g.endFill();
			g.beginFill(balloon.color, alpha * 0.14);
			g.drawEllipse(x, y, rx * 1.5, ry * 1.45);
			g.endFill();

			// wavy string, bending opposite to the sway direction
			const lean = Math.cos(swayPhase) * balloon.swayAmp * 0.35;
			g.lineStyle(1.5, 0xd9b878, alpha * 0.45);
			g.moveTo(x, y + ry + 6);
			g.quadraticCurveTo(x - lean, y + ry + 34, x - lean * 0.4, y + ry + 62);
			g.lineStyle(0);

			// body: dark base → mid tone offset to the light → glossy highlights
			g.beginFill(shade(balloon.color, 0.45), alpha);
			g.drawEllipse(x, y, rx, ry);
			g.drawPolygon([x - 5, y + ry + 7, x + 5, y + ry + 7, x, y + ry - 2]);
			g.endFill();
			g.beginFill(balloon.color, alpha);
			g.drawEllipse(x - rx * 0.1, y - ry * 0.12, rx * 0.86, ry * 0.85);
			g.endFill();
			g.beginFill(shade(balloon.color, 1.45), alpha * 0.75);
			g.drawEllipse(x - rx * 0.26, y - ry * 0.32, rx * 0.42, ry * 0.4);
			g.endFill();
			// sharp specular + bottom bounce light (metallic sheen)
			g.beginFill(0xffffff, alpha * 0.9);
			g.drawEllipse(x - rx * 0.34, y - ry * 0.42, rx * 0.14, ry * 0.16);
			g.endFill();
			g.beginFill(0xffffff, alpha * 0.35);
			g.drawEllipse(x - rx * 0.16, y - ry * 0.52, rx * 0.3, ry * 0.1);
			g.endFill();
			g.beginFill(shade(balloon.color, 1.6), alpha * 0.3);
			g.drawEllipse(x + rx * 0.12, y + ry * 0.62, rx * 0.5, ry * 0.16);
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

	// confetti raining down, each piece glowing like the bloom-lit bits in the bg art
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
			const flip = Math.sin(seconds * 2 + piece.phase * 11);
			const w = piece.size * (0.35 + 0.65 * Math.abs(flip));
			const h = piece.size * 0.55;
			const quad = (scale: number): number[] => [
				x + (cos * w - sin * h) * scale,
				y + (sin * w + cos * h) * scale,
				x + (-cos * w - sin * h) * scale,
				y + (-sin * w + cos * h) * scale,
				x + (-cos * w + sin * h) * scale,
				y + (-sin * w - cos * h) * scale,
				x + (cos * w + sin * h) * scale,
				y + (sin * w - cos * h) * scale,
			];

			// soft bloom halo
			g.beginFill(piece.color, 0.14);
			g.drawPolygon(quad(2.1));
			g.endFill();
			// core: bright when facing the light, darker mid-flip
			const facing = 0.55 + 0.45 * Math.abs(flip);
			g.beginFill(shade(piece.color, 0.7 + 0.7 * facing), 0.92);
			g.drawPolygon(quad(1));
			g.endFill();
			// glint edge on the lit side
			g.beginFill(0xffffff, 0.4 * facing);
			g.drawPolygon([
				x + cos * w,
				y + sin * w,
				x + cos * w - sin * h * 0.8,
				y + sin * w + cos * h * 0.8,
				x + cos * w * 0.4 - sin * h * 0.8,
				y + sin * w * 0.4 + cos * h * 0.8,
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

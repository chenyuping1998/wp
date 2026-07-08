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
		// a third of the pieces occasionally twinkle, echoing the symbols'
		// sparkle accents without putting one on every single piece
		sparkle: i % 3 === 0,
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


	// floating party bokeh, drifting up with a gentle sway — soft textured
	// motes (fxGlow) instead of hard vector circles
	const bokehState = (orb: (typeof BOKEH)[number]) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const seconds = tick / 62.5;
		const travel = height + orb.size * 4;
		const y = height + orb.size * 2 - ((seconds * orb.rise + orb.phase * travel) % travel);
		const x = orb.x * width + Math.sin(seconds * orb.swayFreq + orb.phase * 9) * orb.swayAmp;
		const edge = Math.max(0, Math.min(1, (height - y) / 90, (y + orb.size * 2) / 90));
		return { x, y, alpha: orb.alpha * edge * 2.2 };
	};

	// shared per-piece motion state — consumed by the soft glow (Sprite,
	// behind), the crisp gradient-faked core (Graphics, on top), and the
	// occasional sparkle (Sprite, on top of that) so all three layers stay
	// perfectly in sync for a given piece
	const confettiState = (piece: (typeof CONFETTI)[number]) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const seconds = tick / 62.5;
		const travel = height + 60;
		const y = ((seconds * piece.fall + piece.phase * travel) % travel) - 30;
		const x = piece.x * width + Math.sin(seconds * piece.swayFreq + piece.phase * 7) * piece.swayAmp;
		const rot = seconds * piece.rotSpeed + piece.phase * 6;
		// flutter: the strip narrows as it "turns" in the air
		const flip = Math.sin(seconds * 2 + piece.phase * 11);
		const facing = 0.55 + 0.45 * Math.abs(flip);
		const w = piece.size * (0.35 + 0.65 * Math.abs(flip));
		const h = piece.size * 0.55;
		return { x, y, rot, facing, w, h };
	};

	// crisp core with a faked two-tone gradient (base + inset lifted highlight,
	// offset toward the "lit" corner) instead of a single flat multiply-shade —
	// closer to the symbols' faceted-gem look, but still soft-edged/glossy
	// rather than ink-outlined so it doesn't read as a flat sticker pasted onto
	// the photoreal bg art
	const drawConfetti = (g: PixiGraphics) => {
		g.clear();
		for (const piece of CONFETTI) {
			const s = confettiState(piece);
			const cos = Math.cos(s.rot);
			const sin = Math.sin(s.rot);
			const quad = (scale: number, liftX = 0, liftY = 0): number[] => [
				s.x + (cos * s.w - sin * s.h) * scale + liftX,
				s.y + (sin * s.w + cos * s.h) * scale + liftY,
				s.x + (-cos * s.w - sin * s.h) * scale + liftX,
				s.y + (-sin * s.w + cos * s.h) * scale + liftY,
				s.x + (-cos * s.w + sin * s.h) * scale + liftX,
				s.y + (-sin * s.w - cos * s.h) * scale + liftY,
				s.x + (cos * s.w + sin * s.h) * scale + liftX,
				s.y + (sin * s.w - cos * s.h) * scale + liftY,
			];

			// shadow-side base tone
			g.beginFill(shade(piece.color, 0.55 + 0.35 * s.facing), 0.92);
			g.drawPolygon(quad(1));
			g.endFill();
			// lifted highlight tone, inset and offset toward the lit corner —
			// fakes a gradient sheen without a real gradient-fill API
			g.beginFill(shade(piece.color, 1.15 + 0.35 * s.facing), 0.85 * s.facing);
			g.drawPolygon(quad(0.55, cos * s.w * 0.32, sin * s.w * 0.32));
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

{#snippet bokeh()}
	{#each BOKEH as orb, index (index)}
		{@const state = bokehState(orb)}
		{#if state.alpha > 0.01}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={state.x}
				y={state.y}
				tint={orb.color}
				blendMode="add"
				width={orb.size * 5}
				height={orb.size * 5}
				alpha={state.alpha}
			/>
		{/if}
	{/each}
{/snippet}

{#snippet confettiGlow()}
	<!-- soft blurred aura behind each piece — reads as the same depth-of-field
	     glow the bg art's own confetti/streamers have, instead of a hard
	     vector edge sitting flatly on top of a glossy photoreal scene -->
	{#each CONFETTI as piece, index (index)}
		{@const s = confettiState(piece)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={s.x}
			y={s.y}
			tint={piece.color}
			blendMode="add"
			width={piece.size * 5}
			height={piece.size * 5}
			alpha={0.16 * s.facing}
		/>
	{/each}
{/snippet}

{#snippet confettiSparkle()}
	<!-- occasional twinkle on a third of the pieces, echoing the symbols'
	     sparkle accents -->
	{#each CONFETTI as piece, index (index)}
		{#if piece.sparkle}
			{@const s = confettiState(piece)}
			{@const twinkle = 0.5 + 0.5 * Math.sin(tick / 20 + piece.phase * 13)}
			<Sprite
				key="fxStar"
				anchor={0.5}
				x={s.x}
				y={s.y}
				blendMode="add"
				width={piece.size * 1.6 * twinkle}
				height={piece.size * 1.6 * twinkle}
				alpha={0.5 * twinkle}
			/>
		{/if}
	{/each}
{/snippet}

<!-- Wild Party base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="wildPartyBgBase" {...context.stateLayoutDerived.canvasSizes()} />
	{@render bokeh()}
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
	{@render confettiGlow()}
	<Graphics draw={drawConfetti} />
	{@render confettiSparkle()}
</FadeContainer>

<!-- Wild Party free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="wildPartyBgFeature" {...context.stateLayoutDerived.canvasSizes()} />
	{@render bokeh()}
	<Graphics draw={(g) => drawSoftBeams(g, 1.2)} />
	{@render confettiGlow()}
	<Graphics draw={drawConfetti} />
	{@render confettiSparkle()}
</FadeContainer>

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
	// win reactivity: kicked up on a win, eased back to 0 — brightens/quickens
	// the beams and thumps the dance-floor pulse so the scene answers the play.
	// Tiered: a regular win gives a gentle bump; big-tier wins hit far harder and
	// scale up through the tiers (big < super < mega < epic < max).
	let winBoost = $state(0);
	// eased 0→1 as the free game takes over; drives how tall the side spectrum
	// runs, so the feature reads as a much louder room than base play
	let featureLevel = $state(0);

	// big(6) → 1.2 … max(10) → 2.2
	const bigBoost = (level: number) => 1.2 + (Math.max(6, Math.min(10, level)) - 6) * 0.25;

	context.eventEmitter.subscribeOnMount({
		// fires on every win presentation (small + big); the gentle baseline
		boardWithAnimateSymbols: () => (winBoost = Math.max(winBoost, 0.5)),
		// only big-tier wins carry winLevelData — override with the strong, tiered hit
		winUpdate: ({ winLevelData }) => {
			if (winLevelData?.type === 'big') winBoost = Math.max(winBoost, bigBoost(winLevelData.level));
		},
	});

	// slow ken-burns parallax over a small overscan so the still art drifts and
	// breathes with depth instead of sitting dead still
	const OVERSCAN = 1.07;
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const t = tick / 62.5;
		const zoom = OVERSCAN + 0.02 * Math.sin(t * 0.05);
		const panX = Math.sin(t * 0.043) * width * 0.018;
		const panY = Math.cos(t * 0.035) * height * 0.013;
		return {
			width: width * zoom,
			height: height * zoom,
			x: -(width * (zoom - 1)) / 2 + panX,
			y: -(height * (zoom - 1)) / 2 + panY,
		};
	});

	// ambient club-light wash: a very low-alpha colour that slowly cross-fades
	// between club hues (≈9s each) with a slow breath. Deliberately NOT beat-
	// synced — no strobing/flashing. A win adds a smooth swell (winBoost eases
	// in and out), so it brightens and settles gently rather than flashing.
	const FLOOR_HUES = [0xff2fa0, 0x9a4dff, 0x2fb6ff, 0xffb833];
	const FLOOR_CYCLE = 9;
	const floorWash = $derived.by(() => {
		const t = tick / 62.5;
		const i = Math.floor(t / FLOOR_CYCLE) % FLOOR_HUES.length;
		const j = (i + 1) % FLOOR_HUES.length;
		const f = (t % FLOOR_CYCLE) / FLOOR_CYCLE;
		const smooth = f * f * (3 - 2 * f);
		const color = lerpHex(FLOOR_HUES[i], FLOOR_HUES[j], smooth);
		const breathe = 0.5 + 0.5 * Math.sin(t * 0.28);
		const alpha = 0.02 + 0.028 * breathe + 0.03 * winBoost;
		return { color, alpha };
	});

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

	// side spectrum columns: slim light bars framing the scene, bass on the
	// outside (tall, slow) climbing to treble inboard (short, quick). Drawn as
	// low-alpha additive light rather than solid blocks so they read as club
	// lighting, and they surge with the tiered win boost.
	const EQ_PER_SIDE = 13;
	const EQ = Array.from({ length: EQ_PER_SIDE * 2 }, (_, i) => {
		const k = i % EQ_PER_SIDE;
		return {
			freq: 0.55 + k * 0.26,
			phase: rand() * Math.PI * 2,
			weight: 1 - (k / EQ_PER_SIDE) * 0.55,
		};
	});

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

	const lerpHex = (a: number, b: number, t: number) => {
		const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
		const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
		return (
			((Math.round(ar + (br - ar) * t) << 16) |
				(Math.round(ag + (bg - ag) * t) << 8) |
				Math.round(ab + (bb - ab) * t)) >>>
			0
		);
	};

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
		// concert-style flicker so the spotlights feel alive; a win warms them up
		// (gentle, smooth swell — not a bright strobe)
		const flicker = (1 + 0.3 * Math.sin(beamPhase * 7 + phaseShift * 3)) * (1 + 0.32 * winBoost);

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


	// side spectrum columns (B5). Bars rise from the bottom of each edge;
	// champagne gold at the base blending to pink up top with a lit cap.
	const drawEq = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const seconds = tick / 62.5;
		// always alive at idle, surging as the tiered win boost climbs
		// Height ceiling steps up hard for the feature: base play tops out around
		// 28% of the screen, free games around 50% — the room visibly gets louder.
		const ceiling = 0.28 + 0.22 * featureLevel;
		// on top of that, each win tier surges the columns higher
		// (regular ≈1.3× · big ≈1.7× · max ≈2.2×)
		const surge = 1 + 0.55 * winBoost;
		// wider, taller and brighter than a subtle ambient touch — the whole
		// background sits behind a BlurFilter, so faint bars smear into nothing
		const clusterW = width * 0.105;
		const pitch = clusterW / EQ_PER_SIDE;
		const barW = pitch * 0.64;
		const radius = barW * 0.45;

		g.clear();
		for (let side = 0; side < 2; side++) {
			for (let k = 0; k < EQ_PER_SIDE; k++) {
				const bar = EQ[side * EQ_PER_SIDE + k];
				// two-rate blend fakes a spectrum: quick jitter under a slow swell
				const quick = 0.5 + 0.5 * Math.sin(seconds * bar.freq * 2.1 + bar.phase);
				const swell = 0.6 + 0.4 * Math.sin(seconds * 0.5 + bar.phase * 1.7);
				// capped so a max-win surge still stops short of the top edge
				const h = Math.min(
					height * 0.8,
					height * (0.05 + ceiling * quick * swell * surge * bar.weight),
				);
				// bass sits on the outside edge, treble climbs inboard
				const x =
					side === 0
						? width * 0.012 + k * pitch
						: width - width * 0.012 - (k + 1) * pitch + (pitch - barW);
				const yTop = height - h;

				// soft halo so the column still reads once the blur smears it
				g.beginFill(0xff8ede, 0.14);
				g.drawRoundedRect(x - barW * 0.45, yTop - barW * 0.4, barW * 1.9, h + barW * 0.8, radius * 2);
				g.endFill();
				// lower body — champagne gold
				g.beginFill(0xffc65a, 0.62);
				g.drawRoundedRect(x, yTop + h * 0.4, barW, h * 0.6, radius);
				g.endFill();
				// upper body — pink
				g.beginFill(0xff8ede, 0.55);
				g.drawRoundedRect(x, yTop, barW, h * 0.55, radius);
				g.endFill();
				// lit cap
				g.beginFill(0xfff6dd, 0.95);
				g.drawRoundedRect(x, yTop, barW, Math.max(3, barW * 0.55), radius);
				g.endFill();
			}
		}
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
			// beams sweep a touch quicker while a win boost is active (kept mild so
			// the flicker never speeds up into a strobe)
			beamPhase += 0.004 * (1 + 0.4 * winBoost);
			tick += 1;
			winBoost += (0 - winBoost) * 0.02; // ease the boost back to rest
			featureLevel += ((showFeatureBackground ? 1 : 0) - featureLevel) * 0.03;
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

{#snippet floor()}
	<Rectangle
		{...context.stateLayoutDerived.canvasSizes()}
		backgroundColor={floorWash.color}
		alpha={floorWash.alpha}
		blendMode="add"
	/>
{/snippet}

<!-- Wild Party base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="wildPartyBgBase" {...parallax} />
	{@render floor()}
	{@render bokeh()}
	<Graphics draw={drawEq} blendMode="add" />
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
	<Graphics draw={drawConfetti} />
</FadeContainer>

<!-- Wild Party free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="wildPartyBgFeature" {...parallax} />
	{@render floor()}
	{@render bokeh()}
	<Graphics draw={drawEq} blendMode="add" />
	<Graphics draw={(g) => drawSoftBeams(g, 1.2)} />
	<Graphics draw={drawConfetti} />
</FadeContainer>

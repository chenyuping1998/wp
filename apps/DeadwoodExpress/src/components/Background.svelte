<script lang="ts">
	// The backdrop, kept alive.
	//
	// Until 2026-09-30 this was one static sprite stretched to the canvas: the
	// only game in the repo whose scene never moved (Hot Miami, GoBananas, Capo
	// and Hard Time all drift and carry ambient light), in a theme that is
	// literally fog, steam and a ghost train. The third review tagged "Poor
	// animations" twice. Everything here is transforms of the painted plate plus
	// the soft fxGlow sprite — no new art.
	//
	//   plate    cover-fit (the old stretch squashed the 3:2 art to 16:9 and
	//            pulled it tall in portrait) over a small overscan, drifting
	//   lights   every lamp painted into the plate flickers where it is drawn,
	//            so the sprites are pinned in IMAGE coordinates and ride the drift
	//   steam    base game only: puffs leave the locomotive's chimney
	//   fog      wide soft banks crossing the lower half, slower than the motes
	//   motes    cold ghost-light rising through the whole scene
	//
	// Driven by requestAnimationFrame from a mount timestamp, not a setInterval
	// (a 16ms interval steps out of phase with the display — see review-findings).
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const size = $derived(context.stateLayoutDerived.canvasSizes());
	const isFeature = $derived(context.stateGame.gameType === 'freegame');

	/** seconds since mount */
	let clock = $state(0);
	onMount(() => {
		let raf = 0;
		const start = performance.now();
		const tick = (now: number) => {
			clock = (now - start) / 1000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// Both plates are 1536×1024.
	const ART_W = 1536;
	const ART_H = 1024;
	const OVERSCAN = 1.07;

	const plate = $derived.by(() => {
		const { width, height } = size;
		const s = Math.max(width / ART_W, height / ART_H) * OVERSCAN;
		const w = ART_W * s;
		const h = ART_H * s;
		const slackX = w - width;
		const slackY = h - height;
		return {
			s,
			width: w,
			height: h,
			x: -slackX * 0.5 + Math.sin(clock * 0.07) * slackX * 0.45,
			y: -slackY * 0.5 + Math.sin(clock * 0.047 + 1.1) * slackY * 0.45,
		};
	});

	/** image pixel → canvas */
	const at = (px: number, py: number) => ({ x: plate.x + px * plate.s, y: plate.y + py * plate.s });

	/** irregular flame flicker in 0..1: three incommensurate sines, never a loop */
	const flicker = (seed: number) =>
		0.62 + 0.2 * Math.sin(clock * 9.1 + seed) + 0.12 * Math.sin(clock * 15.7 + seed * 2.3) + 0.06 * Math.sin(clock * 3.3 + seed * 5);

	type Lamp = { x: number; y: number; r: number; tint: number; seed: number; steady?: boolean };

	// Lamp positions in plate pixels, measured off the two plates 2026-09-30.
	const BASE_LAMPS: Lamp[] = [
		{ x: 109, y: 327, r: 150, tint: 0xffb24a, seed: 0.3 },
		{ x: 1396, y: 327, r: 190, tint: 0xffb24a, seed: 1.7 },
		{ x: 1373, y: 540, r: 90, tint: 0xffb24a, seed: 4.1 },
		// the locomotive's lamps are ghost-light: a slow pulse, not a flame
		{ x: 300, y: 400, r: 170, tint: 0x7ff0dc, seed: 2.2, steady: true },
		{ x: 296, y: 493, r: 120, tint: 0x7ff0dc, seed: 3.6, steady: true },
	];
	const FEATURE_LAMPS: Lamp[] = [
		{ x: 171, y: 187, r: 170, tint: 0x7ff0dc, seed: 0.9 },
		{ x: 371, y: 340, r: 130, tint: 0x7ff0dc, seed: 2.8 },
		{ x: 1317, y: 340, r: 130, tint: 0x7ff0dc, seed: 5.2 },
		{ x: 1413, y: 187, r: 170, tint: 0x7ff0dc, seed: 3.3 },
		// the light at the end of the tunnel breathes
		{ x: 990, y: 620, r: 260, tint: 0xa8fff0, seed: 1.4, steady: true },
	];

	const lampAlpha = (lamp: Lamp) =>
		lamp.steady ? 0.28 + 0.14 * Math.sin(clock * 1.3 + lamp.seed) : 0.42 * flicker(lamp.seed);

	// ── chimney steam (base plate only) ──────────────────────────────────────
	const CHIMNEY = { x: 267, y: 262 };
	const PUFFS = 7;
	const PUFF_LIFE = 4.2;
	const puff = (i: number) => {
		const age = ((clock + (i * PUFF_LIFE) / PUFFS) % PUFF_LIFE) / PUFF_LIFE;
		const p = at(CHIMNEY.x - 40 * age + 14 * Math.sin(age * 5 + i), CHIMNEY.y - 230 * age);
		const d = (60 + 220 * age) * plate.s;
		return { ...p, width: d * 1.3, height: d, alpha: 0.32 * Math.sin(Math.PI * age) ** 0.8 };
	};

	// ── fog banks ────────────────────────────────────────────────────────────
	const fogs = Array.from({ length: 6 }, (_, i) => ({
		seed: i / 6 + Math.random() * 0.1,
		y: 0.56 + (i % 3) * 0.13,
		speed: 0.012 + Math.random() * 0.01,
		w: 0.7 + Math.random() * 0.45,
		h: 0.16 + Math.random() * 0.1,
		alpha: 0.1 + Math.random() * 0.07,
		dir: i % 2 === 0 ? 1 : -1,
	}));
	const fogState = (f: (typeof fogs)[number]) => {
		const { width, height } = size;
		const u = (f.seed + clock * f.speed) % 1;
		const travel = width * (1 + f.w);
		const x = f.dir > 0 ? -width * f.w * 0.5 + u * travel : width * (1 + f.w * 0.5) - u * travel;
		return {
			x,
			y: height * f.y + Math.sin(clock * 0.3 + f.seed * 6) * height * 0.015,
			width: width * f.w,
			height: height * f.h,
			alpha: f.alpha * Math.sin(Math.PI * u) ** 0.5,
		};
	};

	// ── ghost motes ──────────────────────────────────────────────────────────
	const motes = Array.from({ length: 24 }, () => ({
		seedX: Math.random(),
		seedY: Math.random(),
		size: 8 + Math.random() * 26,
		phase: Math.random() * Math.PI * 2,
		rise: 0.018 + Math.random() * 0.03,
		sway: 12 + Math.random() * 34,
		alpha: 0.18 + Math.random() * 0.3,
		warm: Math.random() < 0.2,
	}));
	const moteState = (m: (typeof motes)[number]) => {
		const { width, height } = size;
		const u = (m.seedY + clock * m.rise) % 1;
		return {
			x: m.seedX * width + Math.sin(clock * 0.6 + m.phase) * m.sway,
			y: height * (1.04 - u * 1.12),
			alpha: m.alpha * Math.sin(u * Math.PI) ** 0.6 * (0.75 + 0.25 * Math.sin(clock * 2.1 + m.phase)),
		};
	};
</script>

<Rectangle {...size} backgroundColor={0x071817} />

{#snippet lamps(list: Lamp[])}
	{#each list as lamp, i (i)}
		{@const p = at(lamp.x, lamp.y)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={p.x}
			y={p.y}
			width={lamp.r * 2 * plate.s}
			height={lamp.r * 2 * plate.s}
			tint={lamp.tint}
			blendMode="add"
			alpha={lampAlpha(lamp)}
		/>
	{/each}
{/snippet}

<FadeContainer show={!isFeature} duration={SECOND}>
	<Sprite key="dwBackground" x={plate.x} y={plate.y} width={plate.width} height={plate.height} />
	{#each Array.from({ length: PUFFS }, (_, i) => puff(i)) as p, i (i)}
		<Sprite key="fxGlow" anchor={0.5} x={p.x} y={p.y} width={p.width} height={p.height} tint={0xd8f4ee} alpha={p.alpha} />
	{/each}
	{@render lamps(BASE_LAMPS)}
</FadeContainer>

<FadeContainer show={isFeature} duration={SECOND}>
	<Sprite key="dwBackgroundFeature" x={plate.x} y={plate.y} width={plate.width} height={plate.height} />
	{@render lamps(FEATURE_LAMPS)}
</FadeContainer>

<Container>
	{#each fogs as f, i (i)}
		{@const s = fogState(f)}
		<Sprite key="fxGlow" anchor={0.5} x={s.x} y={s.y} width={s.width} height={s.height} tint={0xcfeee8} alpha={s.alpha} />
	{/each}
	{#each motes as m, i (i)}
		{@const s = moteState(m)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={s.x}
			y={s.y}
			width={m.size}
			height={m.size}
			tint={m.warm ? 0xffc87a : 0x8ff5e2}
			blendMode="add"
			alpha={s.alpha}
		/>
	{/each}
</Container>

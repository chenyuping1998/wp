<script lang="ts">
	/**
	 * The night on the farm, alive (2026-10-25, user: 飛碟也做一樣的處理, 背景太
	 * 靜態). The meshes (bgProps.ts) move the corn, trees, clouds and craft; this
	 * is the light and what flies:
	 *
	 *   stars      every star on the plate breathes faintly on its own clock
	 *   windows    the barn and the village flicker like lamplight
	 *   meteor     a thin shooting star crosses the sky now and then
	 *   feature    the mothership's ports chase, the beam shimmers, the crop
	 *              circle breathes
	 *
	 * 2026-11-06 (user: 不要有粗糙的光暈或亮點): the fireflies, the motes rising
	 * in the beam, the flaring stars and the meteor's white head were glow dots
	 * floating over a printed poster — all removed. The stars stay small and dim
	 * (a breath, not a sparkle).
	 *
	 * All of it is the plate's own pixels added back (design/build_bg_night.py)
	 * or a soft glow — no new shapes. requestAnimationFrame, not setInterval:
	 * the review checker flags interval animation.
	 */
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { MOON, NIGHT_BOXES, STARS } from '../game/bgNight';
	import { mothershipDy } from '../game/meshWin/bgProps';

	type Props = {
		scene: 'base' | 'feature';
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const context = getContext();

	let t = $state(0);
	let winAt = -1e9;
	context.eventEmitter.subscribeOnMount({
		winLinesShow: () => {
			winAt = t;
		},
	});
	onMount(() => {
		let raf = 0;
		const start = performance.now();
		const tick = (now: number) => {
			t = (now - start) / 1000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const sx = $derived(props.width / 1920);
	const sy = $derived(props.height / 1080);
	const at = (px: number, py: number) => ({ x: props.x + px * sx, y: props.y + py * sy });
	const box = (k: string) => {
		const [x0, y0, x1, y1] = NIGHT_BOXES[k];
		return { x: props.x + x0 * sx, y: props.y + y0 * sy, width: (x1 - x0) * sx, height: (y1 - y0) * sy };
	};

	// a win lifts every light for a beat
	const stir = $derived.by(() => {
		const d = t - winAt;
		return d < 0 || d > 1.6 ? 0 : Math.min(1, d / 0.15) * Math.exp(-d / 0.55);
	});

	// the mothership's hull covers the stars behind it
	const SHIP = [520, 0, 1420, 240];
	const stars = $derived(
		STARS.filter(([x, y]) => props.scene === 'base' || !(x > SHIP[0] && x < SHIP[2] && y < SHIP[3])).map(([x, y, r], i) => ({
			x,
			y,
			size: 8 + Math.min(r, 30) * 0.7,
			rate: 0.35 + ((i * 37) % 11) / 16,
			phase: (i * 2.39) % (Math.PI * 2),
		})),
	);
	const twinkle = (s: (typeof stars)[number]) => {
		const base = 0.2 + 0.1 * Math.sin(t * s.rate + s.phase) + 0.04 * Math.sin(t * s.rate * 2.7 + s.phase * 3);
		return Math.max(0, base + 0.1 * stir);
	};

	// lamplight: two unrelated rates and a rare dip
	const flicker = (seed: number) => {
		const a = Math.sin(t * 6.7 + seed * 5) * 0.5 + Math.sin(t * 11.3 + seed * 9) * 0.3;
		const dip = Math.max(0, Math.sin(t * 0.7 + seed * 2.1) - 0.9) * 5;
		return Math.max(0, 0.55 + 0.18 * a - 0.3 * dip + 0.35 * stir);
	};

	// a shooting star: once every METEOR_EVERY s, a fast streak down-right
	const METEOR_EVERY = 23;
	const drawMeteor = (g: PixiGraphics) => {
		g.clear();
		const n = Math.floor((t + 4) / METEOR_EVERY);
		const u = ((t + 4) % METEOR_EVERY) / 0.9;
		if (u <= 0 || u >= 1) return;
		// a different path each time, always across open sky
		const x0 = 200 + ((n * 547) % 1000), y0 = 30 + ((n * 131) % 120);
		const len = 260;
		const head = at(x0 + len * u, y0 + len * 0.42 * u);
		const tail = at(x0 + len * Math.max(0, u - 0.35), y0 + len * 0.42 * Math.max(0, u - 0.35));
		const a = Math.sin(u * Math.PI) * 0.7;
		// tapered: three segments thinning and fading toward the tail, no head dot
		for (let k = 0; k < 3; k++) {
			const f0 = k / 3, f1 = (k + 1) / 3;
			const p0 = { x: head.x + (tail.x - head.x) * f0, y: head.y + (tail.y - head.y) * f0 };
			const p1 = { x: head.x + (tail.x - head.x) * f1, y: head.y + (tail.y - head.y) * f1 };
			g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: Math.max(1, 2.2 * sx * (1 - k * 0.3)), color: 0xfff6d8, alpha: a * (1 - k * 0.32), cap: 'round' });
		}
	};

</script>

<Container>
	<!-- the moon's halo breathes -->
	{@const moon = at(MOON[0], MOON[1])}
	<Sprite
		key="night_soft_glow"
		anchor={0.5}
		x={moon.x}
		y={moon.y}
		width={MOON[2] * 3.4 * sx}
		height={MOON[2] * 3.4 * sy}
		tint={0xfff1c8}
		blendMode="add"
		alpha={0.13 + 0.04 * Math.sin(t * 0.8) + 0.08 * stir}
	/>

	{#each stars as s, i (i)}
		{@const p = at(s.x, s.y)}
		<Sprite key="night_soft_glow" anchor={0.5} x={p.x} y={p.y} width={s.size * sx} height={s.size * sy} tint={0xfff8e0} blendMode="add" alpha={twinkle(s)} />
	{/each}

	<Graphics draw={drawMeteor} />

	<Sprite key="night_light_barn" {...box('light_barn')} blendMode="add" alpha={flicker(0.3)} />
	<Sprite key="night_light_village" {...box('light_village')} blendMode="add" alpha={flicker(2.1)} />

	{#if props.scene === 'base'}
		<!-- (no glow on the little saucer: it hovers as a mesh, and a still
		     glow over a moving hull showed it twice) -->
	{:else}
		{@const bob = mothershipDy(t * 1000) * sy}
		<!-- the ports chase round the hull: three overlapping pulses -->
		<!-- the ports ride the hull's hover (bgProps mothershipDy) -->
		<Sprite key="night_ship_lights" {...box('ship_lights')} y={box('ship_lights').y + bob} blendMode="add" alpha={0.45 + 0.4 * Math.sin(t * 4.2) ** 2 + 0.3 * stir} />
		<Sprite key="night_ship_beam" {...box('ship_beam')} blendMode="add" alpha={0.3 + 0.18 * Math.sin(t * 2.3) + 0.08 * Math.sin(t * 9.1) + 0.3 * stir} />
		<Sprite key="night_ship_circle" {...box('ship_circle')} blendMode="add" alpha={0.25 + 0.25 * Math.sin(t * 1.6) ** 2 + 0.3 * stir} />
	{/if}

</Container>

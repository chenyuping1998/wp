<script lang="ts">
	/**
	 * The night on the farm, alive (2026-10-25, user: 飛碟也做一樣的處理, 背景太
	 * 靜態). The meshes (bgProps.ts) move the corn, trees, clouds and craft; this
	 * is the light and what flies:
	 *
	 *   stars      every star on the plate twinkles on its own clock, a few
	 *              brightening hard now and then
	 *   windows    the barn and the village flicker like lamplight
	 *   fireflies  drift over the empty field in the middle — which is all a
	 *              portrait phone sees of this plate, cropped about its centre
	 *   meteor     a shooting star crosses the sky every ~11s
	 *   base       the little saucer's rim lights pulse
	 *   feature    the mothership's ports chase, the beam shimmers with motes
	 *              rising in it, the crop circle breathes
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
			size: 14 + Math.min(r, 30) * 1.4,
			rate: 0.6 + ((i * 37) % 11) / 8,
			phase: (i * 2.39) % (Math.PI * 2),
			flare: i % 7 === 0,
		})),
	);
	const twinkle = (s: (typeof stars)[number]) => {
		const base = 0.35 + 0.3 * Math.sin(t * s.rate + s.phase) + 0.15 * Math.sin(t * s.rate * 2.7 + s.phase * 3);
		// one in seven flares up now and then
		const flare = s.flare ? Math.max(0, Math.sin(t * 0.45 + s.phase) - 0.86) * 6 : 0;
		return Math.max(0, base + flare + 0.3 * stir);
	};

	// lamplight: two unrelated rates and a rare dip
	const flicker = (seed: number) => {
		const a = Math.sin(t * 6.7 + seed * 5) * 0.5 + Math.sin(t * 11.3 + seed * 9) * 0.3;
		const dip = Math.max(0, Math.sin(t * 0.7 + seed * 2.1) - 0.9) * 5;
		return Math.max(0, 0.55 + 0.18 * a - 0.3 * dip + 0.35 * stir);
	};

	// fireflies over the field, centred where a phone's crop looks
	const FLIES = Array.from({ length: 16 }, (_, i) => ({
		cx: 560 + ((i * 397) % 820),
		cy: 520 + ((i * 211) % 300),
		rx: 40 + ((i * 53) % 70),
		ry: 18 + ((i * 29) % 30),
		speed: 0.18 + ((i * 17) % 9) / 40,
		phase: i * 1.7,
		blink: 0.5 + ((i * 13) % 7) / 7,
	}));
	const fly = (f: (typeof FLIES)[number]) => {
		const a = t * f.speed + f.phase;
		const p = at(f.cx + Math.sin(a) * f.rx + Math.sin(a * 2.3) * 12, f.cy + Math.sin(a * 1.4 + 1) * f.ry - Math.sin(a * 0.5) * 20);
		// a firefly glows, goes dark, glows again
		const on = Math.max(0, Math.sin(t * f.blink * 2 + f.phase * 3)) ** 2;
		return { ...p, alpha: 0.9 * on, size: 26 * sx };
	};

	// a shooting star: once every METEOR_EVERY s, a fast streak down-right
	const METEOR_EVERY = 11;
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
		const a = Math.sin(u * Math.PI);
		g.moveTo(tail.x, tail.y).lineTo(head.x, head.y).stroke({ width: Math.max(1.5, 3 * sx), color: 0xfff6d8, alpha: a, cap: 'round' });
		g.circle(head.x, head.y, Math.max(1.5, 3.5 * sx)).fill({ color: 0xffffff, alpha: a });
	};

	// feature: rising motes in the beam
	const MOTES = Array.from({ length: 14 }, (_, i) => ({ x: 900 + ((i * 47) % 140), speed: 0.25 + ((i * 7) % 5) / 12, phase: (i * 0.137) % 1 }));
	const mote = (m: (typeof MOTES)[number]) => {
		const u = (t * m.speed + m.phase) % 1;
		// the beam narrows toward the ship: pull the mote in as it rises
		const x = 967 + (m.x - 967) * (1 - u * 0.55);
		return { ...at(x + Math.sin(t * 2 + m.phase * 9) * 5, 470 - u * 300), alpha: Math.sin(u * Math.PI) * 0.85, size: 16 * sx };
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
		alpha={0.18 + 0.07 * Math.sin(t * 0.8) + 0.15 * stir}
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
		{#each MOTES as m, i (i)}
			{@const p = mote(m)}
			<Sprite key="night_soft_glow" anchor={0.5} x={p.x} y={p.y} width={p.size} height={p.size} tint={0x9cffc8} blendMode="add" alpha={p.alpha} />
		{/each}
	{/if}

	{#each FLIES as f, i (i)}
		{@const p = fly(f)}
		<Sprite key="night_soft_glow" anchor={0.5} x={p.x} y={p.y} width={p.size} height={p.size} tint={0xd8ff7a} blendMode="add" alpha={p.alpha} />
	{/each}
</Container>

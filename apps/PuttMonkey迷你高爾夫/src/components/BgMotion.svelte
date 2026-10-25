<script lang="ts">
	/**
	 * What in the background turns or glows, rather than bends (bending is
	 * BgProps): the windmill's sails, the noon sun's rays, and at sunset the
	 * lamp heads and the volcano's lava. Stake review 2026-10-24: "the
	 * background is too static".
	 *
	 * The sails and rays are cut sprites over plates whose holes behind them
	 * are filled (design/build_bg_motion.py), drawn back at exactly angle 0 at
	 * rest — so the plate is unchanged until they move.
	 *
	 * The sails turn on the SAME wind as the palms and umbrellas (windAt): a
	 * slow idle turn, and when the gust that bends the left palm arrives they
	 * pick up speed and coast back down. That shared cause is what makes it
	 * read as one breeze across the course.
	 *
	 * requestAnimationFrame, not setInterval (the review checker flags interval
	 * animation), same as Background.svelte's drift.
	 */
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { BG_CANVAS, windAt } from '../game/meshWin/bgProps';

	type Props = {
		kind: 'base' | 'feature';
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const context = getContext();

	// plate px (1920 x 1080), measured in design/build_bg_motion.py
	const HUB = { x: 244, y: 311.7, box: 240 };
	const SUN = { x: 284, y: 100, box: 320 };
	const LAVA = { x: 1600, y: 0, w: 320, h: 280 };
	const CRATER = { x: 1792, y: 118 };
	// the lamp heads under the sunset umbrellas and along the fence
	const LAMPS = [
		{ x: 52, y: 389, seed: 0.3 },
		{ x: 361, y: 393, seed: 1.7 },
		{ x: 516, y: 387, seed: 2.9 },
		{ x: 1530, y: 379, seed: 4.1 },
		{ x: 1861, y: 384, seed: 5.3 },
	];

	// idle: one turn in ~16s; a full gust adds ~3.5 turns a minute's worth
	// a turn every 7s at rest, so the mill is plainly working (was 16s)
	const SAIL_IDLE = (Math.PI * 2) / 7;
	const SAIL_GUST = (Math.PI * 2) / 3.2;

	let t = $state(0);
	let sail = $state(0);
	let gustAt = -1;

	context.eventEmitter.subscribeOnMount({
		winLinesShow: () => {
			gustAt = performance.now();
		},
	});

	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const start = last;
		let spin = SAIL_IDLE;
		const tick = (now: number) => {
			const dt = Math.min(now - last, 100) / 1000;
			last = now;
			t = (now - start) / 1000;
			const env = { t: now - start, gustT: gustAt < 0 ? -1 : now - gustAt };
			// the sails only ever turn one way: a lull slows them, never reverses
			const w = Math.max(0, windAt(env, HUB.x, 5600, 0));
			const target = SAIL_IDLE + SAIL_GUST * Math.min(w, 1.4);
			// heavy sails: they take a second to catch the gust and longer to lose it
			spin += (target - spin) * Math.min(1, dt * (target > spin ? 1.3 : 0.55));
			sail = (sail - spin * dt) % (Math.PI * 2);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const sx = $derived(props.width / BG_CANVAS[0]);
	const sy = $derived(props.height / BG_CANVAS[1]);
	const at = (px: number, py: number) => ({ x: props.x + px * sx, y: props.y + py * sy });

	// a lamp's flame: two unrelated rates and a rare dip, never a clean pulse
	const flicker = (seed: number) => {
		const a = Math.sin(t * 7.3 + seed * 5) * 0.5 + Math.sin(t * 12.9 + seed * 11) * 0.3;
		const dip = Math.max(0, Math.sin(t * 0.83 + seed * 2.3) - 0.92) * 6;
		return 0.62 + 0.14 * a - 0.25 * dip;
	};
	// the lava breathes slowly and flares with the gusts' timing offset
	const lava = $derived(0.55 + 0.3 * Math.sin(t * 1.9) ** 2 + 0.1 * Math.sin(t * 6.1));

	// A few gulls cross the sky every so often. They are here for the PORTRAIT
	// and narrow layouts: the background is cover-cropped about its centre, and
	// a phone sees only plate x ~650-1270 — the windmill, sun, palms, umbrellas
	// and volcano are all off screen there, and the sky band is all that is
	// left. Ink "m" strokes, the print's own idiom for a bird.
	const FLOCK_EVERY = 13;
	const FLOCK_CROSS = 15;
	const FLOCK = [
		{ dx: 0, dy: 0, phase: 0, w: 22 },
		{ dx: -58, dy: 20, phase: 1.9, w: 18 },
		{ dx: -104, dy: -12, phase: 3.4, w: 16 },
	];
	const ink = props.kind === 'base' ? 0x2a2a3a : 0x2b1a24;
	const drawFlock = (g: import('pixi.js').Graphics) => {
		g.clear();
		const local = (t + 6) % FLOCK_EVERY;
		if (local > FLOCK_CROSS) return;
		const u = local / FLOCK_CROSS;
		// flies left to right, drifting up a little and bobbing
		const cx = -140 + u * (BG_CANVAS[0] + 280);
		const cy = 150 - u * 40;
		for (const b of FLOCK) {
			const flap = Math.sin(t * 8.5 + b.phase);
			const p = at(cx + b.dx, cy + b.dy + Math.sin(t * 1.3 + b.phase) * 6);
			const w = b.w * sx;
			const lift = flap * w * 0.5;
			g.moveTo(p.x - w, p.y - lift);
			g.quadraticCurveTo(p.x - w * 0.45, p.y - w * 0.35 - lift * 0.4, p.x, p.y);
			g.quadraticCurveTo(p.x + w * 0.45, p.y - w * 0.35 - lift * 0.4, p.x + w, p.y - lift);
		}
		g.stroke({ width: Math.max(1.5, 3.2 * sx), color: ink, cap: 'round', join: 'round' });
	};

	const EMBERS = Array.from({ length: 9 }, (_, i) => ({
		phase: (i * 0.618) % 1,
		speed: 0.22 + (i % 4) * 0.06,
		spread: ((i * 37) % 23) - 11,
		size: 7 + (i % 3) * 3,
	}));
	const ember = (e: (typeof EMBERS)[number]) => {
		const p = (t * e.speed + e.phase) % 1;
		const pos = at(CRATER.x + e.spread + p * (18 + e.spread * 0.8), CRATER.y - 6 - p * 120);
		return { ...pos, alpha: Math.sin(p * Math.PI) * 0.9, size: e.size * (1 - p * 0.5) * sx };
	};
</script>

<Container>
	<!-- the gulls: drawn every frame, empty between crossings -->
	<Graphics draw={drawFlock} />

	{#if props.kind === 'base'}
		{@const sun = at(SUN.x, SUN.y)}
		<!-- the rays turn about the disc and breathe a little -->
		<Sprite
			key="bgSunRays"
			anchor={0.5}
			x={sun.x}
			y={sun.y}
			rotation={t * 0.14}
			width={SUN.box * sx * (1 + 0.025 * Math.sin(t * 1.4))}
			height={SUN.box * sy * (1 + 0.025 * Math.sin(t * 1.4))}
		/>
	{/if}

	{@const hub = at(HUB.x, HUB.y)}
	<Sprite
		key={props.kind === 'base' ? 'bgSailsBase' : 'bgSailsFeature'}
		anchor={0.5}
		x={hub.x}
		y={hub.y}
		rotation={sail}
		width={HUB.box * sx}
		height={HUB.box * sy}
	/>

	{#if props.kind === 'feature'}
		{@const lv = at(LAVA.x, LAVA.y)}
		<Sprite key="bgLavaGlow" x={lv.x} y={lv.y} width={LAVA.w * sx} height={LAVA.h * sy} blendMode="add" alpha={lava} />
		{#each EMBERS as e, i (i)}
			{@const s = ember(e)}
			<Sprite key="bgLampGlow" anchor={0.5} x={s.x} y={s.y} width={s.size} height={s.size} tint={0xffb347} blendMode="add" alpha={s.alpha} />
		{/each}
		{#each LAMPS as lamp, i (i)}
			{@const p = at(lamp.x, lamp.y)}
			<Sprite key="bgLampGlow" anchor={0.5} x={p.x} y={p.y} width={92 * sx} height={92 * sy} blendMode="add" alpha={flicker(lamp.seed)} />
		{/each}
	{/if}
</Container>

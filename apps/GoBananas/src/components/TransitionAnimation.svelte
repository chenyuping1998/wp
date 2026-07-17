<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	// Jungle-commando transition: the sergeant pops up, lobs his pineapple
	// grenade into the middle of the screen — two red ticks — BOOM. The cut to
	// the next scene lands on the white-hot peak of the blast.
	type Props = {
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const POP_MS = 320; // monkey pops up
	const THROW_MS = 480; // grenade arc to screen center
	const TICK_MS = 320; // armed: two red blinks
	const BOOM_MS = 300; // shockwave + flash ramp
	const TOTAL_MS = POP_MS + THROW_MS + TICK_MS + BOOM_MS;
	const BOOM_AT = POP_MS + THROW_MS + TICK_MS;

	type Frag = { a: number; speed: number; r: number; spin: number };
	const frags: Frag[] = Array.from({ length: 16 }, (_, i) => ({
		a: (i / 16) * Math.PI * 2 + Math.random() * 0.4,
		speed: 0.55 + Math.random() * 0.75,
		r: 7 + Math.random() * 12,
		spin: Math.random() * Math.PI,
	}));

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let boomFired = false;

	let monkeyY = $state(1);
	let monkeyRot = $state(0);
	let grenadeVisible = $state(false);
	let grenadeX = $state(0);
	let grenadeY = $state(0);
	let grenadeRot = $state(0);
	let grenadeScale = $state(1);
	let grenadeTint = $state(0xffffff);
	let boomT = $state(-1);
	let flashAlpha = $state(0);

	const easeOutCubic = (t: number) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3;

	onMount(() => {
		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			const dt = now - last;
			last = now;
			elapsed += dt;

			const h = context.stateLayoutDerived.canvasSizes().height;
			const w = context.stateLayoutDerived.canvasSizes().width;
			const startX = -w * 0.24;
			const startY = h * 0.24;

			if (elapsed < POP_MS) {
				// monkey pops up from the bottom-left with a cheeky wobble
				const p = easeOutCubic(elapsed / POP_MS);
				monkeyY = 1 - p;
				monkeyRot = Math.sin(p * Math.PI * 2.2) * 0.1;
				grenadeVisible = false;
			} else if (elapsed < POP_MS + THROW_MS) {
				// grenade arcs from the paw to dead center, spinning
				const p = (elapsed - POP_MS) / THROW_MS;
				monkeyY = 0;
				monkeyRot = -0.14 * (1 - p); // follow-through of the throw
				grenadeVisible = true;
				grenadeX = startX + (0 - startX) * p;
				grenadeY = startY + (0 - startY) * p - Math.sin(p * Math.PI) * h * 0.28;
				grenadeRot = p * Math.PI * 4;
				grenadeScale = 0.7 + p * 0.5;
				grenadeTint = 0xffffff;
			} else if (elapsed < BOOM_AT) {
				// armed on the spot: two hot red blinks
				const p = (elapsed - POP_MS - THROW_MS) / TICK_MS;
				grenadeVisible = true;
				grenadeX = 0;
				grenadeY = 0;
				grenadeRot = 0;
				grenadeScale = 1.2 + Math.sin(p * Math.PI * 2) * 0.06;
				grenadeTint = Math.sin(p * Math.PI * 4) > 0 ? 0xff5a3a : 0xffffff;
			} else {
				// BOOM
				if (!boomFired) {
					boomFired = true;
					context.eventEmitter.broadcast({ type: 'soundBigWinBlast' });
				}
				grenadeVisible = false;
				monkeyY = easeOutCubic((elapsed - BOOM_AT) / BOOM_MS); // monkey ducks
				boomT = (elapsed - BOOM_AT) / BOOM_MS;
				flashAlpha = Math.min(1, boomT * 1.6) * 0.95;
			}

			if (elapsed >= TOTAL_MS) {
				if (!completed) {
					completed = true;
					props.oncomplete();
				}
				return;
			}

			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});

	const drawBoom = (g: PixiGraphics) => {
		g.clear();
		if (boomT < 0) return;
		const { height } = context.stateLayoutDerived.canvasSizes();
		const maxR = height * 0.7;
		// shockwave rings
		for (const [delay, color] of [
			[0, 0xfff2c0],
			[0.18, 0xff9c3a],
		] as [number, number][]) {
			const t = (boomT - delay) / (1 - delay);
			if (t < 0 || t > 1) continue;
			g.lineStyle(16 * (1 - t) + 2, color, 0.85 * (1 - t));
			g.drawCircle(0, 0, maxR * easeOutCubic(t));
		}
		// hot core
		g.lineStyle(0);
		g.beginFill(0xfff7d6, 0.9 * (1 - boomT));
		g.drawCircle(0, 0, height * 0.16 * (0.4 + boomT));
		g.endFill();
		// leaf/shrapnel fragments
		for (const f of frags) {
			const d = f.speed * easeOutCubic(boomT) * maxR;
			const x = Math.cos(f.a) * d;
			const y = Math.sin(f.a) * d;
			g.beginFill(f.r > 13 ? 0x35521a : 0xffd75e, 0.9 * (1 - boomT));
			g.drawPolygon([
				x, y - f.r,
				x + f.r * Math.cos(f.spin), y + f.r * Math.sin(f.spin),
				x - f.r * Math.cos(f.spin), y + f.r * 0.6,
			]);
			g.endFill();
		}
	};

	const drawFlash = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		g.clear();
		if (flashAlpha <= 0) return;
		g.beginFill(0xfff2c0, flashAlpha);
		g.drawRect(-width, -height, width * 2, height * 2);
		g.endFill();
	};
</script>

<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
>
	<!-- the thrower: sergeant bust rising from the bottom-left corner -->
	<Sprite
		key="gbW"
		anchor={{ x: 0.5, y: 0 }}
		x={-context.stateLayoutDerived.canvasSizes().width * 0.3}
		y={context.stateLayoutDerived.canvasSizes().height * (0.12 + monkeyY * 0.42)}
		width={context.stateLayoutDerived.canvasSizes().height * 0.34}
		height={context.stateLayoutDerived.canvasSizes().height * 0.34}
		rotation={monkeyRot}
	/>

	{#if grenadeVisible}
		<Sprite
			key="gbH2"
			anchor={0.5}
			x={grenadeX}
			y={grenadeY}
			width={context.stateLayoutDerived.canvasSizes().height * 0.2 * grenadeScale}
			height={context.stateLayoutDerived.canvasSizes().height * 0.2 * grenadeScale}
			rotation={grenadeRot}
			tint={grenadeTint}
		/>
	{/if}

	<Graphics draw={drawBoom} />
	<Graphics draw={drawFlash} />
</Container>

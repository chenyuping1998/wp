<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	// Jungle-commando transition: a pineapple grenade drops into the middle of
	// the screen — two red ticks — BOOM. The cut to the next scene lands on the
	// white-hot peak of the blast.
	type Props = {
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const THROW_MS = 460; // grenade drops in from the top, always face-on
	const TICK_MS = 340; // armed: two red blinks
	const BOOM_MS = 420; // shockwave + flash ramp (longer so the bigger blast reads)
	const TOTAL_MS = THROW_MS + TICK_MS + BOOM_MS;
	const BOOM_AT = THROW_MS + TICK_MS;

	const FRAG_COUNT = 30;
	type Frag = { a: number; speed: number; r: number; spin: number };
	const frags: Frag[] = Array.from({ length: FRAG_COUNT }, (_, i) => ({
		a: (i / FRAG_COUNT) * Math.PI * 2 + Math.random() * 0.4,
		speed: 0.5 + Math.random() * 0.85,
		r: 9 + Math.random() * 17,
		spin: Math.random() * Math.PI,
	}));

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let boomFired = false;

	let grenadeVisible = $state(false);
	let grenadeX = $state(0);
	let grenadeY = $state(0);
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

			if (elapsed < THROW_MS) {
				// drops in from above and brakes to a stop — deliberately NOT spinning,
				// so the grenade reads face-on the whole way down
				const p = easeOutCubic(elapsed / THROW_MS);
				grenadeVisible = true;
				grenadeX = 0;
				grenadeY = -h * 0.72 * (1 - p);
				grenadeScale = 0.7 + p * 0.5;
				grenadeTint = 0xffffff;
			} else if (elapsed < BOOM_AT) {
				// armed on the spot: two hot red blinks
				const p = (elapsed - THROW_MS) / TICK_MS;
				grenadeVisible = true;
				grenadeX = 0;
				grenadeY = 0;
				grenadeScale = 1.2 + Math.sin(p * Math.PI * 2) * 0.06;
				grenadeTint = Math.sin(p * Math.PI * 4) > 0 ? 0xff5a3a : 0xffffff;
			} else {
				// BOOM
				if (!boomFired) {
					boomFired = true;
					context.eventEmitter.broadcast({ type: 'soundBigWinBlast' });
					// the shockwave rattles the reel housing as it passes
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.4 });
				}
				grenadeVisible = false;
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
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// reach past the long edge so the blast genuinely engulfs the screen
		const maxR = Math.max(width, height) * 0.95;
		// shockwave rings — a third, slowest ring gives the blast visible depth
		for (const [delay, color, weight] of [
			[0, 0xfff7d6, 30],
			[0.14, 0xfff2c0, 24],
			[0.3, 0xff9c3a, 18],
		] as [number, number, number][]) {
			const t = (boomT - delay) / (1 - delay);
			if (t < 0 || t > 1) continue;
			g.lineStyle(weight * (1 - t) + 3, color, 0.85 * (1 - t));
			g.drawCircle(0, 0, maxR * easeOutCubic(t));
		}
		// hot core — expands most of the way across the screen before fading
		g.lineStyle(0);
		g.beginFill(0xfff7d6, 0.9 * (1 - boomT));
		g.drawCircle(0, 0, height * 0.34 * (0.4 + boomT * 1.5));
		g.endFill();
		g.beginFill(0xffb347, 0.55 * (1 - boomT));
		g.drawCircle(0, 0, height * 0.5 * (0.35 + boomT * 1.7));
		g.endFill();
		// leaf/shrapnel fragments — thrown the full blast radius
		for (const f of frags) {
			const d = f.speed * easeOutCubic(boomT) * maxR * 1.1;
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
	{#if grenadeVisible}
		<Sprite
			key="gbH2"
			anchor={0.5}
			x={grenadeX}
			y={grenadeY}
			width={context.stateLayoutDerived.canvasSizes().height * 0.2 * grenadeScale}
			height={context.stateLayoutDerived.canvasSizes().height * 0.2 * grenadeScale}
			tint={grenadeTint}
		/>
	{/if}

	<Graphics draw={drawBoom} />
	<Graphics draw={drawFlash} />
</Container>

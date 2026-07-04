<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	// Themed big-win symbol scenes built by mask-slicing the existing single
	// PNGs (no extra art needed):
	//  H1 disco ball  — rotating light rays + orbiting glints
	//  H2 champagne   — the cork slice blasts off with a golden spray, bottle recoils
	//  H3 cocktail    — glass sways from its base, droplets splash off the rim
	//  H4 gift        — the lid slice hinges open, stars float out of the box
	type Props = {
		symbolKey: 'wpSpH1' | 'wpSpH2' | 'wpSpH3' | 'wpSpH4';
	};

	const props: Props = $props();

	const SPRITE_KEY: Record<Props['symbolKey'], string> = {
		wpSpH1: 'wpH1',
		wpSpH2: 'wpH2',
		wpSpH3: 'wpH3',
		wpSpH4: 'wpH4',
	};
	const spriteKey = $derived(SPRITE_KEY[props.symbolKey]);

	// art is 256px; displayed at 240px centered on origin
	const S = 240;
	const HALF = S / 2;
	const px = (v: number) => (v / 256) * S - HALF; // 256-space → centered coords

	let t = $state(0);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / 1000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// ─── H1 disco ball ──────────────────────────────────────────────────────
	const drawDiscoRays = (g: PixiGraphics) => {
		g.clear();
		const alpha = 0.14 + 0.07 * Math.sin(t * 3);
		for (let i = 0; i < 10; i++) {
			const angle = (i / 10) * Math.PI * 2 + t * 0.4;
			const reach = 205 * (i % 2 === 0 ? 1 : 0.8);
			const halfWidth = Math.PI / 26;
			g.beginFill(i % 2 === 0 ? 0xfff07a : 0xff8ede, alpha);
			g.drawPolygon([
				0,
				0,
				Math.cos(angle - halfWidth) * reach,
				Math.sin(angle - halfWidth) * reach,
				Math.cos(angle + halfWidth) * reach,
				Math.sin(angle + halfWidth) * reach,
			]);
			g.endFill();
		}
	};

	const drawDiscoGlints = (g: PixiGraphics) => {
		g.clear();
		for (let i = 0; i < 5; i++) {
			const phase = t * 1.2 + (i / 5) * Math.PI * 2;
			const gx = Math.cos(phase) * 78;
			const gy = Math.sin(phase) * 72 - 6;
			// only glint on the front hemisphere sweep
			const twinkle = Math.max(0, Math.sin(phase * 2 + i));
			if (twinkle < 0.15) continue;
			const size = 7 + 5 * twinkle;
			g.beginFill(0xffffff, 0.5 + 0.5 * twinkle);
			g.drawPolygon([gx, gy - size, gx + size * 0.28, gy, gx, gy + size, gx - size * 0.28, gy]);
			g.drawPolygon([gx - size, gy, gx, gy + size * 0.28, gx + size, gy, gx, gy - size * 0.28]);
			g.endFill();
		}
	};

	// ─── H2 champagne (cork slice: 256-space x 172..240, y 4..76) ───────────
	const CORK = { x0: px(172), x1: px(240), y0: px(4), y1: px(76) };
	const CORK_CENTER = { x: (CORK.x0 + CORK.x1) / 2, y: (CORK.y0 + CORK.y1) / 2 };
	const NECK = { x: px(160), y: px(88) };
	const POP_PERIOD = 2.4;

	const corkState = (time: number) => {
		const p = time % POP_PERIOD;
		if (p < 0.3) return { dx: 0, dy: 0, rot: 0, alpha: 1, flying: false };
		if (p < 1.35) {
			const f = (p - 0.3) / 1.05;
			return {
				dx: 150 * f,
				dy: -200 * f + 260 * f * f,
				rot: f * 7,
				alpha: f > 0.75 ? 1 - (f - 0.75) / 0.25 : 1,
				flying: true,
			};
		}
		if (p < 2.1) return { dx: 0, dy: 0, rot: 0, alpha: 0, flying: true };
		return { dx: 0, dy: 0, rot: 0, alpha: (p - 2.1) / 0.3, flying: false };
	};

	const bottleState = (time: number) => {
		const p = time % POP_PERIOD;
		if (p < 0.3 || p > 0.9) return { rot: 0, sy: 1 };
		const f = (p - 0.3) / 0.6;
		const kick = Math.sin(f * Math.PI);
		return { rot: -0.09 * kick, sy: 1 - 0.05 * kick };
	};

	// bottle mask = full square minus the cork rect
	const drawBottleMask = (g: PixiGraphics) => {
		g.beginFill(0xffffff);
		g.drawRect(-HALF, -HALF, CORK.x0 + HALF, S);
		g.drawRect(CORK.x1, -HALF, HALF - CORK.x1, S);
		g.drawRect(CORK.x0, -HALF, CORK.x1 - CORK.x0, CORK.y0 + HALF);
		g.drawRect(CORK.x0, CORK.y1, CORK.x1 - CORK.x0, HALF - CORK.y1);
		g.endFill();
	};

	const drawCorkMask = (g: PixiGraphics) => {
		g.beginFill(0xffffff);
		g.drawRect(CORK.x0 - CORK_CENTER.x, CORK.y0 - CORK_CENTER.y, CORK.x1 - CORK.x0, CORK.y1 - CORK.y0);
		g.endFill();
	};

	const drawSpray = (g: PixiGraphics) => {
		g.clear();
		const p = t % POP_PERIOD;
		if (p < 0.3 || p > 1.5) return;
		const active = (p - 0.3) / 1.2;
		for (let i = 0; i < 9; i++) {
			const dp = (active * 2.2 + i * 0.13) % 1;
			const spread = ((i % 3) - 1) * 0.35;
			const dx = Math.cos(-0.85 + spread) * 150 * dp;
			const dy = Math.sin(-0.85 + spread) * 150 * dp + 120 * dp * dp;
			const alpha = (1 - dp) * (active > 0.8 ? (1 - active) * 5 : 1);
			if (alpha <= 0) continue;
			g.beginFill(i % 2 ? 0xffe066 : 0xfff7d1, Math.min(1, alpha));
			g.drawCircle(NECK.x + dx, NECK.y + dy, 2.5 + (i % 3));
			g.endFill();
		}
	};

	// ─── H3 cocktail ────────────────────────────────────────────────────────
	const PIVOT_Y = px(244); // base of the glass
	const RIM = { left: px(38), right: px(200), y: px(92) };
	const cocktailRot = (time: number) => 0.12 * Math.sin(time * 2.6);

	const drawSplash = (g: PixiGraphics) => {
		g.clear();
		const rot = cocktailRot(t);
		for (let i = 0; i < 6; i++) {
			const dp = (t / 0.9 + i / 6) % 1;
			const fromLeft = i % 2 === 0;
			const baseX = fromLeft ? RIM.left : RIM.right;
			// rotate the rim point around the base pivot to follow the sway
			const relX = baseX;
			const relY = RIM.y - PIVOT_Y;
			const cos = Math.cos(rot);
			const sin = Math.sin(rot);
			const ox = relX * cos - relY * sin;
			const oy = relX * sin + relY * cos + PIVOT_Y;
			const dir = fromLeft ? -1 : 1;
			const dx = dir * (26 + (i % 3) * 12) * dp;
			const dy = -34 * dp + 90 * dp * dp;
			g.beginFill(i % 2 ? 0xff9ecb : 0xffd1e6, (1 - dp) * 0.9);
			g.drawCircle(ox + dx, oy + dy, 2.5 + (i % 2));
			g.endFill();
		}
	};

	// ─── H4 gift (lid slice: everything above the 256-space y=132 line) ─────
	const LID_LINE = px(132);
	const HINGE = { x: px(30), y: px(132) };
	const GIFT_PERIOD = 3.4;

	const lidState = (time: number) => {
		const p = time % GIFT_PERIOD;
		if (p < 0.3) return { angle: 0, lift: 0, openness: 0 };
		if (p < 0.85) {
			const f = (p - 0.3) / 0.55;
			const overshoot = Math.sin(Math.min(1, f * 1.15) * Math.PI * 0.5);
			return { angle: -0.62 * overshoot, lift: -10 * overshoot, openness: overshoot };
		}
		if (p < 2.45) {
			const hover = Math.sin((p - 0.85) * 3.2) * 0.035;
			return { angle: -0.62 + hover, lift: -10, openness: 1 };
		}
		if (p < 2.9) {
			const f = 1 - (p - 2.45) / 0.45;
			return { angle: -0.62 * f, lift: -10 * f, openness: f };
		}
		return { angle: 0, lift: 0, openness: 0 };
	};

	const drawLidMask = (g: PixiGraphics) => {
		g.beginFill(0xffffff);
		g.drawRect(-HALF - HINGE.x, -HALF - HINGE.y, S, LID_LINE + HALF);
		g.endFill();
	};

	const drawBoxMask = (g: PixiGraphics) => {
		g.beginFill(0xffffff);
		g.drawRect(-HALF, LID_LINE, S, HALF - LID_LINE);
		g.endFill();
	};

	const drawGiftStars = (g: PixiGraphics) => {
		g.clear();
		const { openness } = lidState(t);
		if (openness <= 0.05) return;
		// warm glow spilling from the opening
		g.beginFill(0xffe08a, 0.22 * openness * (0.8 + 0.2 * Math.sin(t * 5)));
		g.drawEllipse(0, LID_LINE - 6, 86, 30);
		g.endFill();
		for (let i = 0; i < 6; i++) {
			const dp = (t / 1.3 + i / 6) % 1;
			const alpha = Math.sin(dp * Math.PI) * openness;
			if (alpha <= 0.02) continue;
			const sx = ((i % 3) - 1) * 34 + Math.sin(t * 2 + i * 2) * 8;
			const sy = LID_LINE - 10 - dp * 105;
			const size = 5 + (i % 3) * 2.5;
			const rot = t * 2 + i;
			const cos = Math.cos(rot);
			const sin = Math.sin(rot);
			g.beginFill(i % 2 ? 0xffd75e : 0xfff7d1, alpha);
			g.drawPolygon([
				sx + cos * size,
				sy + sin * size,
				sx - sin * size * 0.4,
				sy + cos * size * 0.4,
				sx - cos * size,
				sy - sin * size,
				sx + sin * size * 0.4,
				sy - cos * size * 0.4,
			]);
			g.endFill();
		}
	};
</script>

{#if spriteKey === 'wpH1'}
	<Graphics draw={drawDiscoRays} />
	<Container scale={1 + 0.02 * Math.sin(t * 2.4)}>
		<Sprite key={spriteKey} anchor={0.5} width={S} height={S} />
	</Container>
	<Graphics draw={drawDiscoGlints} />
{:else if spriteKey === 'wpH2'}
	{@const cork = corkState(t)}
	{@const bottle = bottleState(t)}
	<Container rotation={bottle.rot} scale={{ x: 1, y: bottle.sy }}>
		<Sprite key={spriteKey} anchor={0.5} width={S} height={S} />
		<Graphics isMask draw={drawBottleMask} />
	</Container>
	{#if cork.alpha > 0}
		<Container
			x={CORK_CENTER.x + cork.dx}
			y={CORK_CENTER.y + cork.dy}
			rotation={cork.rot}
			alpha={cork.alpha}
		>
			<Sprite key={spriteKey} anchor={0.5} x={-CORK_CENTER.x} y={-CORK_CENTER.y} width={S} height={S} />
			<Graphics isMask draw={drawCorkMask} />
		</Container>
	{/if}
	<Graphics draw={drawSpray} />
{:else if spriteKey === 'wpH3'}
	<Container y={PIVOT_Y} rotation={cocktailRot(t)}>
		<Sprite key={spriteKey} anchor={0.5} y={-PIVOT_Y} width={S} height={S} />
	</Container>
	<Graphics draw={drawSplash} />
{:else}
	{@const lid = lidState(t)}
	<Graphics draw={drawGiftStars} />
	<Container>
		<Sprite key={spriteKey} anchor={0.5} width={S} height={S} />
		<Graphics isMask draw={drawBoxMask} />
	</Container>
	<Container x={HINGE.x} y={HINGE.y + lid.lift} rotation={lid.angle}>
		<Sprite key={spriteKey} anchor={0.5} x={-HINGE.x} y={-HINGE.y} width={S} height={S} />
		<Graphics isMask draw={drawLidMask} />
	</Container>
{/if}

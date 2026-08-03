<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';

	/**
	 * Opening: the smithy doors swing open.
	 *
	 * Two iron door leaves cover the whole canvas. They unlatch, part in the
	 * middle, and swing outward on their hinges to reveal the forge behind, with
	 * firelight widening through the gap as they go.
	 *
	 * The swing is faked with a horizontal scale about each door's outer edge —
	 * that is what a door leaf rotating away from the viewer projects to, and it
	 * costs one transform instead of a perspective matrix. The giveaway that would
	 * break the illusion is uniform lighting, so each leaf also darkens as it turns
	 * edge-on and its inner edge catches the light spilling out.
	 */
	const context = getContext();

	// Beats, in seconds. Held slightly longer than a normal transition because
	// this plays once, on arrival, and it is the game introducing itself.
	const UNLATCH_AT = 0.12;
	const OPEN_AT = 0.34;
	const OPEN_FOR = 1.05;
	const T_TOTAL = OPEN_AT + OPEN_FOR + 0.28;

	let t = $state(0);

	onMount(() => {
		context.eventEmitter.broadcast({ type: 'soundTransitionBlast' });
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / 1000;
			if (t >= T_TOTAL) return;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeInOut = (v: number) =>
		v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2;

	const open = $derived(
		t < OPEN_AT ? 0 : easeInOut(Math.min(1, (t - OPEN_AT) / OPEN_FOR)),
	);
	// A short shudder as the latch gives, before anything actually moves.
	const shudder = $derived(
		t > UNLATCH_AT && t < OPEN_AT
			? Math.sin((t - UNLATCH_AT) * 90) * 3 * (1 - (t - UNLATCH_AT) / (OPEN_AT - UNLATCH_AT))
			: 0,
	);

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());
	const half = $derived(sizes.width * 0.5 + 2);
	// Doors never quite reach zero width: a leaf edge-on still shows its thickness,
	// and letting it vanish entirely is what makes this kind of effect look like a
	// wipe rather than a door.
	const leafScale = $derived(Math.max(0.04, 1 - open));

	const drawLeaf = (g: PixiGraphics) => {
		g.clear();
		const w = half;
		const h = sizes.height;
		// plate
		g.rect(0, 0, w, h).fill({ color: 0x2c343d });
		// vertical plank seams
		for (let i = 1; i < 4; i += 1) {
			const x = (w / 4) * i;
			g.moveTo(x, 0).lineTo(x, h).stroke({ width: 3, color: 0x1a2027, alpha: 0.9 });
		}
		// cross braces
		for (const y of [h * 0.24, h * 0.76]) {
			g.rect(0, y - h * 0.045, w, h * 0.09).fill({ color: 0x39434e });
			g.rect(0, y - h * 0.045, w, h * 0.09).stroke({ width: 3, color: 0x151a20, alpha: 0.8 });
		}
		// rivets along the braces
		for (const y of [h * 0.24, h * 0.76]) {
			for (let i = 0; i < 6; i += 1) {
				const x = (w / 6) * (i + 0.5);
				g.circle(x, y, 7).fill({ color: 0x20262e });
				g.circle(x - 2, y - 2, 2.5).fill({ color: 0xc9d4df, alpha: 0.5 });
			}
		}
		// Handle and lit edge both sit at local x -> w, which is the inner edge for
		// the left leaf and — because the right leaf is drawn mirrored about its own
		// hinge — the inner edge for that one too. One drawing serves both.
		const handleX = w - 46;
		g.roundRect(handleX - 11, h * 0.5 - 58, 22, 116, 11).fill({ color: 0xc9922f });
		g.roundRect(handleX - 11, h * 0.5 - 58, 22, 116, 11).stroke({ width: 3, color: 0x5a3a0a });
		// the inner edge catches the light coming through the gap
		g.rect(w - 10, 0, 10, h).fill({ color: 0xff9b32, alpha: 0.35 + open * 0.5 });
	};
</script>

{#if t < T_TOTAL}
	<MainContainer>
		<!-- firelight widening through the opening gap -->
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={sizes.width * 0.5}
			y={sizes.height * 0.52}
			width={sizes.width * (0.15 + open * 1.5)}
			height={sizes.height * (0.5 + open * 1.1)}
			tint={0xff9b32}
			blendMode="add"
			alpha={0.55 * (1 - open * 0.75)}
		/>

		<!-- left leaf: hinged on the far left, so it scales about x = 0 -->
		<Container x={shudder} scale={{ x: leafScale, y: 1 }}>
			<Graphics draw={drawLeaf} />
			<Graphics
				draw={(g) => {
					g.clear();
					// turning edge-on takes the leaf out of the light
					g.rect(0, 0, half, sizes.height).fill({ color: 0x000000, alpha: open * 0.55 });
				}}
			/>
		</Container>

		<!-- right leaf: hinged on the far right, so it is drawn from the right edge -->
		<Container x={sizes.width - shudder} scale={{ x: -leafScale, y: 1 }}>
			<Graphics draw={drawLeaf} />
			<Graphics
				draw={(g) => {
					g.clear();
					g.rect(0, 0, half, sizes.height).fill({ color: 0x000000, alpha: open * 0.55 });
				}}
			/>
		</Container>
	</MainContainer>
{/if}

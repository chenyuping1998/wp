<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { everyFrame } from '../game/frameLoop';
	import { GAME_FONT } from '../game/fonts';

	// The BIG plaque's red seal was a plain red disc (review 10-17: read as a
	// placeholder). It is now an order-up rubber stamp: a paper ring and the
	// word set at runtime, slammed onto the seal after the plaque lands, with a
	// small overshoot and a settle, as if pressed by hand.
	type Props = { x: number; y: number; size: number; delay?: number; text?: string };
	const props: Props = $props();

	const PAPER = 0xfff0cf;
	const TOMATO = 0xc84a36;
	const INK = 0x20231d;

	let t = $state(-1);
	onMount(() => {
		const start = performance.now() + (props.delay ?? 520);
		return everyFrame(() => {
			t = (performance.now() - start) / 1000;
		});
	});

	const pose = $derived.by(() => {
		if (t < 0) return { scale: 0, alpha: 0, rotation: -0.5 };
		if (t < 0.12) {
			const p = t / 0.12;
			return { scale: 2.2 - 1.35 * p * p, alpha: Math.min(1, p * 3), rotation: -0.5 + 0.32 * p };
		}
		if (t < 0.3) {
			const p = (t - 0.12) / 0.18;
			return { scale: 0.85 + 0.15 * Math.sin(p * Math.PI * 0.5), alpha: 1, rotation: -0.18 };
		}
		return { scale: 1 + 0.02 * Math.sin((t - 0.3) * 4), alpha: 1, rotation: -0.18 };
	});

	const draw = (g: PixiGraphics) => {
		g.clear();
		const r = props.size / 2;
		g.circle(0, 0, r).fill({ color: TOMATO });
		g.circle(0, 0, r * 0.82).stroke({ color: PAPER, width: r * 0.09 });
		g.circle(0, 0, r).stroke({ color: INK, width: r * 0.08 });
	};
</script>

<Container x={props.x} y={props.y} scale={pose.scale} alpha={pose.alpha} rotation={pose.rotation}>
	<Graphics {draw} />
	<Text
		anchor={0.5}
		text={props.text ?? 'UP!'}
		style={{ fontFamily: GAME_FONT, fontSize: props.size * 0.34, fill: PAPER, letterSpacing: 1 }}
	/>
</Container>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	type Props = {
		// true while the reels are running — the icon spins and, once this flips
		// back to false, finishes the current turn and rests upright.
		spinning: boolean;
		radius: number;
		color?: number;
	};

	const props: Props = $props();
	const color = $derived(props.color ?? 0xffffff);

	const TWO_PI = Math.PI * 2;
	const MAX_SPEED = 0.075; // rad per 16ms tick ≈ 0.7 turns/s — a calm spin

	let rotation = $state(0);
	let speed = 0;

	onMount(() => {
		const id = setInterval(() => {
			if (props.spinning) {
				// ramp up on press
				speed = Math.min(MAX_SPEED, speed + 0.008);
				rotation += speed;
				if (rotation >= TWO_PI) rotation -= TWO_PI;
			} else if (speed > 0 || rotation !== 0) {
				// reels stopped — halt right away, back to the upright rest pose
				rotation = 0;
				speed = 0;
			}
		}, 16);
		return () => clearInterval(id);
	});

	// Classic 🔄 refresh mark: one chunky ring (the hole in the middle is a
	// perfect circle) split into two arcs, each ending in an arrowhead.
	const drawIcon = (g: PixiGraphics) => {
		const r = props.radius;
		const outerR = r * 1.18;
		const innerR = r * 0.72;
		const midR = (outerR + innerR) / 2;
		const headExt = r * 0.14; // arrowhead base sticks out past both ring edges
		const headSweep = 0.62; // rad the arrow tip reaches into the gap

		// filled annular sector between two angles (the ring piece itself)
		const ringPiece = (a0: number, a1: number) => {
			const pts: number[] = [];
			const steps = Math.max(10, Math.ceil(((a1 - a0) / Math.PI) * 28));
			for (let i = 0; i <= steps; i++) {
				const a = a0 + ((a1 - a0) * i) / steps;
				pts.push(outerR * Math.cos(a), outerR * Math.sin(a));
			}
			for (let i = steps; i >= 0; i--) {
				const a = a0 + ((a1 - a0) * i) / steps;
				pts.push(innerR * Math.cos(a), innerR * Math.sin(a));
			}
			return pts;
		};

		// triangle sitting in the gap: base flush with the arc end, tip along the ring
		const arrowhead = (a: number) => [
			(outerR + headExt) * Math.cos(a),
			(outerR + headExt) * Math.sin(a),
			(innerR - headExt) * Math.cos(a),
			(innerR - headExt) * Math.sin(a),
			midR * Math.cos(a + headSweep),
			midR * Math.sin(a + headSweep),
		];

		// two arcs of 140° leave two 40° gaps for the arrowheads
		const segments: [number, number][] = [
			[Math.PI * (-170 / 180), Math.PI * (-30 / 180)],
			[Math.PI * (10 / 180), Math.PI * (150 / 180)],
		];

		g.clear();
		g.beginFill(color);
		for (const [a0, a1] of segments) {
			g.drawPolygon(ringPiece(a0, a1));
			g.drawPolygon(arrowhead(a1));
		}
		g.endFill();
	};
</script>

<Container {rotation}>
	<Graphics draw={drawIcon} />
</Container>

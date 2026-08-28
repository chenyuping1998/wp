<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { stateBet } from 'state-shared';

	import { uiTheme } from '../theme.svelte';

	type Props = {
		// true while the reels are running — the icon spins and, once this flips
		// back to false, finishes the current turn and rests upright.
		spinning: boolean;
		radius: number;
		color?: number;
	};

	const props: Props = $props();

	/**
	 * The charge for the bet mode currently switched on, if the game named one.
	 *
	 * `undefined` for every game that leaves uiTheme.spinButtonCharge empty, and
	 * for any mode inside a game that did not name that one - so this is inert
	 * unless a game asked for it.
	 */
	const charge = $derived(
		uiTheme.spinButtonCharge[`${stateBet.activeBetModeKey ?? ''}`.toUpperCase()],
	);
	const color = $derived(charge?.color ?? props.color ?? 0xffffff);

	const TWO_PI = Math.PI * 2;
	const MAX_SPEED = 0.075; // rad per 16ms tick ≈ 0.7 turns/s — a calm spin

	let rotation = $state(0);
	let speed = 0;

	// Soft halo behind the mark. The rotation alone reads as a single flat loop;
	// a slow breath underneath gives the button some life while it sits idle and
	// lifts as the reels run. Deliberately NOT inside the rotating container —
	// a spinning glow reads as clutter rather than light.
	let pulse = $state(0);
	let phase = 0;
	let orbitPhase = $state(0);

	onMount(() => {
		const id = setInterval(() => {
			// idle breathes slowly and shallowly; spinning runs faster and brighter.
			// A charged mode runs faster and brighter again on top of that, which is
			// what makes an expensive mode feel expensive while it is idle - the
			// moment a player is deciding whether to press.
			const rate = charge?.speed ?? 1;
			phase += (props.spinning ? 0.075 : 0.032) * rate;
			const base = props.spinning ? 0.5 : 0.24;
			const amp = props.spinning ? 0.32 : 0.16;
			pulse = (base + amp * Math.sin(phase)) * (charge?.strength ?? 1);
			// The motes ride their own clock so they keep circling at a steady rate
			// while the halo breathes.
			orbitPhase += 0.012 * rate;
			if (orbitPhase >= TWO_PI) orbitPhase -= TWO_PI;

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

{#if uiTheme.spinButtonGlow || charge}
	<Graphics
		draw={(g: PixiGraphics) => {
			const r = props.radius;
			g.clear();
			// stacked low-alpha rings stand in for a blur — widest and faintest
			// first, so the falloff reads as light rather than as outlines
			for (const [mult, width, alpha] of [
				[2.0, r * 0.5, 0.1],
				[1.62, r * 0.42, 0.16],
				[1.3, r * 0.3, 0.22],
			] as [number, number, number][]) {
				g.circle(0, 0, r * mult);
				g.stroke({ width, color, alpha: Math.min(0.9, alpha * pulse) });
			}

			// Motes circling the button. This is the part that separates one charged
			// mode from another at a glance: the halo says "charged", the count and
			// the speed of what is orbiting say how much.
			const orbits = charge?.orbits ?? 0;
			for (let i = 0; i < orbits; i += 1) {
				const angle = orbitPhase + (TWO_PI * i) / orbits;
				const ring = r * (1.55 + 0.12 * Math.sin(orbitPhase * 2 + i));
				const mx = Math.cos(angle) * ring;
				const my = Math.sin(angle) * ring;
				const size = r * 0.13 * (0.7 + 0.3 * Math.sin(orbitPhase * 3 + i));
				// a soft head over a wider, fainter body - the same two-part falloff
				// the halo uses, at mote scale
				g.circle(mx, my, size * 2.1);
				g.fill({ color, alpha: 0.16 * pulse });
				g.circle(mx, my, size);
				g.fill({ color: 0xffffff, alpha: 0.55 * pulse });
			}
		}}
	/>
{/if}

<Container {rotation}>
	<Graphics draw={drawIcon} />
</Container>

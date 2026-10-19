<script lang="ts" module>
	// Raised by Mascot.svelte at the release of 'bowl'. Resolves once the ball
	// has rolled off the left edge of the canvas. Layout (MainContainer) units.
	export type EmitterEventBowlingBallRoll = {
		type: 'bowlingBallRoll';
		x: number;
		y: number;
		size: number;
		groundY: number;
		/** the in-hand ball's angle and velocity (layout units/s) at the release */
		rotation?: number;
		vx?: number;
		vy?: number;
	};
</script>

<script lang="ts">
	/**
	 * The ball he bowls before the free-game wipe (2026-10-18).
	 *
	 * Mascot.svelte stands behind the board, so the ball that leaves his hand
	 * is drawn here, above it: it drops the short way from the hand to the
	 * floor line he stands on, takes one small bounce, and rolls left along
	 * the foot of the board frame and off the canvas. It is the transition's
	 * own teal ball (smTransitionWipe) — the wipe then rolls back in huge.
	 */
	import { onDestroy } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	let ball = $state<{ x: number; y: number; rot: number; size: number; ground: number } | null>(null);
	let raf = 0;
	let finish: (() => void) | undefined;
	const stop = () => {
		cancelAnimationFrame(raf);
		ball = null;
		const done = finish;
		finish = undefined;
		done?.();
	};
	onDestroy(stop);

	const drawShadow = (g: PixiGraphics) => {
		g.clear();
		if (!ball) return;
		const lift = Math.max(0, ball.ground - ball.size / 2 - ball.y);
		const k = Math.max(0, 1 - lift / (ball.size * 1.5));
		g.ellipse(ball.x, ball.ground - ball.size * 0.04, ball.size * (0.34 + 0.12 * k), ball.size * 0.07).fill({
			color: 0x14262e,
			alpha: 0.4 * k,
		});
	};

	context.eventEmitter.subscribeOnMount({
		bowlingBallRoll: (event) =>
			new Promise<void>((resolve) => {
				stop();
				finish = resolve;
				const r = event.size / 2;
				const restY = event.groundY - r;
				// it leaves the hand at the hand's speed and angle
				let x = event.x, y = Math.min(event.y, restY);
				let vx = event.vx ?? -event.size * 3.2, vy = event.vy ?? 0;
				let rot = event.rotation ?? 0, landed = 0;
				const GRAVITY = event.size * 26;
				const SPEED = layout.width * 1.05;
				ball = { x, y, rot, size: event.size, ground: event.groundY };
				let previous = performance.now();
				const tick = (now: number) => {
					const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000));
					previous = now;
					if (landed < 2) {
						vy += GRAVITY * dt;
						y += vy * dt;
						if (y >= restY) {
							y = restY;
							if (landed === 0) context.eventEmitter.broadcast({ type: 'soundBowlingRoll' });
							landed++;
							// one small hop, then it is on the lane
							vy = landed === 1 ? -Math.abs(vy) * 0.28 : 0;
						}
					}
					// picks up speed once it is on the lane (in the air it keeps
					// what the hand gave it)
					if (landed) vx += (-SPEED - vx) * Math.min(1, dt * 3.2);
					x += vx * dt;
					rot += (vx * dt) / r;
					ball = { x, y, rot, size: event.size, ground: event.groundY };
					// the canvas's left edge, in layout units (MainContainer centres)
					const leftEdge = layout.width / 2 - canvas.width / 2 / layout.scale;
					if (x < leftEdge - event.size) {
						stop();
						return;
					}
					raf = requestAnimationFrame(tick);
				};
				raf = requestAnimationFrame(tick);
			}),
	});
</script>

{#if ball}
	<MainContainer>
		<Graphics draw={drawShadow} />
		<Sprite key="smTransitionWipe" anchor={0.5} x={ball.x} y={ball.y} rotation={ball.rot}
			width={ball.size} height={ball.size} />
	</MainContainer>
{/if}

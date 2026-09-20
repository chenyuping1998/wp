<script lang="ts">
	/**
	 * The "it woke up" halo: a ring of rays behind the Buy Bonus plate that
	 * LIGHTS on hover and then TURNS for as long as the cursor is on it.
	 *
	 * Why a separate component rather than more branches inside ButtonBuyBonus:
	 * the animation has to start and stop with `hovered`, and `hovered` only
	 * exists inside that button's children snippet. Reading it into component
	 * state from inside the snippet would be writing state during render. Taking
	 * it as a PROP on a child moves the timer to where the value already is, so
	 * the clock genuinely runs only while the cursor is over the button instead
	 * of ticking all game long the way the idle-glow timer does.
	 *
	 * Why rays rather than spinning the plate itself: the plate is a panel with
	 * words on it. Rotating that turns the label upside down. The reference the
	 * user pointed at is a ship's wheel — a rim that can turn because it is
	 * radially symmetric and carries no type — so the turning part here is a rim
	 * of its own, behind the plate, and the plate and its label stay put.
	 */
	import { Graphics } from 'pixi-svelte';

	const props: {
		hovered: boolean;
		/** Centre, in the parent's coordinates — the button's own `center`. */
		center: { x: number; y: number };
		/** The plate's drawn size; the ring is sized from this. */
		plate: { width: number; height: number };
		/** Degrees per second. Negative turns the other way. */
		speed: number;
		rays: number;
		color: number;
		/** Ring radius as a multiple of the plate's half-diagonal. >1 peeks out. */
		radius: number;
	} = $props();

	// Three quantities, and keeping them apart is what makes it read as "lights
	// up, then spins" rather than as a ring that snaps into existence already
	// turning:
	//
	//   lit    alpha. Ramps 0 -> 1 over FADE_MS when the cursor arrives. On the
	//          way out it does NOT run its own fade — see below.
	//   speed  deg/sec, eased toward the target rather than set to it.
	//   angle  integrates speed. Wrapped at 360 so a long session cannot drift
	//          off into float noise, and never reset, so leaving and returning
	//          picks the rim up where it was instead of jumping it back to
	//          twelve o'clock.
	//
	// ── THE MOMENTUM, AND WHY IT IS ASYMMETRIC ─────────────────────────────────
	//
	// A ring that starts and stops dead is a video being played and paused. One
	// with mass answers a hand at once and then carries on for a moment after it
	// leaves. So: takes hold quickly (SPIN_UP), lets go slowly (SPIN_DOWN).
	//
	// Borrowed from a sibling project's ship's-wheel button, which had solved
	// this properly; the constants are theirs and are not worth re-deriving.
	const SPIN_UP = 7; // per second, toward the target
	const SPIN_DOWN = 1.8; // per second, back to rest — deliberately slower
	const FADE_MS = 180;
	const TICK_MS = 16;
	// Below this the coast is over. Without a floor the exponential ease only ever
	// approaches zero and the timer would run forever on an idle button.
	const STOP_DEG_PER_SEC = 0.25;
	// A STALLED TAB MUST NOT JUMP A WHOLE TURN. Clamped to 100ms: if the browser
	// stops servicing timers (backgrounded, blocked main thread), the next tick
	// resumes from where it was instead of integrating the entire gap at once.
	const MAX_DT = 0.1;

	let lit = $state(0);
	let speed = $state(0);
	let angle = $state(0);

	$effect(() => {
		// Runs while the cursor is over the button AND while the ring is still
		// coasting after it leaves — otherwise a mouse-out would freeze a
		// half-bright ring on screen mid-turn.
		if (!props.hovered && speed === 0 && lit <= 0) return;

		// setInterval, NOT requestAnimationFrame. rAF does not run at all in a
		// backgrounded tab, so a ring left mid-coast would still be at that exact
		// angle, at that exact brightness, when the player came back — frozen
		// rather than at rest.
		let last = Date.now();
		const id = setInterval(() => {
			const now = Date.now();
			const dt = Math.min(MAX_DT, (now - last) / 1000);
			last = now;

			const want = props.hovered ? props.speed : 0;
			const k = Math.abs(want) > Math.abs(speed) ? SPIN_UP : SPIN_DOWN;
			speed += (want - speed) * Math.min(1, k * dt);

			if (props.hovered) {
				lit = Math.min(1, lit + (dt * 1000) / FADE_MS);
			} else {
				// THE LIGHT DIES WITH THE MOTION rather than on its own timer.
				//
				// A 180ms fade-out would have the rays gone long before the coast
				// finished, which throws the momentum away — the thing it exists to
				// show would happen invisibly. Tying alpha to the remaining speed
				// means the ring dims as it slows and the two arrive at nothing
				// together, which is also just what a spinning light looks like.
				lit = Math.min(lit, props.speed ? Math.abs(speed / props.speed) : 0);
			}

			if (want === 0 && Math.abs(speed) < STOP_DEG_PER_SEC) {
				speed = 0;
				lit = 0;
				return;
			}
			angle = (angle + speed * dt) % 360;
		}, TICK_MS);
		return () => clearInterval(id);
	});
</script>

{#if lit > 0}
	<Graphics
		x={props.center.x}
		y={props.center.y}
		draw={(g) => {
			const half = Math.hypot(props.plate.width, props.plate.height) / 2;
			const outer = half * props.radius;
			// The rays start just inside the plate's corners so their roots are
			// hidden behind it and only the tips show. A ring that starts outside
			// the plate reads as a separate object orbiting the button.
			const inner = half * 0.72;
			const step = (Math.PI * 2) / props.rays;
			// Half-width of a ray at its tip, as an angle. Tapered: wide at the rim,
			// meeting at a point on the inside, which is what makes it read as
			// light rather than as a cog.
			const spread = step * 0.16;
			const base = angle * (Math.PI / 180);
			g.clear();
			for (let i = 0; i < props.rays; i += 1) {
				const a = base + i * step;
				g.moveTo(Math.cos(a - spread) * outer, Math.sin(a - spread) * outer);
				g.lineTo(Math.cos(a + spread) * outer, Math.sin(a + spread) * outer);
				g.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
				g.closePath();
				g.fill({ color: props.color, alpha: 0.55 * lit });
			}
			// A soft disc under the rays so the plate sits in light rather than in
			// front of a bare star. Two rings at low alpha, the same stacking the
			// idle glow uses.
			//
			// Kept TIGHT and FAINT on purpose. The first version ran to 1.06 of the
			// ray radius at 0.10/0.14 alpha, which on a night board is a pale plate
			// the size of the whole button — the plate stopped reading as wine-dark
			// and the rays lost their edge against it. The halo's job is to seat the
			// rays, not to be seen in its own right.
			for (const [grow, weight] of [
				[0.94, 0.05],
				[0.78, 0.07],
			] as [number, number][]) {
				g.circle(0, 0, outer * grow);
				g.fill({ color: props.color, alpha: weight * lit });
			}
		}}
	/>
{/if}

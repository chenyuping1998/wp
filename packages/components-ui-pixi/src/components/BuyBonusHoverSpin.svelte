<script lang="ts">
	/**
	 * A DIAL ON THE BUY BONUS PLATE that lights when the pointer arrives and turns
	 * for as long as it stays.
	 *
	 * ── Why a dial rather than turning the plate ───────────────────────────────
	 *
	 * A sibling project's Buy Bonus plate is a ship's wheel, so hovering it turns
	 * the whole sprite: it is round and carries no type, and a wheel that does not
	 * move when a hand goes near it is a picture of a wheel. Most plates are not
	 * like that. They are panels with words across them, and rotating one puts the
	 * label upside down.
	 *
	 * So the turning part is the button's own, drawn between the plate and its
	 * caption: an ANNULUS of spokes with a knob on each outer end, sized to run
	 * around the words rather than across them. The plate and the label do not
	 * move.
	 *
	 * ── Why a separate component ───────────────────────────────────────────────
	 *
	 * The animation starts and stops with `hovered`, and `hovered` only exists
	 * inside ButtonBuyBonus's children snippet. Reading it into component state
	 * from in there would be writing state during render. Taking it as a PROP on a
	 * child moves the clock to where the value already is, so it genuinely runs
	 * only while the cursor is on the button rather than ticking all game long the
	 * way the idle-glow timer does.
	 */
	import { Graphics } from 'pixi-svelte';

	const props: {
		hovered: boolean;
		/** Centre, in the parent's coordinates — the button's own `center`. */
		center: { x: number; y: number };
		/** The plate's drawn size; the dial is sized from this. */
		plate: { width: number; height: number };
		/** Degrees per second. Negative turns the other way. */
		speed: number;
		/** Spokes. Pick it to match the art it is quoting, not by eye. */
		spokes: number;
		color: number;
		/** Outer radius, as a multiple of the plate's half-MINIMUM-side. */
		radius: number;
		/** Inner radius, same units. Must clear the caption or the spokes cross it. */
		inner: number;
		/** Knob radius at each spoke's outer end, as a fraction of the outer radius. */
		knob: number;
	} = $props();

	// Three quantities, and keeping them apart is what makes it read as "lights
	// up, then spins" rather than as a dial that snaps into existence already
	// turning:
	//
	//   lit    alpha. Ramps 0 -> 1 over FADE_MS when the cursor arrives. On the
	//          way out it does NOT run its own fade — see below.
	//   speed  deg/sec, eased toward the target rather than set to it.
	//   angle  integrates speed. Wrapped at 360 so a long session cannot drift
	//          off into float noise, and never reset, so leaving and returning
	//          picks the dial up where it was instead of jumping it back to
	//          twelve o'clock.
	//
	// ── THE MOMENTUM, AND WHY IT IS ASYMMETRIC ─────────────────────────────────
	//
	// A dial that starts and stops dead is a video being played and paused. One
	// with mass answers a hand at once and then carries on for a moment after it
	// leaves. So: takes hold quickly (SPIN_UP), lets go slowly (SPIN_DOWN).
	//
	// Borrowed from the same sibling project, which had solved this properly; the
	// constants are theirs and are not worth re-deriving.
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
		// Runs while the cursor is over the button AND while the dial is still
		// coasting after it leaves — otherwise a mouse-out would freeze a
		// half-bright dial on screen mid-turn.
		if (!props.hovered && speed === 0 && lit <= 0) return;

		// setInterval, NOT requestAnimationFrame. rAF does not run at all in a
		// backgrounded tab, so a dial left mid-coast would still be at that exact
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
				// A 180ms fade-out would have the dial gone long before the coast
				// finished, which throws the momentum away — the thing it exists to
				// show would happen invisibly. Tying alpha to the remaining speed
				// means it dims as it slows and the two arrive at nothing together,
				// which is also just what a turning light looks like.
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
			// Sized off the SHORTER side. A plate is usually squarish but not always,
			// and a dial measured against the diagonal on a wide one runs off both
			// ends; against the short side it always fits the object it sits on.
			const half = Math.min(props.plate.width, props.plate.height) / 2;
			const outer = half * props.radius;
			const inner = half * props.inner;
			const knob = outer * props.knob;
			const step = (Math.PI * 2) / props.spokes;
			const base = (angle * Math.PI) / 180;
			// Half-width of a spoke, as an angle at the outer rim. Tapered to a point
			// on the inside, which is what a cast handle looks like and what keeps it
			// from reading as a cog.
			const spread = step * 0.09;

			g.clear();

			// The bed the spokes turn against: a faint annulus, so the dial reads as
			// a machined part let into the plate rather than as lines floating on it.
			g.circle(0, 0, outer * 1.02);
			g.fill({ color: props.color, alpha: 0.055 * lit });
			g.circle(0, 0, inner * 0.98);
			g.cut();

			for (let i = 0; i < props.spokes; i += 1) {
				const a = base + i * step;
				g.moveTo(Math.cos(a - spread) * outer, Math.sin(a - spread) * outer);
				g.lineTo(Math.cos(a + spread) * outer, Math.sin(a + spread) * outer);
				g.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
				g.closePath();
				g.fill({ color: props.color, alpha: 0.5 * lit });
				// The knob on the end. On the art this quotes, the handle's grips are
				// the part you actually see at small sizes — the spokes behind them
				// are nearly invisible — so they carry more alpha than the spoke does.
				g.circle(Math.cos(a) * outer, Math.sin(a) * outer, knob);
				g.fill({ color: props.color, alpha: 0.72 * lit });
			}

			// The rim, drawn last so the knobs sit on it.
			g.circle(0, 0, outer);
			g.stroke({ width: Math.max(1, outer * 0.035), color: props.color, alpha: 0.42 * lit });
		}}
	/>
{/if}

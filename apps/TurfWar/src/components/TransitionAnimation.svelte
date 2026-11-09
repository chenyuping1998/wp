<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	/**
	 * Free-game transition: the vault closes, and opens on a different game.
	 *
	 * What it replaces was a car driving across the screen — Hot Miami's own idea,
	 * kept through one reskin by swapping the neon coupe for a 1930s sedan. The
	 * car was never the problem; "a vehicle drives past" simply is not the beat
	 * this game is about. The Scatter is a vault dial, the top tier's backdrop is
	 * a vault room, and the feature is called getting into the vault. Closing a
	 * vault door and opening it on the free game says that in one gesture.
	 *
	 * It also does the mechanical job better than a car did. A transition exists
	 * to hide the moment the board is swapped, and two opaque steel doors meeting
	 * in the middle hide it completely — where the car left the screen black and
	 * empty for half a second while nothing happened.
	 *
	 * ── Beats ──────────────────────────────────────────────────────────────────
	 *
	 *   CLOSE  the halves slide in and meet          460ms
	 *   LOCK   the dial spins and clunks home        340ms
	 *   HOLD   sealed; `onblack` fires here          520ms
	 *   OPEN   dial reverses, doors part             780ms
	 *
	 * `onblack` is the caller's cue to swap the game, and it fires at the start of
	 * HOLD — the first frame on which the doors are fully shut and the dial has
	 * stopped. Nothing is moving and nothing is transparent, so the swap cannot be
	 * seen. This is the same contract the car version had; only the cover changed.
	 *
	 * ── Why the doors are anchored at the seam ─────────────────────────────────
	 *
	 * Each half is cover-scaled, so it is WIDER than the half-screen it fills.
	 * Anchoring by centre would push that overflow inward and the left door would
	 * cross the middle. Anchoring the left door by its RIGHT edge and the right
	 * door by its LEFT edge puts the overflow off-screen instead, and makes the
	 * seam exactly x = 0 at every viewport size. The art is drawn to meet there:
	 * ART_BRIEF §4.5 requires the inner edge to run to the file boundary, opaque,
	 * with no shadow — a gap here would be a gap over the swap.
	 */
	type Props = {
		onblack?: () => void;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const CLOSE_MS = 460;
	const LOCK_MS = 340;
	const HOLD_MS = 520;
	const OPEN_MS = 780;

	const LOCK_AT = CLOSE_MS;
	const HOLD_AT = CLOSE_MS + LOCK_MS;
	const OPEN_AT = HOLD_AT + HOLD_MS;
	const TOTAL_MS = OPEN_AT + OPEN_MS;

	/** Source dimensions, from ART_BRIEF §4.5. */
	const DOOR_W = 1024;
	const DOOR_H = 1536;
	/** A quarter turn plus a bit, so the spokes visibly travel rather than blur. */
	const LOCK_TURN = Math.PI * 0.62;

	let elapsed = $state(0);
	let clock = $state(0);
	let rafId = 0;
	let completed = false;
	let blackFired = false;
	let clunkFired = false;

	let doorGap = $state(1); // 1 = wide open, 0 = shut
	let dialSpin = $state(0);
	// 2026-11-05: the art is a PADLOCK now (it was drawn as one even before),
	// so it swings from its shackle and drops onto the hasp instead of spinning
	// a quarter turn like a vault dial.
	let lockSwing = $state(0);
	let lockDrop = $state(0);
	let lockOff = $state(0); // 0 hooked on, 1 fallen away
	let sealAlpha = $state(0);
	let bounce = $state(0);

	const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
	const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;
	const easeInCubic = (t: number) => clamp01(t) ** 3;

	/**
	 * The dial's settle: it overshoots a few degrees and comes back, which is what
	 * a heavy wheel hitting its stop does. A pure ease-out arrives as if the wheel
	 * were weightless, and the whole point of the object is that it is not.
	 */
	const settle = (t: number) => {
		const e = easeOutCubic(t);
		return e + Math.sin(clamp01(t) * Math.PI) * 0.06 * (1 - e);
	};

	onMount(() => {
		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			elapsed += Math.min(100, Math.max(0, now - last));
			last = now;
			clock = elapsed;

			if (elapsed < LOCK_AT) {
				// 2026-10-01: it is a ROLLER SHUTTER — it falls from the top and
				// accelerates (gravity) into the ground, instead of two halves
				// sliding in from the sides like a vault door.
				doorGap = 1 - easeInCubic(elapsed / CLOSE_MS);
				dialSpin = 0;
			} else if (elapsed < HOLD_AT) {
				doorGap = 0;
				dialSpin = LOCK_TURN * settle((elapsed - LOCK_AT) / LOCK_MS);
			} else if (elapsed < OPEN_AT) {
				doorGap = 0;
				dialSpin = LOCK_TURN;
			} else {
				const p = (elapsed - OPEN_AT) / OPEN_MS;
				// The lock comes off over the first 30% (see lockOff) and the
				// shutter only starts rolling once it has: a shutter that lifts while
				// its lock is still on reads as two unrelated animations.
				dialSpin = LOCK_TURN * (1 - easeOutCubic(clamp01(p / 0.45)));
				// Reaches 1 at p = 0.87, not at p = 1. The doors have to be GONE
				// before the transition ends, not arriving off-screen on its last
				// frame — otherwise the final beat still has steel in shot while the
				// board underneath is what the player is meant to be looking at.
				// Rolled back up: smoothstep haul after the lock lets go.
				const q = clamp01((p - 0.25) / 0.62);
				doorGap = q * q * (3 - 2 * q);
			}
			if (elapsed < LOCK_AT) {
				lockSwing = 0;
				lockDrop = 1;
				lockOff = 0;
			} else if (elapsed < OPEN_AT) {
				const t = (elapsed - LOCK_AT) / LOCK_MS;
				lockDrop = 1 - easeOutCubic(clamp01(t * 1.6));
				lockSwing = 0.2 * Math.sin(clamp01(t * 0.9) * Math.PI * 3) * Math.exp(-clamp01(t) * 2.6);
			} else {
				const p = (elapsed - OPEN_AT) / OPEN_MS;
				lockDrop = 0;
				lockSwing = -0.16 * Math.sin(clamp01(p / 0.3) * Math.PI * 2) * (1 - clamp01(p / 0.3));
				// unhooked: it falls away (gravity) and fades before the roll starts
				lockOff = easeInCubic(clamp01((p - 0.08) / 0.24));
			}
			// the slam: the bottom rail bounces off the ground once
			const sinceSlam = elapsed - LOCK_AT;
			bounce =
				sinceSlam >= 0 && sinceSlam < 300
					? Math.sin((sinceSlam / 300) * Math.PI * 2) * Math.exp(-sinceSlam / 110)
					: 0;

			// A seam shadow, drawn by us rather than baked into the art — see the
			// note in ART_BRIEF §4.5 about why the halves must not carry one.
			sealAlpha = elapsed >= LOCK_AT && elapsed < OPEN_AT + OPEN_MS * 0.4 ? 1 - doorGap : 0;

			if (elapsed >= LOCK_AT && !clunkFired) {
				clunkFired = true;
				context.eventEmitter.broadcast({ type: 'soundNeonZap' });
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.4 });
			}

			if (elapsed >= HOLD_AT && !blackFired) {
				blackFired = true;
				props.onblack?.();
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

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());
	// Cover half the screen, so a door never runs out of art on a tall viewport.
	const doorScale = $derived(Math.max(sizes.width / 2 / DOOR_W, sizes.height / DOOR_H));
	const doorW = $derived(DOOR_W * doorScale);
	const doorH = $derived(DOOR_H * doorScale);
	// 2026-11-05: no sideways travel any more — a roller shutter rolls back UP
	// the way it came down (the Container's y), it does not part like doors.
	// 0.32 (was 0.4): the padlock no longer crowds the sprayed logo above it
	// and never more than 0.42 of the width, or on a phone held upright it
	// filled two thirds of the screen and sat on the logo
	const dialSize = $derived(Math.min(sizes.height * 0.32, sizes.width * 0.42));

	// 2026-11-05: no seam shadow. A roller shutter is one sheet; the two
	// halves are cut from ONE painting (design/shutter_20261105), so they meet
	// without a line, and the dark band read as a pole down the middle.
</script>

<Container
	x={sizes.width * 0.5}
	y={sizes.height * 0.5 - doorGap * ((sizes.height + doorH) / 2) * 1.04 - bounce * sizes.height * 0.03}
>
	<!--
		Anchored at the seam: left door by its right edge, right door by its left.
		See the header note — this is what keeps the join at x = 0 and the overflow
		off-screen at every aspect ratio.
	-->
	<Sprite
		key="capoVaultDoorL"
		anchor={{ x: 1, y: 0.5 }}
		width={doorW}
		height={doorH}
	/>
	<Sprite
		key="capoVaultDoorR"
		anchor={{ x: 0, y: 0.5 }}
		width={doorW}
		height={doorH}
	/>


	<!--
		The dial rides the seam, so it splits with the doors as they part. Drawn
		last so the seam shadow passes behind it rather than across its face.
	-->
	{#if sealAlpha > 0.01}
		<!-- pivots at the top of the shackle (8% down the canvas) -->
		<Sprite
			key="capoVaultDial"
			anchor={{ x: 0.5, y: 0.08 }}
			y={-dialSize * 0.42 - lockDrop * dialSize * 0.16 + lockOff * sizes.height * 0.55}
			rotation={lockSwing + lockOff * 0.5}
			width={dialSize}
			height={dialSize}
			alpha={Math.min(1, sealAlpha * 1.6) * (1 - lockOff)}
		/>
	{/if}
</Container>

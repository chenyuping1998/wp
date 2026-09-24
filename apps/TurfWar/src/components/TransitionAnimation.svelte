<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

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
	let sealAlpha = $state(0);

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
			elapsed += now - last;
			last = now;
			clock = elapsed;

			if (elapsed < LOCK_AT) {
				// Heavy doors do not ease in gently — they are already moving when
				// they enter frame and slow only at the very end.
				doorGap = 1 - easeOutCubic(elapsed / CLOSE_MS);
				dialSpin = 0;
			} else if (elapsed < HOLD_AT) {
				doorGap = 0;
				dialSpin = LOCK_TURN * settle((elapsed - LOCK_AT) / LOCK_MS);
			} else if (elapsed < OPEN_AT) {
				doorGap = 0;
				dialSpin = LOCK_TURN;
			} else {
				const p = (elapsed - OPEN_AT) / OPEN_MS;
				// The dial unwinds over the first 45% and the doors only start moving
				// once it has: a door that opens while its lock is still turning reads
				// as two unrelated animations.
				dialSpin = LOCK_TURN * (1 - easeOutCubic(clamp01(p / 0.45)));
				// Reaches 1 at p = 0.87, not at p = 1. The doors have to be GONE
				// before the transition ends, not arriving off-screen on its last
				// frame — otherwise the final beat still has steel in shot while the
				// board underneath is what the player is meant to be looking at.
				doorGap = easeInCubic(clamp01((p - 0.25) / 0.62));
			}

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
	// Far enough out that the INNER edge clears the screen when fully open.
	//
	// The bound is width/2: each door is anchored by its inner edge, so that edge
	// has to travel half the screen to leave. 0.55 satisfies it by 5% and looked
	// fine frozen, but with the easing the doors were only just clearing on the
	// final frame. 0.62 gives them room to be plainly gone before the end.
	const travel = $derived(sizes.width * 0.62);
	const dialSize = $derived(sizes.height * 0.4);

	/** The dark line where the two halves meet, plus its falloff onto each door. */
	const drawSeam = (g: PixiGraphics) => {
		g.clear();
		if (sealAlpha <= 0.01) return;
		const { height } = sizes;
		for (const [halfWidth, alpha] of [
			[height * 0.05, 0.3],
			[height * 0.014, 0.62],
		] as [number, number][]) {
			g.rect(-halfWidth, -height, halfWidth * 2, height * 2);
			g.fill({ color: 0x000000, alpha: alpha * sealAlpha });
		}
	};
</script>

<Container x={sizes.width * 0.5} y={sizes.height * 0.5}>
	<!--
		Anchored at the seam: left door by its right edge, right door by its left.
		See the header note — this is what keeps the join at x = 0 and the overflow
		off-screen at every aspect ratio.
	-->
	<Sprite
		key="capoVaultDoorL"
		anchor={{ x: 1, y: 0.5 }}
		x={-doorGap * travel}
		width={doorW}
		height={doorH}
	/>
	<Sprite
		key="capoVaultDoorR"
		anchor={{ x: 0, y: 0.5 }}
		x={doorGap * travel}
		width={doorW}
		height={doorH}
	/>

	<Graphics draw={drawSeam} />

	<!--
		The dial rides the seam, so it splits with the doors as they part. Drawn
		last so the seam shadow passes behind it rather than across its face.
	-->
	{#if sealAlpha > 0.01}
		<Sprite
			key="capoVaultDial"
			anchor={0.5}
			rotation={dialSpin}
			width={dialSize}
			height={dialSize}
			alpha={Math.min(1, sealAlpha * 1.6)}
		/>
	{/if}
</Container>

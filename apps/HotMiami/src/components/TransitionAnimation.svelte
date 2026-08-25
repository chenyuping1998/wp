<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	// Scene transition: cut to black, then the car tears through the dark with its
	// headlights raking across the frame.
	//
	// Two earlier versions: a grenade (GoBananas' animation with the WOMAN symbol
	// dropped in as the bomb — armed, blinked red, detonated), then the car
	// driving across the live board. The car was right but the board being visible
	// underneath was fighting it: a lit reel grid behind a vehicle reads as a
	// sprite sliding over a UI, not as something moving through a place.
	//
	// Blacking out first is what makes it work, and not only because it looks
	// better. On black you can draw light, and light is what sells a car —
	// headlight cones sweeping the frame, a ground smear under the wheels, tail
	// lights receding. None of that is visible over a magenta reel housing. It
	// also hides the scene swap completely: the screen is at its most opaque when
	// `oncomplete` fires and the caller changes scene, so the cut has nowhere to
	// show.
	//
	// The car (hmCarSide, drawn by design/build_transition_car.py) faces right, so
	// it drives left to right and never needs mirroring.
	type Props = {
		/** the screen is fully black and nothing is moving: swap the game here */
		onblack?: () => void;
		/** the reveal has finished and this can go away */
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// 2920ms total: 1420ms of car, then 500ms of held black and a 1000ms reveal. The drive was
	// slowed from 760ms once because the car crossed before the eye settled on it;
	// the blackout is carved out of the front rather than added on top.
	const DARK_MS = 210; // slam to black
	const DRIVE_MS = 910; // off-screen left to off-screen right
	const EXIT_MS = 300; // tail lights recede, smoke catches the light
	// ── the tail, added 2026-08-25 from the Hacksaw spec ───────────────────────
	//
	// Their feature entry holds full black for 0.5s and then fades back in over
	// 1.0s — deliberately twice as slow as the fade that took it out. The switch
	// itself (their `enterMode`) happens inside the black, so the player never
	// sees the board change; what they see is a slow reveal of a game that is
	// already different.
	//
	// This transition had NO fade-in at all: the component unmounted at the end
	// of the car's exit and the black vanished in one frame, which is a cut. The
	// car stays — it is the game's own idea — but the way it hands over does not.
	const BLACK_MS = 500;
	const FADE_IN_MS = 1000;
	const TOTAL_MS = DARK_MS + DRIVE_MS + EXIT_MS + BLACK_MS + FADE_IN_MS;
	const DRIVE_AT = DARK_MS;
	const EXIT_AT = DARK_MS + DRIVE_MS;
	// The moment the caller may swap the game underneath: full black, nothing
	// else moving.
	const BLACK_AT = DARK_MS + DRIVE_MS + EXIT_MS;
	const FADE_AT = BLACK_AT + BLACK_MS;

	// Where in the drive the car is level with the middle of the screen.
	const PASS_AT = 0.5;

	const PUFF_EVERY_MS = 34;
	const PUFF_LIFE_MS = 700;
	// Exhaust reads as warm grey lit by the tail lights, not white — white on
	// black becomes another light source and competes with the headlights.
	const SMOKE = 0x9c8fa8;
	const HEADLIGHT = 0xfff4d0;
	const TAILLIGHT = 0xff2e5a;

	type Puff = { id: number; x: number; y: number; r0: number; grow: number; born: number; drift: number };
	let puffs = $state<Puff[]>([]);
	let puffSeq = 0;

	let clock = $state(0);
	let darkAlpha = $state(0);
	let carVisible = $state(false);
	let carX = $state(0);
	let carY = $state(0);
	let carScale = $state(1);
	let carTilt = $state(0);
	let beamT = $state(-1); // drive progress, drives the headlights
	let exitT = $state(-1);
	let flashAlpha = $state(0);

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let blackFired = false;
	let passFired = false;
	let lastPuffAt = -1e9;

	const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
	const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;

	const spawnPuff = (x: number, y: number, big = false) => {
		puffs.push({
			id: puffSeq++,
			x: x + (Math.random() - 0.5) * 18,
			y: y + (Math.random() - 0.5) * 14,
			r0: (big ? 30 : 16) + Math.random() * (big ? 26 : 14),
			grow: (big ? 3.4 : 2.6) + Math.random() * 1.2,
			born: elapsed,
			drift: -0.05 - Math.random() * 0.06,
		});
	};

	onMount(() => {
		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			elapsed += now - last;
			last = now;
			clock = elapsed;

			const { width, height } = context.stateLayoutDerived.canvasSizes();

			// The black is slammed on, not faded — a fade reads as the game dimming,
			// a slam reads as a cut. It stays up for the whole transition.
			// Only while the black is coming ON. Past BLACK_AT the fade-out branch
			// below owns this value, and letting both write it made the screen
			// snap back to full black on every frame of the reveal.
			if (elapsed < BLACK_AT) {
				darkAlpha = Math.min(0.97, easeOutCubic(elapsed / DARK_MS) * 0.97);
			}

			if (elapsed >= DRIVE_AT && elapsed < EXIT_AT) {
				const p = (elapsed - DRIVE_AT) / DRIVE_MS;
				beamT = p;
				carVisible = true;
				const travel = Math.pow(p, 1.15);
				carX = -width * 0.78 + travel * width * 1.56;
				carY = Math.sin(p * Math.PI * 3) * height * 0.012;
				const near = Math.sin(Math.min(1, p / PASS_AT) * Math.PI * 0.5);
				carScale = 0.86 + 0.26 * near - 0.1 * Math.max(0, p - PASS_AT);
				carTilt = -0.05 + 0.09 * p;

				if (elapsed - lastPuffAt >= PUFF_EVERY_MS) {
					lastPuffAt = elapsed;
					spawnPuff(carX - height * 0.11 * carScale, carY + height * 0.045 * carScale);
				}

				if (!passFired && p >= PASS_AT) {
					passFired = true;
					context.eventEmitter.broadcast({ type: 'soundNeonZap' });
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.4 });
					for (let i = 0; i < 14; i++) {
						spawnPuff(carX - height * 0.1, carY + height * 0.05, true);
					}
				}
			} else if (elapsed >= EXIT_AT) {
				carVisible = false;
				beamT = -1;
				exitT = clamp01((elapsed - EXIT_AT) / EXIT_MS);
				// A short warm bloom, not a white-out: the screen is already black, so
				// the cut is covered without blinding anyone.
				flashAlpha = Math.sin(exitT * Math.PI) * 0.34;
			}

			if (elapsed >= BLACK_AT && !blackFired) {
				blackFired = true;
				props.onblack?.();
			}
			if (elapsed >= FADE_AT) {
				// 0.97 -> 0 over a full second. Cubic out, so most of the reveal
				// happens early and the last of the black lifts slowly — the opposite
				// shape from the slam that put it there.
				const p = clamp01((elapsed - FADE_AT) / FADE_IN_MS);
				darkAlpha = 0.97 * (1 - easeOutCubic(p));
			}

			if (puffs.length && elapsed - puffs[0].born > PUFF_LIFE_MS) {
				puffs = puffs.filter((puff) => elapsed - puff.born <= PUFF_LIFE_MS);
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

	const puffPose = (puff: Puff) => {
		const t = clamp01((clock - puff.born) / PUFF_LIFE_MS);
		const e = easeOutCubic(t);
		return {
			size: puff.r0 * (1 + puff.grow * e),
			alpha: (1 - t) ** 1.6 * 0.42,
			x: puff.x - e * 90,
			y: puff.y + puff.drift * e * 140,
		};
	};

	const drawDark = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		g.clear();
		if (darkAlpha <= 0) return;
		g.rect(-width, -height, width * 2, height * 2);
		g.fill({ color: 0x05020a, alpha: darkAlpha });
	};

	// Headlights: two cones thrown ahead of the car, plus the pool of light they
	// put on the ground. Drawn additively so they build where they overlap, which
	// is what makes the beams look like light rather than grey wedges.
	const drawBeams = (g: PixiGraphics) => {
		g.clear();
		if (beamT < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const reach = width * 1.1;
		const nose = carX + height * 0.1 * carScale;
		// dips as the car passes closest, the way a beam swings past you
		const swing = Math.sin(beamT * Math.PI) * height * 0.05;

		for (const [dy, spread, alpha] of [
			[-0.018, 0.1, 0.2],
			[0.024, 0.13, 0.26],
		] as [number, number, number][]) {
			const y = carY + height * dy;
			g.moveTo(nose, y);
			g.lineTo(nose + reach, y - height * spread + swing);
			g.lineTo(nose + reach, y + height * spread + swing);
			g.closePath();
			g.fill({ color: HEADLIGHT, alpha: alpha * (0.35 + 0.65 * Math.sin(beamT * Math.PI)) });
		}

		// the two lamps themselves
		for (const dy of [-0.018, 0.024]) {
			g.circle(nose, carY + height * dy, height * 0.016 * carScale);
			g.fill({ color: HEADLIGHT, alpha: 0.9 });
		}

		// ground smear travelling with the car
		g.ellipse(carX, carY + height * 0.105 * carScale, height * 0.26, height * 0.022);
		g.fill({ color: HEADLIGHT, alpha: 0.1 });

		// tail lights: two short red streaks off the back
		const tail = carX - height * 0.1 * carScale;
		for (const dy of [-0.012, 0.03]) {
			const y = carY + height * dy;
			g.moveTo(tail, y);
			g.lineTo(tail - height * (0.1 + 0.35 * beamT), y);
			g.stroke({ width: 6, color: TAILLIGHT, alpha: 0.75 });
		}
	};

	// The trail the car leaves, blooming as it goes. On black this is the only
	// thing still moving once the car is gone.
	const drawExit = (g: PixiGraphics) => {
		g.clear();
		if (exitT < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const e = easeOutCubic(exitT);
		const maxR = Math.max(width, height) * 0.9;
		for (const [ox, oy, scale] of [
			[0.2, 0.02, 1],
			[-0.12, -0.05, 0.8],
		] as [number, number, number][]) {
			g.circle(width * ox * (1 - e), height * oy, maxR * e * scale);
			g.fill({ color: SMOKE, alpha: 0.22 * (1 - e) });
		}
		// the tail lights disappearing into the distance
		const away = width * (0.55 + e * 0.6);
		for (const dy of [-0.012, 0.03]) {
			g.circle(away, height * dy, height * 0.012 * (1 - e));
			g.fill({ color: TAILLIGHT, alpha: 0.8 * (1 - e) });
		}
	};

	const drawFlash = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		g.clear();
		if (flashAlpha <= 0) return;
		g.rect(-width, -height, width * 2, height * 2);
		g.fill({ color: HEADLIGHT, alpha: flashAlpha });
	};
</script>

<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
>
	<!-- black first: everything below is drawn on top of it -->
	<Graphics draw={drawDark} />

	<!-- beams sit under the smoke and the car so the smoke is lit by them -->
	<Graphics draw={drawBeams} blendMode="add" />

	{#each puffs as puff (puff.id)}
		{@const pose = puffPose(puff)}
		{#if pose.alpha > 0.01}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={pose.x}
				y={pose.y}
				width={pose.size}
				height={pose.size}
				tint={SMOKE}
				alpha={pose.alpha}
			/>
		{/if}
	{/each}

	{#if carVisible}
		<!--
			car_side.png is 1024x512, so the height is half the width. Passing the
			same number to both — which the symbol version did, because a symbol is
			square — would squash it to a wedge half as long as it is drawn.
		-->
		{@const carW = context.stateLayoutDerived.canvasSizes().height * 0.62 * carScale}
		<Sprite
			key="hmCarSide"
			anchor={0.5}
			x={carX}
			y={carY}
			rotation={carTilt}
			width={carW}
			height={carW * 0.5}
		/>
	{/if}

	<Graphics draw={drawExit} />
	<Graphics draw={drawFlash} />
</Container>

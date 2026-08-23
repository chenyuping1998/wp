<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	// Jungle-commando transition: a pineapple grenade drops into the middle of
	// the screen — two red ticks — BOOM. The cut to the next scene lands on the
	// white-hot peak of the blast.
	//
	// The grenade falls over the LIVE scene: for the first 800ms of this
	// animation whatever is behind it is fully visible. Anything the player must
	// not see change therefore has to be swapped inside `oncover`, which fires
	// only once the flash has gone fully opaque. Swapping before calling for the
	// transition puts the change on screen a beat before the grenade even
	// appears, which is what the superspin exit used to do.
	type Props = {
		oncomplete: () => void;
		// Fired at full white, with ~160ms of opaque flash still to run. Swap
		// scenes here.
		oncover?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const THROW_MS = 460; // grenade drops in from the top, always face-on
	const TICK_MS = 340; // armed: two red blinks
	// Longer than it was (420ms) to make room for the smoke. The blast itself did
	// not need more time; what it needed was somewhere for the white-out to GO.
	const BOOM_MS = 700;
	const TOTAL_MS = THROW_MS + TICK_MS + BOOM_MS;
	const BOOM_AT = THROW_MS + TICK_MS;

	// Flash envelope, as fractions of the boom.
	//
	// It used to ramp to 0.95 and simply stay there until the component was torn
	// down, which is why smoke could not be added: anything drawn after ~0.35 of
	// the boom was painted over by an opaque screen and never seen. Now it ramps,
	// holds long enough to hide the scene swap, then clears — and what it clears
	// to is the new scene seen through drifting smoke, which is the whole effect.
	const FLASH_IN = 0.22; // reaches full here
	const FLASH_HOLD = 0.46; // stays full until here
	const FLASH_OUT = 0.86; // gone by here
	// The swap must happen while the screen is genuinely opaque. Placed inside the
	// hold rather than at its edge: a frame landing a millisecond before FLASH_IN
	// would otherwise swap the scene while the flash was still ramping.
	const COVER_AT_BOOM_T = (FLASH_IN + FLASH_HOLD) / 2;

	const FRAG_COUNT = 30;
	type Frag = { a: number; speed: number; r: number; spin: number };
	const frags: Frag[] = Array.from({ length: FRAG_COUNT }, (_, i) => ({
		a: (i / FRAG_COUNT) * Math.PI * 2 + Math.random() * 0.4,
		speed: 0.5 + Math.random() * 0.85,
		r: 9 + Math.random() * 17,
		spin: Math.random() * Math.PI,
	}));

	// Smoke, as soft round puffs rather than Graphics circles: fxGlow is a radial
	// falloff texture, and a hard-edged circle reads as a circle, not as smoke.
	// Normal blending, NOT additive — smoke occludes, and additive smoke over a
	// dark board would be invisible anyway.
	const SMOKE_COUNT = 16;
	type Puff = { a: number; dist: number; size: number; rise: number; delay: number; drift: number };
	const puffs: Puff[] = Array.from({ length: SMOKE_COUNT }, (_, i) => ({
		// biased to the sides and slightly upward, the way a ground burst throws it
		a: (i / SMOKE_COUNT) * Math.PI * 2 + Math.random() * 0.6,
		dist: 0.26 + Math.random() * 0.5,
		size: 0.4 + Math.random() * 0.62,
		rise: 0.16 + Math.random() * 0.3,
		delay: Math.random() * 0.22,
		drift: (Math.random() - 0.5) * 0.24,
	}));

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let boomFired = false;
	let coverFired = false;

	let grenadeVisible = $state(false);
	let grenadeX = $state(0);
	let grenadeY = $state(0);
	let grenadeScale = $state(1);
	let grenadeTint = $state(0xffffff);
	let grenadeAlpha = $state(1);
	// fraction of the boom over which the grenade is consumed by its own blast
	const GRENADE_BURN = 0.16;
	let boomT = $state(-1);
	let flashAlpha = $state(0);

	const easeOutCubic = (t: number) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3;
	const mixColor = (from: number, to: number, t: number) => {
		const k = Math.max(0, Math.min(1, t));
		const ch = (shift: number) =>
			Math.round(((from >> shift) & 255) + ((((to >> shift) & 255) - ((from >> shift) & 255)) * k));
		return (ch(16) << 16) | (ch(8) << 8) | ch(0);
	};
	const smoothstep = (a: number, b: number, t: number) => {
		const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
		return x * x * (3 - 2 * x);
	};

	onMount(() => {
		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			const dt = now - last;
			last = now;
			elapsed += dt;

			const h = context.stateLayoutDerived.canvasSizes().height;

			if (elapsed < THROW_MS) {
				// drops in from above and brakes to a stop — deliberately NOT spinning,
				// so the grenade reads face-on the whole way down
				const p = easeOutCubic(elapsed / THROW_MS);
				grenadeVisible = true;
				grenadeX = 0;
				grenadeY = -h * 0.72 * (1 - p);
				grenadeScale = 0.7 + p * 0.5;
				grenadeTint = 0xffffff;
			} else if (elapsed < BOOM_AT) {
				// armed on the spot: two hot red blinks
				const p = (elapsed - THROW_MS) / TICK_MS;
				grenadeVisible = true;
				grenadeX = 0;
				grenadeY = 0;
				grenadeScale = 1.2 + Math.sin(p * Math.PI * 2) * 0.06;
				// Interpolated, not a binary flip. Switching hard between white and red on
				// the sign of a sine reads as a strobe; easing between them reads as
				// something heating up.
				grenadeTint = mixColor(0xffffff, 0xff5a3a, 0.5 + 0.5 * Math.sin(p * Math.PI * 4));
				grenadeAlpha = 1;
			} else {
				// BOOM
				if (!boomFired) {
					boomFired = true;
					// A real explosion, not bigwin_blast (a musical flourish kept for
					// max wins). This fires on every opening and free-game transition.
					context.eventEmitter.broadcast({ type: 'soundGrenadeBlast' });
					// the shockwave rattles the reel housing as it passes
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.4 });
				}
				boomT = (elapsed - BOOM_AT) / BOOM_MS;
				// Consumed by its own blast rather than deleted. It used to vanish on a
				// single frame at BOOM_AT — and that is the one frame the eye is locked
				// on it, which made the cut to the blast the roughest moment in the
				// whole transition. It now swells and burns out over the first sliver
				// of the boom, underneath the expanding core.
				const burn = Math.min(1, boomT / GRENADE_BURN);
				grenadeVisible = burn < 1;
				grenadeScale = 1.2 + 1.15 * easeOutCubic(burn);
				grenadeTint = mixColor(0xffe2b0, 0xffffff, burn);
				grenadeAlpha = (1 - burn) ** 1.6;
				// Both ends eased. A linear ramp to white lands hard — its rate of change
				// is constant right up to the instant it saturates — and a linear fade
				// leaves the same edge on the way out.
				flashAlpha =
					0.96 *
					(boomT < FLASH_HOLD
						? smoothstep(0, FLASH_IN, boomT)
						: 1 - smoothstep(FLASH_HOLD, FLASH_OUT, boomT));
				if (!coverFired && boomT >= COVER_AT_BOOM_T) {
					coverFired = true;
					props.oncover?.();
				}
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

	// Per-puff state at the current boomT. Smoke is lit by the fireball as it is
	// thrown and cools as it expands, so the tint runs from a hot ember colour to
	// cold ash — a puff that stayed one grey the whole way reads as a decal rather
	// than as something the explosion just made.
	const EMBER = [0xff, 0xb0, 0x66];
	const ASH = [0x4a, 0x44, 0x3c];
	const puffState = (puff: Puff) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const reach = Math.max(width, height);
		const t = Math.max(0, Math.min(1, (boomT - puff.delay) / (1 - puff.delay)));
		const spread = easeOutCubic(t);
		const cool = Math.min(1, t * 1.5);
		const tint =
			(Math.round(EMBER[0] + (ASH[0] - EMBER[0]) * cool) << 16) |
			(Math.round(EMBER[1] + (ASH[1] - EMBER[1]) * cool) << 8) |
			Math.round(EMBER[2] + (ASH[2] - EMBER[2]) * cool);
		return {
			t,
			x: Math.cos(puff.a) * reach * puff.dist * spread + puff.drift * reach * t,
			// rises as it spreads, so the cloud lifts off the blast rather than
			// sitting on it as a flat ring
			y: Math.sin(puff.a) * reach * puff.dist * spread * 0.72 - puff.rise * reach * t * t,
			// 0.5 factor: without it a single puff came out nearly as wide as the
			// screen, and sixteen of those is not a cloud, it is a wash.
			size: reach * puff.size * 0.5 * (0.25 + spread * 0.75),
			tint,
			// In fast, hold, then out — and the hold is the point. A plain
			// (1 - t) ** 1.5 decay put the smoke at alpha 0.04 by the time the flash
			// had cleared, so the one moment it was supposed to be seen was the one
			// moment it was already gone. It now stays up through the reveal and
			// only lets go at the very end, reaching 0 exactly as the component is
			// torn down rather than vanishing on a frame.
			alpha: Math.min(1, t * 5) * (1 - smoothstep(0.58, 1, t)) * 0.72,
		};
	};

	const drawBoom = (g: PixiGraphics) => {
		g.clear();
		if (boomT < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// reach past the long edge so the blast genuinely engulfs the screen
		const maxR = Math.max(width, height) * 0.95;
		// shockwave rings — a third, slowest ring gives the blast visible depth
		for (const [delay, color, weight] of [
			[0, 0xfff7d6, 30],
			[0.14, 0xfff2c0, 24],
			[0.3, 0xff9c3a, 18],
		] as [number, number, number][]) {
			const t = (boomT - delay) / (1 - delay);
			if (t < 0 || t > 1) continue;
			// Eased rather than linear: a ring that thins at a constant rate reads as a
			// line being erased, one that holds and then lets go reads as energy
			// dissipating.
			g.lineStyle(weight * (1 - t) ** 1.4 + 3, color, 0.85 * (1 - t) ** 1.8);
			g.drawCircle(0, 0, maxR * easeOutCubic(t));
		}
		// hot core — expands most of the way across the screen before fading
		// Radius is eased, not linear. A fireball expanding at constant speed for its
		// whole life looks mechanical; a real one throws hardest at the front and
		// decelerates, which is what easeOutCubic gives for free.
		const coreGrow = easeOutCubic(boomT);
		g.lineStyle(0);
		g.beginFill(0xfff7d6, 0.9 * (1 - boomT) ** 1.5);
		g.drawCircle(0, 0, height * 0.34 * (0.4 + coreGrow * 1.5));
		g.endFill();
		g.beginFill(0xffb347, 0.55 * (1 - boomT) ** 1.3);
		g.drawCircle(0, 0, height * 0.5 * (0.35 + coreGrow * 1.7));
		g.endFill();
		// leaf/shrapnel fragments — thrown the full blast radius
		for (const f of frags) {
			const d = f.speed * easeOutCubic(boomT) * maxR * 1.1;
			const x = Math.cos(f.a) * d;
			// arcs downward as it flies: debris thrown dead flat in every direction
			// reads as a starburst decal rather than as things with weight
			const y = Math.sin(f.a) * d + maxR * 0.16 * boomT * boomT;
			// and tumbles while it travels, each at its own rate
			const spin = f.spin + boomT * f.speed * 7;
			g.beginFill(f.r > 13 ? 0x35521a : 0xffd75e, 0.9 * (1 - boomT) ** 1.6);
			g.drawPolygon([
				x, y - f.r,
				x + f.r * Math.cos(spin), y + f.r * Math.sin(spin),
				x - f.r * Math.cos(spin), y + f.r * 0.6,
			]);
			g.endFill();
		}
	};

	const drawFlash = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		g.clear();
		if (flashAlpha <= 0) return;
		g.beginFill(0xfff2c0, flashAlpha);
		g.drawRect(-width, -height, width * 2, height * 2);
		g.endFill();
	};
</script>

<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
>
	{#if grenadeVisible}
		<Sprite
			key="gbGrenade"
			anchor={0.5}
			x={grenadeX}
			y={grenadeY}
			width={context.stateLayoutDerived.canvasSizes().height * 0.2 * grenadeScale}
			height={context.stateLayoutDerived.canvasSizes().height * 0.2 * grenadeScale}
			tint={grenadeTint}
			alpha={grenadeAlpha}
		/>
	{/if}

	<!--
		Smoke sits under the blast graphics so the hot core punches through it, and
		under the flash so the white-out still covers everything. As the flash
		clears it is what is left on screen, drifting over the scene the transition
		just swapped in.
	-->
	{#if boomT >= 0}
		{#each puffs as puff, i (i)}
			{@const p = puffState(puff)}
			{#if p.alpha > 0.01}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					x={p.x}
					y={p.y}
					width={p.size}
					height={p.size}
					tint={p.tint}
					alpha={p.alpha}
				/>
			{/if}
		{/each}
	{/if}

	<Graphics draw={drawBoom} />
	<Graphics draw={drawFlash} />
</Container>

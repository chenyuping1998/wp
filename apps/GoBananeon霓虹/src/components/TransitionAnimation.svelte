<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import { DYNAMITE } from '../game/meshWin';
	import type { DynamiteEnv } from '../game/meshWin/dynamiteProp';
	import PropMesh from './PropMesh.svelte';

	// Neon transition: the gorilla pitches a Pulse Bomb into the middle of the
	// screen — two violet surges — and it discharges: shockwave rings, forked
	// lightning, plasma blooms. The cut to the next scene lands on the white-hot
	// peak. (The variable names still say "dynamite": this was GoBoomana's.)
	//
	// The dynamite comes out of his HAND when he is on screen, and drops in from
	// above when he is not. Both paths exist because he is only there on layouts
	// wide enough to stand him beside the board — tablet and portrait have no
	// room (Mascot.svelte, MIN_GAP), and a dynamite materialising out of empty
	// space at the edge of the screen would be worse than the plain drop.
	//
	// The dynamite falls over the LIVE scene: for the first 800ms of this
	// animation whatever is behind it is fully visible. Anything the player must
	// not see change therefore has to be swapped inside `oncover`, which fires
	// only once the flash has gone fully opaque. Swapping before calling for the
	// transition puts the change on screen a beat before the dynamite even
	// appears, which is what the hold-and-spin exit used to do.
	type Props = {
		oncomplete: () => void;
		// Fired at full white, with ~160ms of opaque flash still to run. Swap
		// scenes here.
		oncover?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// He reaches, a dynamite appears in his fist, he winds up, he throws. All of
	// that happens on the mascot, and this is how long it takes — RELEASE_AT in
	// design/generate_monkey_spine.mjs, in milliseconds.
	//
	// NOT free to change on its own. The skeleton switches the dynamite OFF in his
	// hand at exactly this moment and the transition switches its own copy on, so
	// if the two drift there is either a frame with two dynamites or a frame with
	// none.
	const THROW_RELEASE_MS = 580;
	const FLIGHT_MS = 340; // hand to the middle of the screen
	const DROP_MS = 460; // the no-mascot fallback: straight down, face-on
	const TICK_MS = 260; // armed: two red blinks
	// Longer than it was (420ms) to make room for the smoke. The blast itself did
	// not need more time; what it needed was somewhere for the white-out to GO.
	const BOOM_MS = 700;

	// Which entrance this run uses is decided ONCE, on mount. Reading the state
	// every frame would let a resize part-way through swap the dynamite from a
	// thrown one to a dropped one in mid-flight.
	const origin = context.stateGame.mascotThrowOrigin;
	const thrown = origin !== null;

	const ENTRY_MS = thrown ? THROW_RELEASE_MS + FLIGHT_MS : DROP_MS;
	const BOOM_AT = ENTRY_MS + TICK_MS;
	const TOTAL_MS = BOOM_AT + BOOM_MS;

	// The release point in this container's coordinates. The container is centred
	// on the canvas, and `origin` is in main-layout units, so the conversion is
	// the same one MainContainer applies: offset from the layout's centre, scaled.
	const releasePoint = () => {
		const layout = context.stateLayoutDerived.mainLayout();
		if (!origin) return { x: 0, y: 0 };
		return {
			x: (origin.x - layout.width / 2) * layout.scale,
			y: (origin.y - layout.height / 2) * layout.scale,
		};
	};

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

	// Plasma blooms, as soft round puffs rather than Graphics circles: fxGlow is
	// a radial falloff texture. They spread flat and burn out fast — light, not
	// smoke, so they do not rise or linger.
	const SMOKE_COUNT = 16;
	type Puff = { a: number; dist: number; size: number; rise: number; delay: number; drift: number };
	const puffs: Puff[] = Array.from({ length: SMOKE_COUNT }, (_, i) => ({
		// biased to the sides and slightly upward, the way a ground burst throws it
		a: (i / SMOKE_COUNT) * Math.PI * 2 + Math.random() * 0.6,
		dist: 0.26 + Math.random() * 0.5,
		size: 0.4 + Math.random() * 0.62,
		rise: 0.02 + Math.random() * 0.04,
		delay: Math.random() * 0.22,
		drift: (Math.random() - 0.5) * 0.24,
	}));

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let boomFired = false;
	let coverFired = false;

	let dynamiteVisible = $state(false);
	let dynamiteX = $state(0);
	let dynamiteY = $state(0);
	let dynamiteScale = $state(1);
	let dynamiteTint = $state(0xffffff);
	let dynamiteAlpha = $state(1);
	let dynamiteSpin = $state(0);
	// fraction of the boom over which the dynamite is consumed by its own blast
	const GRENADE_BURN = 0.16;
	let boomT = $state(-1);
	let flashAlpha = $state(0);

	// What the dynamite's MESH is told each frame (game/meshWin/dynamiteProp):
	// the fuse trails the tumble and flutters in the flight, whips over on the
	// arrival, and the bundle squashes, swells with the blinks and the burn.
	let shownAt = -1;
	let spinRate = 0; // turns per second, eased so the fuse does not snap
	let dynamiteEnv = $state<DynamiteEnv>({ t: 0, flying: 1, spin: 0, arriveT: -1, armedT: -1, burn: 0 });

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
		// Tell him to wind up. Broadcast before the first frame rather than inside
		// the loop, so the arm is already moving on the frame the flash-less part
		// of this animation begins.
		if (thrown) context.eventEmitter.broadcast({ type: 'mascotThrow' });

		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			const dt = now - last;
			last = now;
			elapsed += dt;

			const h = context.stateLayoutDerived.canvasSizes().height;

			if (thrown && elapsed < THROW_RELEASE_MS) {
				// still in his hand — nothing to draw yet
				dynamiteVisible = false;
			} else if (thrown && elapsed < ENTRY_MS) {
				// FLIGHT: hand to the middle of the screen.
				//
				// Linear across, parabolic up and back down: a thrown object's
				// horizontal speed barely changes and all of the interest is in the
				// vertical, so easing the x as well is what makes a lobbed prop look
				// like it is being dragged along a path.
				const p = (elapsed - THROW_RELEASE_MS) / FLIGHT_MS;
				const from = releasePoint();
				// Arc height scales with how far it has to travel, so the lob looks
				// the same shape on a wide layout as on a narrow one.
				const lift = Math.hypot(from.x, from.y) * 0.38;
				dynamiteVisible = true;
				dynamiteX = from.x * (1 - p);
				dynamiteY = from.y * (1 - p) - lift * 4 * p * (1 - p);
				// grows as it comes toward the camera
				dynamiteScale = 0.55 + p * 0.65;
				// A real thrown dynamite tumbles. This is the one moment it should:
				// on the way down (the fallback) it is deliberately face-on, but a
				// throw has spin in it and a prop that arrives flat looks placed.
				dynamiteSpin = p * Math.PI * 2.4;
				dynamiteTint = 0xffffff;
			} else if (!thrown && elapsed < ENTRY_MS) {
				// drops in from above and brakes to a stop — deliberately NOT spinning,
				// so the dynamite reads face-on the whole way down
				const p = easeOutCubic(elapsed / ENTRY_MS);
				dynamiteVisible = true;
				dynamiteX = 0;
				dynamiteY = -h * 0.72 * (1 - p);
				dynamiteScale = 0.7 + p * 0.5;
				dynamiteSpin = 0;
				dynamiteTint = 0xffffff;
			} else if (elapsed < BOOM_AT) {
				// armed on the spot: two hot red blinks
				const p = (elapsed - ENTRY_MS) / TICK_MS;
				dynamiteVisible = true;
				dynamiteX = 0;
				dynamiteY = 0;
				// settles out of the tumble rather than snapping to upright
				dynamiteSpin *= 0.82;
				dynamiteScale = 1.2 + Math.sin(p * Math.PI * 2) * 0.06;
				// Interpolated, not a binary flip. Switching hard between white and red on
				// the sign of a sine reads as a strobe; easing between them reads as
				// something heating up.
				// armed: the plasma surges violet, twice
				dynamiteTint = mixColor(0xffffff, 0xc070ff, 0.5 + 0.5 * Math.sin(p * Math.PI * 4));
				dynamiteAlpha = 1;
			} else {
				// BOOM
				if (!boomFired) {
					boomFired = true;
					// A real explosion, not bigwin_blast (a musical flourish kept for
					// max wins). This fires on every opening and free-game transition.
					context.eventEmitter.broadcast({ type: 'soundDynamiteBlast' });
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
				dynamiteVisible = burn < 1;
				dynamiteScale = 1.2 + 1.15 * easeOutCubic(burn);
				dynamiteTint = mixColor(0xe6c8ff, 0xffffff, burn);
				dynamiteAlpha = (1 - burn) ** 1.6;
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

			if (dynamiteVisible) {
				if (shownAt < 0) shownAt = elapsed;
				const inFlight = elapsed < ENTRY_MS;
				// the throw tumbles 2.4 turns over the flight; afterwards the spin
				// settles out (dynamiteSpin *= 0.82) and so does the drag
				const targetSpin = thrown && inFlight ? 2.4 / (FLIGHT_MS / 1000) : 0;
				spinRate += (targetSpin - spinRate) * Math.min(1, dt / 60);
				const arriveT = inFlight ? -1 : elapsed - ENTRY_MS;
				dynamiteEnv = {
					t: elapsed - shownAt,
					flying: inFlight ? 1 : Math.max(0, 1 - arriveT / 90),
					spin: spinRate,
					arriveT,
					armedT: arriveT,
					burn: boomT >= 0 ? Math.min(1, boomT / GRENADE_BURN) : 0,
				};
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
	// NEON, not smoke: each puff is a bloom of plasma that blazes pink-white
	// and cools to deep violet as it spreads, then is gone — nothing hangs on
	const EMBER = [0xff, 0x9a, 0xf0];
	const ASH = [0x5a, 0x1c, 0xc8];
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
			alpha: Math.min(1, t * 5) * (1 - smoothstep(0.4, 0.9, t)) * 0.6,
		};
	};

	// THE PULSE BOMB GOES OFF: no fireball and no smoke — a plasma discharge.
	// Shockwave rings in the game's four neon colours, a violet-white core,
	// forked lightning re-striking out of it, and glowing shards flung flat
	// (light has no weight, so they do not arc down like debris did).
	//
	// v8 path API throughout: the v7 beginFill/lineStyle shim paints every shape
	// in one Graphics with the LAST fill set (see the pixi-v8 gotchas).
	const drawBoom = (g: PixiGraphics) => {
		g.clear();
		if (boomT < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const maxR = Math.max(width, height) * 0.95;
		for (const [delay, color, weight] of [
			[0, 0xffffff, 30],
			[0.12, 0x59e3ff, 24],
			[0.24, 0xff3fd0, 20],
			[0.38, 0xb143ec, 16],
		] as [number, number, number][]) {
			const t = (boomT - delay) / (1 - delay);
			if (t < 0 || t > 1) continue;
			const r = maxR * easeOutCubic(t);
			const a = (1 - t) ** 1.8;
			g.circle(0, 0, r).stroke({ width: (weight * (1 - t) ** 1.4 + 3) * 3, color, alpha: 0.22 * a });
			g.circle(0, 0, r).stroke({ width: weight * (1 - t) ** 1.4 + 3, color, alpha: 0.85 * a });
		}
		const coreGrow = easeOutCubic(boomT);
		g.circle(0, 0, height * 0.5 * (0.35 + coreGrow * 1.7)).fill({ color: 0xb143ec, alpha: 0.5 * (1 - boomT) ** 1.3 });
		g.circle(0, 0, height * 0.34 * (0.4 + coreGrow * 1.5)).fill({ color: 0xf6e8ff, alpha: 0.9 * (1 - boomT) ** 1.5 });

		// lightning: seven forks, re-struck every 45ms
		if (boomT < 0.6) {
			const strike = Math.floor((boomT * BOOM_MS) / 45);
			const fade = (1 - boomT / 0.6) ** 1.2;
			for (let b = 0; b < 7; b++) {
				const a0 = (b / 7) * Math.PI * 2 + strike * 0.7;
				const len = maxR * (0.35 + 0.45 * easeOutCubic(boomT * 2.5));
				const pts: number[] = [];
				for (let k = 0; k <= 6; k++) {
					const jag = k === 0 ? 0 : Math.sin(strike * 13.7 + b * 7.1 + k * 3.3) * 0.18;
					const d = (len * k) / 6;
					pts.push(Math.cos(a0 + jag) * d, Math.sin(a0 + jag) * d);
				}
				for (const [w, color, al] of [[16, 0xb143ec, 0.35], [7, 0xd98bff, 0.7], [2.5, 0xffffff, 0.95]] as const) {
					g.moveTo(pts[0], pts[1]);
					for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]);
					g.stroke({ width: w, color, alpha: al * fade, cap: 'round', join: 'round' });
				}
			}
		}

		// neon shards: small glowing tiles, cyan, pink and white
		for (const f of frags) {
			const d = f.speed * easeOutCubic(boomT) * maxR * 1.1;
			const x = Math.cos(f.a) * d;
			const y = Math.sin(f.a) * d;
			const spin = f.spin + boomT * f.speed * 7;
			const r = f.r * 0.6;
			const color = f.r > 19 ? 0xff3fd0 : f.r > 13 ? 0x59e3ff : 0xffffff;
			const a = (1 - boomT) ** 1.6;
			g.circle(x, y, r * 2).fill({ color, alpha: 0.22 * a });
			g.poly([0, 1, 2, 3].flatMap((k) => [x + r * Math.cos(spin + (k * Math.PI) / 2), y + r * Math.sin(spin + (k * Math.PI) / 2)])).fill({
				color,
				alpha: 0.95 * a,
			});
		}
	};

	const drawFlash = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		g.clear();
		if (flashAlpha <= 0) return;
		// violet-white: the plasma's light, not a lamp's
		g.rect(-width, -height, width * 2, height * 2).fill({ color: 0xf1e4ff, alpha: flashAlpha });
	};
	// Width / height of assets/sprites/goBananasSymbolsV3/dynamite.png. Stated here
	// rather than read at runtime because the Sprite needs it on its first frame,
	// before the texture has necessarily resolved — a fallback of 1 would flash a
	// square dynamite for a frame on a cold load.
	// 672x618, the trimmed size of assets/sprites/goBananasSymbolsV3/dynamite.png.
	//
	// Re-measure this whenever the prop art is replaced. Sizing is by HEIGHT, so a
	// stale ratio does not fail loudly — it just draws the prop at the wrong
	// width. The grenade this replaced was 651x1000, taller than wide; the bundle
	// is wider than tall, so leaving the old number would have squashed it to
	// roughly half its width.
	// the Pulse Bomb art is square (GoBoomana's dynamite was 672 x 618)
	const DYNAMITE_ASPECT = 1;
</script>

<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
>
	{#if dynamiteVisible}
		<!--
			Sized by HEIGHT, with width following the art's own aspect.

			Both were set to the same value, which was invisible while the prop was a
			square 256px tile and became a squashed dynamite the moment it was replaced
			by a properly trimmed cut-out at 651x1000. A prop is whatever shape its
			artwork is; only one dimension may be chosen.
		-->
		{@const gh = context.stateLayoutDerived.canvasSizes().height * 0.26 * dynamiteScale}
		<!-- drawn through its mesh (game/meshWin/dynamiteProp.ts), same box -->
		<PropMesh
			spec={DYNAMITE}
			env={dynamiteEnv}
			anchor={0.5}
			x={dynamiteX}
			y={dynamiteY}
			width={gh * DYNAMITE_ASPECT}
			height={gh}
			rotation={dynamiteSpin}
			tint={dynamiteTint}
			alpha={dynamiteAlpha}
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

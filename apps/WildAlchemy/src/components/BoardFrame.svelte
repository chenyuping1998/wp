<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the brass
		| { type: 'boardFrameImpact'; strength?: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics, Rectangle } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import NineSlice from './NineSlice.svelte';

	const context = getContext();

	// The housing is art/game-ready-1110 frames/board.png (1146x1147): ink from
	// 4 px in, the window from 104 px in, so the band is 100 px of a square that
	// would make the window only 82% of the art. Drawn whole at "window = 1.04x
	// the reels" that band came out at 9% of the board each side — wide enough to
	// run into the free games' flask and ladder. So it is drawn nine-sliced: the
	// corners and band keep their proportions at a thinner scale, and the box is
	// fixed by two numbers shared with the cast and logo placement
	// (Cast.svelte, castPlacement.ts, cornerLogo.ts: FRAME_SCALE x FRAME_INK =
	// HOUSING_INK):
	//   window 1.04x the reels (a WILD is drawn at 1.08 of its cell and carries a
	//   drop shadow; at 1.03 the bottom row touched the frame),
	//   ink edge 1.12x the reels.
	const WINDOW = 1.04;
	const HOUSING_INK = 1.12;
	const ART = { margin: 4, band: 100, slice: 140 };

	const housing = $derived.by(() => {
		const layout = context.stateGameDerived.boardLayout();
		const w = layout.width * layout.scale;
		const h = layout.height * layout.scale;
		const k = (((HOUSING_INK - WINDOW) / 2) * Math.min(w, h)) / ART.band;
		return {
			x: layout.x - (w * HOUSING_INK) / 2 + impact.x,
			y: layout.y - (h * HOUSING_INK) / 2 + impact.y,
			width: w * HOUSING_INK,
			height: h * HOUSING_INK,
			k,
			// the walnut backing behind the cells, inside the window
			win: { x: layout.x - (w * WINDOW) / 2 + impact.x, y: layout.y - (h * WINDOW) / 2 + impact.y, width: w * WINDOW, height: h * WINDOW },
		};
	});

	// mode ambience: in the free games the housing breathes in the alchemy
	// gold of its brass trim; the base game stays clean.
	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	const ambienceColor = $derived(
		isSuperspin ? 0x9fd0ff : context.stateGame.gameType === 'freegame' ? 0xC9A227 : null,
	);

	let pulse = $state(0);
	onMount(() => {
		// frame clock (was a 33 ms interval — the glow breathed at 30 steps a second)
		let pulseRaf = 0;
		const pulseTick = (now: number) => {
			pulse = 0.5 + 0.5 * Math.sin(now / 620);
			pulseRaf = requestAnimationFrame(pulseTick);
		};
		pulseRaf = requestAnimationFrame(pulseTick);
		return () => {
			cancelAnimationFrame(pulseRaf);
			cancelAnimationFrame(impactRaf);
			cancelAnimationFrame(glowRaf);
		};
	});

	// ── frame impact: a short recoil plus a hot flash along the brass, so a
	// wild slamming into the housing is felt and not just seen ────────────────
	let impact = $state({ x: 0, y: 0, flash: 0 });
	let impactRaf = 0;
	const IMPACT_MS = 420;

	// Energy still left in the impact currently playing, so a weaker one cannot
	// cut it short. Reel stops now request a light 0.12 rattle on every reel; a
	// wild explode (1) or a transition slam (1.4) can overlap one, and without
	// this the small request would cancel the big recoil mid-swing.
	let impactEnergy = 0;

	const runImpact = (strength: number) => {
		if (strength < impactEnergy) return;
		cancelAnimationFrame(impactRaf);
		impactEnergy = strength;
		const start = performance.now();
		const step = (now: number) => {
			const p = (now - start) / IMPACT_MS;
			if (p >= 1) {
				impact = { x: 0, y: 0, flash: 0 };
				impactEnergy = 0;
				return;
			}
			// decay the gate alongside the motion, so a later hit of similar size
			// can still take over once this one has mostly spent itself
			impactEnergy = strength * (1 - p);
			// decaying rattle: fast wobble under an exponential envelope
			const decay = (1 - p) ** 2.2;
			const amp = 9 * strength * decay;
			impact = {
				x: Math.sin(p * 46) * amp * 0.45,
				y: Math.sin(p * 38 + 1.1) * amp,
				flash: 0.55 * strength * (1 - p) ** 3,
			};
			impactRaf = requestAnimationFrame(step);
		};
		impactRaf = requestAnimationFrame(step);
	};

	const drawAmbience = (g: PixiGraphics) => {
		g.clear();
		// The feature glow can be lit while gameType is still 'basegame' — the
		// trigger fires boardFrameGlowShow before the free game starts — so fall
		// back to the feature magenta rather than bailing out on a null colour.
		const colour = ambienceColor ?? 0xC9A227;
		if (ambienceColor === null && featureGlow <= 0) return;
		const layout = context.stateGameDerived.boardLayout();
		const w = layout.width * layout.scale * HOUSING_INK;
		const h = layout.height * layout.scale * HOUSING_INK;
		const x = layout.x - w / 2;
		const y = layout.y - h / 2;
		// `featureGlow` adds a second, much brighter set of the same three strokes
		// on top of the idle ambience, and widens them, so the housing visibly
		// lights up on the trigger instead of only changing hue.
		const lift = featureGlow;
		const layers: [number, number][] = [
			[34 + 22 * lift, (0.05 + 0.06 * pulse) * (1 + 2.2 * lift)],
			[20 + 14 * lift, (0.09 + 0.09 * pulse) * (1 + 2.4 * lift)],
			[10 + 8 * lift, (0.14 + 0.12 * pulse) * (1 + 2.6 * lift)],
		];
		// Pixi 8: the path has to be stroked explicitly. Under v7's `lineStyle`
		// these three layers drew nothing, which is why the reel housing read as a
		// flat panel with a hairline edge — its ambient glow was never rendered.
		for (const [width, alpha] of layers) {
			g.roundRect(x, y, w, h, 40);
			g.stroke({ width, color: colour, alpha });
		}
	};

	// Feature glow — drawn, not a Spine.
	//
	// This used to play `reelhouse_glow_start/idle/exit` out of
	// assets/spines/reelhouse, whose skeleton shipped with
	// `"images": "D:/Cristina/TWIST GAMES/reel_frame"` baked into it. Twist Gaming
	// is a real studio publishing on Stake; carrying their working path inside our
	// submission is an originality problem before it is an aesthetic one, and
	// Stake's guidelines make asset IP grounds for rejection outright.
	//
	// The replacement is the ambience pass that was already here, driven harder:
	// same three concentric strokes, same palette, ramped up on show and down on
	// hide. It is one number rather than three animation states, so there is no
	// completion callback to miss and no way for the glow to get stuck on — which
	// the Spine version could, since `reelhouse_glow_exit` only cleared the track
	// if its `complete` listener ever fired.
	const GLOW_IN_MS = 520;
	const GLOW_OUT_MS = 420;
	let featureGlow = $state(0);
	let glowRaf = 0;

	const rampGlow = (to: number, ms: number) => {
		cancelAnimationFrame(glowRaf);
		const from = featureGlow;
		const start = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - start) / ms);
			// easeOutCubic on the way in, linear out — arriving should feel like a
			// light coming on, leaving should just get out of the way
			const e = to > from ? 1 - (1 - p) ** 3 : p;
			featureGlow = from + (to - from) * e;
			if (p < 1) glowRaf = requestAnimationFrame(step);
		};
		glowRaf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => rampGlow(1, GLOW_IN_MS),
		boardFrameGlowHide: () => rampGlow(0, GLOW_OUT_MS),
		boardFrameImpact: ({ strength }) => runImpact(strength ?? 1),
	});
</script>

<Graphics zIndex={-2} draw={drawAmbience} />


<!-- walnut backing behind the reels: the frame art's window is transparent -->
<Rectangle
	x={housing.win.x}
	y={housing.win.y}
	width={housing.win.width}
	height={housing.win.height}
	backgroundColor={0x2e2219}
/>

<NineSlice key="waBoardFrame" x={housing.x} y={housing.y} width={housing.width} height={housing.height} k={housing.k} slice={ART.slice} margin={ART.margin} />

{#if impact.flash > 0}
	<!-- additive copy of the frame = the brass rings hot on an impact -->
	<NineSlice key="waBoardFrame" x={housing.x} y={housing.y} width={housing.width} height={housing.height} k={housing.k} slice={ART.slice} margin={ART.margin} blendMode="add" alpha={impact.flash} />
{/if}

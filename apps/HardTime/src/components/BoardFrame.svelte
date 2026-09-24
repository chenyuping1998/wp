<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the brass
		| { type: 'boardFrameImpact'; strength?: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';

	const context = getContext();
	// The frame art is 1280x1280 and its INNER WINDOW — measured off the PNG, not
	// assumed — runs from x=60 to x=1221, so the window is 1161/1280 = 90.7% of
	// the art. Drawn at the old 1280/1000 = 1.28, that window came out at 1.16x
	// the board: 16% of empty panel on every side, about half a cell of nothing
	// between the outermost symbols and the frame.
	//
	// The reference build's neon border hugs its grid — a couple of percent, not
	// sixteen — and the gap is most of why this board reads as "外框太大圖騰太小".
	// 1280/1110 puts the window at 1.05x the board. That is deliberately a little
	// looser than the tightest fit: a special symbol is drawn at 1.08 of its cell
	// and now carries a drop shadow below it, and at 1.03 the bottom row visibly
	// touched the frame.
	const FRAME_SCALE = 1280 / 1110;

	// mode ambience: the frame breathes in the free game and cool moonlight in
	// superspin; the base game stays clean.
	//
	// The free-game colour was 0xffd75e — GoBananas' brass. It is now the hot
	// magenta the frame art, the free-spin sign and uiTheme.buttonBorder already
	// carry, so the housing glows in the game's own primary signal colour rather
	// than the sibling's. Superspin's icy blue is deliberate and stays: it is the
	// one mode meant to read cold.
	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	const ambienceColor = $derived(
		isSuperspin ? 0x9fd0ff : context.stateGame.gameType === 'freegame' ? 0xC9A227 : null,
	);

	let pulse = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 620);
		}, 33);
		return () => {
			clearInterval(id);
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
		const w = layout.width * layout.scale * 1.06;
		const h = layout.height * layout.scale * 1.06;
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


<Sprite
	key="hmFrameBg"
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y}
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
/>

<Sprite
	key="hmFrameEdge"
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y}
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
/>

{#if impact.flash > 0}
	<!-- additive copy of the brass edge = the whole housing rings white-hot -->
	<Sprite
		key="hmFrameEdge"
		anchor={0.5}
		x={context.stateGameDerived.boardLayout().x + impact.x}
		y={context.stateGameDerived.boardLayout().y + impact.y}
		width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
		height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
		blendMode="add"
		alpha={impact.flash}
	/>
{/if}

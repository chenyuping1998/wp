<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the brass
		| { type: 'boardFrameImpact'; strength?: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import frameGeometry from '../game/frameGeometry';

	const context = getContext();

	/**
	 * Where the frame sprite goes, derived from the art itself.
	 *
	 * frameGeometry.ts is written by design/import_scene.mjs, which measures the
	 * magenta window in the supplied frame. It used to be a single hand-written
	 * FRAME_SCALE on the assumption of a centred 78.1% window; the art that
	 * actually arrived has a 60.7% x 57.3% window sitting below centre, because
	 * its altar table occupies the bottom. Measuring beats assuming - and a
	 * misaligned frame is invisible to every other check, since the frame and the
	 * reels are each drawn correctly, just not around each other.
	 *
	 * Scaled UNIFORMLY off the board's HEIGHT, so the ornate art is never
	 * stretched; the window is proportionally wider than the board, and that
	 * slack shows the wall at the sides.
	 */
	const frameSize = $derived.by(() => {
		const layout = context.stateGameDerived.boardLayout();
		const height = layout.height * layout.scale * frameGeometry.spriteHeightPerBoardHeight;
		return { width: height * frameGeometry.spriteAspect, height };
	});
	// The window is below the sprite's centre, so the sprite rides above the board.
	const frameOffsetY = $derived(frameSize.height * frameGeometry.centreOffsetY);

	// ── no halo, and no glow spine ───────────────────────────────
	//
	// Two things used to light up around the housing for the whole feature, and
	// both are gone.
	//
	// drawAmbience breathed three thick rounded-rect strokes around the board -
	// phosphor green originally, candle after the repaint. Either way it is a
	// generic soft glow pulsing around a rectangle, which is the most
	// characterless thing a slot can do with a feature, and it ran on every spin
	// of every feature.
	//
	// The `reelhouse` spine was worse: it is the scaffold's art, a PURPLE NEON
	// rectangle, and it was still being played around a carved wooden shrine. It
	// survived the re-theme because nothing on screen names it - it arrives
	// through an event and an asset key, and neither says what it looks like.
	//
	// What tells the player they are in the feature instead: the backdrop changes
	// (mcBgFeature), the talisman rail appears above the board, and the free-spin
	// counter is on screen. All three say something specific. A halo says
	// "something is happening" and nothing else.

	let pulse = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 620);
		}, 33);
		return () => {
			clearInterval(id);
			cancelAnimationFrame(impactRaf);
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

	context.eventEmitter.subscribeOnMount({
		// Kept as no-ops: the events still fire from bookEventHandlerMap on entering
		// and leaving the feature, and a listener that ignores an event is a quieter
		// thing than a broadcast with nothing on the other end.
		boardFrameGlowShow: () => {},
		boardFrameGlowHide: () => {},
		boardFrameImpact: ({ strength }) => runImpact(strength ?? 1),
	});
</script>

<Sprite
	key="mcFrameBg"
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y + frameOffsetY}
	width={frameSize.width}
	height={frameSize.height}
/>

<Sprite
	key="mcFrameEdge"
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y + frameOffsetY}
	width={frameSize.width}
	height={frameSize.height}
/>

{#if impact.flash > 0}
	<!-- additive copy of the brass edge = the whole housing rings white-hot -->
	<Sprite
		key="mcFrameEdge"
		anchor={0.5}
		x={context.stateGameDerived.boardLayout().x + impact.x}
		y={context.stateGameDerived.boardLayout().y + impact.y + frameOffsetY}
		width={frameSize.width}
		height={frameSize.height}
		blendMode="add"
		alpha={impact.flash}
	/>
{/if}

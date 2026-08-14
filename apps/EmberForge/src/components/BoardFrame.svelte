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

	import { getContext } from '../game/context';
	import LavaFlow from './LavaFlow.svelte';
	import SceneEmbers from './SceneEmbers.svelte';

	const context = getContext();

	// ── placing the painted scene ───────────────────────────────────────────
	//
	// bg_background.png is one picture holding BOTH the room and the reel frame,
	// with a black opening the board shows through. That fuses two things this
	// codebase had kept apart, and it has one hard consequence: the image cannot
	// be positioned by the screen, it has to be positioned by the BOARD, so that
	// its opening lands exactly on the playfield at every aspect ratio.
	//
	// Measured off the file rather than eyeballed:
	const SCENE = { width: 1536, height: 1024 };
	const OPENING = { x: 454, y: 241, width: 628, height: 586 };
	// Offset of the opening's centre from the image's centre, in image pixels.
	const OPENING_DX = OPENING.x + OPENING.width / 2 - SCENE.width / 2; // -0.5
	const OPENING_DY = OPENING.y + OPENING.height / 2 - SCENE.height / 2; // +21.5

	// Scale is taken from the opening's HEIGHT, never its width. The opening is
	// 628x586 while the board is square, so matching width would leave the
	// opening shorter than the board and the frame would sit over the top and
	// bottom rows. Matching height leaves horizontal slack instead, which is
	// harmless — it just shows a little more of the dark recess.
	//
	// The margin is what keeps the recoil from eating that slack: the scene
	// shakes on impact and the board does not, so without a gap a hard slam would
	// walk the frame across the playfield edge.
	const OPENING_MARGIN = 1.06;
	// ...and the scene only takes a fraction of the impact, so the movement stays
	// well inside the margin even on a transition slam.
	const SCENE_IMPACT = 0.45;

	// mode ambience: the housing glows with the forge running in the free game;
	// the base game stays cold
	const ambienceColor = $derived(
		context.stateGame.gameType === 'freegame' ? 0xffa32c : null,
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

	// Declared after `impact` on purpose: this reads it, and a derived that
	// closes over a `let` declared further down is a temporal-dead-zone trap
	// waiting for someone to make it eager.
	const scene = $derived.by(() => {
		const layout = context.stateGameDerived.boardLayout();
		const boardHeight = layout.height * layout.scale;
		const s = (boardHeight * OPENING_MARGIN) / OPENING.height;
		return {
			x: layout.x - OPENING_DX * s + impact.x * SCENE_IMPACT,
			y: layout.y - OPENING_DY * s + impact.y * SCENE_IMPACT,
			width: SCENE.width * s,
			height: SCENE.height * s,
		};
	});

	const drawAmbience = (g: PixiGraphics) => {
		g.clear();
		if (ambienceColor === null) return;
		const layout = context.stateGameDerived.boardLayout();
		const w = layout.width * layout.scale * 1.06;
		const h = layout.height * layout.scale * 1.06;
		const x = layout.x - w / 2;
		const y = layout.y - h / 2;
		const layers: [number, number][] = [
			[34, 0.05 + 0.06 * pulse],
			[20, 0.09 + 0.09 * pulse],
			[10, 0.14 + 0.12 * pulse],
		];
		for (const [width, alpha] of layers) {
			g.lineStyle(width, ambienceColor, alpha);
			g.drawRoundedRect(x, y, w, h, 40);
		}
	};

	// ── the housing glow ──────────────────────────────────────────────────────
	//
	// This used to be `reelhouse_glow`, a Spine skeleton out of the Stake sample
	// game. It was template art sitting permanently around the playfield of a
	// game that is not that game, so it is gone; the glow is drawn here instead,
	// out of the forge's own fire.
	//
	// A ramp rather than a flag: the spine had start / idle / exit animations, and
	// snapping a glow on and off in their place would be a step backwards. `glow`
	// eases to its target and the drawing reads it, so show and hide are both
	// smooth for free.
	let glow = $state(0);
	let glowTarget = $state(0);
	let glowRaf = 0;

	const runGlow = () => {
		cancelAnimationFrame(glowRaf);
		const step = () => {
			// Asymmetric: lighting up is quick because it is announcing something,
			// fading out is slow because nothing is being announced any more.
			const rate = glowTarget > glow ? 0.09 : 0.035;
			glow += (glowTarget - glow) * rate;
			if (Math.abs(glowTarget - glow) < 0.002) {
				glow = glowTarget;
				return;
			}
			glowRaf = requestAnimationFrame(step);
		};
		glowRaf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			glowTarget = 1;
			runGlow();
		},
		boardFrameGlowHide: () => {
			glowTarget = 0;
			runGlow();
		},
		boardFrameImpact: ({ strength }) => runImpact(strength ?? 1),
	});

	// Edge positions for the glow sprites, as fractions of the board box. Sized off
	// the board rather than the canvas so the glow tracks the playfield through
	// every layout, including the popout.
	const glowEdges = $derived.by(() => {
		const layout = context.stateGameDerived.boardLayout();
		const w = layout.width * layout.scale;
		const h = layout.height * layout.scale;
		const breathe = 0.82 + 0.18 * pulse;
		return [
			{ x: layout.x, y: layout.y - h * 0.5, width: w * 1.15, height: h * 0.42, breathe },
			{ x: layout.x, y: layout.y + h * 0.5, width: w * 1.15, height: h * 0.42, breathe },
			{ x: layout.x - w * 0.5, y: layout.y, width: w * 0.42, height: h * 1.15, breathe },
			{ x: layout.x + w * 0.5, y: layout.y, width: w * 0.42, height: h * 1.15, breathe },
		];
	});
</script>

<Graphics zIndex={-2} draw={drawAmbience} />

{#if glow > 0.004}
	<!-- Heat banked up along the four edges of the housing, breathing on the same
	     slow pulse as the free-game ambience so the two never fight. -->
	{#each glowEdges as edge, index (index)}
		<Sprite
			key="fxGlow"
			zIndex={-1}
			anchor={0.5}
			x={edge.x}
			y={edge.y}
			width={edge.width}
			height={edge.height}
			tint={0xff8420}
			blendMode="add"
			alpha={0.5 * glow * edge.breathe}
		/>
	{/each}
{/if}

<Sprite key="efScene" anchor={0.5} x={scene.x} y={scene.y} width={scene.width} height={scene.height} />

<!--
	The fire in that picture, set moving. Drawn immediately over the scene and with
	the same geometry, so every bright band lands exactly on the flame it belongs
	to; see LavaFlow for why the motion cannot live in the image itself.
-->
<LavaFlow
	x={scene.x - scene.width / 2}
	y={scene.y - scene.height / 2}
	width={scene.width}
	height={scene.height}
	intensity={context.stateGame.gameType === 'freegame' ? 1.35 : 1}
/>

<!-- and sparks off the top of it, from the same fire -->
<SceneEmbers
	x={scene.x - scene.width / 2}
	y={scene.y - scene.height / 2}
	width={scene.width}
	height={scene.height}
	intensity={context.stateGame.gameType === 'freegame' ? 1.3 : 1}
/>

{#if context.stateGame.gameType === 'freegame'}
	<!--
		The painted scene is one image, so the free game cannot swap to a different
		one the way the generated backdrop does. A warm additive pass over the same
		art carries the mode instead: the forge is running hotter, not somewhere
		else.
	-->
	<Sprite
		key="efScene"
		anchor={0.5}
		x={scene.x}
		y={scene.y}
		width={scene.width}
		height={scene.height}
		blendMode="add"
		tint={0xff8a3a}
		alpha={0.12 + 0.05 * pulse}
	/>
{/if}

{#if impact.flash > 0}
	<!--
		Additive copy of the whole scene: a hard slam now rings the entire room
		rather than just the housing, because the housing IS the room in this art.
		Held well below the old value — the painted scene is already bright, and at
		the frame's original flash strength it blew out to white.
	-->
	<Sprite
		key="efScene"
		anchor={0.5}
		x={scene.x}
		y={scene.y}
		width={scene.width}
		height={scene.height}
		blendMode="add"
		alpha={impact.flash * 0.35}
	/>
{/if}

<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the brass
		| { type: 'boardFrameImpact'; strength?: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';

	const context = getContext();
	const SPINE_SCALE = { width: 0.62, height: 0.66 };

	// ── placing the painted scene ───────────────────────────────────────────
	//
	// bg_background.png is one picture holding BOTH the room and the reel frame,
	// with a black opening the board shows through. That fuses two things this
	// codebase had kept apart, and it has one hard consequence: the image cannot
	// be positioned by the screen, it has to be positioned by the BOARD, so that
	// its opening lands exactly on the playfield at every aspect ratio.
	//
	// These four numbers are a CONTRACT with design/generate_scene_yard.mjs, which
	// prints them when it runs. They are not measured by eye and they are not
	// adjustable here alone — change one side and the housing walks off the board.
	const SCENE = { width: 1536, height: 1024 };
	const OPENING = { x: 362, y: 196, width: 812, height: 650 };
	// Offset of the opening's centre from the image's centre, in image pixels.
	const OPENING_DX = OPENING.x + OPENING.width / 2 - SCENE.width / 2; // 0
	const OPENING_DY = OPENING.y + OPENING.height / 2 - SCENE.height / 2; // -291

	// Scale is taken from the opening's HEIGHT, never its width. The opening is
	// 812x650 (1.249) against a 588x490 board (1.2), so matching height leaves a
	// little horizontal slack — harmless, it just shows more of the dark recess.
	// Matching width instead would leave the opening SHORTER than the board and
	// put the jaw faces over the top and bottom rows.
	//
	// This is exactly what the forge painting did before it was replaced: its
	// opening was 628x586 (1.072), cut for a square 7x7 board, and on this board
	// it scaled to 525 wide against 588 of playfield — the housing sat over the
	// first and last reel.
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

	type AnimationName = 'reelhouse_glow_start' | 'reelhouse_glow_idle' | 'reelhouse_glow_exit';

	let animationName = $state<AnimationName | undefined>(undefined);
	let loop = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			animationName = 'reelhouse_glow_start';
			loop = false;
		},
		boardFrameGlowHide: () => {
			if (animationName) animationName = 'reelhouse_glow_exit';
		},
		boardFrameImpact: ({ strength }) => runImpact(strength ?? 1),
	});
</script>

<Graphics zIndex={-2} draw={drawAmbience} />

{#if animationName}
	<SpineProvider
		zIndex={-1}
		key="reelhouse"
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y}
		width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * SPINE_SCALE.width}
		height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * SPINE_SCALE.height}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			listener={{
				complete: (entry) => {
					if (entry.animation) {
						if (entry.animation.name === 'reelhouse_glow_start') {
							animationName = 'reelhouse_glow_idle';
							loop = true;
						}

						if (entry.animation.name === 'reelhouse_glow_exit') {
							animationName = undefined;
							loop = false;
						}
					}
				},
			}}
		/>
	</SpineProvider>
{/if}

<Sprite key="cyScene" anchor={0.5} x={scene.x} y={scene.y} width={scene.width} height={scene.height} />

{#if context.stateGame.gameType === 'freegame'}
	<!--
		The painted scene is one image, so the free game cannot swap to a different
		one the way the generated backdrop does. A warm additive pass over the same
		art carries the mode instead: the forge is running hotter, not somewhere
		else.
	-->
	<Sprite
		key="cyScene"
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
		key="cyScene"
		anchor={0.5}
		x={scene.x}
		y={scene.y}
		width={scene.width}
		height={scene.height}
		blendMode="add"
		alpha={impact.flash * 0.35}
	/>
{/if}

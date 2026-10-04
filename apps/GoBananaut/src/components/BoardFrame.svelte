<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the brass. With a
		// `reel`, the housing also DENTS over that column (FrameMesh); `out` bows
		// it outward instead (a reel growing into it), with no kick at all.
		| { type: 'boardFrameImpact'; strength?: number; reel?: number; out?: boolean };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import FrameMesh, { type FrameDent } from './FrameMesh.svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { HOLD_AND_SPIN_MODE_KEY, FRAME_SCALE } from '../game/constants';

	const context = getContext();
	const SPINE_SCALE = { width: 0.62, height: 0.66 };

	// mode ambience: the frame breathes gold in the free game and cool
	// moonlight in hold and spin; the base game stays clean
	const isSuperspin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	const ambienceColor = $derived(
		isSuperspin ? 0x9fd0ff : context.stateGame.gameType === 'freegame' ? 0xffd75e : null,
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

	// ── the shell giving where it is hit (FrameMesh) ──────────────────────────
	let dents = $state<FrameDent[]>([]);
	let breathAt = $state(0);
	const DENT_KEEP_MS = 700;
	// a reel's column in the frame texture: the frame is FRAME_SCALE.x times the
	// board's width, centred on it, and the board is five equal columns
	const reelU = (reel: number) => 0.5 + ((reel - 2) * 0.2) / FRAME_SCALE.x;
	const dent = (d: Omit<FrameDent, 't0'>) => {
		const now = performance.now();
		dents = [...dents.filter((x) => now - x.t0 < DENT_KEEP_MS), { ...d, t0: now }];
	};

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
		boardFrameImpact: ({ strength, reel, out }) => {
			if (reel !== undefined) {
				const s = strength ?? 1;
				dent({ kind: 'column', at: reelU(reel), depth: out ? 5 : 4 + 10 * Math.min(1, s), out });
				// the hit is taken by the dent now; the whole housing only shivers
				if (!out) runImpact(s * 0.4);
				return;
			}
			runImpact(strength ?? 1);
		},
		// each fist of the chest beat lands on the rail beside him — the same
		// timings as the skeleton (generate_monkey_spine.mjs BEAT_START / BEAT_GAP)
		mascotChestBeat: () => {
			if (!context.stateGame.mascotThrowOrigin) return;
			for (let i = 0; i < 6; i += 1)
				setTimeout(() => dent({ kind: 'side', at: 0.35 + 0.08 * (i % 2), depth: 7 + i }), 480 + 300 * i);
		},
		winUpdate: ({ winLevelData }) => {
			if (winLevelData.type === 'big') breathAt = performance.now();
		},
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

<Sprite
	key="gbFrameBg"
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y}
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE.x}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE.y}
/>

<!-- the housing's edge as a mesh, with its additive flash copy on the same
     geometry: it dents where it is hit rather than only jumping as one piece.
     Its own container, so the mesh keeps this slot when it attaches. -->
<Container>
	<FrameMesh
		textureKey="gbFrameEdge"
		x={context.stateGameDerived.boardLayout().x + impact.x}
		y={context.stateGameDerived.boardLayout().y + impact.y}
		width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE.x}
		height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE.y}
		{dents}
		{breathAt}
		flash={impact.flash}
	/>
</Container>

<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the brass
		// `from`: where it came from, in board units (-1..1 across, -1 top ..
		// 1 bottom; past 1 is outside, the gorilla's side) — the knock runs
		// round the ring from there. The centre when unsaid.
		| { type: 'boardFrameImpact'; strength?: number; from?: [number, number] };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { buildFrameGrid, poseFrame, FRAME, FRAME_KNOCK_S, type FrameKnock } from '../game/meshWin/sheets';
	import SheetMesh from './SheetMesh.svelte';

	const context = getContext();
	const SPINE_SCALE = { width: 0.62, height: 0.66 };
	// frame art is 1280×1280 with the board occupying the centered 1000×1000
	const FRAME_SCALE = 1280 / 1000;

	// mode ambience: the frame breathes gold in the free game and cool
	// moonlight in superspin; the base game stays clean
	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
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
			// two thirds of what it was: the wave through the ring (below) now
			// carries part of the hit
			const amp = 6 * strength * decay;
			impact = {
				x: Math.sin(p * 46) * amp * 0.45,
				y: Math.sin(p * 38 + 1.1) * amp,
				flash: 0.55 * strength * (1 - p) ** 3,
			};
			impactRaf = requestAnimationFrame(step);
		};
		impactRaf = requestAnimationFrame(step);
	};

	// ── THE KNOCK RUNS ROUND THE RING (meshWin/sheets.ts poseFrame) ──────────
	// Every knock also sends a wave through the steel from where it came, on
	// top of the whole-housing recoil above. Unlike the recoil these ADD:
	// five reel stops in a row are five small waves, not the last one.
	const frameGrid = buildFrameGrid();
	let knocks: FrameKnock[] = [];
	const clock = () => performance.now() / 1000;
	const knock = (strength: number, from: [number, number]) => {
		const now = clock();
		knocks = [...knocks.filter((k) => now - k.at < FRAME_KNOCK_S), { from, at: now, strength }];
	};
	const poseTheFrame = (out: Float32Array) => poseFrame(frameGrid, knocks, clock(), out);

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
		boardFrameImpact: ({ strength, from }) => {
			runImpact(strength ?? 1);
			knock(strength ?? 1, from ?? [0, 0]);
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

<!-- the backing, the steel ring and its additive white-hot copy: one grid, so
     a knock's wave runs through all three as one piece (meshWin/sheets.ts) -->
<SheetMesh
	layers={[
		{ key: 'gbFrameBg' },
		{ key: 'gbFrameEdge' },
		{ key: 'gbFrameEdge', blendMode: 'add', alpha: impact.flash },
	]}
	grid={frameGrid}
	artWidth={FRAME.w}
	artHeight={FRAME.h}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y}
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	pose={poseTheFrame}
/>

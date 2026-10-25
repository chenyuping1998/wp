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
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { FRAME } from '../game/meshWin';
	import { REELS, type FrameEnv } from '../game/meshWin/frameEdge';
	import PropMesh from './PropMesh.svelte';
	import { pulseRateMs, tierIntensity, tierOf } from '../game/anticipationFocus';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	const context = getContext();
	const SPINE_SCALE = { width: 0.62, height: 0.66 };
	// frame art is 1280×1280 with the board occupying the centered 1000×1000
	const FRAME_SCALE = 1280 / 1000;

	// mode ambience: the frame breathes gold in the free game and cool
	// moonlight in hold and spin; the base game stays clean
	const isSuperspin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	const ambienceColor = $derived(
		isSuperspin ? 0x9fd0ff : context.stateGame.gameType === 'freegame' ? 0xff4fd8 : 0x39dfff,
	);
	const ambienceGain = $derived(!isSuperspin && context.stateGame.gameType === 'basegame' ? 0.3 : 1);

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
			g.lineStyle(width, ambienceColor, alpha * ambienceGain);
			g.drawRoundedRect(x, y, w, h, 40);
		}
	};

	// THE TEMPLATE'S FRAME GLOW IS OFF.
	//
	// reelhouse_glow is the purple halo and the drifting star particles from the
	// template this game started as. In the feature it drew a purple band round
	// a mine-coloured housing and scattered small amber dots over the frame — one
	// of which sat on the bottom edge of the board looking like a stray light.
	// Neither belongs to this game. What is left is drawAmbience above: the
	// housing breathing amber, which is the game's own colour.
	//
	// The events and the animation state below are still driven, so switching it
	// back on is this one flag.
	const SPINE_GLOW = false;

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
		// the rails bow out over every reel that goes up (meshWin/frameEdge.ts),
		// on the bang itself: ReelBlast's CHARGE beat comes first
		reelBlast: ({ reels, full }) => {
			const at = performance.now() + BLAST_CHARGE_MS;
			for (const r of reels) {
				blastAt[r] = at;
				blastStrength[r] = full ? 1.6 : 1;
			}
			runBow();
		},
	});

	// ── the rails' bow ──────────────────────────────────────────────────────────
	// ReelBlast's CHARGE_MS (fixed, turbo too): the tiles swell for this long
	// before the bang
	const BLAST_CHARGE_MS = 380;
	const BOW_MS = 900;
	const blastAt: number[] = Array(REELS).fill(-Infinity);
	const blastStrength: number[] = Array(REELS).fill(1);
	let frameEnv = $state<FrameEnv>({ blastT: Array(REELS).fill(-1), strength: Array(REELS).fill(1) });
	let bowTimer: ReturnType<typeof setInterval> | undefined;

	// ── the tease's strain: the rails over a teasing reel throb outward with
	// the column's pulse (meshWin/frameEdge.ts). Eased in and out per reel so
	// the rails are at rest when the tease starts and when the reel stops.
	const STRAIN_EASE_MS = 140;
	const strainAmp: number[] = Array(REELS).fill(0);
	const teasing = () => context.stateGame.board.some((reel) => reel.reelState.anticipating);
	let lastTick = 0;

	// only ticks while a bow or a strain is playing; setInterval, not rAF, like
	// the meshes
	const runBow = () => {
		if (bowTimer) return;
		lastTick = performance.now();
		bowTimer = setInterval(() => {
			const now = performance.now();
			const dt = now - lastTick;
			lastTick = now;
			const blastT = blastAt.map((at) => (now - at <= BOW_MS ? now - at : -1));
			// the column pulse is Anticipation.svelte's own sine, on the same
			// wall clock and phase, so the rails throb with the light
			const wall = Date.now();
			const tier = tierOf(context.stateGame.scatterCounter);
			const k = 1 - Math.exp(-dt / STRAIN_EASE_MS);
			const strain = strainAmp.map((amp, i) => {
				const target = context.stateGame.board[i]?.reelState.anticipating ? tierIntensity(tier) : 0;
				strainAmp[i] = amp + (target - amp) * k;
				if (strainAmp[i] < 0.002 && target === 0) strainAmp[i] = 0;
				const pulse = 0.5 + 0.5 * Math.sin(wall / pulseRateMs(i, tier) + i * 0.9);
				return strainAmp[i] * (0.45 + 0.55 * pulse);
			});
			frameEnv = { blastT, strength: [...blastStrength], strain };
			if (blastAt.every((at) => now - at > BOW_MS) && strainAmp.every((a) => a === 0) && !teasing()) {
				clearInterval(bowTimer);
				bowTimer = undefined;
			}
		}, 16);
	};
	$effect(() => {
		if (teasing()) runBow();
	});
	onMount(() => () => clearInterval(bowTimer));
</script>

<Graphics zIndex={-2} draw={drawAmbience} />

{#if SPINE_GLOW && animationName}
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
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
/>

<!-- drawn through its mesh (game/meshWin/frameEdge.ts), same box: the rails
     bow out over each blasted reel -->
<PropMesh
	spec={FRAME}
	env={frameEnv}
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y}
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
/>

{#if impact.flash > 0}
	<!-- additive copy of the brass edge = the whole housing rings white-hot -->
	<Sprite
		key="gbFrameEdge"
		anchor={0.5}
		x={context.stateGameDerived.boardLayout().x + impact.x}
		y={context.stateGameDerived.boardLayout().y + impact.y}
		width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
		height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
		blendMode="add"
		alpha={impact.flash}
	/>
{/if}

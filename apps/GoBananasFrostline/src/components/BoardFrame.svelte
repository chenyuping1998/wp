<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the rails. `reel`
		// is the column it came from: that column's rails bow (game/meshWin/
		// frameEdge.ts). Without one, every column bows.
		| { type: 'boardFrameImpact'; strength?: number; reel?: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { ICE_DEEP } from '../game/palette';
	import { FRAME, FRAME_REELS } from '../game/meshWin';
	import PropMesh from './PropMesh.svelte';

	const context = getContext();
	const SPINE_SCALE = { width: 0.62, height: 0.66 };
	// frame art is 1280×1280 with the board occupying the centered 1000×1000
	const FRAME_SCALE = 1280 / 1000;

	// Mode ambience: the frame breathes around the board in the free game and in
	// superspin; the base game stays clean.
	//
	// Both are now cold, which loses a distinction the jungle palette had — free
	// game in gold against superspin's moonlight. It is replaced rather than
	// dropped: superspin keeps the pale moonlight it already had and the free
	// game takes the deeper glacier blue, so the two still read apart, by depth
	// instead of by hue. Hue is not available once both are cold.
	//
	// Gold was the wrong marker for this under palette.ts rule 2 anyway: a halo
	// around the whole board says WHERE you are, not what you won.
	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	const ambienceColor = $derived(
		isSuperspin ? 0x9fd0ff : context.stateGame.gameType === 'freegame' ? ICE_DEEP : null,
	);

	let pulse = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 620);
		}, 33);
		return () => {
			clearInterval(id);
			clearInterval(impactTimer);
			clearInterval(bowTimer);
		};
	});

	// ── frame impact: a short recoil plus a hot flash along the brass, so a
	// wild slamming into the housing is felt and not just seen ────────────────
	let impact = $state({ x: 0, y: 0, flash: 0 });
	// A TIMER, not requestAnimationFrame. rAF stops dead in a hidden tab, and an
	// impact started just before the tab was hidden left the whole housing
	// frozen at its offset — a frame visibly out of line with the board — until
	// the player came back. (The pixi v8 note on this has the same lesson.)
	let impactTimer: ReturnType<typeof setInterval> | undefined;
	const IMPACT_MS = 420;

	// THE BOW (game/meshWin/frameEdge.ts): when each column last took a hit and
	// how hard. The rails are drawn through a mesh fed these, on their own timer
	// that runs only while some column is still ringing.
	const BOW_MS = 950;
	const bowAt = Array.from({ length: FRAME_REELS }, () => -Infinity);
	const bowStrength = Array.from({ length: FRAME_REELS }, () => 0);
	let bowEnv = $state({
		blastT: Array.from({ length: FRAME_REELS }, () => -1),
		strength: Array.from({ length: FRAME_REELS }, () => 0),
	});
	let bowTimer: ReturnType<typeof setInterval> | undefined;
	const tickBow = () => {
		const now = Date.now();
		const blastT = bowAt.map((at) => (now - at < BOW_MS ? now - at : -1));
		bowEnv = { blastT, strength: [...bowStrength] };
		if (blastT.every((t) => t < 0)) {
			clearInterval(bowTimer);
			bowTimer = undefined;
		}
	};
	// The square root keeps a reel stop (requested at 0.12, a rattle) visible as
	// a bow at all — 0.35 — while the ice crack (1.6) still bows hardest (1.26).
	const runBow = (strength: number, reel?: number) => {
		const now = Date.now();
		const s = Math.sqrt(Math.max(0, strength));
		for (let i = 0; i < FRAME_REELS; i++) {
			if (reel !== undefined && i !== reel) continue;
			// a weaker hit does not cut a stronger one off mid-swing
			const left = bowStrength[i] * Math.max(0, 1 - (now - bowAt[i]) / BOW_MS);
			if (s < left) continue;
			bowAt[i] = now;
			bowStrength[i] = s;
		}
		if (!bowTimer) bowTimer = setInterval(tickBow, 16);
		tickBow();
	};

	// Energy still left in the impact currently playing, so a weaker one cannot
	// cut it short. Reel stops now request a light 0.12 rattle on every reel; a
	// wild explode (1) or a transition slam (1.4) can overlap one, and without
	// this the small request would cancel the big recoil mid-swing.
	let impactEnergy = 0;

	const runImpact = (strength: number) => {
		if (strength < impactEnergy) return;
		clearInterval(impactTimer);
		impactEnergy = strength;
		const start = Date.now();
		const step = () => {
			const p = (Date.now() - start) / IMPACT_MS;
			if (p >= 1) {
				impact = { x: 0, y: 0, flash: 0 };
				impactEnergy = 0;
				clearInterval(impactTimer);
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
		};
		impactTimer = setInterval(step, 16);
		step();
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
		// Pixi 8: path, then `.stroke()`. `lineStyle` is the v7 call and in v8 only
		// assigns `context.strokeStyle` — it emits no geometry — so all three
		// ambience layers drew nothing and the board never had its coloured halo.
		// Inherited from Go Bananas 100, which still has it.
		for (const [width, alpha] of layers) {
			g.roundRect(x, y, w, h, 40);
			g.stroke({ width, color: ambienceColor, alpha });
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
		boardFrameImpact: ({ strength, reel }) => {
			runImpact(strength ?? 1);
			runBow(strength ?? 1, reel);
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
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
/>

<!-- the rails, through the mesh: the column that took the hit bows -->
<PropMesh
	spec={FRAME}
	env={bowEnv}
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x + impact.x}
	y={context.stateGameDerived.boardLayout().y + impact.y}
	width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
	height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
/>

{#if impact.flash > 0}
	<!-- additive copy of the rails = the housing rings white-hot. Through the
	     same mesh and the same bow, or the light would sit where the rail was
	     before it bent and draw it twice. -->
	<PropMesh
		spec={FRAME}
		env={bowEnv}
		anchor={0.5}
		x={context.stateGameDerived.boardLayout().x + impact.x}
		y={context.stateGameDerived.boardLayout().y + impact.y}
		width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
		height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * FRAME_SCALE}
		blendMode="add"
		alpha={impact.flash}
	/>
{/if}

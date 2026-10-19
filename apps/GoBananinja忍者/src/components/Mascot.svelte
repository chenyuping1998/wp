<script lang="ts" module>
	export type EmitterEventMascot =
		| { type: 'mascotScatterSlash' }
		| { type: 'mascotThrow' }
		| { type: 'mascotGoggleTease' }
		| { type: 'mascotSlash'; finale?: boolean };
</script>

<script lang="ts">
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount, onDestroy } from 'svelte';
	import { getContext } from '../game/context';

	const context = getContext();
	const ART = { width: 560, height: 884 };
	const PUPPET_HEIGHT = 884;
	const MIN_GAP = 260;
	const RELEASE = { x: -180, y: 350 };
	const SPLIT_ACTIONS = ['slash', 'slash_alt', 'split_finale'];
	const ONE_SHOTS = ['cheer', 'nod', 'throwit', 'watch', ...SPLIT_ACTIONS, 'scatter_slash'];
	const isAction = () => [...SPLIT_ACTIONS, 'scatter_slash', 'throwit'].includes(animationName);

	const placement = $derived.by(() => {
		const layout = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		const frameHalfWidth = (board.width * board.scale * 1.28) / 2;
		const frameHalfHeight = (board.height * board.scale * 1.28) / 2;
		const barHeight = layout.height - board.y * 2;
		const gapLeft = board.x + frameHalfWidth;
		const gapWidth = layout.width - gapLeft;
		if (gapWidth < MIN_GAP) return null;
		const height = Math.min(
			(layout.height - barHeight) * 0.94,
			(gapWidth * 0.86 * ART.height) / ART.width,
		);
		return {
			x: gapLeft + gapWidth / 2,
			y: Math.min(board.y + frameHalfHeight, layout.height - barHeight - 6),
			scale: height / PUPPET_HEIGHT,
			legacyScale: height / ART.height,
		};
	});

	$effect(() => {
		context.stateGame.mascotThrowOrigin = placement
			? { x: placement.x + RELEASE.x * placement.legacyScale, y: placement.y - RELEASE.y * placement.legacyScale }
			: null;
		return () => { context.stateGame.mascotThrowOrigin = null; };
	});

	let animationName = $state('idle');
	let loop = $state(true);
	// A big win starts with a cheer, then a quiet looping celebration while its
	// count-up is active (the same rhythm as Anubis). A later action can interrupt.
	let celebrateUntil = 0;
	let pendingCheer = false;
	const celebrate = (duration: number) => {
		celebrateUntil = performance.now() + duration + 1300;
		pendingCheer = isAction();
		if (!pendingCheer) play('cheer', false);
	};
	const endCelebration = () => {
		celebrateUntil = 0;
		pendingCheer = false;
		if (animationName === 'dance' || animationName === 'cheer') play('idle', true);
	};
	let clock = $state(0);
	let teaseUntil = $state(0);
	let raf = 0;
	let nextWatchAt = 0;
	const timers: number[] = [];
	const later = (delay: number, fn: () => void) => timers.push(window.setTimeout(fn, delay));
	const clearTimers = () => { for (const id of timers) clearTimeout(id); timers.length = 0; };
	onMount(() => {
		nextWatchAt = performance.now() + 8000;
		const step = (now: number) => {
			clock = now;
			if (now >= nextWatchAt) {
				nextWatchAt = now + 11000;
				if (placement && animationName === 'idle' && now >= celebrateUntil) play('watch', false);
			}
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});
	onDestroy(clearTimers);

	const play = (name: string, loops: boolean) => {
		clearTimers();
		teaseUntil = 0;
		nextWatchAt = performance.now() + 11000;
		// SpineTrack reacts to a name change. Alternate the identical split
		// clips so a second cut can restart the gesture while the first recovers.
		animationName = name === 'slash' && animationName === 'slash' ? 'slash_alt' : name;
		loop = loops;
	};
	const say = (name: 'roar' | 'effort') =>
		context.eventEmitter.broadcast({ type: 'soundMascotVoice', name });
	const drawTease = (g: PixiGraphics) => {
		g.clear();
		if (clock >= teaseUntil || !placement) return;
		const life = Math.max(0, Math.min(1, (teaseUntil - clock) / 1200));
		const alpha = Math.sin(Math.PI * life) * 0.24;
		for (const x of [30, 85]) {
			g.circle(x, -741, 16).fill({ color: 0xff4d36, alpha: alpha * 0.3 });
			g.circle(x, -741, 4).fill({ color: 0xffda93, alpha });
		}
	};

	context.eventEmitter.subscribeOnMount({
		winUpdate: ({ winLevelData }) => {
			if (winLevelData.type === 'big') celebrate(winLevelData.presentDuration);
		},
		winHide: endCelebration,
		freeSpinOutroHide: endCelebration,
		freeSpinOutroCountUp: ({ amount, winLevelData }) => {
			if (amount <= 0) return;
			if (winLevelData.type === 'big') celebrate(winLevelData.presentDuration);
			else if (!isAction()) play('nod', false);
		},
		mascotScatterSlash: () => {
			if (!placement) return;
			play('scatter_slash', false);
			later(300, () => context.eventEmitter.broadcast({ type: 'soundBladeDraw', finale: true }));
			later(560, () => context.eventEmitter.broadcast({ type: 'soundBladeHit', finale: false }));
			later(1020, () => context.eventEmitter.broadcast({ type: 'soundBladeHit', finale: true }));
			say('roar');
		},
		mascotGoggleTease: () => {
			if (placement && (animationName === 'idle' || animationName === 'watch')) {
				play('watch', false);
				teaseUntil = performance.now() + 1200;
			}
		},
		mascotThrow: () => {
			play('throwit', false);
			later(520, () => say('effort'));
		},
		mascotSlash: ({ finale }) => { if (placement) play(finale ? 'split_finale' : 'slash', false); },
		winLinesShow: () => {
			if (context.stateGame.gameType === 'basegame' && animationName === 'idle') play('nod', false);
		},
	});
</script>

{#if placement}
	<SpineProvider key="gbNinjaPuppet" x={placement.x} y={placement.y} scale={placement.scale} zIndex={-1}>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			mixDuration={SPLIT_ACTIONS.includes(animationName) ? 0.055 : animationName === 'idle' ? 0.24 : 0.18}
			timeScale={1}
			listener={{
				complete: (entry) => {
					const finished = entry.animation?.name;
					if (!finished || finished !== animationName) return;
					if (pendingCheer && performance.now() < celebrateUntil) {
						pendingCheer = false;
						play('cheer', false);
					}
					else if (finished === 'cheer' && performance.now() < celebrateUntil) play('dance', true);
					else if (finished === 'dance' && performance.now() >= celebrateUntil) play('idle', true);
					else if (ONE_SHOTS.includes(finished)) play('idle', true);
				},
			}}
		/>
		<!-- Accessory loop and cloth physics stay active through every gesture. -->
		<SpineTrack trackIndex={1} animationName="flutter" loop />
		<!-- Painted lids on the `lids` slot (design/ninja_blink.py); nothing else keys it. -->
		<SpineTrack trackIndex={2} animationName="blink" loop />
		<!-- the shoulder shuriken catches the light every 6s (design/ninja_shuriken_glint.py) -->
		<SpineTrack trackIndex={3} animationName="glint" loop />
	</SpineProvider>
	<Container x={placement.x} y={placement.y} scale={placement.scale}>
		<Graphics draw={drawTease} blendMode="add" />
	</Container>
{/if}

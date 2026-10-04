<script lang="ts" module>
	export type EmitterEventMascot =
		| { type: 'mascotScatterSlash' }
		| { type: 'mascotThrow' }
		| { type: 'mascotGoggleTease' }
		| { type: 'mascotSlash' };
</script>

<script lang="ts">
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount, onDestroy } from 'svelte';
	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';

	const context = getContext();
	const ART = { width: 564, height: 846 };
	const PUPPET_HEIGHT = 1510;
	const MIN_GAP = 260;
	const RELEASE = { x: -215, y: 385 };
	const ONE_SHOTS = ['cheer', 'nod', 'throwit', 'slash', 'scatter_slash'];

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
	const celebrate = (duration: number) => {
		celebrateUntil = performance.now() + duration + 1300;
		play('cheer', false);
	};
	let clock = $state(0);
	let teaseUntil = $state(0);
	let raf = 0;
	const timers: number[] = [];
	const later = (delay: number, fn: () => void) => timers.push(window.setTimeout(fn, delay));
	const clearTimers = () => { for (const id of timers) clearTimeout(id); timers.length = 0; };
	onMount(() => {
		const step = (now: number) => { clock = now; raf = requestAnimationFrame(step); };
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});
	onDestroy(clearTimers);

	const play = (name: string, loops: boolean) => {
		clearTimers();
		animationName = name;
		loop = loops;
	};
	const say = (name: 'roar' | 'effort') =>
		context.eventEmitter.broadcast({ type: 'soundMascotVoice', name });
	const drawTease = (g: PixiGraphics) => {
		g.clear();
		if (clock >= teaseUntil || !placement) return;
		const life = Math.max(0, Math.min(1, (teaseUntil - clock) / 1200));
		const alpha = Math.sin(Math.PI * life) * 0.24;
		for (const x of [50, 130]) {
			g.circle(x, -1300, 28).fill({ color: 0xff4d36, alpha: alpha * 0.3 });
			g.circle(x, -1300, 7).fill({ color: 0xffda93, alpha });
		}
	};

	context.eventEmitter.subscribeOnMount({
		winUpdate: ({ winLevelData }) => {
			if (winLevelData.type === 'big') celebrate(winLevelData.presentDuration);
		},
		winHide: () => { celebrateUntil = 0; },
		freeSpinOutroHide: () => { celebrateUntil = 0; },
		freeSpinOutroCountUp: ({ amount, winLevelData }) => {
			if (amount <= 0) return;
			if (winLevelData.type === 'big') celebrate(winLevelData.presentDuration);
			else play('nod', false);
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
			if (placement && animationName === 'idle') teaseUntil = performance.now() + 1200;
		},
		mascotThrow: () => {
			play('throwit', false);
			later(520, () => say('effort'));
		},
		mascotSlash: () => { if (placement) play('slash', false); },
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
			mixDuration={animationName === 'slash' || animationName === 'scatter_slash' ? 0.08 : 0.16}
			timeScale={animationName === 'slash' && stateBet.isTurbo ? 1 / 0.6 : 1}
			listener={{
				complete: (entry) => {
					const finished = entry.animation?.name;
					if (!finished || finished !== animationName) return;
					if (finished === 'cheer' && performance.now() < celebrateUntil) play('dance', true);
					else if (finished === 'dance' && performance.now() >= celebrateUntil) play('idle', true);
					else if (ONE_SHOTS.includes(finished)) play('idle', true);
				},
			}}
		/>
	</SpineProvider>
	<Container x={placement.x} y={placement.y} scale={placement.scale}>
		<Graphics draw={drawTease} blendMode="add" />
	</Container>
{/if}

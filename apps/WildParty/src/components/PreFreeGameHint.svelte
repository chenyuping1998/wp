<script lang="ts" module>
	export type EmitterEventPreFreeGameHint = { type: 'preFreeGameHintShow' };
</script>

<script lang="ts">
	import { Container, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';
	import { MainContainer } from 'components-layout';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import FxBurst from './FxBurst.svelte';

	const context = getContext();

	// teaser beats: dash in → hover in the spotlight → blast out (B + A trail)
	const T_ENTER = 0.45;
	const T_HOVER_END = 1.1;
	const T_EXIT_END = 1.45;
	const T_TOTAL = 1.7;

	let show = $state(false);
	let t = $state(0);
	let oncomplete = $state(() => {});
	let intervalId = $state<ReturnType<typeof setInterval> | null>(null);
	let hoverCued = false;
	let exitCued = false;

	// trail: ring buffer of recent ball positions
	let history = $state<{ x: number; y: number }[]>([]);
	const TRAIL_COUNT = 12;
	const TRAIL_JITTER = Array.from({ length: TRAIL_COUNT }, (_, i) => ({
		x: Math.sin(i * 3.7) * 10,
		y: Math.cos(i * 2.3) * 12,
		tint: i % 2 ? 0xffd75e : 0xff8ede,
	}));

	const easeOutCubic = (p: number) => 1 - (1 - Math.min(1, Math.max(0, p))) ** 3;
	const easeInCubic = (p: number) => Math.min(1, Math.max(0, p)) ** 3;

	const ballPos = (time: number) => {
		const board = context.stateGameDerived.boardLayout();
		const xRight = board.x + board.width * 0.82;
		const xCenter = board.x + board.width * 0.02;
		const xLeft = board.x - board.width * 0.85;
		const yBase = board.y - 55;

		if (time < T_ENTER) {
			const p = easeOutCubic(time / T_ENTER);
			return { x: xRight + (xCenter - xRight) * p, y: yBase - 48 * (1 - p) };
		}
		if (time < T_HOVER_END) {
			const p = (time - T_ENTER) / (T_HOVER_END - T_ENTER);
			return {
				x: xCenter + Math.sin(p * Math.PI * 2) * 7,
				y: yBase + Math.sin(p * Math.PI * 3) * 9,
			};
		}
		const p = easeInCubic((time - T_HOVER_END) / (T_EXIT_END - T_HOVER_END));
		return { x: xCenter + (xLeft - xCenter) * p, y: yBase - 28 * p };
	};

	const stopAnimation = () => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	};

	const runAnimation = () => {
		stopAnimation();
		const startedAt = Date.now();
		t = 0;
		history = [];
		hoverCued = false;
		exitCued = false;
		show = true;

		intervalId = setInterval(() => {
			t = (Date.now() - startedAt) / 1000;
			const pos = ballPos(Math.min(t, T_EXIT_END));
			history = [pos, ...history.slice(0, 39)];

			if (!hoverCued && t >= T_ENTER) {
				hoverCued = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_anticipation_start' });
			}
			if (!exitCued && t >= T_HOVER_END) {
				exitCued = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
			}
			if (t >= T_TOTAL) {
				stopAnimation();
				show = false;
				oncomplete();
			}
		}, 16);
	};

	context.eventEmitter.subscribeOnMount({
		preFreeGameHintShow: async () => {
			// Armed before runAnimation() — see Transition.svelte for the race this
			// shape produces.
			const settled = waitForResolve<void>((resolve) => {
				oncomplete = resolve;
			});
			runAnimation();
			await settled;
		},
	});

	onDestroy(() => {
		stopAnimation();
	});

	const ball = $derived(ballPos(Math.min(t, T_EXIT_END)));
	// hover envelope (0→1 during the center hover) — drives the glow swell
	// only; the old full-screen 34% dim stacked with the ambient haze/vignette
	// and read as a dark flicker, so the spotlight is carried by the glow now
	const dim = $derived.by(() => {
		if (t < T_ENTER) return 0;
		if (t < T_ENTER + 0.25) return (t - T_ENTER) / 0.25;
		if (t < T_HOVER_END) return 1;
		if (t < T_HOVER_END + 0.3) return 1 - (t - T_HOVER_END) / 0.3;
		return 0;
	});
	// hover glow swells while the spotlight is on
	const glowSize = $derived(300 + 140 * dim + 26 * Math.sin(t * 9));
	const ballScale = $derived.by(() => {
		if (t < T_ENTER) return 0.88 + 0.12 * easeOutCubic(t / T_ENTER);
		if (t < T_HOVER_END) {
			const p = (t - T_ENTER) / (T_HOVER_END - T_ENTER);
			return 1 + 0.14 * Math.sin(p * Math.PI) + 0.05 * Math.sin(t * 12);
		}
		return 1.05;
	});
	// speed stretch on the dash out
	const stretch = $derived(t > T_HOVER_END && t < T_EXIT_END ? 1.22 : 1);
	const ballAlpha = $derived(t > T_EXIT_END ? Math.max(0, 1 - (t - T_EXIT_END) / 0.15) : 1);
	const moving = $derived(t < T_ENTER + 0.1 || t > T_HOVER_END);
</script>

{#if show}
	<MainContainer>
		<!-- star-dust trail lagging the ball -->
		{#each TRAIL_JITTER as jitter, index (index)}
			{@const past = history[(index + 1) * 3]}
			{#if past}
				{@const trailAlpha = (1 - index / TRAIL_COUNT) * (moving ? 0.55 : 0.18) * ballAlpha}
				<Sprite
					key={index % 3 === 2 ? 'fxStar' : 'fxGlow'}
					anchor={0.5}
					x={past.x + jitter.x * (index / TRAIL_COUNT)}
					y={past.y + jitter.y * (index / TRAIL_COUNT)}
					tint={jitter.tint}
					blendMode="add"
					width={40 - index * 2.4}
					height={40 - index * 2.4}
					alpha={trailAlpha}
				/>
			{/if}
		{/each}

		<Container x={ball.x} y={ball.y} alpha={ballAlpha}>
			<!-- soft spotlight glow behind the ball, swelling during the hover -->
			<Sprite
				key="fxGlow"
				anchor={0.5}
				tint={0xffe993}
				blendMode="add"
				width={glowSize}
				height={glowSize * 0.8}
				alpha={0.5 + 0.3 * dim}
			/>
			<Container scale={{ x: ballScale * stretch, y: ballScale * (2 - stretch) }} rotation={t * 1.6}>
				<SpineProvider key="wpSpH1" width={250}>
					<SpineTrack trackIndex={0} animationName="win" loop />
				</SpineProvider>
			</Container>
		</Container>

		<!-- blast-off burst as it leaves the spotlight -->
		{#if t >= T_HOVER_END}
			<FxBurst
				x={context.stateGameDerived.boardLayout().x}
				y={context.stateGameDerived.boardLayout().y - 55}
				scale={1.1}
			/>
		{/if}
	</MainContainer>
{/if}

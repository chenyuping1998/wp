<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { NUMBER_FONT } from '../game/fonts';
	import { Container } from 'pixi-svelte';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import InkNumber from './InkNumber.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	// The count slams onto the plan poster like a rubber stamp once the sign has
	// dropped (FreeSpinAnimation's drop is 700ms), and the title rides in ahead
	// of it. One rAF clock from the moment the intro shows.
	const TITLE_AT = 350;
	const STAMP_AT = 750;
	let t = $state(0);
	let raf = 0;
	const startClock = () => {
		cancelAnimationFrame(raf);
		const start = performance.now();
		const tick = (now: number) => {
			t = now - start;
			if (t < STAMP_AT + 1200) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	};
	$effect(() => () => cancelAnimationFrame(raf));
	const titlePose = $derived.by(() => {
		const k = Math.min(1, Math.max(0, (t - TITLE_AT) / 300));
		return { alpha: k, y: (1 - k) * -40 };
	});
	const stampScale = $derived.by(() => {
		const k = (t - STAMP_AT) / 380;
		if (k <= 0) return 0;
		if (k >= 1) return 1;
		return k < 0.45 ? 2.6 - 1.75 * (k / 0.45) : 0.85 + 0.15 * Math.sin(((k - 0.45) / 0.55) * Math.PI * 0.5);
	});
	const subtitlePose = $derived.by(() => {
		const k = Math.min(1, Math.max(0, (t - STAMP_AT - 270) / 260));
		return { alpha: k, y: (1 - k) * 18 };
	});
	let stamped = false;
	$effect(() => {
		if (stampScale > 0 && stampScale <= 1 && !stamped && t > STAMP_AT + 150) {
			stamped = true;
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.6 });
			context.eventEmitter.broadcast({ type: 'soundStamp' });
		}
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			show = true;
			stamped = false;
			startClock();
		},
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation>
		{#snippet children({ sizes })}
			<!-- The title is lettered straight onto the board's paper. It used to sit on
			     its own banner plate as wide as the board, which read as a second
			     board laid across the first (2026-10-10). -->
			{@const ts = Math.min((sizes.width * 0.82) / 854, (sizes.height * 0.22) / 117)}
			<Container y={-sizes.height * 0.35 + 0.5 * ts + titlePose.y} alpha={titlePose.alpha}>
				<Text text={title} anchor={.5}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
						fontSize: Math.min(sizes.width * 0.088, sizes.height * 0.15),
						fill: 0x241d1c, stroke: { color: 0xf8e8c6, width: 3 }, letterSpacing: 2 }} />
			</Container>
			{#if stampScale > 0}
				<Container y={sizes.height * 0.025} scale={stampScale} rotation={-0.06}>
					<InkNumber text={freeSpinsFromEvent} fontSize={Math.min(sizes.width * 0.22, sizes.height * 0.42)} role="fs"/>
				</Container>
			{/if}
			<Text
				anchor={0.5}
				y={sizes.height * 0.375 + subtitlePose.y}
				alpha={subtitlePose.alpha}
				text={subtitle}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.05, sizes.height * 0.14, (sizes.width * 1.1) / subtitle.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 4,
					fill: 0x161412,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>

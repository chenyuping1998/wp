<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container } from 'pixi-svelte';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { letterNudge } from '../game/letterCentre';
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
			{@const countSize = Math.min(sizes.width * 0.2, sizes.height * 0.4)}
			{@const countNudge = letterNudge(`${freeSpinsFromEvent}`, countSize)}
			<!-- Lettered like the logo: red, inked, on the marquee's paper. -->
			<Container y={-sizes.height * 0.35 + titlePose.y} alpha={titlePose.alpha}>
				<Text text={title} anchor={.5}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
						fontSize: Math.min(sizes.width * 0.088, sizes.height * 0.15),
						fill: 0xe8502e, stroke: { color: 0x14262e, width: 9, join: 'round' }, letterSpacing: 2 }} />
			</Container>
			<!-- The count, square on (it was tilted) and lettered like the title: the
			     sign-painter face in red with an ink keyline and a hard ink shadow set
			     down-right, the print misregistration every card in the game has.
			     Always mounted (scale 0 until the stamp) so it stays in this order. -->
			<Container y={sizes.height * 0.03} scale={stampScale} visible={stampScale > 0}>
				<Text text={`${freeSpinsFromEvent}`} anchor={.5} x={countSize * 0.05} y={countSize * 0.05 + countNudge}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT, fontSize: countSize,
						fill: 0x14262e, stroke: { color: 0x14262e, width: countSize * 0.09, join: 'round' }, letterSpacing: countSize * 0.04 }} />
				<Text text={`${freeSpinsFromEvent}`} anchor={.5} y={countNudge}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT, fontSize: countSize,
						fill: 0xe8502e, stroke: { color: 0x14262e, width: countSize * 0.09, join: 'round' }, letterSpacing: countSize * 0.04 }} />
			</Container>
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
					fill: 0x14262e,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>

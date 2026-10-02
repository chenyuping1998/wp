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
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
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
			<Container y={-sizes.height * 0.26 + titlePose.y} alpha={titlePose.alpha}>
				<Text
					anchor={0.5}
					text={title}
					style={{
						fontFamily: GAME_FONT,
						fontSize: Math.min(sizes.width * 0.13, (sizes.width * 1.5) / title.length),
						fontWeight: GAME_FONT_WEIGHT,
						letterSpacing: 6,
						fill: 0x1f5c4a,
					}}
				/>
			</Container>
			{#if stampScale > 0}
				<Container y={sizes.height * 0.02} scale={stampScale} rotation={-0.06}>
					<Text
						anchor={0.5}
						x={6}
						y={6}
						text={`${freeSpinsFromEvent}`}
						style={{ fontFamily: NUMBER_FONT, fontSize: sizes.width * 0.22, fontWeight: '400', fill: 0x1e1b1a }}
					/>
					<Text
						anchor={0.5}
						text={`${freeSpinsFromEvent}`}
						style={{ fontFamily: NUMBER_FONT, fontSize: sizes.width * 0.22, fontWeight: '400', fill: 0xd24a2c }}
					/>
				</Container>
			{/if}
			<Text
				anchor={0.5}
				y={sizes.height * 0.32}
				text={subtitle}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.05, (sizes.width * 1.1) / subtitle.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 4,
					fill: 0x1e1b1a,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>

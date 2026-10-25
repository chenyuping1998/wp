<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { SLAM_HIT, stampSlam, titleIn } from '../game/fgMotion';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container } from 'pixi-svelte';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Text } from 'pixi-svelte';

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
	// 2026-10-23 (spine-generator): the title eases in, and the count slams
	// like the kit's text-slam — fgMotion.ts
	const titlePose = $derived.by(() => {
		const k = Math.min(1, Math.max(0, (t - TITLE_AT) / 300));
		return { alpha: k, y: (1 - titleIn(k)) * -40 };
	});
	const slam = $derived(stampSlam(t - STAMP_AT));
	const stampScale = $derived(slam.scale);
	const subtitlePose = $derived.by(() => {
		const k = Math.min(1, Math.max(0, (t - STAMP_AT - 270) / 260));
		return { alpha: k, y: (1 - k) * 18 };
	});
	let stamped = false;
	$effect(() => {
		if (!stamped && t >= STAMP_AT + SLAM_HIT) {
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
			<!-- Lettered like the logo: red, inked, on the board's paper. -->
			<Container y={-sizes.height * 0.35 + titlePose.y} alpha={titlePose.alpha}>
				<Text text={title} anchor={.5}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
						fontSize: Math.min(sizes.width * 0.088, sizes.height * 0.15),
						fill: 0xe8433a, stroke: { color: 0x141a33, width: 9, join: 'round' }, letterSpacing: 2 }} />
			</Container>
			<!-- the count lands square (user, 2026-10-23: no tilt); only the
			     slam's own turn settles out -->
			{#if stampScale > 0}
				<Container y={sizes.height * 0.025} scale={stampScale} rotation={slam.rot}>
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
					fill: 0x141a33,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>

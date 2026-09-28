<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { verticalFill } from '../game/gradientFill';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import PressToContinue from './PressToContinue.svelte';
	import HopTitle from './HopTitle.svelte';
	import { Container } from 'pixi-svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	// THE SIGN LANDS, THEN THE TITLE HOPS, THEN THE COUNT SLAMS DOWN.
	// FreeSpinAnimation drops the sign over 700ms; the title's wave starts as
	// it settles, and the count arrives after the wave has crossed the title —
	// dropped in oversized, squashed on impact, with the scene knocked and the
	// crate-lock thud under it. On a timer, so a hidden tab cannot strand it.
	const SIGN_LANDS_MS = 620;
	const SLAM_AT_MS = 1050;
	let slam = $state({ scale: 1, alpha: 1 });
	let slamTimer: ReturnType<typeof setInterval> | undefined;
	const startSlam = () => {
		clearInterval(slamTimer);
		const t0 = Date.now();
		let hit = false;
		slam = { scale: 2.4, alpha: 0 };
		slamTimer = setInterval(() => {
			const t = Date.now() - t0 - SLAM_AT_MS;
			if (t < 0) {
				slam = { scale: 2.4, alpha: 0 };
				return;
			}
			if (t < 170) {
				const p = t / 170;
				slam = { scale: 2.4 - 1.5 * p * p, alpha: Math.min(1, p * 2) };
				return;
			}
			if (!hit) {
				hit = true;
				context.eventEmitter.broadcast({ type: 'soundCargoLock' });
				context.eventEmitter.broadcast({ type: 'cameraShake', strength: 0.4, ms: 380 });
			}
			const q = (t - 170) / 520;
			if (q >= 1) {
				slam = { scale: 1, alpha: 1 };
				clearInterval(slamTimer);
				return;
			}
			// squashed on impact, springs back past 1, settles
			slam = { scale: 1 - 0.1 * Math.exp(-q * 5) * Math.cos(q * Math.PI * 2.6), alpha: 1 };
		}, 16);
	};
	$effect(() => () => clearInterval(slamTimer));

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			show = true;
			startSlam();
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
			<!-- the title's letters hop in a wave once the sign has landed -->
			<HopTitle
				y={-sizes.height * 0.26}
				text={title}
				delay={SIGN_LANDS_MS}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.13, (sizes.width * 1.5) / title.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 6,
					fill: verticalFill([0xfff3bd, 0xffd75e, 0xc9821a], Math.min(sizes.width * 0.13, (sizes.width * 1.5) / title.length)),
					stroke: { color: 0x54330a, width: 6 },
					dropShadow: { color: 0x000000, blur: 10, distance: 3, alpha: 1, angle: Math.PI / 6 },
				}}
			/>
			<!-- the count lands like a crate set down: in from above, oversized, then
			     a hard squash and settle (slam below) -->
			<Container y={sizes.height * 0.08} scale={slam.scale} alpha={slam.alpha}>
				<GoldText text={freeSpinsFromEvent} fontSize={sizes.width * 0.24} />
			</Container>
			<Text
				anchor={0.5}
				y={sizes.height * 0.32}
				text={subtitle}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.05, (sizes.width * 1.1) / subtitle.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 4,
					fill: 0xf5e3c3,
					stroke: 0x2c1c08,
					strokeThickness: 3,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>

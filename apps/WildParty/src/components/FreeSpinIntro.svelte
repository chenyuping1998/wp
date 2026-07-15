<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { neonNumberStyle } from '../game/textStyles';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import FxBurst from './FxBurst.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	// slam-down entrance + idle sway/pulse for the number
	const SLAM_S = 0.3;
	let animT = $state(-1);
	let burstShown = $state(false);
	let numberRaf = 0;
	let impactFired = false;

	const startNumberAnim = () => {
		cancelAnimationFrame(numberRaf);
		impactFired = false;
		const start = performance.now();
		const tick = (now: number) => {
			animT = (now - start) / 1000;
			if (!impactFired && animT >= SLAM_S) {
				impactFired = true;
				burstShown = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			}
			numberRaf = requestAnimationFrame(tick);
		};
		numberRaf = requestAnimationFrame(tick);
	};
	const stopNumberAnim = () => {
		cancelAnimationFrame(numberRaf);
		animT = -1;
	};
	onDestroy(stopNumberAnim);

	const numberPose = $derived.by(() => {
		if (animT < 0) return { scale: 1, rotation: 0, glow: 0.5 };
		if (animT < SLAM_S) {
			// accelerating drop from 3x — the slam
			const p = animT / SLAM_S;
			return { scale: 3 - 2 * p * p, rotation: 0, glow: 0.2 };
		}
		const t = animT - SLAM_S;
		// impact squash settle, then gentle everlasting sway + glow pulse
		const settle = t < 0.35 ? 1 - 0.14 * Math.sin((t / 0.35) * Math.PI) : 1;
		return {
			scale: settle * (1 + 0.03 * Math.sin(t * 2.1)),
			rotation: 0.05 * Math.sin(t * 1.7),
			glow: 0.5 + 0.22 * Math.sin(t * 2.6),
		};
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => {
			show = false;
			stopNumberAnim();
		},
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			startNumberAnim();
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation>
		{#snippet children({ sizes })}
			<!-- headline: same type treatment as the WILD PARTY title -->
			<Text
				anchor={0.5}
				y={-300}
				text={context.i18nDerived.congratulations()}
				style={{
					fontFamily: 'proxima-nova, Arial, sans-serif',
					fontSize: 96,
					fontWeight: '900',
					fill: 0xfff4cf,
					letterSpacing: 8,
					dropShadow: true,
					dropShadowColor: 0xff9edf,
					dropShadowBlur: 18,
					dropShadowDistance: 0,
					stroke: 0xffffff,
					strokeThickness: 1,
				}}
			/>
			<Text
				anchor={0.5}
				y={-165}
				text={context.i18nDerived.youWon()}
				style={{
					fontFamily: 'proxima-nova, Arial, sans-serif',
					fontSize: 58,
					fontWeight: '900',
					fill: 0xfff4cf,
					letterSpacing: 6,
					dropShadow: true,
					dropShadowColor: 0xff9edf,
					dropShadowBlur: 14,
					dropShadowDistance: 0,
				}}
			/>

			<!-- the number stands alone (old number_ring spine plaque removed) -->
			<Container y={60} scale={numberPose.scale} rotation={numberPose.rotation}>
				<Sprite
					key="fxGlow"
					anchor={0.5}
					tint={0xff8ede}
					blendMode="add"
					width={sizes.width * 0.5}
					height={sizes.width * 0.5}
					alpha={numberPose.glow}
				/>
				<Text
					anchor={0.5}
					text={`${freeSpinsFromEvent}`}
					style={neonNumberStyle(sizes.width * 0.18)}
				/>
			</Container>
			{#if burstShown}
				<FxBurst y={60} scale={1.3} oncomplete={() => (burstShown = false)} />
			{/if}

			<Text
				anchor={0.5}
				y={320}
				text={context.i18nDerived.freeSpins()}
				style={{
					fontFamily: 'proxima-nova, Arial, sans-serif',
					fontSize: 58,
					fontWeight: '900',
					fill: 0xfff4cf,
					letterSpacing: 6,
					dropShadow: true,
					dropShadowColor: 0xff9edf,
					dropShadowBlur: 14,
					dropShadowDistance: 0,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<!-- betweenBoardAndBottom: the plain bottom position sat too low on the
	     FG intro screen -->
	<PressToContinue position="betweenBoardAndBottom" onpress={() => oncomplete()} />
</FadeContainer>

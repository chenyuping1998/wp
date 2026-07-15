<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { BitmapText, SpineProvider, SpineSlot, SpineTrack, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	type AnimationName = 'intro' | 'idle';

	const context = getContext();

	let show = $state(false);
	let animationName = $state<AnimationName>('intro');
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
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

			<SpineProvider key="fsIntroNumber" width={sizes.width * 0.3}>
				<SpineTrack
					trackIndex={0}
					{animationName}
					loop={animationName === 'idle'}
					listener={{
						complete: () => (animationName = 'idle'),
					}}
				/>
				<SpineSlot slotName="slot_number">
					<!-- fontSize is compounded by bone_number's own 2x scale (see
					     fs_number_party.json), so this ends up ~2x on screen — sized
					     to sit inside the number_ring plaque's inner box, not spill past it -->
					<BitmapText
						anchor={{ x: 0.5, y: 0.5 }}
						text={freeSpinsFromEvent}
						style={{
							fontFamily: 'gold',
							fontSize: sizes.width * 0.05,
							fontWeight: 'bold',
						}}
					/>
				</SpineSlot>
			</SpineProvider>

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

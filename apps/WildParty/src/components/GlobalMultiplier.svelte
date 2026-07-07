<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| { type: 'globalMultiplierUpdate'; multiplier: number };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';

	import {
		BitmapText,
		Container,
		Sprite,
		SpineEventEmitterProvider,
		SpineProvider,
		SpineSlot,
		SpineTrack,
	} from 'pixi-svelte';
	import { FadeContainer, ResponsiveBitmapText } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	type AnimationName = 'static' | 'win' | 'reset' | 'increment';

	const PANEL_WIDTH = SYMBOL_SIZE * 0.641;
	const context = getContext();
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 1.28 : 1);
	const desktopPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 1.3,
		y: -SYMBOL_SIZE * 0.47,
	});
	const portraitPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 1.5,
		y: -SYMBOL_SIZE * 0.55,
	});
	const position = $derived(
		context.stateLayoutDerived.isStacked() ? portraitPosition : desktopPosition,
	);

	let show = $state(false);
	let animationName = $state<AnimationName>('static');
	let multiplier = $state(1);
	let previousMultiplier = new Tween(1);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),
		globalMultiplierHide: () => (show = false),
		globalMultiplierUpdate: async (emitterEvent) => {
			if (emitterEvent.multiplier === 1 && multiplier !== 1) {
				animationName = 'reset';
				await waitForTimeout(300);
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_reset' });
				previousMultiplier.set(emitterEvent.multiplier);
			}

			if (emitterEvent.multiplier > multiplier) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
				animationName = 'increment';
			}

			if (animationName !== 'static') {
				multiplier = emitterEvent.multiplier;
				await waitForResolve((resolve) => (oncomplete = resolve));
				animationName = 'static';
				previousMultiplier.set(multiplier, { duration: 0 });
			}
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position} {scale}>
			<!-- "MULTIPLIER" header-cap: Frame_Multiplier's own atlas region has no
			     spare vertical space to grow into (packed edge-to-edge, see
			     design/generate_frames_party.mjs), so this is a separate plaque
			     mostly overlapped BEHIND the frame — only its top ~55% peeks out
			     above the frame's top edge, reading as one continuous panel.
			     SpineProvider has no anchor set, so the frame's own origin (0,0)
			     is its top-left corner. Overlap fraction is an estimate — check
			     on-engine and nudge PANEL_WIDTH multipliers below if it's off. -->
			<Sprite
				key="multiplierLabel"
				anchor={0.5}
				x={PANEL_WIDTH * 0.5}
				y={-PANEL_WIDTH * 0.02}
				width={PANEL_WIDTH}
				height={PANEL_WIDTH * 0.4265}
			/>
			<ResponsiveBitmapText
				anchor={0.5}
				x={PANEL_WIDTH * 0.5}
				y={-PANEL_WIDTH * 0.11}
				maxWidth={PANEL_WIDTH * 0.85}
				text="MULTIPLIER"
				style={{
					fontFamily: 'gold',
					fontSize: SYMBOL_SIZE * 0.4,
					align: 'center',
					fontWeight: 'bold',
					letterSpacing: 0,
				}}
			/>
			<SpineProvider key="globalMultiplier" width={PANEL_WIDTH}>
				<SpineTrack
					trackIndex={0}
					{animationName}
					timeScale={stateBetDerived.timeScale()}
					listener={{
						complete: () => {
							oncomplete();
						},
					}}
				/>
				<SpineEventEmitterProvider>
					<SpineSlot slotName="slot_multi">
						<BitmapText
							anchor={0.5}
							text={`${Math.round(previousMultiplier.current)}×`}
							style={{
								fontFamily: 'gold',
								fontSize: SYMBOL_SIZE * 4.3,
							}}
						/>
					</SpineSlot>
					<SpineSlot slotName="slot_multi_next">
						<BitmapText
							anchor={0.5}
							text={`${multiplier}×`}
							style={{
								fontFamily: 'gold',
								fontSize: SYMBOL_SIZE * 4.3,
							}}
						/>
					</SpineSlot>
				</SpineEventEmitterProvider>
			</SpineProvider>
		</Container>
	</BoardContainer>
</FadeContainer>

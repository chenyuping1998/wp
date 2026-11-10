<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { GAME_FONT, TITLE_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { keyframes } from '../game/keyframes';
	import { gameText } from '../game/i18nText';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	// 天使奧丁 starts its free game on its own after ~2.5 loops of the panel
	// (research/xinstar-angelodin §5.1); a press still skips the wait.
	// reference §5.1: the plaque comes in (1.52 s), loops ~2.5 times and starts on its own
	const AUTO_CONTINUE_MS = 4300;
	// title: stamped in, 1 → 1.9 at 0.18 s → 0.93 → 1.025 → rests at 0.72 s;
	// the count pops in after it, 1.3 → 0.8 → 1 (FG_Board_Start In)
	const TITLE_SCALE = [[0, 1], [180, 1.9], [400, 0.93], [520, 1.025], [720, 1]] as const;
	const TITLE_ALPHA = [[0, 0], [120, 1]] as const;
	const COUNT_SCALE = [[0, 0], [380, 0], [560, 1.3], [700, 0.8], [850, 1]] as const;
	const CAPTION_ALPHA = [[0, 0], [500, 0], [650, 1]] as const;
	const CAPTION_SCALE = [[0, 0.9], [500, 0.9], [650, 1.02], [950, 1]] as const;

	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			await waitForResolve((resolve) => {
				const timer = setTimeout(resolve, AUTO_CONTINUE_MS);
				oncomplete = () => {
					clearTimeout(timer);
					resolve();
				};
			});
		},
	});
</script>

<FadeContainer {show} duration={show ? undefined : 0}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.55} />

	<FreeSpinAnimation>
		{#snippet children({ sizes, ms })}
			<Text
				anchor={0.5}
				y={-sizes.height * 0.34}
				scale={keyframes(ms, TITLE_SCALE)}
				alpha={keyframes(ms, TITLE_ALPHA)}
				text={title}
				style={{
					fontFamily: TITLE_FONT,
					fontSize: Math.min(sizes.height * 0.21,sizes.width * 0.11, (sizes.width * 1.5) / title.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 6,
					fill: 0xf2b632,
					stroke: { color: 0x2a1f24, width: 6 },
					dropShadow: { color: 0x000000, blur: 10, distance: 3, angle: Math.PI / 2, alpha: 1 },
				}}
			/>
			<!--
				The count is sized off the interior's HEIGHT, not its width. The supplied
				plaque is wide and shallow, so a width-derived size put a 112px numeral in
				a 232px box that also has to hold a title above and a caption below — the
				numeral's descender box ran straight through AWARDED.
			-->
			<Container y={sizes.height * 0.02} scale={keyframes(ms, COUNT_SCALE)}>
				<GoldText
					text={freeSpinsFromEvent}
					fontSize={Math.min(sizes.width * 0.2, sizes.height * 0.29)}
				/>
			</Container>
			<Text
				anchor={0.5}
				y={sizes.height * 0.36}
				alpha={keyframes(ms, CAPTION_ALPHA)}
				scale={keyframes(ms, CAPTION_SCALE)}
				text={subtitle}
				style={{
					fontFamily: TITLE_FONT,
					fontSize: Math.min(sizes.width * 0.045, (sizes.width * 1.1) / subtitle.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 4,
					// deep jade on the cream plaque
					fill: 0x1d4a44,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>

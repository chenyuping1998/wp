<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// marble tablet left of the board (fs_counter_panel.png, 512×320)
	const PANEL_RATIO = 512 / 320;
	const panelWidth = $derived(SYMBOL_SIZE * 2.1);
	const panelSizes = $derived({ width: panelWidth, height: panelWidth / PANEL_RATIO });
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived(
		isPortrait
			? {
					// portrait: centered above the board (no room at the side)
					x: context.stateGameDerived.boardLayout().x - panelSizes.width * 0.5,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 -
						panelSizes.height * 1.28 -
						SYMBOL_SIZE * 0.3,
				}
			: {
					x:
						context.stateGameDerived.boardLayout().x -
						context.stateGameDerived.boardLayout().width * 0.5 -
						panelSizes.width -
						SYMBOL_SIZE * 0.6,
					y: context.stateLayoutDerived.mainLayout().height * 0.05,
				},
	);

	let show = $state(false);
	// `current` = the spin being played, 1-based, straight from the math's
	// updateFreeSpin.amount; `total` = window size
	let current = $state(1);
	let total = $state(0);

	const title = $derived(gameText('freeSpins'));

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});

</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<Sprite key="mgFsPanel" {...panelSizes} />

		<!-- title on the upper band, auto-shrunk for long locales -->
		<Text
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.33}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				// dark ink on the marble tablet; a single colour, because a fill array
				// renders as plain white in pixi v8
				fill: 0x2a1f24,
				wordWrap: false,
			}}
		/>

		<!-- free game: current spin of total -->
		<GoldText
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.58}
			text={`${Math.min(current, total)} / ${total}`}
			fontSize={panelSizes.width * 0.19}
			maxWidth={panelSizes.width * 0.72}
		/>
	</FadeContainer>
</MainContainer>

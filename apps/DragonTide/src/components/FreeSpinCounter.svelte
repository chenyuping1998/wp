<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { GAME_FONT, TITLE_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';
	import geometry from '../game/artGeometry.json';

	const context = getContext();

	// Jade-and-cream plaque left of the board (fs_counter.png, 512×320): the title on the
	// jade band, the count on the cream band (bands measured by build_final_art.py)
	const PANEL_RATIO = 512 / 320;
	const BANDS = geometry.fsCounter;
	const panelWidth = $derived(SYMBOL_SIZE * 2.1);
	const panelSizes = $derived({ width: panelWidth, height: panelWidth / PANEL_RATIO });
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived(
		isPortrait
			? {
					// Portrait: above the left edge, clear of the assistant and her watch.
					x: context.stateGameDerived.boardLayout().x - context.stateGameDerived.boardLayout().width * 0.5 + SYMBOL_SIZE * 0.05,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 -
						panelSizes.height * 1.28 -
						SYMBOL_SIZE * 3.3,
				}
			: {
					x:
						context.stateGameDerived.boardLayout().x -
						context.stateGameDerived.boardLayout().width * 0.5 -
						panelSizes.width -
						SYMBOL_SIZE * 0.6,
					// Near the top, clear of the clock-and-name line the popout sizes print large;
					// the running-total plate
					// sits below it on the same side (MedusaThrow.svelte).
					y: context.stateLayoutDerived.mainLayout().height * 0.085,
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
			y={panelSizes.height * BANDS.title.y}
			text={title}
			style={{
				fontFamily: TITLE_FONT,
				// Rye runs ~7% wider than the old rounded face: keep the title off the rim
				fontSize: Math.min(panelSizes.width * 0.1, (panelSizes.width * BANDS.title.w * 1.15) / Math.max(1, title.length)),
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 1,
				// cream lettering on the jade band, inked so it holds on every screen; one colour,
				// because a fill array renders as plain white in pixi v8
				fill: 0xfff2d6,
				stroke: { color: 0x16302d, width: 3 },
				wordWrap: false,
			}}
		/>

		<!-- free game: current spin of total -->
		<GoldText
			x={panelSizes.width * 0.5}
			y={panelSizes.height * BANDS.count.y}
			text={`${Math.min(current, total)} / ${total}`}
			fontSize={Math.min(panelSizes.width * 0.19, panelSizes.height * BANDS.count.h * 0.8)}
			maxWidth={panelSizes.width * BANDS.count.w * 0.8}
		/>
	</FadeContainer>
</MainContainer>

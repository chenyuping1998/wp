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

	const context = getContext();

	// Circus timber plaque left of the board (fs_counter_panel.png, 512×320)
	const PANEL_RATIO = 512 / 320;
	const panelWidth = $derived(SYMBOL_SIZE * 2.1);
	const panelSizes = $derived({ width: panelWidth, height: panelWidth / PANEL_RATIO });
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const base = context.stateGameDerived.boardLayoutBase();
		// Portrait: above the left edge, clear of the assistant and her watch.
		// The stage layout grows the board downward from a fixed top beam and
		// leaves the cast above it where it was (stageLayout.ts), so this keeps
		// the pre-bar placement.
		if (isPortrait)
			return {
				x: base.x - base.width * 0.5 + SYMBOL_SIZE * 0.05,
				y: base.y - base.height * 0.5 - panelSizes.height * 1.28 - SYMBOL_SIZE * 3.3,
			};
		// Left of the board, as far from the frame's outer edge as before the
		// stage layout grew the board (the frame edge moves out by its growth).
		return {
			x:
				board.x -
				board.width * 0.5 -
				panelSizes.width -
				SYMBOL_SIZE * 0.6 -
				(board.width * 0.5 + 32) * (board.scale - base.scale),
			// Pinned near the top of the screen; Medusa's running-total plate
			// sits below it on the same side (MedusaThrow.svelte).
			y: context.stateLayoutDerived.mainLayout().height * 0.05,
		};
	});

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
				fontFamily: TITLE_FONT,
				// Rye runs ~7% wider than the old rounded face: keep the title off the rim
				fontSize: Math.min(panelSizes.width * 0.105, (panelSizes.width * 1.22) / Math.max(1, title.length)),
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				// Ivory lettering on the dark timber; a single colour, because a fill array
				// renders as plain white in pixi v8
				fill: 0xffedc2,
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

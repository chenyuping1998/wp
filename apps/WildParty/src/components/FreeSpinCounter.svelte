<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { anchorToPivot, Container, Sprite, Text, type Sizes } from 'pixi-svelte';
	import { GAME_FONT } from '../game/fonts';

	const context = getContext();
	// Standalone sprite now, not a rect in the reelsFrame atlas — that rect sat
	// beyond the right edge of the new frame art and drew nothing, which would
	// have left the counter invisible for the whole free-spin round.
	const PANEL_KEY_DESKTOP = 'frameFsCounter';
	const PANEL_RATIO_DESKTOP = 824 / 622;
	const panelKey = PANEL_KEY_DESKTOP;
	// 1.55 cells, not 2. The left gutter is only as wide as the gap between the
	// canvas edge and the reel housing — with the housing drawing at
	// boardWidth * 1.24 that is 265px, and a 288px plaque could not fit there at
	// all, which is half of why it ended up on top of the Buy Bonus.
	const panelWidth = $derived(SYMBOL_SIZE * 1.55);
	const panelSizes = $derived({
		width: panelWidth,
		height: panelWidth / PANEL_RATIO_DESKTOP,
	});
	const scale = 1;
	// Placement has to clear two things, and the old version cleared neither.
	//
	// Horizontally it sat against the BOARD's left edge, but the reel housing
	// extends well past that — it draws at boardWidth * 1.24 (BoardFrame.svelte's
	// SPRITE_SCALE.width), so the panel was tucked under the chrome. It now sits
	// outside the housing, not outside the board.
	//
	// Vertically it was pinned to the board's top edge, which puts it straight
	// through the Buy Bonus CTA: that button is centred in the left gutter at
	// 0.46 of the layout height, and the gutter is the only place either of them
	// can go. Pinning near the top of the screen instead gives them separate
	// bands. The sibling Hot Miami hit exactly this and fixed it the same way.
	const HOUSING_WIDTH_RATIO = 1.24; // keep equal to BoardFrame.svelte SPRITE_SCALE.width
	const position = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const housingLeft = board.x - (board.width * HOUSING_WIDTH_RATIO) / 2;
		const MARGIN = SYMBOL_SIZE * 0.2;
		const GAP = SYMBOL_SIZE * 0.1;
		return {
			x: Math.max(MARGIN, housingLeft - panelSizes.width - GAP),
			y: context.stateLayoutDerived.mainLayout().height * 0.05,
		};
	});

	const fontSize = SYMBOL_SIZE * 0.22;

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);
	let titleSizes: Sizes = $state({ width: 0, height: 0 });
	let counterSizes: Sizes = $state({ width: 0, height: 0 });

	const textContainerSizes = $derived({
		width: titleSizes.width,
		height: titleSizes.height + counterSizes.height,
	});
	const counterPosition = $derived({ x: titleSizes.width / 2, y: titleSizes.height });

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
	<FadeContainer {show} {...position} {scale}>
		<Sprite key={panelKey} {...panelSizes} />
		<Container
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.48}
			pivot={anchorToPivot({
				sizes: textContainerSizes,
				anchor: { x: 0.5, y: 0.5 },
			})}
		>
			<!-- same type treatment as the WILD PARTY title -->
			<Text
				text={'FREE SPIN'}
				style={{
					fontFamily: GAME_FONT,
					fontSize,
					fontWeight: '900',
					fill: 0xfff4cf,
					letterSpacing: 2,
					dropShadow: true,
					dropShadowColor: 0xff9edf,
					dropShadowBlur: 8,
					dropShadowDistance: 0,
				}}
				onresize={(sizes) => (titleSizes = sizes)}
			/>
			<Text
				text={`${current} OF ${total}`}
				{...counterPosition}
				anchor={{ x: 0.5, y: 0 }}
				style={{
					fontFamily: GAME_FONT,
					fontSize,
					fontWeight: '900',
					fill: 0xfff4cf,
					letterSpacing: 2,
					dropShadow: true,
					dropShadowColor: 0xff9edf,
					dropShadowBlur: 8,
					dropShadowDistance: 0,
				}}
				onresize={(sizes) => (counterSizes = sizes)}
			/>
		</Container>
	</FadeContainer>
</MainContainer>

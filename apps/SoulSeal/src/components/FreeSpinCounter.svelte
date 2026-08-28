<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { displayFontFor, displayWeightFor } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		FS_COUNTER_PANEL,
		FS_COUNTER_WELL_WIDTH,
		FS_COUNTER_MIN_WELL_WIDTH,
	} from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');

	// The hanging plaque left of the board.
	//
	// Sized from its WELL, not from the image: FS_COUNTER_PANEL carries what
	// design/measure_banner_wells.mjs measured off the supplied art, and the sprite
	// is scaled so the well comes out at FS_COUNTER_WELL_WIDTH cells whatever the
	// picture around it looks like.
	//
	// The plaque this replaced was a generated brass rectangle whose panel filled
	// most of the image, so its text could be placed as fractions of the image and
	// land more or less right. The painted one has a tiled roof, two hanging bells
	// and a talisman slip pinned to its side; the same fractions put "FREE SPINS"
	// on the roof.
	//
	// ── why the width is a minimum of two things ──
	//
	// In landscape the plaque hangs in the gutter to the LEFT of the board, and
	// that gutter is not a fixed size: the tablet preset is square, so the board
	// takes nearly all of its width and leaves a strip. Asking for a fixed number
	// of cells there put the plaque half off the screen and half through the reels.
	//
	// It did so before this art arrived, for a subtler reason worth writing down:
	// boardLayout() returns `x` in screen units but `width` in BOARD units, and the
	// old placement subtracted the two directly - so it thought the board was
	// 520px wide on a preset where it is drawn at 648px, and hung the plaque inside
	// the reels. `boardSpan` below applies the scale, which is what makes the
	// gutter a real measurement rather than an optimistic one.
	const boardSpan = $derived(
		context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale,
	);
	const gutter = $derived(
		context.stateGameDerived.boardLayout().x - boardSpan * 0.5 - SYMBOL_SIZE * 0.35,
	);
	const wantPanel = $derived((SYMBOL_SIZE * FS_COUNTER_WELL_WIDTH) / FS_COUNTER_PANEL.well.w);
	const gutterPanel = $derived(Math.max(0, gutter - SYMBOL_SIZE * 0.3));
	// Shrink to fit the gutter, but only down to the point where the count is
	// still readable. Past that the gutter is refused and the corner is used.
	const fitsGutter = $derived(
		(gutterPanel * FS_COUNTER_PANEL.well.w) / SYMBOL_SIZE >= FS_COUNTER_MIN_WELL_WIDTH,
	);
	const panelWidth = $derived(
		isPortrait || !fitsGutter ? wantPanel : Math.min(wantPanel, gutterPanel),
	);
	const panelSizes = $derived({
		width: panelWidth,
		height: panelWidth * FS_COUNTER_PANEL.aspect,
	});
	// The well in drawn pixels, relative to the sprite's top-left - the sprite is
	// drawn from its corner here, not its centre.
	const well = $derived({
		cx: panelSizes.width * (0.5 + FS_COUNTER_PANEL.well.cx),
		cy: panelSizes.height * (0.5 + FS_COUNTER_PANEL.well.cy),
		w: panelSizes.width * FS_COUNTER_PANEL.well.w,
		h: panelSizes.height * FS_COUNTER_PANEL.well.h,
	});
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
			: !fitsGutter
				? {
						// No usable gutter - the square presets give the board almost the
						// whole width. Full size in the top-left corner instead, above the
						// board's shoulder, which is empty: the talisman rail sits just
						// above the board's top edge and this clears it.
						x: SYMBOL_SIZE * 0.15,
						y: SYMBOL_SIZE * 0.15,
					}
				: {
						// Right-aligned into the gutter, so the plaque sits against the
						// board's edge and any slack falls on the screen side.
						x: Math.max(SYMBOL_SIZE * 0.15, gutter - panelSizes.width),
						// Pinned near the top of the screen rather than to the board's top
						// edge. With the side-rail UI the Buy Bonus button is centred in
						// the left rail, and the board now fills 94% of the height — the
						// old board-relative position put this plaque straight through it.
						y: context.stateLayoutDerived.mainLayout().height * 0.05,
					},
	);

	let show = $state(false);
	// `current` = spins USED + 1 (set by the updateFreeSpin handler); `total` = window size
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
		<Sprite key="mcFsPanel" {...panelSizes} />

		<!--
			Both lines sit INSIDE the well and are sized from its height, so a plaque
			with more furniture around its panel does not shrink the type.
			The title still auto-shrinks for the long locales on top of that.
		-->
		<Text
			anchor={0.5}
			x={well.cx}
			y={well.cy - well.h * 0.26}
			text={title}
			style={{
				fontFamily: displayFontFor(title),
				fontSize: Math.min(well.h * 0.26, (well.w * 1.5) / Math.max(1, title.length)),
				fontWeight: displayWeightFor(title),
				letterSpacing: 1,
				fill: [0xfff3bd, 0xffd75e, 0xc9821a],
				stroke: { color: 0x54330a, width: 3 },
				wordWrap: false,
			}}
		/>

		<!-- free game: current spin of total -->
		<GoldText
			x={well.cx}
			y={well.cy + well.h * 0.18}
			text={`${Math.min(current, total)} / ${total}`}
			fontSize={well.h * 0.42}
			maxWidth={well.w * 0.9}
		/>
	</FadeContainer>
</MainContainer>

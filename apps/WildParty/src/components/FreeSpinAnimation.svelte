<script lang="ts">
	import type { Snippet } from 'svelte';

	import { anchorToPivot, Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
	};

	const props: Props = $props();

	const context = getContext();
	const BACKGROUND_RATIO = 920 / 720;
	const BACKGROUND_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x;
	const BACKGROUND_SIZES = {
		width: BACKGROUND_WIDTH,
		height: BACKGROUND_WIDTH / BACKGROUND_RATIO,
	};
	const PANEL_SIZES = {
		width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
		height: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	};

	// the old fsPanel spine's text slot carried a ~0.7 bone scale; keep it so
	// the intro/outro text layout is unchanged after swapping the spine for
	// the ornate sliced panel
	const CONTENT_SCALE = 0.7;
	// Ornate backdrop plate (fs_ornate_panel.png), sized to hug the YOU WON +
	// number block.
	//
	// The plate's chrome bezel occupies the top 10% of the source image, so the
	// usable interior starts a tenth of PANEL_H below its top edge — at the
	// previous 500/40 that put the inner edge at y=-160 while YOU WON spanned
	// -194..-136, i.e. the headline's upper half sat on the bezel. The plate is
	// grown upwards (bottom edge held, so FREE SPINS below is unaffected) rather
	// than the text pushed down, because pushing it down runs it into the number.
	const PANEL_W = 700;
	const PANEL_H = 548;
	const PANEL_Y = 17;
	// Interior top edge, in the local space the children lay out in, is
	// PANEL_Y - PANEL_H * 0.4 = -202. Text in FreeSpinIntro/FreeSpinOutro must
	// stay below it.
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y}
		pivot={anchorToPivot({ anchor: 0.5, sizes: BACKGROUND_SIZES })}
	>
		<Container
			x={PANEL_SIZES.width * 0.5}
			y={PANEL_SIZES.height * 0.4}
			scale={CONTENT_SCALE}
		>
			<Sprite key="fsOrnatePanel" anchor={0.5} y={PANEL_Y} width={PANEL_W} height={PANEL_H} />
			{@render props.children({ sizes: BACKGROUND_SIZES })}
		</Container>
	</Container>
</MainContainer>

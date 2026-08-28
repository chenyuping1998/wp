<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { FS_COUNTER_PANEL, FS_SIGN_FILL } from '../game/constants';

	// Feature header plate that drops in from the top and settles with a swing.
	// Children render at the plaque's text area center.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
	};

	const props: Props = $props();

	const context = getContext();

	// ── the same plaque the counter uses, drawn large ────────────────────────────
	//
	// This used to be `mcFsSign`, a plate the theme generator DREW: a brass
	// rectangle whose panel filled most of the image. Everything else around it is
	// now painted art, so the feature's own title card was the last drawing left in
	// the game and looked it - which is what "the sign hasn't been changed" meant.
	//
	// It is deliberately the counter's plaque rather than a sixth piece of supplied
	// art. The two are never on screen together (this card is dismissed before the
	// counter appears) and it is the same object seen twice - once held up, once
	// hanging in the corner - which is how the rest of the furniture in this game
	// works.
	//
	// The cost is real and worth stating: the counter's well is only 38.6% of its
	// image width, against the drawn plate's 84%, because most of the picture is
	// roof and bells. Matching the old text size would need a plaque 1528px across
	// on a 1422px desktop. So the plaque is fitted to the SCREEN instead and the
	// text comes out smaller than it was - which the old card could afford, since
	// it was setting "12" at seventy pixels.
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const signWidth = $derived(
		Math.min(layout.width * FS_SIGN_FILL, (layout.height * FS_SIGN_FILL) / FS_COUNTER_PANEL.aspect),
	);
	const SIGN_SIZES = $derived({
		width: signWidth,
		height: signWidth * FS_COUNTER_PANEL.aspect,
	});
	// The well, measured off the art by design/measure_banner_wells.mjs - not a
	// fraction of the image, which on this plaque lands on the roof.
	const TEXT_AREA = $derived({
		width: SIGN_SIZES.width * FS_COUNTER_PANEL.well.w,
		height: SIGN_SIZES.height * FS_COUNTER_PANEL.well.h,
	});

	const dropY = new Tween(-SIGN_SIZES.height * 1.2);
	const swing = new Tween(0);

	onMount(() => {
		dropY.set(0, { duration: 700, easing: backOut });
		(async () => {
			await swing.set(0.035, { duration: 380, easing: cubicOut, delay: 250 });
			await swing.set(-0.022, { duration: 420, easing: cubicOut });
			await swing.set(0.01, { duration: 420, easing: cubicOut });
			await swing.set(0, { duration: 380, easing: cubicOut });
		})();
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={swing.current}
	>
		<Sprite key="mcFsPanel" anchor={0.5} {...SIGN_SIZES} />
		<!-- the well's own offset, measured rather than nudged by eye -->
		<Container y={SIGN_SIZES.height * FS_COUNTER_PANEL.well.cy}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

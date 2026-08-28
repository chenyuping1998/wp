<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, NUM_REELS } from '../game/constants';

	// Feature header plate (mcFsSign) that drops in from the top
	// and settles with a swing. Children render at the sign's text area center.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
	};

	const props: Props = $props();

	const context = getContext();
	// Art is 1280x1002 with the panel at FS_PANEL in generate_theme.mjs. Both
	// numbers below are read off that, not guessed: the panel spans 94% of the
	// image width and 70% of its height, and the content box is that inset far
	// enough to clear the chamfer and the rivet line.
	const SIGN_RATIO = 1280 / 1002;
	const SIGN_WIDTH = SYMBOL_SIZE * NUM_REELS * 1.35;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// inner plank area (in sign source pixels 100..820 × 130..670) mapped to sprite space
	const TEXT_AREA = {
		width: SIGN_SIZES.width * 0.84,
		height: SIGN_SIZES.height * 0.58,
	};

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
		<Sprite key="mcFsSign" anchor={0.5} {...SIGN_SIZES} />
		<!-- the panel is symmetrical, so the text block only needs a hair of drop to
		     sit optically centred; 0.06 pushed AWARDED onto the lower rivet line -->
		<Container y={SIGN_SIZES.height * 0.02}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

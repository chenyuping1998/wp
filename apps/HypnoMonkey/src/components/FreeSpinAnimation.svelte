<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	// The plaque (mgFsSign) drops in from the top and settles with a
	// swing. Children render centred on its interior.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
	};

	const props: Props = $props();

	const context = getContext();
	// Inner marble measured on the installed transparent 1706x922 scroll.
	const SIGN_SOURCE = { width: 1706, height: 922 };
	const SIGN_RATIO = SIGN_SOURCE.width / SIGN_SOURCE.height;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 1.06;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	const TEXT_AREA = {
		width: SIGN_SIZES.width * 0.74,
		height: SIGN_SIZES.height * 0.52,
	};
	// how far the interior's centre sits below the sprite's centre
	const TEXT_OFFSET_Y = SIGN_SIZES.height * 0.035;

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
		<Sprite key="mgFsSign" anchor={0.5} {...SIGN_SIZES} />
		<!-- children sit centred on the measured interior -->
		<Container y={TEXT_OFFSET_Y}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

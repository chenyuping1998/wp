<script lang="ts" module>
	// How long the sign takes to drop in. Exported so FreeSpinIntro can hold its
	// number back until the sign is under it instead of guessing.
	export const SIGN_DROP_MS = 700;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { featureScaled } from '../game/timeScale';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	// Painted fairground sign (mooooFsSign, 920×720) that drops in from the top
	// and settles with a swing. Children render at the sign's text area center.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
	};

	const props: Props = $props();

	const context = getContext();
	const SIGN_RATIO = 920 / 720;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// inner plank area (in sign source pixels 100..820 × 130..670) mapped to sprite space
	const TEXT_AREA = {
		width: SIGN_SIZES.width * (720 / 920),
		height: SIGN_SIZES.height * (540 / 720),
	};

	const dropY = new Tween(-SIGN_SIZES.height * 1.2);
	const swing = new Tween(0);

	// Turbo-scaled like NeonFrames. FreeSpinIntro times its number slam to land as
	// this sign settles (SIGN_DROP_MS), so if the drop stopped scaling the two
	// would come apart in turbo — the number would hit an sign still in the air.
	const scaled = (ms: number) => featureScaled(ms);

	onMount(() => {
		dropY.set(0, { duration: scaled(SIGN_DROP_MS), easing: backOut });
		(async () => {
			await swing.set(0.035, { duration: scaled(380), easing: cubicOut, delay: scaled(250) });
			await swing.set(-0.022, { duration: scaled(420), easing: cubicOut });
			await swing.set(0.01, { duration: scaled(420), easing: cubicOut });
			await swing.set(0, { duration: scaled(380), easing: cubicOut });
		})();
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={swing.current}
	>
		<Sprite key="mooooFsSign" anchor={0.5} {...SIGN_SIZES} />
		<!-- children sit centered on the plank area (slightly below the emblem) -->
		<Container y={SIGN_SIZES.height * 0.06}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

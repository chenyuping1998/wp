<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import PlateMesh from './PlateMesh.svelte';
	import { SIGN_JELLY } from '../game/meshWin/plateJelly';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	// Jungle-military plank sign (gbFsSign, 920×720) that drops in from the top
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
	// the sign's sky face rings when the drop lands (PlateMesh, plateJelly.ts):
	// backOut reaches its resting line ~40% of the way through its 700ms
	let hit = $state(0);

	onMount(() => {
		dropY.set(0, { duration: 700, easing: backOut });
		const land = setTimeout(() => (hit += 1), 290);
		(async () => {
			await swing.set(0.035, { duration: 380, easing: cubicOut, delay: 250 });
			await swing.set(-0.022, { duration: 420, easing: cubicOut });
			await swing.set(0.01, { duration: 420, easing: cubicOut });
			await swing.set(0, { duration: 380, easing: cubicOut });
		})();
		return () => clearTimeout(land);
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={swing.current}
	>
		<!-- its own container: the mesh attaches on mount, and without a slot of
		     its own it would land over the text drawn below -->
		<Container>
			<PlateMesh spec={SIGN_JELLY} {...SIGN_SIZES} {hit} amp={1} centred />
		</Container>
		<!-- children sit centered on the plank area (slightly below the emblem) -->
		<Container y={SIGN_SIZES.height * 0.06}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { SIGN } from '../game/meshWin';
	import PropMesh from './PropMesh.svelte';

	// The snow-capped free-game board (gbFsSign, drawn by
	// design/generate_fs_counter_frost.mjs --sign) that drops in from the top and
	// settles with a swing. Children render at the sign's text area center.
	//
	// The board is drawn through a mesh (game/meshWin/fsSign.ts): the snow on top
	// is dragged up by the fall and slumps on the landing, the icicles under it
	// shiver. The text is drawn over it, not through it, and never moves.
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
	// the mesh's clock: ms since the drop began. A timer, not rAF — rAF stops in
	// a hidden tab and the snow would freeze mid-slump.
	let signT = $state(0);

	onMount(() => {
		const started = Date.now();
		const clock = setInterval(() => {
			signT = Date.now() - started;
			if (signT > SIGN.durationMs) clearInterval(clock);
		}, 16);
		dropY.set(0, { duration: 700, easing: backOut });
		(async () => {
			await swing.set(0.035, { duration: 380, easing: cubicOut, delay: 250 });
			await swing.set(-0.022, { duration: 420, easing: cubicOut });
			await swing.set(0.01, { duration: 420, easing: cubicOut });
			await swing.set(0, { duration: 380, easing: cubicOut });
		})();
		return () => clearInterval(clock);
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={swing.current}
	>
		<PropMesh spec={SIGN} env={{ t: signT }} anchor={0.5} {...SIGN_SIZES} />
		<!-- children sit centered on the plank area (slightly below the emblem) -->
		<Container y={SIGN_SIZES.height * 0.06}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

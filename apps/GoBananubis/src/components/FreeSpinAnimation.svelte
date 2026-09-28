<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { buildSignGrid, poseSign, SIGN } from '../game/meshWin/sheets';
	import SheetMesh from './SheetMesh.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	// Jungle-military plank sign (gbFsSign, 920×720) that drops in from the top
	// and settles with a swing. Children render at the sign's text area center.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
		/** performance.now() when a total landed on the sign, for its second
		 *  ripple (FreeSpinOutro); unset on the intro */
		landAt?: number;
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

	// THE SIGN IS A MESH (meshWin/sheets.ts poseSign): the drop and the swing
	// below stay whole-sign moves; the mesh adds the landing ripple, the winged
	// sun's crest and wings following through, and a ripple when a total lands.
	// One grid for every sign this session: it depends only on the art.
	const signGrid = buildSignGrid();
	const shownAt = performance.now();
	const poseTheSign = (out: Float32Array) => {
		const now = performance.now();
		const landAt = props.landAt ?? -1;
		poseSign(signGrid, (now - shownAt) / 1000, landAt < 0 ? -1 : (now - landAt) / 1000, out);
	};

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
		<SheetMesh
			layers={[{ key: 'gbFsSign' }]}
			grid={signGrid}
			artWidth={SIGN.w}
			artHeight={SIGN.h}
			width={SIGN_SIZES.width}
			height={SIGN_SIZES.height}
			pose={poseTheSign}
		/>
		<!-- children sit centered on the plank area (slightly below the emblem) -->
		<Container y={SIGN_SIZES.height * 0.06}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

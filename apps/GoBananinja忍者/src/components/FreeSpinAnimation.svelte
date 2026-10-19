<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, getContextApp, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import PlaqueMesh from './PlaqueMesh.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	// The lacquered sign (gbFsSign, 1417x1110) that drops in from the top and
	// settles. Children render at the sign's text area centre.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
	};

	const props: Props = $props();

	const context = getContext();
	const SIGN_RATIO = 1417 / 1110;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// inner panel area mapped to sprite space
	const TEXT_AREA = {
		width: SIGN_SIZES.width * (720 / 920),
		height: SIGN_SIZES.height * (540 / 720),
	};

	// ── IT DROPS IN AND LANDS (2026-10-17) ─────────────────────────────────
	//
	// It used to hang on two red cords drawn from its top corners straight up
	// off the screen, and swing on them. The user: 「FG開始的板子上面兩條線很
	// 奇怪」 — two lines running out of the top of the frame, attached to
	// nothing. Now there are no cords: the sign falls into place, settles with
	// one small bounce, its two ends flex down on the landing (PlaqueMesh
	// `droop`) and spring back, and then it is still.
	const W = SIGN_SIZES.width;
	const H = SIGN_SIZES.height;
	const HANG = { x: 0.5, y: 0.06 };
	const hangFromCentre = (HANG.y - 0.5) * H;
	const FALL_MS = 420;
	const OVER = H * 0.035;
	let t = $state(0);
	const app = getContextApp();
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		const t0 = performance.now();
		const tick = () => (t = performance.now() - t0);
		ticker?.add(tick);
		return () => ticker?.remove(tick);
	});
	const caught = $derived(Math.max(0, t - FALL_MS));
	// the drop, measured at the top edge: free fall, then one small settle
	const dropY = $derived(
		t < FALL_MS
			? -H * 1.25 + (H * 1.25 + OVER) * (t / FALL_MS) ** 2
			: OVER * Math.exp(-caught / 110) * Math.cos((2 * Math.PI * caught) / 240),
	);
	const droop = $derived(t < FALL_MS ? 0 : H * 0.07 * Math.exp(-caught / 150) * Math.cos((2 * Math.PI * caught) / 210));

</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + hangFromCentre + dropY}
	>
		<Container y={-hangFromCentre}>
			<Container x={-W / 2} y={-H / 2}>
				<!-- own container: PlaqueMesh adds itself at its parent's end -->
				<Container>
					<PlaqueMesh key="gbFsSign" width={W} height={H} pivotX={W * HANG.x} pivotY={H * HANG.y} bend={0} {droop} />
				</Container>
			</Container>
			<!-- children sit centred on the panel -->
			<Container y={SIGN_SIZES.height * 0.06}>
				{@render props.children({ sizes: TEXT_AREA })}
			</Container>
		</Container>
	</Container>
</MainContainer>

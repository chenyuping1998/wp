<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Graphics, getContextApp, type Sizes } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
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

	// ── IT IS DROPPED ON TWO RED CORDS (2026-10-04) ─────────────────────────
	//
	// GoBananasBoat's chain drop, re-dressed for this sign: it hangs from the red
	// cord bindings at its two top corners on cords running up off the screen.
	// It FALLS, the cords catch it a little past its rest, it bounces twice and
	// swings about the middle of its top edge, and at the instant it is caught
	// its two ends keep going — the panel flexes down at both sides (PlaqueMesh
	// `droop`) and springs back; while it swings, its lower edge lags (`bend`).
	// It used to slide in on a back-ease and rock about its own middle.
	const W = SIGN_SIZES.width;
	const H = SIGN_SIZES.height;
	// the cord bindings in fs_sign.png, as fractions of the sign
	const CORD_X = [0.13, 0.87];
	const HANG = { x: 0.5, y: 0.06 };
	const hangFromCentre = (HANG.y - 0.5) * H;
	const FALL_MS = 420;
	const OVER = H * 0.05;
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
	// the drop, measured at the top edge: free fall, then the cords' bounce
	const dropY = $derived(
		t < FALL_MS
			? -H * 1.25 + (H * 1.25 + OVER) * (t / FALL_MS) ** 2
			: OVER * Math.exp(-caught / 110) * Math.cos((2 * Math.PI * caught) / 240),
	);
	// two cords hold it, so it swings less than one hook would let it
	const swingAt = (c: number) =>
		c <= 0 ? 0 : 0.026 * Math.exp(-c / 650) * Math.sin((2 * Math.PI * c) / 1250) + 0.003 * Math.sin((2 * Math.PI * c) / 2900);
	const swing = $derived(swingAt(caught));
	const bend = $derived(-((swingAt(caught) - swingAt(caught - 16)) / 16) * 90);
	const droop = $derived(t < FALL_MS ? 0 : H * 0.07 * Math.exp(-caught / 150) * Math.cos((2 * Math.PI * caught) / 210));

	// the cords: from each binding straight up, off the top of the screen,
	// a twisted red rope (two strands)
	const drawCords = (g: PixiGraphics) => {
		g.clear();
		const top = -H * 3;
		const thick = W * 0.012;
		for (const fx of CORD_X) {
			const x = (fx - HANG.x) * W;
			const y0 = (0.04 - HANG.y) * H;
			g.moveTo(x, y0).lineTo(x, top);
			g.stroke({ width: thick * 1.7, color: 0x3a0a0a, alpha: 1 });
			g.moveTo(x, y0).lineTo(x, top);
			g.stroke({ width: thick, color: 0xc4262a, alpha: 1 });
			for (let y = y0 - thick, i = 0; y > top; y -= thick * 1.6, i++) {
				g.moveTo(x - thick * 0.5, y).lineTo(x + thick * 0.5, y - thick * 0.8);
				g.stroke({ width: Math.max(1, thick * 0.28), color: i % 2 ? 0x7a1214 : 0xff6a5a, alpha: 0.9 });
			}
		}
	};
</script>

<MainContainer>
	<!-- hung from the middle of its top edge: everything below turns about it -->
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + hangFromCentre + dropY}
		rotation={swing}
	>
		<Graphics draw={drawCords} />
		<Container y={-hangFromCentre}>
			<Container x={-W / 2} y={-H / 2}>
				<!-- own container: PlaqueMesh adds itself at its parent's end -->
				<Container>
					<PlaqueMesh key="gbFsSign" width={W} height={H} pivotX={W * HANG.x} pivotY={H * HANG.y} {bend} {droop} />
				</Container>
			</Container>
			<!-- children sit centred on the panel -->
			<Container y={SIGN_SIZES.height * 0.06}>
				{@render props.children({ sizes: TEXT_AREA })}
			</Container>
		</Container>
	</Container>
</MainContainer>

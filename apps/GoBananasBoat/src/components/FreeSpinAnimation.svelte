<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Graphics, getContextApp, type Sizes } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import PlaqueMesh from './PlaqueMesh.svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
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

	// ── IT IS DROPPED ON A CHAIN (2026-10-02) ────────────────────────────────
	//
	// It used to slide in on an ease and rock about its own middle. Now it hangs
	// from the ring on top of its anchor, on a chain running up off the screen:
	// it FALLS, the chain catches it a little past its rest, it bounces twice on
	// the chain and swings about the ring, and at the instant it is caught its
	// two ends keep going — the plate flexes down at both sides (PlaqueMesh
	// `droop`) and springs back. All of it a function of time since it appeared.
	const H = SIGN_SIZES.height;
	// the anchor's ring in fs_sign.png (1280x1000): the point it hangs from
	const RING = { x: 0.5, y: 118 / 1000 };
	const ringFromCentre = (RING.y - 0.5) * H;
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
	// the drop, measured at the ring: free fall, then the chain's bounce
	const dropY = $derived(
		t < FALL_MS
			? -H * 1.25 + (H * 1.25 + OVER) * (t / FALL_MS) ** 2
			: OVER * Math.exp(-caught / 110) * Math.cos((2 * Math.PI * caught) / 240),
	);
	// the swing about the ring after the catch, dying to a faint sway
	const swingAt = (c: number) =>
		c <= 0 ? 0 : 0.034 * Math.exp(-c / 700) * Math.sin((2 * Math.PI * c) / 1300) + 0.004 * Math.sin((2 * Math.PI * c) / 2900);
	const swing = $derived(swingAt(caught));
	// the plate's lower edge lags the swing a touch
	const bend = $derived(-((swingAt(caught) - swingAt(caught - 16)) / 16) * 90);
	// the ends flex down on the catch and spring back
	const droop = $derived(t < FALL_MS ? 0 : H * 0.075 * Math.exp(-caught / 150) * Math.cos((2 * Math.PI * caught) / 210));

	// the chain: from the ring straight up, off the top of the screen
	const drawChain = (g: PixiGraphics) => {
		g.clear();
		const link = SIGN_SIZES.width * 0.03;
		const top = -H * 3;
		for (let i = 0, y = -link * 0.4; y > top; i++, y -= link * 0.72) {
			const across = i % 2 ? link * 0.12 : link * 0.3;
			g.ellipse(0, y, across, link * 0.55);
			g.stroke({ width: Math.max(2, link * 0.16), color: i % 2 ? 0x8a5a1c : 0xd8a334, alpha: 1 });
		}
	};
</script>

<MainContainer>
	<!-- hung from the ring: everything below turns about it -->
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + ringFromCentre + dropY}
		rotation={swing}
	>
		<Graphics draw={drawChain} />
		<Container y={-ringFromCentre}>
		<Container x={-SIGN_SIZES.width / 2} y={-H / 2}>
			<!-- own container: PlaqueMesh adds itself at its parent's end -->
			<Container>
				<PlaqueMesh
					key="gbFsSign"
					width={SIGN_SIZES.width}
					height={H}
					pivotX={SIGN_SIZES.width * RING.x}
					pivotY={H * RING.y}
					{bend}
					{droop}
				/>
			</Container>
		</Container>
		<!-- children sit centered on the plank area (slightly below the emblem) -->
		<Container y={SIGN_SIZES.height * 0.06}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
		</Container>
	</Container>
</MainContainer>

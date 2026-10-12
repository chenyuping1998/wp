<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { FG_BOARD_DECOR } from '../game/meshWin';
	import type { BoardEnv } from '../game/meshWin/fgBoard';
	import PropMesh from './PropMesh.svelte';

	// Jungle-military plank sign (gbFsSign, 920×720) that drops in from the top
	// and settles with a swing. Children render at the sign's text area center.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
		settlement?: boolean;
	};

	const props: Props = $props();

	const context = getContext();
	const SIGN_RATIO = 1600 / 1000;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// THE PAPER, MEASURED ON EACH BOARD (1600x1000 source px, 2026-10-06).
	// This used to be the old jungle sign's plank ratios (920x720 canvas,
	// 100..820 x 130..670, nudged down 6%), which put "TOTAL WIN" up on the new
	// board's top beam. Inset past the pins / the clip-on receipt / the cloth.
	// Re-measure whenever the board art changes.
	const PAPER = props.settlement
		? { x0: 260, y0: 300, x1: 1350, y1: 860 }
		: { x0: 140, y0: 300, x1: 1400, y1: 870 };
	const TEXT_AREA = {
		width: SIGN_SIZES.width * ((PAPER.x1 - PAPER.x0) / 1600),
		height: SIGN_SIZES.height * ((PAPER.y1 - PAPER.y0) / 1000),
	};
	const AREA_CENTER = {
		x: SIGN_SIZES.width * ((PAPER.x0 + PAPER.x1) / 2 / 1600 - 0.5),
		y: SIGN_SIZES.height * ((PAPER.y0 + PAPER.y1) / 2 / 1000 - 0.5),
	};

	const dropY = new Tween(-SIGN_SIZES.height * 1.2);
	const swing = new Tween(0);

	// The decor's MESHES (game/meshWin/fgBoard.ts): the bells on the intro
	// board rock and ring, the burger stack and the plates on the total board
	// wobble and teeter. Their clock starts with the drop, which fgBoard's
	// landing beat is timed against. Driven by rAF (the review checker flags
	// interval-stepped animation).
	let signEnv = $state<BoardEnv>({ t: 0 });
	const decorSpecs = FG_BOARD_DECOR(!!props.settlement);

	onMount(() => {
		const started = performance.now();
		let clock = 0;
		let payoutPlayed = false;
		const tick = (now: number) => {
			signEnv = { t: now - started };
			if (props.settlement && !payoutPlayed && signEnv.t >= 700) {
				payoutPlayed = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
			}
			clock = requestAnimationFrame(tick);
		};
		clock = requestAnimationFrame(tick);
		dropY.set(0, { duration: 700, easing: backOut });
		(async () => {
			await swing.set(0.035, { duration: 380, easing: cubicOut, delay: 250 });
			await swing.set(-0.022, { duration: 420, easing: cubicOut });
			await swing.set(0.01, { duration: 420, easing: cubicOut });
			await swing.set(0, { duration: 380, easing: cubicOut });
		})();
		return () => cancelAnimationFrame(clock);
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={swing.current + Math.sin(signEnv.t / 2000 * Math.PI * 2) * 0.012}
	>
		<!-- the board is a plain sprite; the things on its corners are meshes
		     over the decor layer (game/meshWin/fgBoard.ts), same box -->
		<Container>
			<Sprite key={props.settlement ? "v8FgTotal" : "v8FgIntro"} anchor={.5} {...SIGN_SIZES} />
			{#each decorSpecs as spec (spec.symbol)}
				<PropMesh {spec} env={signEnv} {...SIGN_SIZES} anchor={0.5} />
			{/each}
		</Container>
		<!-- children sit centered on the board's paper -->
		<Container x={AREA_CENTER.x} y={AREA_CENTER.y}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

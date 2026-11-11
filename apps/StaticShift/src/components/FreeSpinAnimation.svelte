<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { SIGN_LAND_MS } from '../game/meshWin/fsSign';

	// The pinned programme sheet (ssIntroCard, 900×640 — 2026-11-05 art,
	// design/source-ui-1104/intro_card.png) drops in from the top, lands with a
	// paper squash and settles with a swing. Children render around the
	// sheet's centre: the title lands in the blank header box (y 48–168 of 640),
	// the numbers and subtitle on the paper below it.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
        oncontact?:()=>void;
	};

	const props: Props = $props();

	const context = getContext();
	const SIGN_RATIO = 900 / 640;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// The intro/outro place their title at -0.26 and subtitle at +0.32 of this
	// height around the container: with height 1.05H and the container 0.057H
	// above centre that puts the title on the header box's centre (0.17H) and
	// the subtitle at 0.78H, both on clean paper.
	const TEXT_AREA = {
		width: SIGN_SIZES.width * 0.82,
		height: SIGN_SIZES.height * 1.05,
	};
	const TEXT_Y = -SIGN_SIZES.height * 0.057;

	const dropY = new Tween(-SIGN_SIZES.height * 1.2);
	const swing = new Tween(0);

	// Landing: a damped paper squash from SIGN_LAND_MS (the outro's count-up
	// is timed against that moment), then a slow breath while it hangs there.
	// Driven by rAF (the review checker flags interval-stepped animation).
	let signT = $state(0);
	const squash = $derived.by(() => {
		const s = (signT - SIGN_LAND_MS) / 1000;
		const land = s < 0 ? 0 : 0.06 * Math.exp(-s * 7) * Math.cos(s * 26);
		const breath = 0.006 * Math.sin(signT / 640);
		return { x: 1 + land * 0.6 + breath, y: 1 - land - breath };
	});

	onMount(() => {
		const started = performance.now();
		let clock = 0;let contacted=false;
		const tick = (now: number) => {
			signT = now - started;
            if(!contacted && signT>=SIGN_LAND_MS){contacted=true;props.oncontact?.();}
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
		rotation={swing.current}
	>
		<!-- squash pivots on the pin at the top edge, so the sheet hangs from it -->
		<Container y={-SIGN_SIZES.height / 2} scale={squash}>
			<Container y={SIGN_SIZES.height / 2}>
				<Sprite key="ssIntroCard" anchor={0.5} {...SIGN_SIZES} />
				<Container y={TEXT_Y}>
					{@render props.children({ sizes: TEXT_AREA })}
				</Container>
			</Container>
		</Container>
	</Container>
</MainContainer>

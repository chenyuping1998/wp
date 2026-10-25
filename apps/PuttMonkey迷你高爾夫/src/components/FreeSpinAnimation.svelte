<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { postcardSwing } from '../game/fgMotion';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	// The course postcard (design/build_putt_fg_sign.py, 1600x1000): a view of
	// the course over the card's paper panel, dropping in from the top and
	// settling with a swing. Children render at the paper's centre.
	// Nothing is pinned on it any more (user, 2026-10-18: the corner icons read
	// as AI-made); its decor layer is empty.
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
	// 2026-10-18 postcard: panel ink y 431..966; the grass tufts fill the
	// bottom corners up to x 330 / from 1270, so the safe paper is narrower
	// low down — the subtitle line is centred and short enough to clear them.
	const PAPER = { x0: 200, y0: 452, x1: 1400, y1: 950 };
	const TEXT_AREA = {
		width: SIGN_SIZES.width * ((PAPER.x1 - PAPER.x0) / 1600),
		height: SIGN_SIZES.height * ((PAPER.y1 - PAPER.y0) / 1000),
	};
	const AREA_CENTER = {
		x: SIGN_SIZES.width * ((PAPER.x0 + PAPER.x1) / 2 / 1600 - 0.5),
		y: SIGN_SIZES.height * ((PAPER.y0 + PAPER.y1) / 2 / 1000 - 0.5),
	};

	const dropY = new Tween(-SIGN_SIZES.height * 1.2);

	// The board and lettering land as one object, then settle together. Its
	// swing is one damped spring (fgMotion.postcardSwing, 2026-10-23); it was
	// four tweens end to end that jolted at every turn.
	let signTime = $state(0);
	const landing = $derived.by(() => {
		const t = signTime - 700;
		return t < 0 || t > 1200 ? 0 : Math.sin(t / 72) * Math.exp(-t / 260);
	});

	onMount(() => {
		const started = performance.now();
		let clock = 0;
		let payoutPlayed = false;
		const tick = (now: number) => {
			signTime = now - started;
			if (props.settlement && !payoutPlayed && signTime >= 700) {
				payoutPlayed = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
			}
			clock = requestAnimationFrame(tick);
		};
		clock = requestAnimationFrame(tick);
		dropY.set(0, { duration: 700, easing: backOut });
		return () => cancelAnimationFrame(clock);
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={postcardSwing(signTime)}
		scale={{ x: 1 + landing * 0.028, y: 1 - landing * 0.032 }}
	>
		<Sprite key={props.settlement ? "v8FgTotal" : "v8FgIntro"} anchor={.5} {...SIGN_SIZES}/>
		<!-- children sit centered on the plank area (slightly below the emblem),
		     riding the middle plank as it rattles -->
		<Container x={AREA_CENTER.x} y={AREA_CENTER.y}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

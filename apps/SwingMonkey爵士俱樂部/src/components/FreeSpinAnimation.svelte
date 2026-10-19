<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import LightRays from './LightRays.svelte';

	// The gig ticket (design/build_swing_fg_sign.py, 1600x1000): a window onto
	// the stage over the ticket's paper, dropping in from the top and settling
	// with a swing. Children render at the paper's centre. Nothing is pinned on
	// it any more (2026-10-18: the corner badge and record read as AI-made, as
	// on Putt / Strike); its decor layer is empty. On the intro the stage's
	// spotlight swings across the window once and comes to rest centre stage.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
		settlement?: boolean;
		/**
		 * 0..1: a warm light pooled BEHIND the board, over the dark scrim (never on
		 * the paper, where additive light on cream is invisible). The intro flares
		 * it when the count lands; the settlement when the total stops.
		 */
		halo?: number;
		/** 0..1: light rays fanned out behind the board, turning slowly. */
		rays?: number;
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
	// 2026-10-18 ticket: window y 30..420, ink rule + red stripe to 437,
	// perforation y 482, red keyline x 56..1544 / y 512..944 — the text stays
	// inside the keyline.
	const PAPER = { x0: 90, y0: 526, x1: 1510, y1: 930 };
	const UNIT = SIGN_SIZES.width / 1600;
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

	// The board and lettering land as one object, then settle together.
	let signTime = $state(0);
	const landing = $derived.by(() => {
		const t = signTime - 700;
		return t < 0 || t > 1200 ? 0 : Math.sin(t / 72) * Math.exp(-t / 260);
	});
	// The intro's spotlight (board px): it finds the stage from the wings as the
	// board lands — in from stage left, a touch past centre, back — then holds,
	// dimmed. Additive over the window's painted stage only; it is an ellipse
	// kept inside the window (y 30..420) so it never lights the frame or paper.
	const spot = $derived.by(() => {
		const u = (signTime - 760) / 1100;
		if (props.settlement || u <= 0) return null;
		const k = Math.min(1, u);
		const ease = 1 - (1 - k) ** 3;
		const x = 330 + 470 * ease + 46 * Math.sin(Math.PI * k) * (1 - k);
		// additive over an already-lit cream curtain: kept low or it blows out to
		// white (user, 2026-10-18: "too bright")
		const alpha = u < 0.2 ? u / 0.2 * 0.22 : Math.max(0.1, 0.22 - 0.12 * Math.max(0, u - 1) / 0.6);
		return { x, alpha };
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
	{#if (props.halo ?? 0) > 0.001 || (props.rays ?? 0) > 0.001}
		<!-- behind the board, as siblings of nothing masked or filtered, so the
		     additive light really adds to the scrim (as Jade Teahouse's) -->
		<Container x={context.stateGameDerived.boardLayout().x} y={context.stateGameDerived.boardLayout().y + dropY.current}>
			<LightRays radius={SIGN_SIZES.width * 0.95} alpha={props.rays ?? 0} />
			<Sprite
				key="fxSoftGlow"
				anchor={0.5}
				blendMode="add"
				tint={0xffd27a}
				width={SIGN_SIZES.width * 1.55}
				height={SIGN_SIZES.height * 1.7}
				alpha={(props.halo ?? 0) * 0.32}
			/>
		</Container>
	{/if}
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={swing.current}
		scale={{ x: 1 + landing * 0.028, y: 1 - landing * 0.032 }}
	>
		<Sprite key={props.settlement ? "v8FgTotal" : "v8FgIntro"} anchor={.5} {...SIGN_SIZES}/>
		{#if spot}
			<Sprite
				key="fxSoftGlow"
				anchor={0.5}
				blendMode="add"
				tint={0xffcf8a}
				x={(spot.x - 800) * UNIT}
				y={(222 - 500) * UNIT}
				width={500 * UNIT}
				height={360 * UNIT}
				alpha={spot.alpha}
			/>
		{/if}
		<!-- children sit centred on the ticket's paper -->
		<Container x={AREA_CENTER.x} y={AREA_CENTER.y}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>

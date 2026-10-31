<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Graphics, Sprite, type Sizes } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut, cubicInOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { FG_BOARD } from '../game/meshWin';
	import type { BoardEnv } from '../game/meshWin/fgBoard';
	import PropMesh from './PropMesh.svelte';
	import LightRays from './LightRays.svelte';

	// THE TWO FREE-SPIN BOARDS ARE TWO DIFFERENT OBJECTS (2026-10-16; they were
	// one jade board shown twice, which read as a certificate).
	//
	//   intro       the jade board, HUNG: two red cords run up off the top of
	//               the screen. It drops in, swings on the cords and settles.
	//   settlement  a hand-scroll (design/build_splash_parts.py: the scroll's
	//               own bamboo rods and paper, gold brackets in the corners). It
	//               rises in rolled up, and the rods draw apart to unroll it.
	//
	// Children render at the centre of the paper either way.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
		settlement?: boolean;
		/**
		 * 0..1: a warm light pooled BEHIND the board, over the dark scrim (never on
		 * the paper, where additive light on cream is invisible). The splash drives
		 * it: a flare when the count lands, then a low steady glow.
		 */
		halo?: number;
		/**
		 * 0..1: light rays fanned out behind the board — the settlement's own
		 * signature.
		 */
		rays?: number;
	};

	const props: Props = $props();

	const context = getContext();
	const SIGN_RATIO = 1600 / 1000;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };

	// the scroll: paper 1600x900, rods (122x1022 art) a little taller than it
	const SCROLL = (() => {
		const paperW = SIGN_WIDTH * 0.92;
		const paperH = paperW * (900 / 1600);
		const rodH = paperH * 1.12;
		return { paperW, paperH, rodH, rodW: rodH * (122 / 1022) };
	})();

	// THE PAPER inside the board's dotted border, measured on fg_intro.png
	// (1600x1000 source px, re-measured 2026-10-31: the 2026-10-06 numbers were
	// an older board's and sat 140px low, so the last rules line ran off the
	// paper onto the frame), and the scroll's writing area inside its brackets.
	const PAPER = { x0: 175, y0: 165, x1: 1425, y1: 795 };
	const TEXT_AREA = props.settlement
		? { width: SCROLL.paperW * 0.8, height: SCROLL.paperH * 0.78 }
		: {
				width: SIGN_SIZES.width * ((PAPER.x1 - PAPER.x0) / 1600),
				height: SIGN_SIZES.height * ((PAPER.y1 - PAPER.y0) / 1000),
			};
	const AREA_CENTER = props.settlement
		? { x: 0, y: 0 }
		: {
				x: SIGN_SIZES.width * ((PAPER.x0 + PAPER.x1) / 2 / 1600 - 0.5),
				y: SIGN_SIZES.height * ((PAPER.y0 + PAPER.y1) / 2 / 1000 - 0.5),
			};

	// The intro DROPS in from above and swings on its cords; the settlement
	// RISES from below and unrolls.
	const dropY = new Tween(props.settlement ? SIGN_SIZES.height * 0.9 : -SIGN_SIZES.height * 1.2);
	const rise = new Tween(props.settlement ? 0.82 : 1);
	const swing = new Tween(0);
	// 0 = rolled up (rods together), 1 = open
	const unroll = new Tween(props.settlement ? 0 : 1);

	// The board's MESH (game/meshWin/fgBoard.ts): its jade pendants are thrown
	// out when it lands and drift after. Driven by rAF (the review checker flags
	// interval-stepped animation).
	let signEnv = $state<BoardEnv>({ t: 0 });
	const boardSpec = FG_BOARD('v8FgIntro');

	onMount(() => {
		const started = performance.now();
		let clock = 0;
		const tick = (now: number) => {
			signEnv = { t: now - started };
			clock = requestAnimationFrame(tick);
		};
		clock = requestAnimationFrame(tick);
		dropY.set(0, { duration: props.settlement ? 620 : 700, easing: backOut });
		if (props.settlement) {
			rise.set(1, { duration: 620, easing: backOut });
			unroll.set(1, { duration: 720, delay: 380, easing: cubicInOut });
			return () => cancelAnimationFrame(clock);
		}
		(async () => {
			await swing.set(0.035, { duration: 380, easing: cubicOut, delay: 250 });
			await swing.set(-0.022, { duration: 420, easing: cubicOut });
			await swing.set(0.01, { duration: 420, easing: cubicOut });
			await swing.set(0, { duration: 380, easing: cubicOut });
		})();
		return () => cancelAnimationFrame(clock);
	});

	const board = $derived(context.stateGameDerived.boardLayout());

	// cords: 72x120 tiles of the scroll's rope (sign_cord.png), stacked
	const CORD_W = SIGN_WIDTH * 0.024;
	const CORD_TILE = CORD_W * (120 / 72);
	const cordTiles = (length: number) => Math.max(1, Math.ceil(length / CORD_TILE));
	// where the board's cords tie on: its two top corner ornaments
	const TIES = [-0.36, 0.36].map((fx) => ({ x: SIGN_SIZES.width * fx, y: -SIGN_SIZES.height * 0.4 }));
</script>

<MainContainer>
	{#if (props.halo ?? 0) > 0.001 || (props.rays ?? 0) > 0.001}
		<!-- behind the board, as siblings of nothing masked or filtered, so the
		     additive light really adds to the scrim -->
		<Container x={board.x} y={board.y + dropY.current}>
			<LightRays radius={SIGN_SIZES.width * 0.95} alpha={props.rays ?? 0} />
			<Sprite
				key="fxSoftGlow"
				anchor={0.5}
				blendMode="add"
				tint={0xe6c27a}
				width={SIGN_SIZES.width * 1.55}
				height={SIGN_SIZES.height * 1.7}
				alpha={(props.halo ?? 0) * 0.4}
			/>
		</Container>
	{/if}

	{#if props.settlement}
		{@const half = (SCROLL.paperW / 2) * unroll.current}
		<Container scale={rise.current} x={board.x} y={board.y + dropY.current}>
			<!-- the paper and what is written on it, revealed between the rods -->
			<Container>
				<Sprite key="v8ScrollPaper" anchor={0.5} width={SCROLL.paperW} height={SCROLL.paperH} />
				<Container x={AREA_CENTER.x} y={AREA_CENTER.y}>
					{@render props.children({ sizes: TEXT_AREA })}
				</Container>
				<!-- only while it unrolls: a mask left on afterwards would clip the
				     leaves thrown off the total -->
				<Graphics
					isMask={unroll.current < 0.999}
					draw={(g: PixiGraphics) => {
						g.clear();
						if (unroll.current >= 0.999) return;
						g.rect(-half, -SCROLL.paperH, half * 2, SCROLL.paperH * 2).fill(0xffffff);
					}}
				/>
			</Container>
			{#each [-1, 1] as side (side)}
				<Sprite
					key="v8ScrollRod"
					anchor={0.5}
					x={side * (half + SCROLL.rodW * 0.3)}
					width={SCROLL.rodW}
					height={SCROLL.rodH}
				/>
			{/each}
		</Container>
	{:else}
		<!-- (the two festival lanterns that hung on cords either side of the board
		     were removed 2026-10-31: with the Master standing beside it they
		     crowded the frame; the board hangs on its own cords alone) -->
		<Container x={board.x} y={board.y + dropY.current} rotation={swing.current}>
			<!-- the board's cords, up off the top of the screen, behind it -->
			{#each TIES as tie, t (t)}
				{@const topY = -(board.y + dropY.current) - 40}
				{#each Array(cordTiles(tie.y - topY)) as _, i (i)}
					<Sprite key="v8SignCord" anchor={{ x: 0.5, y: 1 }} x={tie.x} y={tie.y - i * CORD_TILE} width={CORD_W} height={CORD_TILE} />
				{/each}
			{/each}
			<!-- drawn through its mesh (game/meshWin/fgBoard.ts), same box -->
			<PropMesh spec={boardSpec} env={signEnv} {...SIGN_SIZES} anchor={0.5} rotation={Math.sin(signEnv.t/2000*Math.PI*2)*.012} />
			<!-- and tied on in front of it -->
			{#each TIES as tie, t (t)}
				<Sprite key="v8SignKnot" anchor={{ x: 0.5, y: 0.55 }} x={tie.x} y={tie.y} width={CORD_W * 2.3} height={CORD_W * 2.3 * (124 / 164)} />
			{/each}
			<!-- children sit centered on the board's paper -->
			<Container x={AREA_CENTER.x} y={AREA_CENTER.y}>
				{@render props.children({ sizes: TEXT_AREA })}
			</Container>
		</Container>
	{/if}
</MainContainer>

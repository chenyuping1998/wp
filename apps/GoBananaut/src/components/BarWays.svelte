<script lang="ts">
	/**
	 * THE BOARD'S WAYS, ON THE BET BAR — this game's own readout in the bar's
	 * empty Win→Bet cell.
	 *
	 * The selling point here is the board getting taller, and the bar said
	 * nothing about it: the player could see the skyline step down from reel 1
	 * but never the number it was worth. This is an inset display window in that
	 * cell (asked for 2026-09-27):
	 *
	 *   a mini board   five reels of six slots — the rows each reel stands at lit,
	 *                  a DOUBLING reel lit ice with its x2 above it (the same
	 *                  drawing as the Buy Bonus cards' meter, so the two teach
	 *                  one picture)
	 *   WAYS           Π rows × the maths' per-reel multiplier — 1,024 on a
	 *                  baseline board, 3,072 with reel one doubling at six rows.
	 *                  It ROLLS to a new figure and flares ice when it climbs.
	 *
	 * Read from stateGame.growRows / growMultipliers, which ReelGrow sets only once
	 * a climb has finished on screen, so the figure never runs ahead of the board.
	 * The multipliers are the ones the maths SENT (all 1s in the base game), never
	 * derived from the row count — see ReelGrow's note on the x2 plates.
	 *
	 * WHERE: the bar belongs to components-ui-pixi (LayoutBottomBar), which has no
	 * slot for a game's own content, and per-game styling stays out of the shared
	 * package. So this is drawn over the bar from the app, on the same geometry:
	 * the constants below are LayoutBottomBar's, and must move with it. The
	 * window's own fill covers the cell's centred "breather" tick. Shown only
	 * where that layout is the one in use (compactBottom, not portrait), not in
	 * replay (the replay button takes the cell) and not in hold and spin (a
	 * board of coins has no ways). It fades with the bar (uiShow / uiHide).
	 */
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { uiTheme } from 'components-ui-pixi';
	import { stateReplay } from 'state-shared';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onDestroy, untrack } from 'svelte';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { BASE_ROWS } from '../game/constants';
	import config from '../game/config';
	import {
		DISC,
		HULL,
		STEEL_DIM,
		STEEL_EDGE,
		STEEL_TEXT,
		ICE_EDGE,
		ICE_RIM,
		ICE_TEXT,
		ICE_BRIGHT,
		CREAM,
		INK,
	} from '../game/palette';

	const context = getContext();
	const { maxRows } = config.growth;
	const REELS = config.numReels;

	// ── LayoutBottomBar's geometry (components-ui-pixi) — keep in step ──────
	const FRAME_X = 24;
	const DIV_3 = 656;
	const DIV_INSET = 22;
	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const barTop = $derived(box.height - uiTheme.barHeight);
	const frameH = $derived(uiTheme.barHeight - uiTheme.barFrameBottom);
	const barMid = $derived(barTop + frameH * 0.5);
	// the right cluster, from the frame's inner right edge inward
	const betX = $derived(box.width - FRAME_X - 14 - 33 - 106 - 140 - 128 - 175);
	const divBeforeBet = $derived(betX - 118);
	const cellCenter = $derived((DIV_3 + divBeforeBet) * 0.5);
	const cellWidth = $derived(divBeforeBet - DIV_3);

	// ── when it shows ───────────────────────────────────────────────────────
	// the same choice UIDefault makes: portrait keeps its own full bar, and a
	// localStorage override can put the side rails back
	const override = typeof localStorage !== 'undefined' ? localStorage.getItem('betBarLayout') : null;
	const layout = $derived(
		override === 'sideRail' || override === 'compactBottom' ? override : uiTheme.betBarLayout,
	);
	const visible = $derived(
		context.stateLayoutDerived.layoutType() !== 'portrait' &&
			layout === 'compactBottom' &&
			!stateReplay.enabled &&
			stateGame.gameType !== 'holdandspin',
	);
	let barShown = $state(true);
	context.eventEmitter.subscribeOnMount({
		uiShow: () => {
			barShown = true;
		},
		uiHide: () => {
			barShown = false;
		},
	});

	// ── the figure ──────────────────────────────────────────────────────────
	const rows = $derived(Array.from({ length: REELS }, (_, i) => stateGame.growRows[i] ?? BASE_ROWS));
	const mults = $derived(Array.from({ length: REELS }, (_, i) => stateGame.growMultipliers[i] ?? 1));
	const ways = $derived(rows.reduce((a, r, i) => a * r * mults[i], 1));
	const doubling = $derived(mults.filter((m) => m > 1).length);

	// rolls to a new figure rather than jumping; a board reset (a new round)
	// snaps straight back down, since counting DOWN would read as losing ways
	const shown = new Tween(untrack(() => ways), { duration: 650, easing: cubicOut });
	let flare = $state(0);
	let flareRaf = 0;
	let last = untrack(() => ways);
	$effect(() => {
		const w = ways;
		if (w > last) {
			shown.set(w);
			flare = 1;
			cancelAnimationFrame(flareRaf);
			const t0 = performance.now();
			const step = (now: number) => {
				flare = Math.max(0, 1 - (now - t0) / 900);
				if (flare > 0) flareRaf = requestAnimationFrame(step);
			};
			flareRaf = requestAnimationFrame(step);
		} else if (w < last) shown.set(w, { duration: 0 });
		last = w;
	});
	onDestroy(() => cancelAnimationFrame(flareRaf));
	const text = $derived(Math.round(shown.current).toLocaleString('en-US'));

	// ── the window ──────────────────────────────────────────────────────────
	const winH = $derived(frameH - DIV_INSET * 2 + 8);
	const winW = $derived(Math.min(cellWidth - 36, 300));
	// the mini board: five columns of six slots
	const COL_W = 11;
	const COL_GAP = 4;
	const boardW = REELS * COL_W + (REELS - 1) * COL_GAP;
	const slotH = $derived((winH - 30) / maxRows);
	const PAD = 16;

	const drawWindow = (g: PixiGraphics) => {
		g.clear();
		const x = -winW / 2, y = -winH / 2;
		// the inset window: a darker pane sunk into the hull, a steel rim, and an
		// ice rim that comes up while the figure flares
		g.roundRect(x, y, winW, winH, 8);
		g.fill({ color: DISC, alpha: 1 });
		g.stroke({ width: 2, color: STEEL_DIM, alpha: 1 });
		g.roundRect(x + 3, y + 3, winW - 6, winH - 6, 6);
		g.stroke({ width: 1, color: HULL, alpha: 1 });
		if (flare > 0) {
			g.roundRect(x, y, winW, winH, 8);
			g.stroke({ width: 3, color: ICE_RIM, alpha: 0.9 * flare });
		}
		// the board, left in the window, standing on a common floor
		const bx = x + PAD;
		const floor = y + winH - 8;
		for (let reel = 0; reel < REELS; reel++) {
			const cx = bx + reel * (COL_W + COL_GAP);
			const tall = rows[reel];
			const lit = mults[reel] > 1;
			for (let k = 0; k < maxRows; k++) {
				const sy = floor - (k + 1) * slotH + 1.5;
				const h = slotH - 3;
				if (k < tall) {
					g.roundRect(cx, sy, COL_W, h, 1.5);
					g.fill({ color: lit ? ICE_EDGE : 0x3a4d5e, alpha: 1 });
					g.stroke({ width: 1, color: lit ? ICE_BRIGHT : STEEL_EDGE, alpha: 1 });
				} else {
					g.roundRect(cx + 0.5, sy + 0.5, COL_W - 1, h - 1, 1.5);
					g.stroke({ width: 1, color: STEEL_DIM, alpha: 0.8 });
				}
			}
		}
	};

	const labelStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontWeight: uiTheme.fontWeight,
		fontSize: 20,
		letterSpacing: 2,
		fill: doubling ? ICE_TEXT : STEEL_TEXT,
	});
	const valueStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontWeight: uiTheme.fontWeight,
		fontSize: 40,
		fill: doubling ? ICE_BRIGHT : CREAM,
		stroke: { color: INK, width: 4 },
	});
	const x2Style = {
		fontFamily: 'Segoe UI, Arial, sans-serif',
		fontWeight: '800' as const,
		fontSize: 11,
		fill: ICE_BRIGHT,
	};
	// the text block, centred in what the board leaves of the window
	const textX = $derived(-winW / 2 + PAD + boardW + (winW - PAD - boardW) / 2);
</script>

{#if visible}
	<MainContainer standard>
		<FadeContainer persistent show={barShown}>
			<Container x={cellCenter} y={barMid}>
				<Graphics draw={drawWindow} />
				<!-- each doubling reel's x2, over its column -->
				{#each mults as m, reel (reel)}
					{#if m > 1}
						<Text
							anchor={{ x: 0.5, y: 1 }}
							x={-winW / 2 + PAD + reel * (COL_W + COL_GAP) + COL_W / 2}
							y={winH / 2 - 8 - rows[reel] * slotH - 1}
							text={`x${m}`}
							style={x2Style}
						/>
					{/if}
				{/each}
				<Text anchor={{ x: 0.5, y: 1 }} x={textX} y={-4} text="WAYS" style={labelStyle} />
				<Text
					anchor={{ x: 0.5, y: 0.5 }}
					x={textX}
					y={18}
					scale={1 + 0.12 * flare}
					text={text}
					style={valueStyle}
				/>
			</Container>
		</FadeContainer>
	</MainContainer>
{/if}

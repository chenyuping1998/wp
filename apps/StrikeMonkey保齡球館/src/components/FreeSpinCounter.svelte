<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	// The free-spin ticket keeps spins, collection progress and active
	// replacements legible between the milestone performances.
	//
	// The meter is the feature's whole chase — each rung adds spins and replaces
	// one low symbol — so it sits on the same ticket as the spin count
	// rather than somewhere the eye has to go looking for it. Drawn as a flat
	// screenprint ticket (paper, red offset print, ink border): no gradients, no
	// glow, matching ART_BRIEF.md §0.
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import config from '../game/config';
	import { removedLabelsAtLevel } from '../game/chefMeter';

	const context = getContext();

	const PAPER = 0xf7ead0;
	const RED = 0xe8502e;
	const INK = 0x14262e;
	const UPGRADE = 0x8e5bd6;

	const W = SYMBOL_SIZE * 2.0;
	const H = SYMBOL_SIZE * 1.6;
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived(
		isPortrait
			? {
					// portrait: centred above the board (no room at the side)
					x: context.stateGameDerived.boardLayout().x - W * 0.5,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 * context.stateGameDerived.boardLayout().scale -
						H * 1.05,
				}
			: (() => {
					// LEFT of the board, ABOVE the Buy Bonus plate (which the shared bar
					// keeps on screen, dimmed, through the feature). It was moved right
					// once to clear that plate, and then sat on the Lookout's head —
					// she stands taller in the margin than the Chef does.
					//
					// Measured from the HOUSING, not the reels: BoardFrame draws it at
					// 1.28x the board, and clearing only the reels left the ticket's
					// right edge sitting on the frame's corner rivets. Where the margin
					// is too narrow for the full ticket it shrinks rather than overlap.
					const board = context.stateGameDerived.boardLayout();
					const frameLeft = board.x - (board.width * board.scale * 1.28) / 2;
					const gap = SYMBOL_SIZE * 0.2;
					const margin = SYMBOL_SIZE * 0.15;
					const available = frameLeft - gap - margin;
					if (available < (W + 6) * 0.5) {
						const layout = context.stateLayoutDerived.mainLayout();
						const scale = Math.min(0.72, (layout.width - 2 * margin) / (W + 6));
						return { x: layout.width - (W + 6) * scale - margin, y: layout.height * 0.015, scale };
					}
					const scale = Math.min(1, available / (W + 6));
					return {
						x: frameLeft - gap - (W + 6) * scale,
						y: context.stateLayoutDerived.mainLayout().height * 0.03,
						scale,
					};
				})(),
	);

	let show = $state(false);
	// `current` = spins USED + 1 (set by the updateFreeSpin handler); `total` = window size
	let current = $state(1);
	let total = $state(0);

	const title = $derived(gameText('freeSpins'));
	const titleSize = $derived(Math.min(W * 0.1, (W * 1.3) / Math.max(1, title.length)));

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});

	// Meter progress within the current rung: from the last threshold passed to
	// the next. At the top rung every pip stays lit.
	const meter = $derived(stateGame.banditMeter);
	const thresholds = config.banditMeter.thresholds as number[];
	const rungFloor = $derived(meter.level === 0 ? 0 : thresholds[meter.level - 1]);
	const rungSize = $derived(meter.nextAt === null ? 4 : meter.nextAt - rungFloor);
	const rungFilled = $derived(meter.nextAt === null ? rungSize : Math.max(0, meter.count - rungFloor));

	// a lit pip pops when it fills — driven by rAF, only while a pop is running
	let popIndex = $state(-1);
	let popT = $state(1);
	let lastFilled = 0;
	let raf = 0;
	$effect(() => {
		const filled = rungFilled;
		if (show && filled > lastFilled) {
			popIndex = filled - 1;
			const start = performance.now();
			cancelAnimationFrame(raf);
			const step = (now: number) => {
				popT = Math.min(1, (now - start) / 420);
				if (popT < 1) raf = requestAnimationFrame(step);
			};
			raf = requestAnimationFrame(step);
		}
		lastFilled = filled;
	});
	$effect(() => () => cancelAnimationFrame(raf));

	// Let the new rung land on the ticket after the cut animation resolves.
	let levelPulseT = $state(1);
	let lastLevel = 0;
	let levelRaf = 0;
	$effect(() => {
		const nextLevel = meter.level;
		if (show && nextLevel > lastLevel) {
			const start = performance.now();
			cancelAnimationFrame(levelRaf);
			const step = (now: number) => {
				levelPulseT = Math.min(1, (now - start) / 520);
				if (levelPulseT < 1) levelRaf = requestAnimationFrame(step);
			};
			levelPulseT = 0;
			levelRaf = requestAnimationFrame(step);
		}
		lastLevel = nextLevel;
	});
	$effect(() => () => cancelAnimationFrame(levelRaf));

	const drawTicket = (g: PixiGraphics) => {
		g.clear();
		// The plate is the card's paper and ink frame with a strip of the alley's
		// score screens for a header (v8FgCounter, design/build_strike_fg_sign.py,
		// 2026-10-18) — the red offset print and flat green band it replaced read
		// as program art. Only the level-up pulse is still drawn.
		const pulse = levelPulseT < 1 ? Math.sin(Math.PI * levelPulseT) : 0;
		if (pulse > 0) g.roundRect(4, 4, W - 8, H - 8, 13).stroke({ width: 4, color: RED, alpha: pulse });
	};

	// THE PIPS ARE BOWLING PINS (user, 2026-10-18; were a five-point trapezoid).
	// The silhouette is a half-width profile down the pin's height — round head,
	// thin neck, full belly, flat foot — sampled through a Catmull-Rom curve and
	// mirrored. Lit: a cream pin with the two red neck stripes, inked. Unlit: the
	// same pin as a faint empty outline, so the rung's length is always visible.
	const PIN_PROFILE: [number, number][] = [
		[0, 0], [0.006, 0.042], [0.025, 0.078], [0.07, 0.106], [0.13, 0.112], [0.2, 0.094], [0.27, 0.062],
		[0.33, 0.06], [0.42, 0.112], [0.54, 0.178], [0.66, 0.2], [0.78, 0.186], [0.9, 0.142],
		[0.97, 0.112], [1, 0.104],
	];
	const pinWidth = (y: number) => {
		const P = PIN_PROFILE;
		let i = 0;
		while (i < P.length - 2 && y > P[i + 1][0]) i++;
		const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
		const t = (y - p1[0]) / (p2[0] - p1[0] || 1);
		const t2 = t * t, t3 = t2 * t;
		return 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
			+ (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
	};
	const PIN_STEPS = 28;
	/** the pin's outline, `h` tall, its foot at (x, foot) */
	const pinOutline = (x: number, foot: number, h: number) => {
		const pts: number[] = [];
		// down the right side, then back up the left
		for (let i = 0; i <= PIN_STEPS; i++) {
			const v = i / PIN_STEPS;
			pts.push(x + Math.max(0, pinWidth(v)) * h, foot - h + v * h);
		}
		for (let i = PIN_STEPS; i >= 0; i--) {
			const v = i / PIN_STEPS;
			pts.push(x - Math.max(0, pinWidth(v)) * h, foot - h + v * h);
		}
		return pts;
	};
	/** a stripe across the neck from v0 to v1 of the height */
	const pinBand = (x: number, foot: number, h: number, v0: number, v1: number) => {
		const pts: number[] = [];
		for (const v of [v0, (v0 + v1) / 2, v1]) pts.push(x + pinWidth(v) * h, foot - h + v * h);
		for (const v of [v1, (v0 + v1) / 2, v0]) pts.push(x - pinWidth(v) * h, foot - h + v * h);
		return pts;
	};

	const drawPips = (g: PixiGraphics) => {
		g.clear();
		const n = Math.max(1, rungSize);
		const gap = W * 0.15;
		const startX = W * 0.5 - ((n - 1) * gap) / 2;
		// between the count (H .62) and the replacements line (H .93)
		const foot = H * 0.84;
		for (let i = 0; i < n; i++) {
			const lit = i < rungFilled;
			const k = i === popIndex && popT < 1 ? 1 + 0.45 * Math.sin(popT * Math.PI) : 1;
			const h = W * 0.13 * k;
			const x = startX + i * gap;
			if (lit) {
				g.poly(pinOutline(x, foot, h)).fill(PAPER);
				g.poly(pinBand(x, foot, h, 0.245, 0.285)).fill(RED);
				g.poly(pinBand(x, foot, h, 0.31, 0.345)).fill(RED);
				g.poly(pinOutline(x, foot, h)).stroke({ width: 2.4, color: INK, join: 'round' });
			} else {
				g.poly(pinOutline(x, foot, h)).fill({ color: INK, alpha: 0.08 });
				g.poly(pinOutline(x, foot, h)).stroke({ width: 2, color: INK, alpha: 0.4, join: 'round' });
			}
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<Sprite key="v8FgCounter" width={W} height={H} />
		<Graphics draw={drawTicket} />
		<Text
			anchor={0.5}
			x={W * 0.5}
			y={H * 0.14}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: titleSize,
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				fill: PAPER,
				stroke: { color: INK, width: 5, join: 'round' },
				wordWrap: false,
			}}
		/>
		<Text anchor={.5} x={W*.5} y={H*.44} text={`${Math.min(current,total)} / ${total}`} style={{fontFamily:NUMBER_FONT,fontSize:W*.19,fontWeight:'900',fill:INK,stroke:{color:PAPER,width:2}}}/>
		<Text anchor={.5} x={W*.5} y={H*.62} text={`${Math.min(meter.count,thresholds[thresholds.length-1])} / ${meter.nextAt ?? thresholds[thresholds.length-1]}`} style={{fontFamily:NUMBER_FONT,fontSize:W*.074,fill:INK,fontWeight:'900'}}/>
		<Graphics draw={drawPips} />
		<!-- Permanent low-symbol replacements already unlocked. -->
		<Container x={W * 0.5} y={H * 0.93} scale={1 + (levelPulseT < 1 ? .1 * Math.sin(Math.PI * levelPulseT) : 0)}>
			<Text
				anchor={0.5}
				text={meter.level ? `${removedLabelsAtLevel(meter.level)} → P` : gameText('chefMeter')}
				style={{
					fontFamily: GAME_FONT,
					fontSize: W * 0.075,
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 1,
					fill: meter.level > 0 ? UPGRADE : INK,
				}}
			/>
		</Container>
		{#if meter.level >= config.banditMeter.thresholds.length}
			<!-- All three replacement stages are active. -->
			<Graphics
				draw={(g) => {
					g.clear();
					g.roundRect(-4, -4, W + 8, H + 8, 18).stroke({ width: 5, color: UPGRADE });
				}}
			/>
		{/if}
	</FadeContainer>
</MainContainer>

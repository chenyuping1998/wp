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
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import config from '../game/config';
	import { removedLabelsAtLevel } from '../game/chefMeter';

	const context = getContext();

	const PAPER = 0xf3e9d2;
	const RED = 0xd9342b;
	const GREEN = 0x3e9fb0;
	const INK = 0x161412;
	const UPGRADE = 0xc2185b;

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
		// red offset print under the paper, like a misregistered second pass
		g.roundRect(6, 6, W, H, 14).fill(RED);
		g.roundRect(0, 0, W, H, 14).fill(PAPER).stroke({ width: 4, color: INK });
		const pulse = levelPulseT < 1 ? Math.sin(Math.PI * levelPulseT) : 0;
		if (pulse > 0) g.roundRect(3, 3, W - 6, H - 6, 11).stroke({ width: 3, color: RED, alpha: pulse });
		// green band behind the title
		g.roundRect(10, 10, W - 20, H * 0.22, 8).fill(GREEN);
	};

	const drawPips = (g: PixiGraphics) => {
		g.clear();
		const n = Math.max(1, rungSize);
		const gap = W * 0.16;
		const startX = W * 0.5 - ((n - 1) * gap) / 2;
		const y = H * 0.77;
		for (let i = 0; i < n; i++) {
			const lit = i < rungFilled;
			const k = i === popIndex && popT < 1 ? 1 + 0.6 * Math.sin(popT * Math.PI) : 1;
			const r = W * 0.055 * k;
			const x = startX + i * gap;
			g.circle(x + 2, y + 3, r).fill(INK);
			g.circle(x, y, r).fill(lit ? RED : PAPER).stroke({ width: 2.5, color: INK });
			g.circle(x, y, r * .51).stroke({ width: 1.5, color: lit ? PAPER : INK });
			g.circle(x, y, r * .18).fill(lit ? PAPER : INK);
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<Graphics draw={drawTicket} />
		<Text
			anchor={0.5}
			x={W * 0.5}
			y={10 + H * 0.11}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: titleSize,
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				fill: PAPER,
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

<script lang="ts" module>
	export type EmitterEventWinLines =
		| { type: 'winLinesShow'; wins: WinLineData[]; fast?: boolean }
		| { type: 'winLinesHide' }
		| { type: 'winLinesClear' };

	export type WinLineData = {
		lineIndex: number;
		positions: { reel: number; row: number }[];
		symbolCount: number;
		/** Maths symbol code, e.g. 'L2'. */
		symbol: string;
		/** How many in the run — 3, 4 or 5. */
		kind: number;
		/** This line's win, in book units (100 = 1x the stake). */
		win: number;
	};
</script>

<script lang="ts">
	import { Graphics, Container, Text } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS } from '../game/constants';
	import config from '../game/config';
	import { symbolLabel } from '../game/symbolLabels';
	import { GAME_FONT } from '../game/fonts';
	import { WHITE_HOT, CYAN, INK } from '../game/palette';

	const context = getContext();

	const LINE_COLORS = [
		0xff2288, 0x00eeff, 0xffee00, 0xff6600, 0x00ff88,
		0xcc44ff, 0x44aaff, 0xffaa00, 0xff44aa, 0x22ffcc,
		0xff4444, 0x88ff44, 0x4488ff, 0xff88ff, 0xaaff22,
		0xff6688, 0x66ffee, 0xffcc44, 0xaa66ff, 0x44ff66,
		0xff3366, 0x3399ff, 0xffff66, 0xff9944, 0x66ff99,
		0xdd44ff, 0x44ddff, 0xff6633, 0x99ff44, 0xff44dd,
		0x44ffbb, 0xffbb44, 0x7744ff, 0x44ff44, 0xff4477,
	];

	type DrawnLine = {
		lineIndex: number;
		color: number;
		points: { x: number; y: number }[];
	};

	// One beat per SYMBOL GROUP, not per line.
	//
	// This used to flick through one line every 140ms with nothing naming them,
	// and certification could not reconcile the payout against the pay table —
	// reasonably, because the screen never said which symbol had paid or how
	// much. A 35-payline board reaches 35 simultaneous line wins, so simply
	// slowing the cycle down was not available: at a readable pace that is half a
	// minute of animation.
	//
	// Lines that won on the same symbol and the same run length pay identically,
	// so they are one fact, not thirty-five. Grouping on (symbol, kind) collapses
	// every book in this game to at most 5 groups and 92% of them to 3 — which
	// fits comfortably at a pace someone can actually read.
	const GROUP_DELAY_FAST = 420;
	const GROUP_DELAY_NORMAL = 800;
	const WIN_LINE_END_DELAY = 80;

	type WinGroup = { key: string; lines: DrawnLine[]; label: string };

	// Centred on the board, just below the bottom row.
	const READOUT_X = (SYMBOL_SIZE * BOARD_DIMENSIONS.x) / 2;
	const READOUT_Y = SYMBOL_SIZE * BOARD_DIMENSIONS.y + 34;

	let drawnLines = $state<DrawnLine[]>([]);
	let readout = $state('');
	let show = $state(false);

	// Symbol center X: same formula as getSymbolX in utils.ts
	function symbolCenterX(reel: number) {
		return SYMBOL_SIZE * (reel + REEL_PADDING);
	}

	// Symbol center Y accounts for the reel default offset (-SYMBOL_SIZE)
	// Actual render: reelY(-120) + (arrayIndex + 0.5) * 120
	// Payline rows (0,1,2) map to padded array indices (1,2,3)
	function symbolCenterYFromPayline(paylineRow: number) {
		return -SYMBOL_SIZE + (paylineRow + 1 + 0.5) * SYMBOL_SIZE;
	}

	context.eventEmitter.subscribeOnMount({
		winLinesShow: async ({ wins, fast }) => {
			drawnLines = [];
			readout = '';
			show = true;

			// Group first, then build geometry, so the order the player sees is
			// the order the groups were found rather than payline order.
			const groups: WinGroup[] = [];
			const byKey = new Map<string, WinGroup>();

			for (const win of wins) {
				const paylineRows: number[] = (config.paylines as Record<string, number[]>)[
					String(win.lineIndex)
				];
				if (!paylineRows) continue;

				const points = paylineRows.map((row, reel) => ({
					x: symbolCenterX(reel),
					y: symbolCenterYFromPayline(row),
				}));
				const line: DrawnLine = {
					lineIndex: win.lineIndex,
					color: LINE_COLORS[(win.lineIndex - 1) % LINE_COLORS.length],
					points,
				};

				const key = `${win.symbol}x${win.kind}`;
				const existing = byKey.get(key);
				if (existing) {
					existing.lines.push(line);
					continue;
				}
				const group: WinGroup = { key, lines: [line], label: '' };
				byKey.set(key, group);
				groups.push(group);
			}

			// Label last, so it can state how many lines the group ended up with.
			for (const group of groups) {
				const win = wins.find((w) => `${w.symbol}x${w.kind}` === group.key);
				if (!win) continue;
				const amount = bookEventAmountToCurrencyString(win.win);
				const lines = group.lines.length > 1 ? ` · ${group.lines.length} lines` : '';
				group.label = `${symbolLabel(win.symbol)} ×${win.kind}  ${amount}${lines}`;
			}

			const delay = fast ? GROUP_DELAY_FAST : GROUP_DELAY_NORMAL;
			for (const group of groups) {
				drawnLines = group.lines;
				readout = group.label;
				await waitForTimeout(delay);
			}
			await waitForTimeout(WIN_LINE_END_DELAY);
		},
		winLinesHide: () => {
			show = false;
			drawnLines = [];
			readout = '';
		},
		winLinesClear: () => {
			drawnLines = [];
			readout = '';
		},
	});
</script>

{#if show && drawnLines.length > 0}
	<BoardContainer>
		<Container zIndex={10}>
			{#each drawnLines as line (line.lineIndex)}
				<Graphics
					draw={(g) => {
						if (!line.points || line.points.length < 2) return;
						g.clear();
						g.lineStyle(7, line.color, 0.22);
						g.moveTo(line.points[0].x, line.points[0].y);
						for (let i = 1; i < line.points.length; i++) g.lineTo(line.points[i].x, line.points[i].y);
						g.lineStyle(3, line.color, 0.95);
						g.moveTo(line.points[0].x, line.points[0].y);
						for (let i = 1; i < line.points.length; i++) g.lineTo(line.points[i].x, line.points[i].y);
						g.lineStyle(1.2, 0xffffff, 0.5);
						g.moveTo(line.points[0].x, line.points[0].y);
						for (let i = 1; i < line.points.length; i++) g.lineTo(line.points[i].x, line.points[i].y);
					}}
				/>
			{/each}

			<!-- Names the group the lit lines belong to: which symbol, how long a
			     run, and what it paid. Sits on the board's bottom edge, over the
			     housing rather than over a cell, so it never covers a symbol the
			     player is being asked to read. -->
			{#if readout}
				<Container x={READOUT_X} y={READOUT_Y}>
					<Graphics
						draw={(g) => {
							const w = Math.max(240, readout.length * 15 + 48);
							g.clear();
							g.beginFill(INK, 0.82);
							g.lineStyle(2, CYAN, 0.65);
							g.drawRoundedRect(-w / 2, -24, w, 48, 24);
							g.endFill();
						}}
					/>
					<Text
						anchor={0.5}
						text={readout}
						style={{
							fontFamily: GAME_FONT,
							fontSize: 26,
							fontWeight: '700',
							fill: WHITE_HOT,
							letterSpacing: 1.5,
							dropShadow: true,
							dropShadowColor: CYAN,
							dropShadowBlur: 10,
							dropShadowDistance: 0,
						}}
					/>
				</Container>
			{/if}
		</Container>
	</BoardContainer>
{/if}

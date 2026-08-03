<script lang="ts" module>
	import type { SymbolName } from '../game/types';

	export type SpinLedgerEntry = { symbol: SymbolName; count: number; win: number };

	export type EmitterEventSpinLedger =
		| { type: 'spinLedgerReset' }
		| { type: 'spinLedgerAdd'; entries: SpinLedgerEntry[] };
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';
	import { uiTheme } from 'components-ui-pixi';

	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { SYMBOL_INFO_MAP } from '../game/constants';
	import GoldText from './GoldText.svelte';

	/**
	 * A written record of what this spin paid: one row per symbol, how many were
	 * cleared across the whole tumble chain, and what that came to.
	 *
	 * This exists because a tumble game cannot do what a lines game does. There the
	 * win lines can be redrawn while the board sits idle, because the board on
	 * screen is the board that won. Here every winning symbol was destroyed and
	 * replaced by the fall that followed, so by the time the chain ends there is
	 * nothing left to point at.
	 *
	 * ── coordinate space ──
	 * Rendered in `MainContainer standard`, NOT the plain one. The Buy Bonus button
	 * this sits above is placed by LayoutBottomBar at `mainLayoutStandard().height *
	 * 0.46` inside a `standard` container, and the two boxes have different
	 * dimensions AND different scales. Positioning with standard-space numbers
	 * (railWidth, box.height) while rendering in game space is why earlier attempts
	 * kept landing on top of the button however large the gap was made — the
	 * arithmetic was right, it was just being applied in the wrong space.
	 */
	const context = getContext();

	let entries = $state<Record<string, { count: number; win: number }>>({});

	// Sorted by what paid most, so the row that matters is at the top.
	const allRows = $derived(
		Object.entries(entries)
			.map(([symbol, value]) => ({ symbol: symbol as SymbolName, ...value }))
			.sort((a, b) => b.win - a.win),
	);
	const total = $derived(allRows.reduce((sum, row) => sum + row.win, 0));

	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');

	// Chain depth used to live in its own floating panel above the board, which
	// collided with the free-spin counter. It costs nothing here: the header is
	// already reserved space, and the ledger is where a player is looking for what
	// this spin did anyway.
	const chain = $derived(context.stateGame.tumbleChain);
	const heading = $derived(chain > 1 ? `THIS SPIN · CHAIN x${chain}` : 'THIS SPIN');

	// ── geometry ────────────────────────────────────────────────────────────
	// UI_BASE_SIZE from components-ui-pixi, which does not export it. Kept here so
	// the panel keeps its proportion to the Buy Bonus button if that is rescaled.
	const UI_BASE_SIZE = 150;
	const buyBonusSize = $derived(UI_BASE_SIZE * uiTheme.buyBonusRailScale);

	const ROW_H = 26;
	const PAD = 8;
	const HEADER_H = 24;
	const GAP_ABOVE_BUY_BONUS = 20;
	const MAX_PORTRAIT_CHIPS = 5;

	/**
	 * How many rows fit between the top margin and the Buy Bonus button.
	 *
	 * Derived from the layout rather than fixed, because the answer differs per
	 * device: the same panel that fits six rows on desktop fits four on a short
	 * landscape box. Capping by measurement is what makes "never overlaps the
	 * button" true everywhere instead of true on the one screen it was tuned on.
	 *
	 * Books say at most seven distinct symbols can pay in one spin, and 93% of
	 * paying spins involve four or fewer — so the fold below is a rare case, not
	 * the normal presentation.
	 */
	const capacity = $derived.by(() => {
		if (isPortrait) return MAX_PORTRAIT_CHIPS;
		const box = context.stateLayoutDerived.mainLayoutStandard();
		const bottomLimit = box.height * 0.46 - buyBonusSize * 0.5 - GAP_ABOVE_BUY_BONUS;
		const topLimit = box.height * 0.03;
		const usable = bottomLimit - topLimit - HEADER_H - PAD * 2;
		return Math.max(2, Math.floor(usable / ROW_H));
	});

	// Fold the tail into one OTHERS row when the list cannot fit. Nothing is lost:
	// the folded rows still count towards TOTAL, which is the number that matters.
	const layout = $derived.by(() => {
		const wantsTotal = allRows.length > 1;
		const needed = allRows.length + (wantsTotal ? 1 : 0);
		if (needed <= capacity) {
			return { rows: allRows, others: null, showTotal: wantsTotal };
		}
		// leave room for the OTHERS row and the TOTAL row
		const keep = Math.max(1, capacity - 2);
		const shown = allRows.slice(0, keep);
		const rest = allRows.slice(keep);
		return {
			rows: shown,
			others: {
				count: rest.reduce((sum, row) => sum + row.count, 0),
				win: rest.reduce((sum, row) => sum + row.win, 0),
				symbols: rest.length,
			},
			showTotal: true,
		};
	});

	const bodyRows = $derived(
		Math.max(1, layout.rows.length + (layout.others ? 1 : 0) + (layout.showTotal ? 1 : 0)),
	);

	const panel = $derived.by(() => {
		const box = context.stateLayoutDerived.mainLayoutStandard();

		if (isPortrait) {
			const width = Math.min(box.width * 0.78, 820);
			const height = HEADER_H + PAD * 2 + ROW_H;
			return {
				width,
				height,
				x: box.width * 0.5 - width * 0.5,
				// Pinned near the top of the standard box. Portrait has no rail, and
				// the free-spin plaque already owns the band just above the board.
				y: box.height * 0.02,
				horizontal: true,
			};
		}

		const width = buyBonusSize * 0.72;
		const height = HEADER_H + PAD * 2 + ROW_H * bodyRows;
		const bottomLimit = box.height * 0.46 - buyBonusSize * 0.5 - GAP_ABOVE_BUY_BONUS;
		return {
			width,
			height,
			x: uiTheme.railWidth * 0.5 - width * 0.5,
			// Bottom-anchored: the panel grows upward from a fixed line above the
			// button, so adding rows can never walk it downward onto the button.
			y: bottomLimit - height,
			horizontal: false,
		};
	});

	const symbolTexture = (symbol: SymbolName) => SYMBOL_INFO_MAP[symbol].static.assetKey;

	const drawPanel = (graphics: PixiGraphics) => {
		graphics.clear();
		const { width, height } = panel;
		graphics.roundRect(0, 0, width, height, 10).fill({ color: 0x14181d, alpha: 0.92 });
		graphics.roundRect(0, 0, width, height, 10).stroke({ width: 2, color: 0xc9922f, alpha: 0.85 });
		graphics
			.moveTo(PAD, HEADER_H)
			.lineTo(width - PAD, HEADER_H)
			.stroke({ width: 1.5, color: 0xc9922f, alpha: 0.45 });
		if (layout.showTotal) {
			const y = HEADER_H + PAD + ROW_H * (bodyRows - 1);
			graphics
				.moveTo(PAD, y)
				.lineTo(width - PAD, y)
				.stroke({ width: 1.5, color: 0xc9922f, alpha: 0.3 });
		}
	};

	const labelStyle = (size: number, fill: number) => ({
		fontFamily: GAME_FONT,
		fontWeight: GAME_FONT_WEIGHT,
		fontSize: size,
		fill,
	});

	context.eventEmitter.subscribeOnMount({
		spinLedgerReset: () => (entries = {}),
		spinLedgerAdd: ({ entries: incoming }) => {
			const next = { ...entries };
			for (const entry of incoming) {
				const current = next[entry.symbol] ?? { count: 0, win: 0 };
				next[entry.symbol] = {
					count: current.count + entry.count,
					win: current.win + entry.win,
				};
			}
			entries = next;
		},
	});
</script>

<MainContainer standard>
	<Container x={panel.x} y={panel.y}>
		<Graphics draw={drawPanel} />

		<Text
			text={heading}
			x={panel.width * 0.5}
			y={HEADER_H * 0.5}
			anchor={{ x: 0.5, y: 0.5 }}
			style={{ ...labelStyle(chain > 1 ? 11 : 12, 0xe8c9a0), letterSpacing: 1 }}
		/>

		{#if allRows.length === 0}
			<Text
				text="—"
				x={panel.width * 0.5}
				y={HEADER_H + PAD + ROW_H * 0.5}
				anchor={{ x: 0.5, y: 0.5 }}
				style={labelStyle(15, 0x6b6257)}
			/>
		{:else if panel.horizontal}
			<!-- portrait: chips reading left to right in a single band -->
			{#each layout.rows.slice(0, MAX_PORTRAIT_CHIPS) as row, index (row.symbol)}
				{@const slot = panel.width / Math.min(layout.rows.length, MAX_PORTRAIT_CHIPS)}
				{@const cx = slot * (index + 0.5)}
				<Sprite
					key={symbolTexture(row.symbol)}
					anchor={{ x: 0.5, y: 0.5 }}
					x={cx - slot * 0.3}
					y={HEADER_H + PAD + ROW_H * 0.5}
					width={ROW_H * 0.9}
					height={ROW_H * 0.9}
				/>
				<Text
					text={`x${row.count}`}
					x={cx - slot * 0.02}
					y={HEADER_H + PAD + ROW_H * 0.5}
					anchor={{ x: 0.5, y: 0.5 }}
					style={labelStyle(13, 0xbfa588)}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(row.win)}
					fontSize={14}
					x={cx + slot * 0.28}
					y={HEADER_H + PAD + ROW_H * 0.5}
					anchor={{ x: 0.5, y: 0.5 }}
					maxWidth={slot * 0.42}
				/>
			{/each}
		{:else}
			{#each layout.rows as row, index (row.symbol)}
				{@const rowY = HEADER_H + PAD + ROW_H * (index + 0.5)}
				<Sprite
					key={symbolTexture(row.symbol)}
					anchor={{ x: 0.5, y: 0.5 }}
					x={PAD + ROW_H * 0.42}
					y={rowY}
					width={ROW_H * 0.88}
					height={ROW_H * 0.88}
				/>
				<Text
					text={`x${row.count}`}
					x={PAD + ROW_H * 0.95}
					y={rowY}
					anchor={{ x: 0, y: 0.5 }}
					style={labelStyle(12, 0xbfa588)}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(row.win)}
					fontSize={13}
					x={panel.width - PAD}
					y={rowY}
					anchor={{ x: 1, y: 0.5 }}
					maxWidth={panel.width * 0.46}
				/>
			{/each}

			{#if layout.others}
				{@const othersY = HEADER_H + PAD + ROW_H * (layout.rows.length + 0.5)}
				<Text
					text={`+${layout.others.symbols} MORE`}
					x={PAD}
					y={othersY}
					anchor={{ x: 0, y: 0.5 }}
					style={labelStyle(11, 0xbfa588)}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(layout.others.win)}
					fontSize={13}
					x={panel.width - PAD}
					y={othersY}
					anchor={{ x: 1, y: 0.5 }}
					maxWidth={panel.width * 0.46}
				/>
			{/if}

			{#if layout.showTotal}
				{@const totalY = HEADER_H + PAD + ROW_H * (bodyRows - 0.5)}
				<Text
					text="TOTAL"
					x={PAD}
					y={totalY}
					anchor={{ x: 0, y: 0.5 }}
					style={{ ...labelStyle(11, 0xe8c9a0), letterSpacing: 1 }}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(total)}
					fontSize={15}
					x={panel.width - PAD}
					y={totalY}
					anchor={{ x: 1, y: 0.5 }}
					maxWidth={panel.width * 0.54}
				/>
			{/if}
		{/if}
	</Container>
</MainContainer>

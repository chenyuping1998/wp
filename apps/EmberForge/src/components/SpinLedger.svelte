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

	// Raised from 26/8/24. The panel was legible but small — a symbol at 23px with
	// a 12px count beside it is a label, not a readout, and this is the only
	// record of what a spin paid once the tumble has taken the symbols away.
	const ROW_H_BASE = 34;
	const PAD_BASE = 10;
	const HEADER_H_BASE = 30;
	const GAP_ABOVE_BUY_BONUS_BASE = 20;
	const MAX_PORTRAIT_CHIPS = 5;
	// Below this many rows the vertical panel is not worth its own frame: three
	// symbols plus a TOTAL is the least that reads as a ledger rather than as a
	// cropped list. Under it, the compact band is used instead.
	const MIN_VERTICAL_ROWS = 3;
	/**
	 * Scale compensation.
	 *
	 * `mainLayoutStandard` is a fixed 1920x1080 virtual box scaled to fit whatever
	 * canvas it is given, so every metric above is in standard units and the REAL
	 * size on screen is those units times the box scale. That is right for the
	 * board, which should shrink with the window. It is wrong for a text readout,
	 * which stops working below a physical size:
	 *
	 *     desktop 1280x720   scale 0.67   amount text 10.7px
	 *     popout M  900x560  scale 0.47   amount text  7.5px
	 *     popout S  660x400  scale 0.34   amount text  5.5px
	 *
	 * So the ledger grows in standard units as the box shrinks, holding its real
	 * size roughly constant. Capped, because past that the panel would need more
	 * than the rail it stands in — and when the cap is not enough the row count
	 * falls under MIN_VERTICAL_ROWS and the compact band takes over, which is the
	 * honest outcome for a viewport that small.
	 */
	const REFERENCE_SCALE = 0.667;
	const MAX_UI_SCALE = 2.2;
	const uiScale = $derived.by(() => {
		const box = context.stateLayoutDerived.mainLayoutStandard();
		return Math.min(MAX_UI_SCALE, Math.max(1, REFERENCE_SCALE / box.scale));
	});

	const rowH = $derived(ROW_H_BASE * uiScale);
	const pad = $derived(PAD_BASE * uiScale);
	const headerH = $derived(HEADER_H_BASE * uiScale);
	const gapAboveBuyBonus = $derived(GAP_ABOVE_BUY_BONUS_BASE * uiScale);
	/** Text is authored at reference scale and follows the panel. */
	const fs = (size: number) => size * uiScale;


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
	const verticalCapacity = $derived.by(() => {
		const box = context.stateLayoutDerived.mainLayoutStandard();
		const bottomLimit = box.height * 0.46 - buyBonusSize * 0.5 - gapAboveBuyBonus;
		const topLimit = box.height * 0.03;
		const usable = bottomLimit - topLimit - headerH - pad * 2;
		return Math.floor(usable / rowH);
	});

	/**
	 * Compact mode: one horizontal band instead of the standing panel.
	 *
	 * Portrait has always used it — there is no rail to stand a panel in. Short
	 * landscape boxes now use it too. Popout S is the case that forced this: the
	 * rail is there but there is barely any height in it, and the honest answer is
	 * that a taller panel does not fit rather than to shrink the rows until they
	 * are unreadable again. The band needs one row of height and gets the same
	 * information, folded.
	 */
	const compact = $derived(isPortrait || verticalCapacity < MIN_VERTICAL_ROWS);
	const capacity = $derived(compact ? MAX_PORTRAIT_CHIPS : verticalCapacity);

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

		if (compact) {
			const width = Math.min(box.width * 0.78, 820);
			const height = headerH + pad * 2 + rowH;
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

		// 0.72 -> 0.95 of the Buy Bonus button. The rail is that wide already, and
		// the panel was leaving a quarter of it empty on both sides while the
		// amounts inside were being scaled down to fit.
		// Clamped to the rail: at the top of the compensation range the uncapped
		// width is wider than the rail the panel stands in.
		const width = Math.min(buyBonusSize * 0.95 * uiScale, uiTheme.railWidth * 0.9);
		const height = headerH + pad * 2 + rowH * bodyRows;
		const bottomLimit = box.height * 0.46 - buyBonusSize * 0.5 - gapAboveBuyBonus;
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
			.moveTo(pad, headerH)
			.lineTo(width - pad, headerH)
			.stroke({ width: 1.5, color: 0xc9922f, alpha: 0.45 });
		if (layout.showTotal) {
			const y = headerH + pad + rowH * (bodyRows - 1);
			graphics
				.moveTo(pad, y)
				.lineTo(width - pad, y)
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
			y={headerH * 0.5}
			anchor={{ x: 0.5, y: 0.5 }}
			style={{ ...labelStyle(chain > 1 ? fs(13) : fs(14), 0xe8c9a0), letterSpacing: 1 }}
		/>

		{#if allRows.length === 0}
			<Text
				text="—"
				x={panel.width * 0.5}
				y={headerH + pad + rowH * 0.5}
				anchor={{ x: 0.5, y: 0.5 }}
				style={labelStyle(fs(19), 0x6b6257)}
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
					y={headerH + pad + rowH * 0.5}
					width={rowH * 0.9}
					height={rowH * 0.9}
				/>
				<Text
					text={`x${row.count}`}
					x={cx - slot * 0.02}
					y={headerH + pad + rowH * 0.5}
					anchor={{ x: 0.5, y: 0.5 }}
					style={labelStyle(fs(15), 0xbfa588)}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(row.win)}
					fontSize={fs(16)}
					x={cx + slot * 0.28}
					y={headerH + pad + rowH * 0.5}
					anchor={{ x: 0.5, y: 0.5 }}
					maxWidth={slot * 0.42}
				/>
			{/each}
		{:else}
			{#each layout.rows as row, index (row.symbol)}
				{@const rowY = headerH + pad + rowH * (index + 0.5)}
				<Sprite
					key={symbolTexture(row.symbol)}
					anchor={{ x: 0.5, y: 0.5 }}
					x={pad + rowH * 0.42}
					y={rowY}
					width={rowH * 0.88}
					height={rowH * 0.88}
				/>
				<Text
					text={`x${row.count}`}
					x={pad + rowH * 0.95}
					y={rowY}
					anchor={{ x: 0, y: 0.5 }}
					style={labelStyle(fs(15), 0xbfa588)}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(row.win)}
					fontSize={fs(16)}
					x={panel.width - pad}
					y={rowY}
					anchor={{ x: 1, y: 0.5 }}
					maxWidth={panel.width * 0.46}
				/>
			{/each}

			{#if layout.others}
				{@const othersY = headerH + pad + rowH * (layout.rows.length + 0.5)}
				<Text
					text={`+${layout.others.symbols} MORE`}
					x={pad}
					y={othersY}
					anchor={{ x: 0, y: 0.5 }}
					style={labelStyle(fs(13), 0xbfa588)}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(layout.others.win)}
					fontSize={fs(15)}
					x={panel.width - pad}
					y={othersY}
					anchor={{ x: 1, y: 0.5 }}
					maxWidth={panel.width * 0.46}
				/>
			{/if}

			{#if layout.showTotal}
				{@const totalY = headerH + pad + rowH * (bodyRows - 0.5)}
				<Text
					text="TOTAL"
					x={pad}
					y={totalY}
					anchor={{ x: 0, y: 0.5 }}
					style={{ ...labelStyle(fs(13), 0xe8c9a0), letterSpacing: 1 }}
				/>
				<GoldText
					text={bookEventAmountToCurrencyString(total)}
					fontSize={fs(18)}
					x={panel.width - pad}
					y={totalY}
					anchor={{ x: 1, y: 0.5 }}
					maxWidth={panel.width * 0.54}
				/>
			{/if}
		{/if}
	</Container>
</MainContainer>

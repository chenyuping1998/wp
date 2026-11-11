<script lang="ts" module>
	export type EmitterEventWildColumns =
		| { type: 'wildColumnExpand'; wilds: { reel: number; row: number }[]; reels: number[] }
		| { type: 'wildColumnClear' };
</script>

<script lang="ts">
	/**
	 * The Violin Case filling its reel with Wilds.
	 *
	 * This owns BOTH the beat and the substitution, and the substitution is not
	 * optional. `reveal` carries the board as DEALT — the case still sitting in
	 * its cell and the rest of the reel untouched — while the maths evaluated
	 * the spin against a reel that was already all Wild. Nothing else in the
	 * stream ever restates that board, so without the swap below the player
	 * watches a payline light up an L4 and pay as if it were a Wild.
	 *
	 * Splitting it this way is deliberate rather than a workaround: emitting the
	 * post-expansion board from `reveal` instead would fix the mismatch and
	 * throw away the feature, because the case would never be seen landing.
	 *
	 * Three beats, in order:
	 *
	 *   1. the case opens at its own cell, light behind it (~90ms)
	 *   2. a beam sweeping down the reel, turning each
	 *      cell Wild as it passes                        (~260ms)
	 *   3. the column holding lit, then fading           (~380ms)
	 *
	 * The sweep runs top-to-bottom from the case rather than outward from it in
	 * both directions: a single direction reads as the column being *filled*,
	 * which is what happened, while a symmetric bloom reads as an explosion,
	 * which is not.
	 *
	 * Art Deco B version (2026-10-04): the Tommy Gun's muzzle flash, shells,
	 * bullet holes and red beam are gone. The case opening is its own art
	 * (capoFx/sw_case_open.png) and the column is a paper-white stepped beam
	 * (design/build_sw_beam.py). No red: red belongs to the multiplier frames.
	 */
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Container, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { featureScaled } from '../game/timeScale';
	import { getSymbolX } from '../game/utils';
	import { BONE } from '../game/palette';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	// Paper white (ART_BRIEF §0.3). The special wild is told apart by light, not
	// by colour: red is the multiplier frames' and nothing else's.
	const PAPER = BONE;

	// Rows are padded by one on the wire, so the drawn column spans the four
	// playable rows starting at padded row 1 — centres at (r - 0.5) * SYMBOL_SIZE.
	const ROWS = BOARD_DIMENSIONS.y;
	const columnHeight = SYMBOL_SIZE * ROWS;
	const columnCentreY = ((1 + ROWS) / 2 - 0.5) * SYMBOL_SIZE;
	/** How long the fill takes to travel the reel, top to bottom. */
	const SWEEP_MS = 260;

	/**
	 * Ceiling on the opening flash, in cells.
	 *
	 * WildColumns is a SIBLING of Board, not a child of it — that is deliberate,
	 * because additive light drawn inside BoardMask would have nothing to add to
	 * and would vanish. The cost of sitting outside the mask is that nothing
	 * clips this sprite, so its size is the only thing keeping it on the board.
	 *
	 * The case can land on the top or the bottom row, and from either of those
	 * cell centres the board edge is half a cell away. A sprite of k cells
	 * centred there spills (k / 2 - 0.5) cells past the edge, so k = 3.0 — what
	 * this was — threw the explosion a full cell past the board and onto the bet
	 * bar. 1.6 keeps the worst-case spill to 0.3 of a cell, which reads as light
	 * escaping the frame rather than as art in the wrong place.
	 */
	const FLASH_MAX = 1.6;
	const FLASH_CORE_MAX = 1.35;
	const rowCenterY = (row: number) => (row - 0.5) * SYMBOL_SIZE;

	const scaled = (ms: number) => featureScaled(ms);

	/**
	 * Turn one cell Wild, unless it holds a Scatter.
	 *
	 * The exclusion mirrors the maths exactly (game_executables.py,
	 * expand_special_wilds): a Scatter in an expanding reel survives, so the
	 * board here and the board the win was calculated on stay the same board.
	 * Getting this wrong in either direction is a payout the player cannot
	 * reconcile with what they can see.
	 */
	const turnWild = (reel: number, paddedRow: number) => {
		const symbol = context.stateGame.board[reel]?.reelState.symbols[paddedRow];
		if (!symbol || symbol.rawSymbol.scatter) return;
		symbol.rawSymbol = { name: 'W', wild: true };
	};

	type Column = {
		reel: number;
		row: number;
		/** 0 -> 1 as the fill sweeps down the reel */
		sweep: Tween<number>;
		/** overall column brightness, held after the sweep then faded */
		lit: Tween<number>;
		/** the case opening, at its own cell */
		flash: Tween<number>;
	};

	let columns = $state<Column[]>([]);

	const makeColumn = (wild: { reel: number; row: number }): Column => ({
		reel: wild.reel,
		row: wild.row,
		sweep: new Tween(0, { duration: 0 }),
		lit: new Tween(0, { duration: 0 }),
		flash: new Tween(0, { duration: 0 }),
	});

	context.eventEmitter.subscribeOnMount({
		wildColumnExpand: async ({ wilds }) => {
			columns = wilds.map(makeColumn);

			// Cases on separate reels open together rather than in sequence. Two
			// columns is already the good outcome; staggering them would make the
			// second one read as a consolation rather than as a doubling.
			await Promise.all(
				columns.map(async (column) => {
					await column.flash.set(1, { duration: scaled(90), easing: backOut });
					void column.flash.set(0, { duration: scaled(240), easing: cubicOut });
					void column.lit.set(1, { duration: scaled(120), easing: cubicOut });

					// The beam and the substitution run on the same clock: each row
					// turns Wild as the leading edge reaches it, so the fill is
					// something the player watches happen rather than a board that
					// was already different by the time the effect finished.
					const beam = column.sweep.set(1, { duration: scaled(SWEEP_MS), easing: cubicOut });
					for (let paddedRow = 1; paddedRow <= ROWS; paddedRow += 1) {
						await waitForTimeout(scaled(SWEEP_MS / ROWS));
						turnWild(column.reel, paddedRow);
					}
					await beam;

					await waitForTimeout(scaled(380));
					await column.lit.set(0, { duration: scaled(260), easing: cubicOut });
				}),
			);
			columns = [];
		},
		wildColumnClear: async () => {
			columns = [];
		},
	});
</script>

<BoardContainer>
	{#each columns as column (column.reel)}
		{@const x = getSymbolX(column.reel)}
		{@const lit = column.lit.current}
		{@const sweep = column.sweep.current}
		<Container {x}>
			<!--
				The filled part of the reel. Height is driven by `sweep`, and the
				container is anchored at the TOP of the column so it grows downward
				instead of growing from its own centre in both directions.
			-->
			{#if lit > 0.01 && sweep > 0.001}
				<Sprite
					key="capoSwBeam"
					anchor={{ x: 0.5, y: 0 }}
					y={columnCentreY - columnHeight / 2}
					tint={PAPER}
					blendMode="add"
					width={SYMBOL_SIZE * 1.02}
					height={columnHeight * sweep}
					alpha={0.5 * lit}
				/>
				<!-- the leading edge of the fill, brighter than what it leaves behind -->
				<Sprite
					key="fxStreak"
					anchor={{ x: 0.5, y: 0.5 }}
					y={columnCentreY - columnHeight / 2 + columnHeight * sweep}
					rotation={Math.PI / 2}
					tint={PAPER}
					blendMode="add"
					width={SYMBOL_SIZE * 0.55}
					height={SYMBOL_SIZE * 1.6}
					alpha={0.85 * lit * Math.sin(Math.PI * Math.min(1, sweep))}
				/>
			{/if}

			<!-- the case opening, at the cell it landed on: a paper-white flash
			     behind it, and the open-lid art over the closed case. The open case
			     stays up while the column is lit; only its pop in size follows the
			     flash. -->
			{#if column.flash.current > 0.01}
				<Sprite
					key="fxGlow"
					anchor={{ x: 0.5, y: 0.5 }}
					y={rowCenterY(column.row)}
					tint={PAPER}
					blendMode="add"
					width={SYMBOL_SIZE * (0.9 + (FLASH_MAX - 0.9) * column.flash.current)}
					height={SYMBOL_SIZE * (0.9 + (FLASH_MAX - 0.9) * column.flash.current)}
					alpha={0.8 * column.flash.current}
				/>
			{/if}
			{#if column.flash.current > 0.01 || column.lit.current > 0.01}
				<Sprite
					key="capoSwCaseOpen"
					anchor={{ x: 0.5, y: 0.5 }}
					y={rowCenterY(column.row)}
					width={SYMBOL_SIZE * (0.9 + (FLASH_CORE_MAX - 0.9) * column.flash.current)}
					height={SYMBOL_SIZE * (0.9 + (FLASH_CORE_MAX - 0.9) * column.flash.current)}
					alpha={Math.max(column.flash.current, column.lit.current)}
				/>
			{/if}
		</Container>
	{/each}
</BoardContainer>

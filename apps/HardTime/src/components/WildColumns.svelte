<script lang="ts" module>
	export type EmitterEventWildColumns = { type: 'wildColumnClear' };
</script>

<script lang="ts">
	/**
	 * A searchlight beam sweeping DOWN its reel and turning cells Wild.
	 *
	 * This owns BOTH the beat and the substitution, and the substitution is not
	 * optional. `reveal` carries the board as DEALT — the searchlight still
	 * sitting in its cell and the rest of the reel untouched — while the maths
	 * evaluated the spin against the lit cells already being Wild. Nothing else
	 * in the stream restates that board, so without the swap below the player
	 * watches a payline light up an L4 and pay as if it were a Wild.
	 *
	 * Splitting it this way is deliberate rather than a workaround: emitting the
	 * post-sweep board from `reveal` instead would fix the mismatch and throw
	 * away the feature, because the light would never be seen landing.
	 *
	 * The beam runs from the landing row DOWN to the floor, never upward, and
	 * the cells above it are untouched — that asymmetry is the mechanic, so the
	 * loop below starts at the light's own row rather than at the top.
	 *
	 * Three beats, in order:
	 *
	 *   1. muzzle flash at the gun's own cell            (~90ms)
	 *   2. a beam sweeping down the reel, turning each
	 *      cell Wild as it passes                        (~260ms)
	 *   3. the column holding lit, then fading           (~380ms)
	 *
	 * The sweep runs top-to-bottom from the gun rather than outward from it in
	 * both directions: a single direction reads as the column being *filled*,
	 * which is what happened, while a symmetric bloom reads as an explosion,
	 * which is not.
	 *
	 * The dedicated cold beam is authored for Hard Time's prison-searchlight signal.
	 */
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Container, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { featureScaled } from '../game/timeScale';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	// Cold light is exclusive to the searchlight mechanic; red belongs to alarms.
	const SIGNAL_LIGHT = 0xdce8f0;
	const HOT = 0x8fb4c8;

	// Rows are padded by one on the wire, so the drawn column spans the four
	// playable rows starting at padded row 1 — centres at (r - 0.5) * SYMBOL_SIZE.
	const ROWS = BOARD_DIMENSIONS.y;
	/** How long the fill takes to travel the reel, top to bottom. */
	const SWEEP_MS = 260;

	/**
	 * Ceiling on the muzzle flash, in cells.
	 *
	 * WildColumns is a SIBLING of Board, not a child of it — that is deliberate,
	 * because additive light drawn inside BoardMask would have nothing to add to
	 * and would vanish. The cost of sitting outside the mask is that nothing
	 * clips this sprite, so its size is the only thing keeping it on the board.
	 *
	 * The gun can land on the top or the bottom row, and from either of those
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
		/** the muzzle flash at the gun's own cell */
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
		searchlightSweep: async ({ reel, row }) => {
			const column = makeColumn({ reel, row });
			columns = [column];

			// How many cells this beam actually covers. A light on the top row
			// sweeps all four; one on the bottom row sweeps a single cell. The
			// duration scales with that so a short beam is a short gesture — a
			// one-cell sweep played over the full 260ms reads as a stall.
			const covered = ROWS - row + 1;
			const sweepMs = SWEEP_MS * (covered / ROWS);

			await column.flash.set(1, { duration: scaled(90), easing: backOut });
			void column.flash.set(0, { duration: scaled(240), easing: cubicOut });
			void column.lit.set(1, { duration: scaled(120), easing: cubicOut });

			// The beam and the substitution run on the same clock: each row turns
			// Wild as the leading edge reaches it, so the fill is something the
			// player watches happen rather than a board that was already different
			// by the time the effect finished.
			const beam = column.sweep.set(1, { duration: scaled(sweepMs), easing: cubicOut });
			for (let paddedRow = row; paddedRow <= ROWS; paddedRow += 1) {
				await waitForTimeout(scaled(sweepMs / covered));
				turnWild(column.reel, paddedRow);
			}
			await beam;

			await waitForTimeout(scaled(380));
			await column.lit.set(0, { duration: scaled(260), easing: cubicOut });
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
		<!--
			The beam starts at the TOP EDGE of the cell the light landed on, not at
			the top of the reel, and is only as tall as the cells below it. Capo
			Nostra's gun filled the whole column so both were the column's own
			geometry; here they are the light's, and using the column's would draw
			a beam through cells the maths never turned Wild.

			rowCenterY(r) is (r - 0.5) * SYMBOL_SIZE, so the top edge of row r is
			(r - 1) * SYMBOL_SIZE — which for row 1 is 0, exactly where the old
			`columnCentreY - columnHeight / 2` landed.
		-->
		{@const beamTop = (column.row - 1) * SYMBOL_SIZE}
		{@const beamHeight = SYMBOL_SIZE * (ROWS - column.row + 1)}
		<Container {x}>
			<!--
				The lit part of the reel. Height is driven by `sweep`, anchored at the
				beam's own top edge so it grows downward instead of growing from its
				centre in both directions.
			-->
			{#if lit > 0.01 && sweep > 0.001}
				<Sprite
					key="capoSwBeam"
					anchor={{ x: 0.5, y: 0 }}
					y={beamTop}
					tint={SIGNAL_LIGHT}
					blendMode="screen"
					width={SYMBOL_SIZE * 1.02}
					height={beamHeight * sweep}
					alpha={0.65 * lit}
				/>
				<!-- the leading edge of the fill, brighter than what it leaves behind -->
				<Sprite
					key="fxStreak"
					anchor={{ x: 0.5, y: 0.5 }}
					y={beamTop + beamHeight * sweep}
					rotation={Math.PI / 2}
					tint={HOT}
					blendMode="add"
					width={SYMBOL_SIZE * 0.55}
					height={SYMBOL_SIZE * 1.6}
					alpha={0.85 * lit * Math.sin(Math.PI * Math.min(1, sweep))}
				/>
			{/if}

			<!-- lamp flare, at the cell the searchlight itself landed on -->
			{#if column.flash.current > 0.01}
				<Sprite
					key="fxGlow"
					anchor={{ x: 0.5, y: 0.5 }}
					y={rowCenterY(column.row)}
					tint={HOT}
					blendMode="screen"
					width={SYMBOL_SIZE * (0.9 + (FLASH_MAX - 0.9) * column.flash.current)}
					height={SYMBOL_SIZE * (0.9 + (FLASH_MAX - 0.9) * column.flash.current)}
					alpha={column.flash.current}
				/>
				<Sprite
					key="fxGlow"
					anchor={{ x: 0.5, y: 0.5 }}
					y={rowCenterY(column.row)}
					tint={0xffffff}
					blendMode="add"
					width={SYMBOL_SIZE * (0.6 + (FLASH_CORE_MAX - 0.6) * column.flash.current)}
					height={SYMBOL_SIZE * (0.6 + (FLASH_CORE_MAX - 0.6) * column.flash.current)}
					alpha={0.9 * column.flash.current}
				/>
			{/if}
		</Container>
	{/each}
</BoardContainer>

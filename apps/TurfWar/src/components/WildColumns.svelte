<script lang="ts" module>
	export type EmitterEventWildColumns =
		| { type: 'wildColumnExpand'; wilds: { reel: number; row: number }[]; reels: number[] }
		| { type: 'wildColumnClear' }
		// Kingpin: the full cumulative set of held Wild columns for this feature.
		| { type: 'stickyWildsHold'; cells: { reel: number; row: number }[]; reels: number[] }
		| { type: 'stickyWildsClear' }
		| { type: 'bigScorePlay'; mult: number };
</script>

<script lang="ts">
	/**
	 * The Bruiser filling its reel with Wilds.
	 *
	 * This owns BOTH the beat and the substitution, and the substitution is not
	 * optional. `reveal` carries the board as DEALT — the gun still sitting in
	 * its cell and the rest of the reel untouched — while the maths evaluated
	 * the spin against a reel that was already all Wild. Nothing else in the
	 * stream ever restates that board, so without the swap below the player
	 * watches a payline light up an L4 and pay as if it were a Wild.
	 *
	 * Splitting it this way is deliberate rather than a workaround: emitting the
	 * post-expansion board from `reveal` instead would fix the mismatch and
	 * throw away the feature, because the gun would never be seen landing.
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
	 * The dedicated comic-print beam, muzzle flash, shells and impact texture are
	 * authored under sprites/capoFx and share the Bruiser's signal-red accent.
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

	// The one saturated red in the game. ART_BRIEF.md reserves #B22222 for this
	// mechanic and nothing else, so a red flash on the board can only ever mean
	// the Bruiser.
	const SIGNAL_RED = 0xb22222;
	const HOT = 0xffb08a;

	// Rows are padded by one on the wire, so the drawn column spans the four
	// playable rows starting at padded row 1 — centres at (r - 0.5) * SYMBOL_SIZE.
	const ROWS = BOARD_DIMENSIONS.y;
	const columnHeight = SYMBOL_SIZE * ROWS;
	const columnCentreY = ((1 + ROWS) / 2 - 0.5) * SYMBOL_SIZE;
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

	/**
	 * Reels HELD Wild for the rest of the feature (Kingpin).
	 *
	 * This is a standing overlay, not a beat: once a Bruiser takes a column it
	 * stays marked here, spin after spin, until the feature ends. The transient
	 * `columns` beat above still plays once, when the column is first taken; from
	 * the next spin on it is this layer that carries it, so the player reads the
	 * Wilds as locked in place rather than as re-landing every spin.
	 */
	let heldReels = $state<number[]>([]);
	// A slow breathing pulse on the chain overlay so a held column reads as
	// active rather than as a static decal. One shared clock for all of them.
	let holdPulse = new Tween(0, { duration: 0 });
	let holdPulseRunning = false;
	const runHoldPulse = async () => {
		if (holdPulseRunning) return;
		holdPulseRunning = true;
		while (heldReels.length > 0) {
			await holdPulse.set(1, { duration: 1400, easing: cubicOut });
			await holdPulse.set(0, { duration: 1400, easing: cubicOut });
		}
		holdPulseRunning = false;
	};

	const makeColumn = (wild: { reel: number; row: number }): Column => ({
		reel: wild.reel,
		row: wild.row,
		sweep: new Tween(0, { duration: 0 }),
		lit: new Tween(0, { duration: 0 }),
		flash: new Tween(0, { duration: 0 }),
	});

	context.eventEmitter.subscribeOnMount({
		wildColumnExpand: async ({ wilds }) => {
			// A reel already held plays no fresh beat - the held overlay owns it.
			columns = wilds.filter((w) => !heldReels.includes(w.reel)).map(makeColumn);
			if (columns.length === 0) return;

			// Guns on separate reels fire together rather than in sequence. Two
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
		stickyWildsHold: async ({ reels }) => {
			heldReels = reels;
			void runHoldPulse();
		},
		stickyWildsClear: async () => {
			heldReels = [];
		},
		// The Big Score's own beat lives elsewhere; this consumer only exists so
		// the broadcastAsync in the handler resolves.
		bigScorePlay: async () => {},
	});
</script>

<BoardContainer>
	<!--
		Held Wild columns (Kingpin). A standing chain overlay down each held reel,
		breathing slowly so it reads as locked-and-live rather than a static decal.
		Drawn first so the transient expand beat, when a column is first taken,
		sits on top of it.
	-->
	{#each heldReels as reel (reel)}
		{@const x = getSymbolX(reel)}
		{@const pulse = holdPulse.current}
		<Container {x}>
			<!-- a light red column bed behind the chain art. The chain sprite
			     itself now carries most of the red (bolder art, 2026-09-07), so
			     this is just a slow breathing wash, not the main event. -->
			<Sprite
				key="capoSwBeam"
				anchor={{ x: 0.5, y: 0.5 }}
				y={columnCentreY}
				tint={SIGNAL_RED}
				blendMode="screen"
				width={SYMBOL_SIZE * 1.02}
				height={columnHeight}
				alpha={0.1 + 0.14 * pulse}
			/>
			<Sprite
				key="turfWildLocked"
				anchor={{ x: 0.5, y: 0.5 }}
				y={columnCentreY}
				width={SYMBOL_SIZE}
				height={columnHeight}
				alpha={1}
			/>
		</Container>
	{/each}

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
					tint={SIGNAL_RED}
					blendMode="screen"
					width={SYMBOL_SIZE * 1.02}
					height={columnHeight * sweep}
					alpha={0.72 * lit}
				/>
				<Sprite
					key="capoSwBulletHoles"
					anchor={{ x: 0.5, y: 0 }}
					y={columnCentreY - columnHeight / 2}
					width={SYMBOL_SIZE}
					height={columnHeight}
					alpha={0.28 * lit * sweep}
				/>
				<!-- the leading edge of the fill, brighter than what it leaves behind -->
				<Sprite
					key="fxStreak"
					anchor={{ x: 0.5, y: 0.5 }}
					y={columnCentreY - columnHeight / 2 + columnHeight * sweep}
					rotation={Math.PI / 2}
					tint={HOT}
					blendMode="add"
					width={SYMBOL_SIZE * 0.55}
					height={SYMBOL_SIZE * 1.6}
					alpha={0.85 * lit * Math.sin(Math.PI * Math.min(1, sweep))}
				/>
			{/if}

			<!-- muzzle flash, at the cell the gun itself landed on -->
			{#if column.flash.current > 0.01}
				<Sprite
					key="capoSwMuzzle"
					anchor={{ x: 0.5, y: 0.5 }}
					y={rowCenterY(column.row)}
					tint={HOT}
					blendMode="screen"
					width={SYMBOL_SIZE * (0.9 + (FLASH_MAX - 0.9) * column.flash.current)}
					height={SYMBOL_SIZE * (0.9 + (FLASH_MAX - 0.9) * column.flash.current)}
					alpha={column.flash.current}
				/>
				<Sprite
					key="capoSwMuzzle"
					anchor={{ x: 0.5, y: 0.5 }}
					y={rowCenterY(column.row)}
					tint={0xffffff}
					blendMode="add"
					width={SYMBOL_SIZE * (0.6 + (FLASH_CORE_MAX - 0.6) * column.flash.current)}
					height={SYMBOL_SIZE * (0.6 + (FLASH_CORE_MAX - 0.6) * column.flash.current)}
					alpha={0.9 * column.flash.current}
				/>
				{#each [-1, 0, 1] as shellIndex}
					<Sprite
						key="capoSwShell"
						anchor={0.5}
						x={SYMBOL_SIZE * (0.24 + shellIndex * 0.12)}
						y={rowCenterY(column.row) + SYMBOL_SIZE * (0.06 + Math.abs(shellIndex) * 0.1)}
						rotation={shellIndex * 0.8 + column.flash.current * 2.4}
						width={SYMBOL_SIZE * 0.22}
						height={SYMBOL_SIZE * 0.22}
						alpha={column.flash.current}
					/>
				{/each}
			{/if}
		</Container>
	{/each}
</BoardContainer>

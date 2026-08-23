<script lang="ts" module>
	/**
	 * The cash value written on each carrier's talisman, on the board.
	 *
	 * Without this a carrier is a spirit holding a blank piece of paper, and the
	 * player has no idea what they are chasing - the value is the entire reason
	 * the symbol is interesting.
	 *
	 * No component props and no events: it reads `stateGame.carriers`, which the
	 * reveal handler rebuilds from the board every spin. One source, so a value on
	 * screen cannot disagree with the value the maths will collect.
	 *
	 * Drawn UNDER the symbol rather than on its talisman, and only once the reel
	 * carrying it has stopped. Both of those are corrections - see WHERE and WHEN
	 * below.
	 */
	export type CarrierValuesMarker = never;
</script>

<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';

	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { stateGame } from '../game/stateGame.svelte';
	import { CARRIER_SYMBOL } from '../game/types';

	// art-bible.md 2.2: talisman yellow with cinnabar is reserved for money, and a
	// carrier's value is money. On its own plaque the pair inverts - yellow type on
	// a dark ground instead of cinnabar on yellow paper - because the plaque sits
	// over the board rather than over the paper, and yellow on dark is what stays
	// legible against whatever symbol is behind it.
	const TALISMAN = 0xf2d544;
	const PAPER_SHADOW = 0x7a2410;
	const BRASS = 0xa8763e;
	const PLAQUE_INK = 0x1a1008;

	// ── WHERE ────────────────────────────────────────────────────────────────
	//
	// Under the symbol, on its own plaque. NOT on the talisman the spirit is
	// holding, which is where this started.
	//
	// The talisman is 20.5% of the cell wide. Measured off m.png, and measured
	// carefully - the first attempt took the bounding box of every paper-coloured
	// pixel and swept in the cord hanging beside the paper, so the number printed
	// half on the paper and half on the spirit's chest; the fix was to take the
	// largest connected region instead. All of that was correct, and none of it
	// mattered, because 20.5% of a 104px cell is 21px and no amount of fitting
	// makes "250x" legible in 21px on a reel that is also moving.
	//
	// So the value comes off the artwork. A brass plaque under the spirit's feet
	// is the full width of the cell, sits in the gap between rows where nothing
	// else is drawn, and can carry type at three times the size. It also stops the
	// value competing with the art it was printed over.
	// Constrained by the CELL, not by taste. BoardMask is exactly the board's
	// height, so anything hanging below a cell is clipped on the bottom row - a
	// plaque centred in the gap between rows (0.5 of a cell down) would have been
	// cut in half on every carrier in row 3. The plaque's bottom edge therefore has
	// to stay within half a cell: PLAQUE_CY + PLAQUE_H / 2 <= 0.5.
	const PLAQUE_CY = 0.35;
	const PLAQUE_W = 0.86;
	const PLAQUE_H = 0.27;

	/**
	 * The value as the player reads it.
	 *
	 * Rounded DOWN, always. The displayed value is a floor: the maths may award
	 * more than the talisman shows but never less (game-spec.md §4.3), so
	 * rounding to nearest could print a number the round does not pay.
	 *
	 * No currency symbol - a carrier's value is a bet multiple, not an amount,
	 * and the player's currency is not known here.
	 */
	const format = (value: number) => {
		const floored = Math.floor(value * 100) / 100;
		return `${floored}x`;
	};

	/**
	 * Font size that keeps the string inside the plaque.
	 *
	 * The ladder runs 0.5x to 500x, so the string is 2 to 5 characters and the
	 * plaque does not change size. art-bible.md 5.4 requires the fit to come from
	 * the type size rather than from wrapping.
	 *
	 * Sized from the character count rather than by measuring the rendered text:
	 * the ladder is a known set of values, so the count is fully determined, and a
	 * measure-then-rescale pass would need per-instance state for something that
	 * can be computed up front.
	 */
	// Measured for the display face at its display weight. Estimating with Arial's
	// ratio said every value fitted while the widest ones were visibly hanging off;
	// rendering the preview in the REAL face is what showed it.
	//
	// 0.89, not the 0.82 the preview reports. resvg cannot instance a variable
	// font's weight axis, so design/preview_carrier_values.mjs renders Cinzel at
	// 400 while the game draws it at 700 - and bold is about 8% wider. Trusting
	// the preview's number would repeat the Arial mistake one level down.
	const CHAR_RATIO = 0.89;
	const fontSizeFor = (label: string) => {
		const plaqueW = SYMBOL_SIZE * PLAQUE_W * 0.86;
		const plaqueH = SYMBOL_SIZE * PLAQUE_H;
		return Math.min(plaqueH * 0.74, plaqueW / (label.length * CHAR_RATIO));
	};

	// ── WHEN ─────────────────────────────────────────────────────────────────
	//
	// Only on reels that have STOPPED.
	//
	// `stateGame.carriers` is filled by the reveal handler, which runs when the
	// round's data arrives - and that is long before the reels finish spinning.
	// So every value was on screen while its own symbol was still a blur travelling
	// past, which gives away the whole board before it lands and makes the reels
	// decorative. Reading the motion per REEL rather than per board also keeps the
	// left-to-right reveal intact: reel 1's values appear when reel 1 stops.
	const stopped = (reel: number) => stateGame.board[reel]?.reelState.motion === 'stopped';

	/**
	 * Is the symbol under this plaque actually a carrier?
	 *
	 * `stateGame.carriers` is a parallel array, rebuilt from the board on every
	 * reveal, and a parallel array is only ever as correct as the last thing that
	 * remembered to update it. It was wrong once already: the return from free
	 * spins restores the base board without sending a reveal, so the final feature
	 * spin's carriers stayed in state and their values were drawn over base-game
	 * symbols - a 20x plaque under a 10.
	 *
	 * That specific hole is fixed where it was made (bookEventHandlerMap,
	 * freeSpinEnd). This is the other half: never draw a value over a symbol that
	 * is not carrying one, whatever the array says. A missing plaque is a small
	 * fault; a plaque promising 20x on a symbol worth nothing is a payout claim.
	 *
	 * Rows are the PADDED convention, so the visible row `row` is index `row` in
	 * the reel's symbol list - the same offset getSymbolY uses.
	 */
	const carriesValue = (reel: number, row: number) =>
		stateGame.board[reel]?.reelState.symbols[row]?.rawSymbol?.name === CARRIER_SYMBOL;

</script>

<!--
	Drawn THROUGH the collect, not hidden for it.

	This used to disappear the moment a sweep started, on the reasoning that a
	value still sitting on a carrier that had already been swept reads as one that
	did not pay. In the base game, where a sweep is one line and a moment, that
	held up. In free spins it does not: a wild takes the WHOLE board, several wilds
	take it several times over, and with the plaques gone the player is watching a
	number count up with nothing on screen to explain where any of it came from.
	They could no longer see what each spirit had been worth - which is the one
	thing the mechanic is about.

	So the values stay. The carriers are still standing on the board for the whole
	sweep, so their values are still true; nothing here is claiming an unpaid
	symbol, it is showing what was on the board that was just collected.
-->
{#if stateGame.carriers.length > 0}
	<Container>
		{#each stateGame.carriers as carrier (`${carrier.reel},${carrier.row}`)}
			{#if stopped(carrier.reel) && carriesValue(carrier.reel, carrier.row)}
				{@const label = format(carrier.value)}
				{@const size = fontSizeFor(label)}
				{@const cx = getSymbolX(carrier.reel)}
				{@const cy = getSymbolY(carrier.row) + SYMBOL_SIZE * PLAQUE_CY}
				{@const w = SYMBOL_SIZE * PLAQUE_W}
				{@const h = SYMBOL_SIZE * PLAQUE_H}
				<Graphics
					draw={(g) => {
						g.clear();
						// Pixi v8: build the path, then commit it. roundRect() only ADDS
						// to the path - the fill or stroke after it is what draws.
						g.roundRect(cx - w / 2, cy - h / 2, w, h, h * 0.3);
						g.fill({ color: PLAQUE_INK, alpha: 0.88 });
						g.roundRect(cx - w / 2, cy - h / 2, w, h, h * 0.3);
						g.stroke({ width: 2, color: BRASS, alpha: 0.9 });
					}}
				/>
				<Text
					text={label}
					x={cx}
					y={cy}
					anchor={{ x: 0.5, y: 0.5 }}
					style={{
						fontFamily: GAME_FONT,
						fontSize: size,
						fontWeight: GAME_FONT_WEIGHT,
						fill: TALISMAN,
						// A warm dark outline rather than black: the plaque is warm and a
						// black stroke on it reads as printing, not as brushwork.
						stroke: { color: PAPER_SHADOW, width: Math.max(1, size * 0.1) },
					}}
				/>
			{/if}
		{/each}
	</Container>
{/if}

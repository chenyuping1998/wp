<script lang="ts" module>
	import type { ScatterWinDatum } from '../game/bookEventHandlerMap';

	/**
	 * Four speeds, not a boolean. The free game needs its own, slower than base —
	 * and turbo inside the feature needs a fourth, because turbo used to win
	 * outright and hand the feature the fastest timings in the game.
	 */
	export type WinPace = 'normal' | 'freegame' | 'turbo' | 'turboFreegame';

	export type EmitterEventScatterWins =
		| { type: 'scatterWinsShow'; wins: ScatterWinDatum[]; pace?: WinPace }
		| { type: 'scatterWinsHide' };
</script>

<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_DIMENSIONS,
		WIN_STAGGER_MS,
		WIN_STAGGER_MS_FREEGAME,
		WIN_STAGGER_MS_FAST,
		WIN_STAGGER_MS_FAST_FREEGAME,
		WIN_VOLLEY_MAX_MS,
		WIN_HOLD_MS,
		WIN_HOLD_MS_FREEGAME,
		WIN_HOLD_MS_FAST,
		WIN_HOLD_MS_FAST_FREEGAME,
		gaugeTierFor,
	} from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';

	/**
	 * Marks every cell that is about to be crushed, and puts the amount at the
	 * centre of the group.
	 *
	 * This is pay-anywhere, which changes the drawing problem completely from the
	 * cluster game this was ported from. There is no blob to trace: the eight to
	 * thirty winning cells are scattered over the board with no adjacency, so a
	 * boundary trace would emit that many separate squares and read as noise. Each
	 * cell is marked individually instead — a wash, a border, and jaw ticks at the
	 * corners, so the mark reads as the press lining up on that cell rather than as
	 * a generic selection box.
	 *
	 * Two simplifications the pay-anywhere maths allows, both worth knowing before
	 * anyone ports cluster behaviour back in:
	 *
	 *  · positions are never shared between wins. A cell holds one symbol and
	 *    belongs to exactly one symbol's group, because there is no wild in this
	 *    game to join several groups at once. The volley-wide dedupe the cluster
	 *    version needed is therefore gone — if a wild is ever added, it comes back.
	 *  · at most three symbols pay at once, and 96% of the time it is exactly one.
	 *    The stagger exists only so a rare double does not land as one flash.
	 *
	 * The multiplier shown here is the pressure gauge (meta.globalMult), which is
	 * already baked into `win`. Do NOT show meta.clusterMult — it is always 1 in
	 * this game. See typesBookEvent.ts.
	 */
	const context = getContext();

	let wins = $state<ScatterWinDatum[]>([]);
	let revealed = $state(0);
	let visible = $state(false);

	const slotY = (row: number) => (row - 1 + 0.5) * SYMBOL_SIZE;
	const CELL = SYMBOL_SIZE;
	/** Length of the corner ticks, as a fraction of the cell. */
	const JAW = 0.26;

	const shownWins = $derived(wins.slice(0, revealed));

	const drawMarks = (graphics: PixiGraphics) => {
		graphics.clear();
		if (!visible) return;

		for (const win of shownWins) {
			const tint = gaugeTierFor(win.globalMult);

			for (const pos of win.positions) {
				const left = getSymbolX(pos.reel) - CELL / 2;
				const top = slotY(pos.row) - CELL / 2;
				graphics
					.rect(left + 3, top + 3, CELL - 6, CELL - 6)
					.fill({ color: 0xffb03a, alpha: 0.13 });
			}

			// Jaw ticks: two short strokes meeting at each corner. Drawn as one pass
			// so a single stroke() covers every cell of the group — a stroke per cell
			// would be 30 draw calls on a big win.
			const tick = CELL * JAW;
			for (const pos of win.positions) {
				const left = getSymbolX(pos.reel) - CELL / 2 + 4;
				const top = slotY(pos.row) - CELL / 2 + 4;
				const right = left + CELL - 8;
				const bottom = top + CELL - 8;

				graphics.moveTo(left, top + tick).lineTo(left, top).lineTo(left + tick, top);
				graphics.moveTo(right - tick, top).lineTo(right, top).lineTo(right, top + tick);
				graphics.moveTo(right, bottom - tick).lineTo(right, bottom).lineTo(right - tick, bottom);
				graphics.moveTo(left + tick, bottom).lineTo(left, bottom).lineTo(left, bottom - tick);
			}
			// Two passes: a wide dim one bleeds light off the edge, a thin bright one
			// keeps the mark crisp against a busy board. The bright pass takes the
			// gauge colour, so at high pressure the marks themselves run hot.
			graphics.stroke({ width: 7, color: 0xff6a12, alpha: 0.3 });

			for (const pos of win.positions) {
				const left = getSymbolX(pos.reel) - CELL / 2 + 4;
				const top = slotY(pos.row) - CELL / 2 + 4;
				const right = left + CELL - 8;
				const bottom = top + CELL - 8;

				graphics.moveTo(left, top + tick).lineTo(left, top).lineTo(left + tick, top);
				graphics.moveTo(right - tick, top).lineTo(right, top).lineTo(right, top + tick);
				graphics.moveTo(right, bottom - tick).lineTo(right, bottom).lineTo(right - tick, bottom);
				graphics.moveTo(left + tick, bottom).lineTo(left, bottom).lineTo(left, bottom - tick);
			}
			graphics.stroke({ width: 2.5, color: tint.color, alpha: 0.95 });
		}
	};

	/**
	 * Light the winning symbols and hold for a beat — deliberately NOT for the
	 * whole win animation.
	 *
	 * Every winning symbol here is destroyed by the tumble that follows, so waiting
	 * out a full 1.4s win animation would put that much dead time in front of each
	 * link of the chain. The effect is still started and keeps playing underneath;
	 * the tumble takes the symbol over when it is ready. Nothing awaits a
	 * completion callback, which also removes the whole class of hangs where a
	 * symbol never fires the callback something is blocking on.
	 */
	const animateWin = async (positions: { reel: number; row: number }[], holdMs: number) => {
		const visiblePositions = positions.filter((p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y);
		if (visiblePositions.length === 0) return;

		for (const position of visiblePositions) {
			const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[position.row];
			if (!reelSymbol) continue;
			// Re-arm through 'static' so the state change is a real transition and the
			// effect restarts, rather than being ignored as a no-op assignment.
			if (reelSymbol.symbolState === 'win') reelSymbol.symbolState = 'static';
			reelSymbol.symbolState = 'win';
		}
		await waitForTimeout(holdMs);
	};

	context.eventEmitter.subscribeOnMount({
		scatterWinsHide: () => {
			visible = false;
			wins = [];
			revealed = 0;
		},
		scatterWinsShow: async ({ wins: incoming, pace = 'normal' }) => {
			wins = incoming;
			revealed = 0;
			visible = true;
			if (incoming.length === 0) return;

			const baseStagger =
				pace === 'turbo'
					? WIN_STAGGER_MS_FAST
					: pace === 'turboFreegame'
						? WIN_STAGGER_MS_FAST_FREEGAME
						: pace === 'freegame'
							? WIN_STAGGER_MS_FREEGAME
							: WIN_STAGGER_MS;
			// Squeeze the gap so the whole volley fits its budget however many symbols
			// paid — total time must not scale with the size of the win.
			const stagger = Math.min(baseStagger, WIN_VOLLEY_MAX_MS / incoming.length);
			const holdMs =
				pace === 'turbo'
					? WIN_HOLD_MS_FAST
					: pace === 'turboFreegame'
						? WIN_HOLD_MS_FAST_FREEGAME
						: pace === 'freegame'
							? WIN_HOLD_MS_FREEGAME
							: WIN_HOLD_MS;

			await Promise.all(
				incoming.map(async (win, index) => {
					await waitForTimeout(stagger * index);
					revealed = Math.max(revealed, index + 1);
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.08 });
					await animateWin(win.positions, holdMs);
				}),
			);
		},
	});
</script>

{#if visible}
	<BoardContainer>
		<Graphics draw={drawMarks} />

		{#each shownWins as win, index (index)}
			<GoldText
				text={bookEventAmountToCurrencyString(win.win)}
				fontSize={SYMBOL_SIZE * 0.34}
				x={getSymbolX(win.overlay.reel)}
				y={slotY(win.overlay.row)}
				anchor={{ x: 0.5, y: 0.5 }}
				maxWidth={SYMBOL_SIZE * 1.9}
			/>
			<!--
				The gauge reading that produced this amount. It is already inside `win`,
				so this is an explanation rather than a second number to add on — which
				is exactly why it is worth showing: without it a 40x payout in the
				feature has no visible cause, because the gauge lives outside the board.
			-->
			{#if win.globalMult > 1}
				<GoldText
					text={`x${win.globalMult}`}
					fontSize={SYMBOL_SIZE * 0.24}
					x={getSymbolX(win.overlay.reel)}
					y={slotY(win.overlay.row) + SYMBOL_SIZE * 0.32}
					anchor={{ x: 0.5, y: 0.5 }}
					maxWidth={SYMBOL_SIZE * 1.2}
				/>
			{/if}
		{/each}
	</BoardContainer>
{/if}

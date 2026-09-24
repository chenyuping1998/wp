<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { HOLD_MS } from '../game/symbolWinMotion';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);

	/**
	 * Which win volley owns the dim right now.
	 *
	 * WinLines fires one `boardWithAnimateSymbols` per reel as the runner crosses
	 * it, with a plain `broadcast`, so two or three of these run at once. Each one
	 * used to clear `winningCells` in its own `finally` — meaning the FIRST volley
	 * to finish switched the dim off while a later one was still lighting cells,
	 * and the board flicked back to uniform brightness in the middle of the win.
	 * Only the most recently started volley may clear.
	 */
	let volleyToken = 0;

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			// Everything not in this volley stands down while it plays. Set before
			// the first symbol changes state and cleared in a finally, so an
			// interrupted volley (a new spin, a slam stop) can never leave the
			// board dimmed with nothing lit.
			const token = ++volleyToken;
			context.stateGame.winningCells = symbolPositions.map((position) => ({
				reel: position.reel,
				row: position.row,
			}));
			const getPromises = () =>
				symbolPositions.map(async (position) => {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					if (!reelSymbol) return; // guard against invalid positions
					// Reset to static first to ensure the state transition triggers $effect
					if (reelSymbol.symbolState === 'win') {
						reelSymbol.symbolState = 'static';
						await waitForResolve((resolve) => setTimeout(resolve, 0));
					}
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					reelSymbol.symbolState = 'postWinStatic';
				});

			// A watchdog, not politeness.
			//
			// Each promise resolves from the symbol's own `oncomplete`, and a symbol
			// whose component goes away mid-animation — the board torn down as a
			// free game ends, a round interrupted — never fires it. The await then
			// hangs forever, the `finally` never runs, and every cell that was not
			// in this volley stays dimmed for the rest of the session. That is the
			// "board is half dark after the free game" report.
			//
			// The cap is generous (four times the symbol hold) because it must
			// never cut a volley that is merely slow; it exists to bound the damage
			// of one that is dead.
			const WATCHDOG_MS = HOLD_MS * 4;
			try {
				await Promise.race([
					Promise.all(getPromises()),
					new Promise((resolve) => setTimeout(resolve, WATCHDOG_MS)),
				]);
			} finally {
				// Not ours any more: a later volley owns the dim, and something else
				// (setWin putting the big-win banner up) may already have cleared it.
				if (volleyToken === token) context.stateGame.winningCells = [];
			}
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

{#if show}
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<BoardBase />
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}

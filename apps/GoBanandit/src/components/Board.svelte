<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| { type: 'boardWinAnimCancel' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  };
</script>

<script lang="ts">
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import WinScrim from './WinScrim.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	// A win symbol is on screen for at least this long, whatever the spine says.
	// The win animation runs 1.4s, so in normal operation this floor is never
	// reached — it exists so that a single bogus completion can no longer make a
	// symbol vanish on the frame it lit up, which is a bug that reads to the
	// player as the symbol never having animated at all.
	const WIN_ANIM_MIN_MS = 900;
	// ...and an upper bound, because the wait is for a callback from a Spine that
	// may have been unmounted. Losing the completion used to leave this promise
	// pending forever, and anything awaiting the board (the scatter celebration)
	// with it.
	const WIN_ANIM_MAX_MS = 2600;

	let show = $state(true);

	// Cancellation for boardWithAnimateSymbols.
	//
	// Without it that handler is a fire-and-forget coroutine that runs for up to
	// WIN_ANIM_MAX_MS and then writes symbolState unconditionally. Press Spin
	// while a win presentation — or an idle replay pass — is still resolving and
	// that write lands up to 2.6 SECONDS later, on symbols the new spin has
	// already replaced: the reel visibly flickers back to a post-win frame in the
	// middle of, or just after, the next spin.
	//
	// Bumped ONLY by boardWinAnimCancel, which the actor fires on every new round.
	//
	// It must not be bumped per call. WinWays animates reel by reel, so it calls
	// this handler once for each reel of a win — an `++` here made every reel
	// cancel the one before it, and a symbol cancelled during its reset-to-static
	// step was left static: the reported "some winning symbols never light up".
	//
	// Nor by winLinesHide, which fires at the natural end of a win presentation
	// while these promises are legitimately still finishing; cancelling there
	// would strand every winning symbol in the 'win' state instead.
	let animCancelToken = 0;

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWinAnimCancel: () => {
			animCancelToken += 1;
		},
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			const mine = animCancelToken;
			const getPromises = () =>
				symbolPositions.map(async (position) => {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					if (!reelSymbol) return; // guard against invalid positions
					// Reset to static first so the state transition re-triggers $effect.
					// The yield paints, so this is a visible blink — it only happens for
					// a symbol still in 'win' from a pass that was interrupted, which
					// the generation check below now makes rare rather than routine.
					if (reelSymbol.symbolState === 'win') {
						reelSymbol.symbolState = 'static';
						await waitForResolve((resolve) => setTimeout(resolve, 0));
						if (mine !== animCancelToken) return; // already static, nothing to undo
					}
					reelSymbol.symbolState = 'win';
					const startedAt = performance.now();
					await Promise.race([
						waitForResolve((resolve) => (reelSymbol.oncomplete = resolve)),
						waitForTimeout(WIN_ANIM_MAX_MS),
					]);
					// A cancelled symbol must be PUT BACK, not simply abandoned.
					//
					// Returning here left it in the 'win' state, so its bloom carried on
					// rendering into the next spin — the win frame that stayed on the
					// board after the round was over. The cancel exists to stop the
					// animation, not to freeze it.
					if (mine !== animCancelToken) {
						reelSymbol.symbolState = 'postWinStatic';
						return;
					}
					const elapsed = performance.now() - startedAt;
					if (elapsed < WIN_ANIM_MIN_MS) await waitForTimeout(WIN_ANIM_MIN_MS - elapsed);
					// Checked again after the floor: that wait is up to 900ms on its own,
					// and it is the one most likely to still be pending when Spin is hit.
					if (mine !== animCancelToken) {
						reelSymbol.symbolState = 'postWinStatic';
						return;
					}
					reelSymbol.symbolState = 'postWinStatic';
				});

			await Promise.all(getPromises());
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

	<!-- between the resting tiles and the winning ones: see WinScrim -->
	<BoardContainer>
		<WinScrim />
	</BoardContainer>

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}

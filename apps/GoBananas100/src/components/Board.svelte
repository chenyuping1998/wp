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
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
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

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
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
					const startedAt = performance.now();
					await Promise.race([
						waitForResolve((resolve) => (reelSymbol.oncomplete = resolve)),
						waitForTimeout(WIN_ANIM_MAX_MS),
					]);
					const elapsed = performance.now() - startedAt;
					if (elapsed < WIN_ANIM_MIN_MS) await waitForTimeout(WIN_ANIM_MIN_MS - elapsed);
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

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}

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
	import { onMount } from 'svelte';
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { baseIdleBoard, getHighlightGeneration } from '../game/bookEventHandlerMap';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);

	// ── the reels are never empty ────────────────────────────────────────────
	//
	// Nothing filled them on a cold start. `settle()` runs when a bet is resumed
	// or when a round produces a reveal, and a player opening the game for the
	// first time has neither - so the reels held no symbols at all until the first
	// spin arrived and put some there.
	//
	// It is visible, and it is what the opening transition was being blamed for:
	// captured at 10fps, the frame after the talismans scatter has the frame, the
	// brick wall, the rail and the whole bar in place and a BLANK RECTANGLE where
	// the symbols go, for about four frames. The transition had already opened
	// correctly onto a board that was not finished.
	//
	// Seeded from the padding strips, which is what the idle board is made of
	// everywhere else in this game - see baseIdleBoard. Whatever the first real
	// reveal contains replaces it.
	onMount(() => context.stateGameDerived.enhancedBoard.settle(baseIdleBoard()));

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			// The board this volley was asked to light. Every yield below is a place
			// the player can press spin, which resets the whole strip to 'spin' and
			// bumps the generation - writing a symbol state after that point paints
			// the win onto a reel that is already moving.
			const generation = getHighlightGeneration();
			const getPromises = () =>
				symbolPositions.map(async (position) => {
					const reel = context.stateGame.board[position.reel];
					const reelSymbol = reel?.reelState.symbols[position.row];
					if (!reelSymbol) {
						// This used to return silently, which is how a win that should have
						// lit five reels can light four and look like a presentation choice
						// rather than a dropped position. If it ever fires, the reel is not
						// holding the board the math just described.
						console.warn(
							`[SoulSeal] no symbol at reel ${position.reel} row ${position.row}`,
							`(reel holds ${reel?.reelState.symbols.length ?? 0} symbols)`,
						);
						return;
					}
					// Reset to static first to ensure the state transition triggers $effect
					if (reelSymbol.symbolState === 'win') {
						reelSymbol.symbolState = 'static';
						await waitForResolve((resolve) => setTimeout(resolve, 0));
					}
					if (generation !== getHighlightGeneration()) return;
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					if (generation !== getHighlightGeneration()) return;
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

<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| { type: 'reelImpact'; reelIndex: number }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';
	import ImpactDust from './ImpactDust.svelte';

	const context = getContext();

	let show = $state(true);
	// short-lived dust bursts at the floor of each stopping reel
	// Ceiling on the per-symbol win-animation wait. The spine is 1.4s; this is
	// generous enough never to cut a real animation short even at the slowest time
	// scale, and short enough that a lost callback is a hiccup rather than a
	// frozen round. See the handshake below.
	const WIN_ANIM_TIMEOUT = 4000;

	let impacts = $state<{ id: number; reelIndex: number }[]>([]);
	let nextImpactId = 0;

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		reelImpact: ({ reelIndex }) => {
			impacts = [...impacts, { id: nextImpactId++, reelIndex }];
		},
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
					// Arm the resolver BEFORE the state change, and bound the wait.
					//
					// This handshake froze the game in a real play-through: three
					// Scatters landed, the free-spin trigger awaited these promises, one
					// never resolved, and the round sat on a looping Scatter animation
					// for minutes with the bet never settling. It is intermittent — the
					// same book completed normally on a later run — which is the
					// signature of a race, not of a broken animation.
					//
					// Two changes, because the second matters even if the first is not
					// the whole story:
					//
					// 1. `oncomplete` is assigned first. Setting symbolState to 'win'
					//    remounts the symbol as a spine, and the assignment used to
					//    happen on the line after — so a `complete` arriving in between
					//    called the previous (no-op) callback and the real resolver was
					//    never invoked.
					// 2. The wait has a ceiling. The win spine runs 1.4s; at the slowest
					//    time scale that is well under this. A missed callback now costs
					//    one beat of presentation instead of the session, which is the
					//    difference between a glitch and a game that has to be reloaded.
					const settled = waitForResolve<void>((resolve) => {
						reelSymbol.oncomplete = resolve;
					});
					reelSymbol.symbolState = 'win';
					await Promise.race([
						settled,
						waitForResolve<void>((resolve) => setTimeout(resolve, WIN_ANIM_TIMEOUT)),
					]);
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
			{#each impacts as impact (impact.id)}
				<ImpactDust
					x={(impact.reelIndex + 0.5) * SYMBOL_SIZE}
					y={BOARD_SIZES.height}
					oncomplete={() => (impacts = impacts.filter(({ id }) => id !== impact.id))}
				/>
			{/each}
		</BoardContainer>
	</BoardContext>
{/if}

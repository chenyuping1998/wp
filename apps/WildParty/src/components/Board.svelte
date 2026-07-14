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
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
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

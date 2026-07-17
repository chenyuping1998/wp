<script lang="ts">
	import { OnMount } from 'components-shared';
	import { SECOND } from 'constants-shared/time';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import Anticipation from './Anticipation.svelte';

	const context = getContext();
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	// spotlight focus: while a reel is teasing, dim the reels that have already
	// stopped so all eyes land on the glowing column
	const drawDim = (g: PixiGraphics) => {
		g.clear();
		context.stateGame.board.forEach((reel, i) => {
			if (reel.reelState.anticipating || reel.reelState.motion !== 'stopped') return;
			g.beginFill(0x000000, 0.3);
			g.drawRoundedRect(
				getSymbolX(i) - SYMBOL_SIZE / 2 + 4,
				4,
				SYMBOL_SIZE - 8,
				BOARD_SIZES.height - 8,
				12,
			);
			g.endFill();
		});
	};
</script>

{#if hasAnticipation}
	<OnMount
		onmount={() => {
			context.eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_anticipation' });
			context.eventEmitter.broadcast({
				type: 'soundFade',
				name: 'sfx_anticipation',
				from: 0,
				to: 1,
				duration: SECOND,
			});
			// Mechanical reel-ticking loop — keeps the player locked on the glowing reel
			context.eventEmitter.broadcast({ type: 'soundReelTensionStart' });

			return () => {
				context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
				context.eventEmitter.broadcast({ type: 'soundReelTensionStop' });
			};
		}}
	/>
{/if}

{#if hasAnticipation}
	<BoardContainer>
		<Graphics draw={drawDim} />
	</BoardContainer>
{/if}

{#each context.stateGame.board as reel}
	{#if reel.reelState.anticipating}
		<Anticipation {reel} oncomplete={() => (reel.reelState.anticipating = false)} />
	{/if}
{/each}

<script lang="ts">
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import ImpactDust from './ImpactDust.svelte';

	// Watches every reel for the slam moment (spinning → bouncing) and kicks a
	// puff of dust off the floor of that reel.
	const context = getContext();

	let puffs = $state<{ id: number; reel: number }[]>([]);
	let nextId = 0;

	const prevMotion: string[] = [];
	$effect(() => {
		context.stateGame.board.forEach((reel, i) => {
			const motion = reel.reelState.motion;
			if (prevMotion[i] === 'spinning' && motion === 'bouncing') {
				puffs = [...puffs, { id: nextId++, reel: i }];
			}
			prevMotion[i] = motion;
		});
	});
</script>

<BoardContainer>
	{#each puffs as puff (puff.id)}
		<ImpactDust
			x={getSymbolX(puff.reel)}
			y={BOARD_SIZES.height - SYMBOL_SIZE * 0.06}
			oncomplete={() => (puffs = puffs.filter((p) => p.id !== puff.id))}
		/>
	{/each}
</BoardContainer>

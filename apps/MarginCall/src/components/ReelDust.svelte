<script lang="ts">
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import ReelStopFx from './ReelStopFx.svelte';

	// Watches every reel for the slam moment (spinning → bouncing) and prints the
	// landing on that reel. The effect itself is in ReelStopFx; this is only the
	// watcher.
	const context = getContext();

	// The board is 3 rows in the basegame and 5 in the feature, so its height
	// has to be read live rather than baked in at module load.
	const boardHeight = $derived(SYMBOL_SIZE * stateGame.rows);

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
		<ReelStopFx
			x={getSymbolX(puff.reel)}
			y={boardHeight - SYMBOL_SIZE * 0.06}
			height={boardHeight}
			oncomplete={() => (puffs = puffs.filter((p) => p.id !== puff.id))}
		/>
	{/each}
</BoardContainer>

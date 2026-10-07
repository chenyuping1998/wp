<script lang="ts">
	/**
	 * Runs the idle director (game/idleDirector.ts) for as long as the game is
	 * mounted, and tells it when a win presentation is on the board — nobody
	 * idles under one. Draws nothing: the acts are drawn by the cells.
	 */
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import { idleCells, startIdleDirector } from '../game/idleDirector';
	import { IDLE_WEIGHT } from '../game/meshWin';

	const context = getContext();
	onMount(() => startIdleDirector(IDLE_WEIGHT));
	context.eventEmitter.subscribeOnMount({
		winLinesShow: () => idleCells.setPresenting(true),
		winLinesHide: () => idleCells.setPresenting(false),
	});
</script>

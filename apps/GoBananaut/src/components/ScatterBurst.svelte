<script lang="ts" module>
	export type EmitterEventScatterBurst = {
		type: 'scatterBurst';
		positions: { reel: number; row: number }[];
	};
</script>

<script lang="ts">
	import { getContext } from '../game/context';
	import { cellCenterY, BASE_ROWS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import FxBurst from './FxBurst.svelte';

	// Free-game trigger celebration: a gold burst on every scatter, staggered
	// left to right so the board lights up as a wave.
	const context = getContext();

	let bursts = $state<{ id: number; x: number; y: number; delay: number }[]>([]);
	let nextId = 0;

	// Through cellCenterY, which knows the reel is bottom-anchored inside a
	// six-row box: a burst on a reel still at four otherwise fires two cells above
	// the scatter that earned it.

	context.eventEmitter.subscribeOnMount({
		scatterBurst: ({ positions }) => {
			const ordered = [...positions].sort((a, b) => a.reel - b.reel);
			bursts = [
				...bursts,
				...ordered.map((pos, index) => ({
					id: nextId++,
					x: getSymbolX(pos.reel),
					y: cellCenterY(context.stateGame.growRows[pos.reel] ?? BASE_ROWS, pos.row),
					delay: index * 110,
				})),
			];
		},
	});
</script>

<BoardContainer>
	{#each bursts as burst (burst.id)}
		<FxBurst
			x={burst.x}
			y={burst.y}
			scale={1.15}
			delay={burst.delay}
			oncomplete={() => (bursts = bursts.filter((b) => b.id !== burst.id))}
		/>
	{/each}
</BoardContainer>

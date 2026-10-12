<script lang="ts" module>
	export type EmitterEventScatterBurst = {
		type: 'scatterBurst';
		positions: { reel: number; row: number }[];
	};
</script>

<script lang="ts">
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import FxBurst from './FxBurst.svelte';

	// Free-game trigger celebration: a gold burst on every scatter, staggered
	// left to right so the board lights up as a wave.
	const context = getContext();

	let bursts = $state<{ id: number; x: number; y: number; delay: number }[]>([]);
	let nextId = 0;

	// padded book rows: visible row r centre sits at r*SYMBOL_SIZE - SYMBOL_SIZE/2
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	context.eventEmitter.subscribeOnMount({
		scatterBurst: ({ positions }) => {
			const ordered = [...positions].sort((a, b) => a.reel - b.reel);
			bursts = [
				...bursts,
				...ordered.map((pos, index) => ({
					id: nextId++,
					x: getSymbolX(pos.reel),
					y: rowCenterY(pos.row),
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

<script lang="ts" module>
	export type EmitterEventScatterBurst = {
		type: 'scatterBurst';
		positions: { reel: number; row: number }[];
	};
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import { MESH_WINS } from '../game/meshWin';
	import BoardContainer from './BoardContainer.svelte';
	import FxBurst from './FxBurst.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';

	// Free-game trigger celebration: a gold burst on every scatter, staggered
	// left to right so the board lights up as a wave.
	//
	// ...and the Scatter ACTS on it (game/meshWin/sScatter): the net swings from
	// its knot and bounces, the loose bananas wag. It used to be the one Scatter
	// moment where the symbol itself did nothing — a burst of light over a still
	// tile — and it is the moment the player most wants to see it do something.
	// Drawn as a copy over the cell, on the burst's own wave, and removed when
	// the act ends: the act ends exactly on the drawing (meshRig.settled), so the
	// tile underneath takes over without a jump.
	const context = getContext();

	let bursts = $state<{ id: number; x: number; y: number; delay: number }[]>([]);
	let acts = $state<{ id: number; x: number; y: number; delay: number; speed: number }[]>([]);
	let nextId = 0;
	const ACT_MS = MESH_WINS.S.durationMs;

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
			const speed = stateBet.isTurbo ? 2 : 1;
			const fresh = ordered.map((pos, index) => ({
				id: nextId++,
				x: getSymbolX(pos.reel),
				y: rowCenterY(pos.row),
				delay: index * 110,
				speed,
			}));
			// a second trigger burst on a cell still acting replaces its act
			const taken = new Set(fresh.map((a) => `${a.x},${a.y}`));
			acts = [...acts.filter((a) => !taken.has(`${a.x},${a.y}`)), ...fresh];
			for (const act of fresh) {
				// a timer owns the ending, not the frame loop (rAF stops in a hidden tab)
				setTimeout(() => (acts = acts.filter((a) => a.id !== act.id)), act.delay + ACT_MS / speed + 40);
			}
		},
	});
</script>

<BoardContainer>
	{#each acts as act (act.id)}
		<Container x={act.x} y={act.y}>
			<SymbolMeshWin symbolName="S" width={SYMBOL_SIZE} height={SYMBOL_SIZE} speed={act.speed} delay={act.delay} />
		</Container>
	{/each}
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

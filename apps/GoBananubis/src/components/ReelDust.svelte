<script lang="ts">
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import ImpactDust from './ImpactDust.svelte';
	import SpinStartSand from './SpinStartSand.svelte';

	// Watches every reel for the slam moment (spinning → bouncing) and kicks a
	// puff of dust off the floor of that reel — and for the LAUNCH, which used to
	// pass unmarked: the first reel leaving rest knocks the housing and shakes
	// sand off its top lintel (SpinStartSand), so a spin begins with the same
	// weight it ends with.
	const context = getContext();

	let puffs = $state<{ id: number; reel: number }[]>([]);
	let nextId = 0;
	let sheds = $state<number[]>([]);

	const prevMotion: string[] = [];
	$effect(() => {
		context.stateGame.board.forEach((reel, i) => {
			const motion = reel.reelState.motion;
			if (prevMotion[i] === 'spinning' && motion === 'bouncing') {
				puffs = [...puffs, { id: nextId++, reel: i }];
			}
			// only reel 1 raises the launch: the others follow it a beat later and
			// five curtains of sand would be a sandstorm, not a cue
			if (i === 0 && prevMotion[i] && prevMotion[i] !== 'spinning' && motion === 'spinning') {
				sheds = [...sheds, nextId++];
				// the strip launches upward, so the knock comes off the top edge
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.22, from: [0, -1] });
			}
			prevMotion[i] = motion;
		});
	});
</script>

{#each sheds as shed (shed)}
	<SpinStartSand oncomplete={() => (sheds = sheds.filter((id) => id !== shed))} />
{/each}

<BoardContainer>
	{#each puffs as puff (puff.id)}
		<ImpactDust
			x={getSymbolX(puff.reel)}
			y={BOARD_SIZES.height - SYMBOL_SIZE * 0.06}
			oncomplete={() => (puffs = puffs.filter((p) => p.id !== puff.id))}
		/>
	{/each}
</BoardContainer>

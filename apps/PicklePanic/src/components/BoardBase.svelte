<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { BlurFilter } from 'pixi.js';

	import ReelSymbol from './ReelSymbol.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	// REEL MOTION BLUR, ONE FILTER PER REEL.
	//
	// The blur used to be faked per symbol: two translucent copies above and
	// below the art, and the art itself faded to 85%. The tile plate behind it
	// stayed sharp, so a spinning reel read as a stack of crisp cream cards with
	// see-through ghosts inside them (review 2026-10-17: "Poor animations").
	// A real vertical blur over the whole reel — plate and symbol together —
	// smears them as one strip, the way a reel strip moves. Strength follows the
	// same 0..1 speed the symbols use, so the bounce eases it off.
	const filters = context.stateGame.board.map(() => {
		const f = new BlurFilter({ strengthX: 0, strengthY: 0, quality: 6, kernelSize: 9 });
		f.enabled = false;
		return f;
	});

	const STRENGTH = 12;

	$effect(() => {
		context.stateGame.board.forEach((reel, i) => {
			const motion = reel.reelState.motion;
			const k = motion === 'spinning' ? 1 : motion === 'bouncing' ? 0.25 : 0;
			const f = filters[i];
			if (!f) return;
			f.strengthY = STRENGTH * k;
			f.strengthX = 0;
			f.enabled = k > 0;
		});
	});
</script>

{#each context.stateGame.board as reel, reelIndex (reelIndex)}
	<Container filters={reel.reelState.motion === 'spinning' || reel.reelState.motion === 'bouncing' ? [filters[reelIndex]] : []}>
		{#each reel.reelState.symbols as reelSymbol}
			<ReelSymbol {reelIndex} {reelSymbol} />
		{/each}
	</Container>
{/each}

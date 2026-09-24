<script lang="ts">
	import { OnMount } from 'components-shared';
	import { SECOND } from 'constants-shared/time';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import Anticipation from './Anticipation.svelte';

	const context = getContext();
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	// Per-reel gated magnitude. 1 = two scatters were on the board when this reel
	// was armed, 2+ = three or more, i.e. the trigger count is already met. It is
	// read PER REEL rather than as one value for the spin, because that is what
	// makes the tease escalate: on a book with anticipation [0,0,1,2,3] the reels
	// arm in turn and reel 3 is a low tease while reels 4 and 5 are full ones.
	// Taking a single max across the spin would light the earlier reel at a tier
	// its own scatter count had not earned yet.
	const magnitudeOf = (reelIndex: number) => context.stateGame.anticipation[reelIndex] ?? 1;

	// The largest magnitude among the reels actually teasing right now. Used only
	// for the drone, which is one sound for the whole board and so cannot be
	// per-reel.
	const teaseMagnitude = $derived(
		Math.max(
			0,
			...context.stateGame.board.map((reel, i) => (reel.reelState.anticipating ? magnitudeOf(i) : 0)),
		),
	);

	// Index of the reel being teased, so the drone can climb as the tease walks
	// to the right — the same ladder the five reel-stop clicks already use
	// (Sound.svelte:95-99). Rate is only ever raised, never restarted, so the
	// loop keeps running underneath.
	const teaseReelIndex = $derived(
		context.stateGame.board.reduce(
			(last, reel, i) => (reel.reelState.anticipating ? i : last),
			-1,
		),
	);
	const tensionRate = $derived(
		teaseReelIndex < 0 ? 1 : 0.9 + teaseReelIndex * 0.1 + (teaseMagnitude >= 2 ? 0.08 : 0),
	);

	$effect(() => {
		if (!hasAnticipation) return;
		context.eventEmitter.broadcast({ type: 'soundReelTensionStart', rate: tensionRate });
	});

	// the focus dim ramps in and back out — snapping it on made the tease read
	// as a glitch rather than the lights going down
	const dim = new Tween(0, { duration: 260, easing: cubicOut });
	$effect(() => {
		dim.set(hasAnticipation ? 1 : 0);
	});

	// spotlight focus: while a reel is teasing, dim the reels that have already
	// stopped so all eyes land on the glowing column
	const drawDim = (g: PixiGraphics) => {
		g.clear();
		if (dim.current <= 0.01) return;
		context.stateGame.board.forEach((reel, i) => {
			if (reel.reelState.anticipating || reel.reelState.motion !== 'stopped') return;
			g.beginFill(0x000000, 0.3 * dim.current);
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
			context.eventEmitter.broadcast({ type: 'soundReelTensionStart', rate: tensionRate });

			return () => {
				context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
				context.eventEmitter.broadcast({ type: 'soundReelTensionStop' });
			};
		}}
	/>
{/if}

{#if dim.current > 0.01}
	<BoardContainer>
		<Graphics draw={drawDim} />
	</BoardContainer>
{/if}

{#each context.stateGame.board as reel}
	{#if reel.reelState.anticipating}
		<Anticipation
			{reel}
			magnitude={magnitudeOf(reel.reelIndex)}
			oncomplete={() => (reel.reelState.anticipating = false)}
		/>
	{/if}
{/each}

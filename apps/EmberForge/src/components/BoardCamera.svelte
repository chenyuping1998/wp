<script lang="ts" module>
	// `strength` is the chain link that caused the push, not a 0..1 amount: the
	// camera decides how far a link of that depth is worth leaning in, so the
	// caller does not have to know the curve.
	export type EmitterEventBoardCamera = { type: 'boardCameraPush'; chain: number };
</script>

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';

	/**
	 * Leans the camera in as a tumble chain gets longer.
	 *
	 * A cluster game's drama is entirely in the chain — one link is a win, six is
	 * a run — and until now the board looked identical at both. Nothing else in
	 * the presentation escalates with depth except the pitch of the strike.
	 *
	 * Deliberately small, and it does not accumulate without bound: past about the
	 * sixth link the push stops growing, because a board that keeps creeping
	 * forward through a twelve-link chain ends up somewhere the layout never
	 * planned for.
	 *
	 * Scaling happens about the BOARD's centre, not the container's origin, via
	 * pivot — otherwise the board grows away from the middle of the screen and
	 * slides out from under the frame it is supposed to be sitting in.
	 */
	type Props = { children?: Snippet };

	const props: Props = $props();
	const context = getContext();

	const MAX_PUSH = 0.045; // 4.5% at full lean
	const CHAIN_FULL = 6; // link at which the push stops growing

	let push = $state(0);
	let target = $state(0);
	let raf = 0;

	const settle = () => {
		cancelAnimationFrame(raf);
		const step = () => {
			// Leans in quickly on the strike and releases slowly, so the push tracks
			// the impact rather than smoothly following the chain up and down.
			const rate = target > push ? 0.22 : 0.045;
			push += (target - push) * rate;
			// Once it has arrived, start letting go: nothing sends a "chain over"
			// event, and holding the last value would leave the board zoomed in for
			// the rest of the round.
			if (Math.abs(target - push) < 0.004) {
				if (target > 0) {
					target = 0;
				} else {
					push = 0;
					return;
				}
			}
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		boardCameraPush: ({ chain }) => {
			const next = Math.min(1, Math.max(0, (chain - 1) / (CHAIN_FULL - 1)));
			// A deeper link may not un-push a shallower one still playing out.
			target = Math.max(target, next);
			settle();
		},
	});

	onMount(() => () => cancelAnimationFrame(raf));

	const layout = $derived(context.stateGameDerived.boardLayout());
	const scale = $derived(1 + MAX_PUSH * push);
</script>

<Container
	x={layout.x}
	y={layout.y}
	pivot={{ x: layout.x, y: layout.y }}
	scale={scale}
>
	{@render props.children?.()}
</Container>

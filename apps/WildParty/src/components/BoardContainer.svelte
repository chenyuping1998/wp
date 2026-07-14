<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	const context = getContext();

	// reel-stop thud: quick downward dip of the whole reel window with a
	// springy return (paired with the per-reel ImpactDust in Board.svelte)
	const JOLT_PX = 9;
	const JOLT_DURATION = 160;
	let jolt = $state(0);
	let joltRaf = 0;

	const startJolt = () => {
		cancelAnimationFrame(joltRaf);
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			const p = Math.min(1, (now - start) / JOLT_DURATION);
			// sharp drop (first quarter), springy ease back out
			jolt = p < 0.25 ? JOLT_PX * (p / 0.25) : JOLT_PX * (1 - (p - 0.25) / 0.75) ** 1.6;
			if (p >= 1) {
				jolt = 0;
				return;
			}
			joltRaf = requestAnimationFrame(tick);
		};
		joltRaf = requestAnimationFrame(tick);
	};

	context.eventEmitter.subscribeOnMount({
		reelImpact: () => startJolt(),
	});
</script>

<Container
	x={context.stateGameDerived.boardLayout().x}
	y={context.stateGameDerived.boardLayout().y + jolt}
	pivot={context.stateGameDerived.boardLayout().pivot}
>
	{@render props.children()}
</Container>

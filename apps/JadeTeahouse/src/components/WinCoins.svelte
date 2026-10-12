<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { getContext } from '../game/context';
	import type { WinLevelAlias } from '../game/winLevelMap';

	type Props = { emit?: boolean; levelAlias?: WinLevelAlias };
	const props: Props = $props();
	const context = getContext();
	let elapsed = $state(0);
	const count = $derived(props.levelAlias === 'max' ? 10 : props.levelAlias === 'epic' ? 9 : props.levelAlias === 'mega' ? 8 : props.levelAlias === 'superwin' ? 7 : 6);
	const leaves = Array.from({ length: 10 }, (_, i) => ({
		key: `v8Particle${i % 16}`,
		side: i % 2 ? 1 : -1,
		phase: (i * .271) % 1,
		lane: i % 3,
	}));
	onMount(() => {
		let raf = 0;
		const start = performance.now();
		const tick = (now: number) => {
			elapsed = (now - start) / 1000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if props.emit}
	<MainContainer>
		<Container x={context.stateGameDerived.boardLayout().x} y={context.stateGameDerived.boardLayout().y}>
			{#each leaves.slice(0, count) as leaf, i}
				{@const p = (elapsed / (3.1 + leaf.lane * .36) + leaf.phase) % 1}
				{@const fade = Math.min(1, p * 6, (1 - p) * 6)}
				<Sprite key={leaf.key} anchor={0.5}
					x={leaf.side * (356 + leaf.lane * 25 + 13 * Math.sin(p * 8 + i))}
					y={220 - p * 455 + 14 * Math.sin(p * 5 + i)}
					width={24 + leaf.lane * 4} height={24 + leaf.lane * 4}
					rotation={leaf.side * (.3 + p * 1.2)} alpha={fade * .68} />
			{/each}
		</Container>
	</MainContainer>
{/if}

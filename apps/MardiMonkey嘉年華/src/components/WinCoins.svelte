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
	const count = $derived(props.levelAlias === 'max' ? 12 : props.levelAlias === 'epic' ? 10 : props.levelAlias === 'mega' ? 8 : props.levelAlias === 'superwin' ? 6 : 4);
	const pieces = Array.from({ length: 12 }, (_, i) => ({
		key: `v8Particle${i % 16}`,
		side: i % 2 ? 1 : -1,
		phase: (i * 0.37) % 1,
		offset: (i % 3) * 31,
	}));
	onMount(() => {
		let frame = 0;
		const start = performance.now();
		const tick = (now: number) => {
			elapsed = (now - start) / 1000;
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
	const pose = (p: number, side: number, offset: number, index: number) => {
		return {
			x: side * (345 + offset + 42 * Math.sin(p * Math.PI * 2 + index * .6)),
			y: 230 - 460 * p,
			rotation: side * (1.2 * p + .18 * Math.sin(3 * Math.PI * p)),
			size: 32 + (index % 3) * 5,
		};
	};
</script>

{#if props.emit}
	<MainContainer>
		<Container x={context.stateGameDerived.boardLayout().x} y={context.stateGameDerived.boardLayout().y}>
			{#each pieces.slice(0, count) as piece, i}
				{@const travel = (elapsed / (2.7 + (i % 3) * 0.45) + piece.phase) % 1}
				{@const fade = Math.min(1, travel * 5, (1 - travel) * 5)}
				{@const motion = pose(travel, piece.side, piece.offset, i)}
				<Sprite key={piece.key} anchor={0.5}
					x={motion.x} y={motion.y}
					width={motion.size} height={motion.size}
					rotation={motion.rotation}
					alpha={fade * 0.8} />
			{/each}
		</Container>
	</MainContainer>
{/if}

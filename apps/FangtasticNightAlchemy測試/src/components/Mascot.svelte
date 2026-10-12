<script lang="ts" module>
	export type EmitterEventMascot =
		| { type: 'mascotChestBeat' }
		| { type: 'mascotThrow' }
		| { type: 'mascotGoggleTease' };
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { getContext } from '../game/context';

	const context = getContext();
	let elapsed = $state(0);
	let reactionUntil = $state(0);
	let blinkUntil = $state(0);
	const placement = $derived.by(() => {
		const layout = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		const frameRight = board.x + (board.width * board.scale * 1.28) / 2;
		const gap = layout.width - frameRight;
		if (gap < 175) return null;
		const barHeight = layout.height - board.y * 2;
		const height = Math.min(layout.height * 0.71, layout.height - barHeight - 20, gap * 1.46);
		return {
			x: frameRight + gap / 2,
			y: layout.height - barHeight + 16,
			width: height * (1024 / 1536),
			height,
		};
	});
	const activeKey = $derived(elapsed < reactionUntil ? 'fangVampireGesture' : elapsed < blinkUntil ? 'fangVampireBlink' : 'fangVampire');
	const sway = $derived(Math.sin(elapsed / 570) * 2.5);
	const bob = $derived(Math.sin(elapsed / 390) * 2);

	$effect(() => {
		context.stateGame.mascotThrowOrigin = placement
			? { x: placement.x - placement.width * 0.23, y: placement.y - placement.height * 0.68 }
			: null;
	});
	onDestroy(() => { context.stateGame.mascotThrowOrigin = null; });
	onMount(() => {
		const id = setInterval(() => {
			elapsed += 33;
			if (elapsed % 3600 < 33) blinkUntil = elapsed + 180;
		}, 33);
		return () => clearInterval(id);
	});
	const react = () => { reactionUntil = elapsed + 690; };
	context.eventEmitter.subscribeOnMount({
		mascotChestBeat: react,
		mascotThrow: react,
		mascotGoggleTease: react,
		winUpdate: ({ winLevelData }) => { if (winLevelData.type === 'big') react(); },
	});
</script>

{#if placement}
	<Sprite
		key={activeKey}
		anchor={{ x: 0.5, y: 1 }}
		x={placement.x + sway}
		y={placement.y + bob}
		width={placement.width}
		height={placement.height}
		rotation={Math.sin(elapsed / 950) * 0.012}
		zIndex={-1}
	/>
{/if}

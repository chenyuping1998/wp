<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { SYMBOL_SIZE } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';

	type Props = {
		debug?: boolean;
		x: number;
		y: number;
		animating: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);
	// Derived, not constant: the feature board is two rows taller, and a fixed
	// bottom edge would clip its last two rows out of existence.
	const top = 0;
	const bottom = $derived(SYMBOL_SIZE * stateGame.rows);
	const inFrame = $derived(props.y >= top && props.y <= bottom);
</script>

{#if props.debug || (show && inFrame)}
	<Container x={props.x} y={props.y}>
		{@render props.children()}
	</Container>
{/if}

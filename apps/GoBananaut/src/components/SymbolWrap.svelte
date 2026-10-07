<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		debug?: boolean;
		x: number;
		y: number;
		animating: boolean;
		/** Top of THIS reel's visible window inside the six-row box. */
		windowTop: number;
		/** How many rows this reel is showing, 4..6. */
		windowRows: number;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);
	// PER REEL, not per board. The box is six rows tall but a reel showing four
	// occupies only the bottom four of them, and its padding symbol sits in the
	// empty space above — culling against the whole box would draw that padding
	// as if it were a real cell, which is a symbol appearing above a reel that
	// has not grown.
	const top = $derived(props.windowTop);
	const bottom = $derived(props.windowTop + SYMBOL_SIZE * props.windowRows);
	const inFrame = $derived(props.y >= top && props.y <= bottom);
</script>

{#if props.debug || (show && inFrame)}
	<Container x={props.x} y={props.y}>
		{@render props.children()}
	</Container>
{/if}

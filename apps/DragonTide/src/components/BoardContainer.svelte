<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { boardShake } from '../game/boardShake.svelte';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	const context = getContext();
	const layout = $derived(context.stateGameDerived.boardLayout());
</script>

<!--
	Every board layer goes through here — symbols, expanding wilds, sticky
	prizes, win lines — so the layout's scale is applied once, at the single
	point they all share, rather than each of them having to know about it.
-->
<!-- zoom: scaling about the pivot would swing the focus point outward; shifting
     back by 80% of that keeps the push-in aimed at it (zoomBoard) -->
<Container
	x={layout.x + (boardShake.x - (boardShake.zoom - 1) * 0.8 * (boardShake.focusX - layout.pivot.x)) * layout.scale}
	y={layout.y + (boardShake.y - (boardShake.zoom - 1) * 0.8 * (boardShake.focusY - layout.pivot.y)) * layout.scale}
	scale={layout.scale * boardShake.scale * boardShake.zoom}
	pivot={layout.pivot}
>
	{@render props.children()}
</Container>

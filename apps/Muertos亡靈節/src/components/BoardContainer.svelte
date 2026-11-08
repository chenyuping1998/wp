<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	const context = getContext();
</script>

<!--
	Every board layer goes through here — symbols, expanding wilds, sticky
	prizes, win lines — so the layout's scale is applied once, at the single
	point they all share, rather than each of them having to know about it.
-->
<Container
	x={context.stateGameDerived.boardLayout().x}
	y={context.stateGameDerived.boardLayout().y}
	scale={context.stateGameDerived.boardLayout().scale}
	pivot={context.stateGameDerived.boardLayout().pivot}
>
	{@render props.children()}
</Container>

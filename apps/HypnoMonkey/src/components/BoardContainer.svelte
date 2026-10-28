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
</script>

<!--
	Every board layer goes through here — symbols, expanding wilds, sticky
	prizes, win lines — so the layout's scale is applied once, at the single
	point they all share, rather than each of them having to know about it.
-->
<Container
	x={context.stateGameDerived.boardLayout().x + boardShake.x * context.stateGameDerived.boardLayout().scale}
	y={context.stateGameDerived.boardLayout().y + boardShake.y * context.stateGameDerived.boardLayout().scale}
	scale={context.stateGameDerived.boardLayout().scale * boardShake.scale}
	pivot={context.stateGameDerived.boardLayout().pivot}
>
	{@render props.children()}
</Container>

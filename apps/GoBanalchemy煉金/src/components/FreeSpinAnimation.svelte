<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	const props: { children: Snippet<[{ sizes: Sizes }]> } = $props();
	const context = getContext();
	const width = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const height = width / (824 / 622);
	const sizes = { width: width * 0.78, height: height * 0.75 };
</script>

<!-- The screen fades in; the plaque and text remain stationary. -->
<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y}
	>
		<Sprite key="gbFgPlaque" anchor={0.5} {width} {height} />
		{@render props.children({ sizes })}
	</Container>
</MainContainer>

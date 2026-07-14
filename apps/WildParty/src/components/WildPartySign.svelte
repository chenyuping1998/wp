<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	const context = getContext();

	const SIGN_WIDTH = SYMBOL_SIZE * 2.4;
	const SIGN_HEIGHT = SIGN_WIDTH * (300 / 420);

	// same left-of-board column as FreeSpinCounter, but pushed below board
	// center so the sign never overlaps the FS counter panel (which hangs
	// from the board's top edge during free games)
	const position = $derived({
		x:
			context.stateGameDerived.boardLayout().x -
			context.stateGameDerived.boardLayout().width * 0.5 -
			SYMBOL_SIZE * 0.7 -
			SIGN_WIDTH * 0.5,
		y:
			context.stateGameDerived.boardLayout().y +
			context.stateGameDerived.boardLayout().height * 0.15,
	});
</script>

{#if ['desktop', 'landscape'].includes(context.stateLayoutDerived.layoutType())}
	<MainContainer>
		<Container {...position}>
			<Sprite key="wpSideSign" anchor={0.5} width={SIGN_WIDTH} height={SIGN_HEIGHT} />
			<ResponsiveBitmapText
				anchor={0.5}
				y={-SIGN_HEIGHT * 0.17}
				maxWidth={SIGN_WIDTH * 0.66}
				text="WILD"
				style={{ fontFamily: 'gold', fontSize: SIGN_HEIGHT * 0.3, align: 'center' }}
			/>
			<ResponsiveBitmapText
				anchor={0.5}
				y={SIGN_HEIGHT * 0.17}
				maxWidth={SIGN_WIDTH * 0.66}
				text="PARTY"
				style={{ fontFamily: 'gold', fontSize: SIGN_HEIGHT * 0.3, align: 'center' }}
			/>
		</Container>
	</MainContainer>
{/if}

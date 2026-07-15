<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		onpress: () => void;
		position?: 'bottom' | 'betweenBoardAndBottom';
	};

	const props: Props = $props();
	const context = getContext();

	const yPosition = $derived.by(() => {
		if (props.position !== 'betweenBoardAndBottom') {
			return context.stateLayoutDerived.mainLayout().height;
		}
		const board = context.stateGameDerived.boardLayout();
		const main = context.stateLayoutDerived.mainLayout();
		// nudged lower so it clears the win count-up above it
		return (board.y + board.height * 0.5 + main.height) * 0.5 + 55;
	});
	</script>

	<MainContainer alignVertical="bottom">
	<!-- same type treatment as the WILD PARTY loading-screen title -->
	<Text
		text={context.i18nDerived.pressAnywhereToContinue()}
		anchor={{ x: 0.5, y: 1 }}
		x={context.stateLayoutDerived.mainLayout().width * 0.5}
		y={yPosition}
		style={{
			fontFamily: 'proxima-nova, Arial, sans-serif',
			fontSize: 34,
			fontWeight: '900',
			fill: 0xfff4cf,
			letterSpacing: 6,
			dropShadow: true,
			dropShadowColor: 0xff9edf,
			dropShadowBlur: 14,
			dropShadowDistance: 0,
			stroke: 0xffffff,
			strokeThickness: 1,
		}}
	/>
</MainContainer>
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />

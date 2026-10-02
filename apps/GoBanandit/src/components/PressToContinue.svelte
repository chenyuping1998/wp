<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';

	type Props = {
		onpress: () => void;
		position?: 'bottom' | 'betweenBoardAndBottom';
		// false: still skippable, but no prompt — for beats that move on by
		// themselves, where "press to continue" would be a false instruction
		showLabel?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	const label = gameText('pressToContinue');

	// soft breathing pulse so the prompt reads as interactive
	let pulse = $state(1);
	onMount(() => {
		const id = everyFrame(() => {
			pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(Date.now() / 480));
		});
		return () => id();
	});

	const yPosition = $derived.by(() => {
		if (props.position !== 'betweenBoardAndBottom') {
			// Off the very edge: anchored flush on it, the stroke and the letters'
			// feet were cut by the bottom of the screen.
			return context.stateLayoutDerived.mainLayout().height - 22;
		}
		const board = context.stateGameDerived.boardLayout();
		const main = context.stateLayoutDerived.mainLayout();
		return (board.y + board.height * 0.5 + main.height) * 0.5;
	});
</script>

{#if props.showLabel !== false}
<MainContainer alignVertical="bottom">
	<Text
		text={label}
		anchor={{ x: 0.5, y: 1 }}
		x={context.stateLayoutDerived.mainLayout().width * 0.5}
		y={yPosition}
		alpha={pulse}
		style={{
			fontFamily: GAME_FONT,
			fontSize: 28,
			fontWeight: GAME_FONT_WEIGHT,
			letterSpacing: 4,
			fill: 0xf2e8d0,
			stroke: 0x1e1b1a,
			strokeThickness: 4,
			dropShadow: false,
		}}
	/>
</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />

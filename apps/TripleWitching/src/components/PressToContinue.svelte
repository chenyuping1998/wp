<script lang="ts">
	import { displayFontFor, displayWeightFor } from '../game/fonts';
	import { onMount } from 'svelte';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';

	type Props = {
		onpress: () => void;
		position?: 'bottom' | 'betweenBoardAndBottom';
	};

	const props: Props = $props();
	const context = getContext();

	const label = gameText('pressToContinue');

	// soft breathing pulse so the prompt reads as interactive
	let pulse = $state(1);
	onMount(() => {
		const id = setInterval(() => {
			pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(Date.now() / 480));
		}, 50);
		return () => clearInterval(id);
	});

	const yPosition = $derived.by(() => {
		if (props.position !== 'betweenBoardAndBottom') {
			return context.stateLayoutDerived.mainLayout().height;
		}
		const board = context.stateGameDerived.boardLayout();
		const main = context.stateLayoutDerived.mainLayout();
		return (board.y + board.height * 0.5 + main.height) * 0.5;
	});
</script>

<MainContainer alignVertical="bottom">
	<Text
		text={label}
		anchor={{ x: 0.5, y: 1 }}
		x={context.stateLayoutDerived.mainLayout().width * 0.5}
		y={yPosition}
		alpha={pulse}
		style={{
			// Wraps rather than running off the screen. This line is one sentence in
			// sixteen languages and some of them are long: Russian's "НАЖМИТЕ В
			// ЛЮБОМ МЕСТЕ, ЧТОБЫ ПРОДОЛЖИТЬ" measured 447px on a 420px portrait
			// canvas, i.e. off both edges at once, against English's comfortable fit.
			wordWrap: true,
			wordWrapWidth: context.stateLayoutDerived.mainLayout().width * 0.9,
			align: 'center',
			fontFamily: displayFontFor(label),
			fontSize: 28,
			fontWeight: displayWeightFor(label),
			letterSpacing: 4,
			fill: 0xf5e3c3,
			stroke: 0x2c1c08,
			strokeThickness: 4,
			dropShadow: true,
			dropShadowColor: 0x000000,
			dropShadowBlur: 8,
			dropShadowDistance: 2,
		}}
	/>
</MainContainer>
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />

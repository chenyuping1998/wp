<script lang="ts">
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
	};

	const props: Props = $props();
	const context = getContext();

	const label = gameText('pressToContinue');

	// Soft breathing pulse so the prompt reads as interactive. On the frame clock:
	// it was a 50 ms interval — 20 steps a second — and visibly stepped.
	let pulse = $state(1);
	onMount(() => {
		let raf = 0;
		const tick = (now: number) => {
			pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now / 480));
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// Clear of the screen's foot. Anchored at the very bottom it sat flush on the
	// edge, and the drop shadow and descenders were cut off.
	const BOTTOM_MARGIN = 22;

	const yPosition = $derived.by(() => {
		if (props.position !== 'betweenBoardAndBottom') {
			return context.stateLayoutDerived.mainLayout().height - BOTTOM_MARGIN;
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
			fontFamily: GAME_FONT,
			fontSize: 28,
			fontWeight: GAME_FONT_WEIGHT,
			letterSpacing: 4,
			// Bone on the charcoal the bet strip uses. It was Hot Miami's pink
			// 0xffe6f7 on a purple 0x2b0a2e stroke.
			fill: 0xf2ead4,
			stroke: 0x091713,
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

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
		/** false: keep the tap-anywhere / Space handling but draw no prompt
		 *  (small wins — the prompt would sit on the bet bar for a second) */
		showLabel?: boolean;
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
		// just under the board: the bet bar fills the band below it, and the old
		// midpoint between board and box floor printed the prompt over the bar
		return Math.min(board.y + board.height * 0.5 + 44, main.height - 200);
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
			fill: 0xf5e3c3,
			stroke: { color: 0x2c1c08, width: 4 },
			dropShadow: { color: 0x000000, blur: 8, distance: 2, alpha: 1, angle: Math.PI / 2 },
		}}
	/>
</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />

<script lang="ts">
	import { Text, Rectangle } from 'pixi-svelte';
	import { stateBet } from 'state-shared';

	import { UI_BASE_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';

	const fontSizeMultiplier = $derived.by(() => {
		if (stateBet.autoSpinsCounter === Infinity) return 3;
		if (stateBet.autoSpinsCounter > 99) return 1.5;
		if (stateBet.autoSpinsCounter > 9) return 2;
		return 2.5;
	});
</script>

{#if stateBet.autoSpinsCounter > 0}
	<Rectangle
		anchor={0.5}
		width={UI_BASE_SIZE * 0.9}
		height={UI_BASE_SIZE * 0.9}
		borderRadius={50}
		backgroundColor={uiTheme.autoSpinsCounterFill}
		borderColor={uiTheme.autoSpinsCounterBorder ?? uiTheme.buttonBorder}
		borderWidth={5}
	/>
	<!--
		The remaining-spins badge is a NUMBER, so it takes valueFontFamily where a
		game supplies one, and the game's own colours everywhere it used to carry
		the Wild Party template's constants: a 0xffd26a amber ring and a 0x6d2692
		purple outline, hard-coded, drawn over every game's bet bar. Capo Nostra has
		no purple in it at all and that outline was the only one on its strip.
		uiTheme.buttonBorder / valueStroke default to the template's own plum-gold
		pair, so a game that themes nothing is close to unchanged.
	-->
	<Text
		anchor={0.5}
		text={stateBet.autoSpinsCounter === Infinity ? '∞' : stateBet.autoSpinsCounter}
		style={{
			fontFamily: uiTheme.valueFontFamily ?? uiTheme.fontFamily,
			fill: uiTheme.autoSpinsCounterLabel,
			fontWeight: uiTheme.valueFontWeight ?? uiTheme.fontWeight,
			fontSize: fontSizeMultiplier * UI_BASE_SIZE * 0.2,
			// v8 shape. `stroke: colour` plus `strokeThickness: n` is the v7 pair:
			// deprecated, it logs on every Text built here, and it caps out thinner
			// than the value asks for.
			stroke: {
				color: uiTheme.autoSpinsCounterLabelStroke ?? uiTheme.valueStroke,
				width: 4,
				join: 'round',
			},
		}}
	/>
{/if}

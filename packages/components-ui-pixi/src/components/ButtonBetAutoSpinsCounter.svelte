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
		borderColor={uiTheme.autoSpinsCounterBorder}
		borderWidth={5}
	/>
	<Text
		anchor={0.5}
		text={stateBet.autoSpinsCounter === Infinity ? '∞' : stateBet.autoSpinsCounter}
		style={{
			fontFamily: uiTheme.fontFamily,
			fill: uiTheme.autoSpinsCounterLabel,
			fontWeight: uiTheme.fontWeight,
			fontSize: fontSizeMultiplier * UI_BASE_SIZE * 0.2,
			// v8 shape. `stroke: colour` plus `strokeThickness: n` is the v7 pair:
			// deprecated, it logs on every Text built here, and it caps out thinner
			// than the value asks for.
			stroke: { color: uiTheme.autoSpinsCounterLabelStroke, width: 4, join: 'round' },
		}}
	/>
{/if}

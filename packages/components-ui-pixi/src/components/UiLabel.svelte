<script lang="ts">
	import { Text } from 'pixi-svelte';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
		// per-metric accent (border + label colour). The value digits deliberately
		// stay uniform across every panel so the numbers read as one consistent set.
		accent?: { border: number; label: number };
	};

	const props: Props = $props();

	const accent = $derived(props.accent ?? { border: uiTheme.panelBorder, label: uiTheme.labelFill });

	const labelStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontSize: UI_BASE_FONT_SIZE,
		fill: accent.label,
		stroke: uiTheme.valueStroke,
		strokeThickness: 3,
	});

	// uniform across Balance / Win / Bet — never tinted by accent
	const valueStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontSize: UI_BASE_FONT_SIZE,
		fill: uiTheme.valueFill,
		stroke: uiTheme.valueStroke,
		strokeThickness: 3,
		dropShadow: true,
		dropShadowColor: uiTheme.valueShadow,
		dropShadowBlur: 2,
		dropShadowDistance: 1,
	});
</script>

{#if props.stacked}
	{#if props.tiled}
		<UiSprite
			y={-20}
			anchor={{ x: 0.5, y: 0 }}
			key="base_ticker"
			width={UI_BASE_FONT_SIZE * 3 * (326 / 73)}
			height={UI_BASE_FONT_SIZE * 3}
			borderRadius={24}
			backgroundColor={uiTheme.panelFill}
			borderColor={accent.border}
			borderWidth={5}
		/>
	{/if}
	<Text anchor={{ x: 0.5, y: 0 }} text={props.label} style={labelStyle} />
	<Text anchor={{ x: 0.5, y: 0 }} text={props.value} style={valueStyle} y={UI_BASE_FONT_SIZE} />
{:else}
	{#if props.tiled}
		<UiSprite
			x={-90}
			anchor={{ x: 0, y: 0.5 }}
			key="base_ticker"
			width={UI_BASE_FONT_SIZE * 3 * (326 / 73)}
			height={UI_BASE_FONT_SIZE * 3}
			borderRadius={24}
			backgroundColor={uiTheme.panelFill}
			borderColor={accent.border}
			borderWidth={5}
		/>
	{/if}
	<Text anchor={{ x: 0, y: 0.5 }} text={props.label} style={labelStyle} />
	<Text
		anchor={{ x: 1, y: 0.5 }}
		text={props.value}
		style={valueStyle}
		x={UI_BASE_FONT_SIZE * 10}
	/>
{/if}

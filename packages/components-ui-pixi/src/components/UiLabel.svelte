<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { WHITE } from 'constants-shared/colors';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';

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

	const DEFAULT_ACCENT = { border: 0xd8a84e, label: 0xfff08c };
	const accent = $derived(props.accent ?? DEFAULT_ACCENT);

	const labelStyle = $derived({
		fontFamily: 'Cinzel, Georgia, serif',
		fontSize: UI_BASE_FONT_SIZE,
		fill: accent.label,
		stroke: 0x7133a4,
		strokeThickness: 3,
	});

	// uniform across Balance / Win / Bet — never tinted by accent
	const valueStyle = {
		fontFamily: 'Cinzel, Georgia, serif',
		fontSize: UI_BASE_FONT_SIZE,
		fill: WHITE,
		stroke: 0x7133a4,
		strokeThickness: 3,
		dropShadow: true,
		dropShadowColor: 0x5a1977,
		dropShadowBlur: 2,
		dropShadowDistance: 1,
	} as const;
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
			backgroundColor={0x1d0b28}
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
			backgroundColor={0x1d0b28}
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

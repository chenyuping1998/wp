<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
		// this panel opens something when tapped — draw a chevron so that is
		// discoverable (Balance/Win are static and look otherwise identical)
		interactive?: boolean;
		// cursor is currently over this panel
		hovered?: boolean;
		// per-metric accent (border + label colour). The value digits deliberately
		// stay uniform across every panel so the numbers read as one consistent set.
		accent?: { border: number; label: number };
		/**
		 * Widest this readout may draw, in the readout's own units. Beyond it the
		 * VALUE line is condensed to fit.
		 *
		 * The bottom bar divides its left half into fixed cells, and the sizes were
		 * chosen against "the widest realistic strings" — which turned out to mean
		 * the widest ones anybody had looked at. A Gold Coin balance is nine
		 * figures (GC 9,999,652,000) and the value ran straight through the rule
		 * into the next cell and printed over its neighbour's text.
		 *
		 * Undefined means unbounded, so every layout that does not pass one is
		 * unchanged.
		 */
		maxWidth?: number;
	};

	const props: Props = $props();

	// Measured, not estimated. pixi reports a Text's width once it has laid the
	// glyphs out, so the only honest way to know whether a string fits is to draw
	// it and ask — a character-count guess is wrong the moment the font or the
	// currency changes.
	//
	// The shrink is applied to a CONTAINER around the Text, not to the Text.
	// Text.width is the width after its own scale, so scaling the Text and then
	// measuring it feeds the measurement back into the thing being measured, and
	// the two chase each other. Wrapping keeps the reported width the natural one.
	let valueWidth = $state(0);
	const valueScale = $derived(
		props.maxWidth && valueWidth > props.maxWidth ? props.maxWidth / valueWidth : 1,
	);

	const accent = $derived(props.accent ?? { border: uiTheme.panelBorder, label: uiTheme.labelFill });

	// The caption is a WORD and the value is a NUMBER, and a game may want them in
	// different faces — see uiTheme.valueFontFamily. Both keys are null by default
	// and resolve to exactly what was here before: fontFamily, and no weight at
	// all on either style.
	const labelStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		...(uiTheme.labelFontWeight ? { fontWeight: uiTheme.labelFontWeight } : {}),
		fontSize: UI_BASE_FONT_SIZE,
		fill: accent.label,
		stroke: uiTheme.valueStroke,
		strokeThickness: 3,
	});

	// uniform across Balance / Win / Bet — never tinted by accent
	const valueStyle = $derived({
		fontFamily: uiTheme.valueFontFamily ?? uiTheme.fontFamily,
		...(uiTheme.valueFontWeight ? { fontWeight: uiTheme.valueFontWeight } : {}),
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
	<!--
		Scaled rather than truncated or wrapped. This is a money figure: an ellipsis
		or a fold turns "9,999,652,000" into something that reads as a different
		number, and a smaller but complete one does not.
	-->
	<Container y={UI_BASE_FONT_SIZE} scale={valueScale}>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			text={props.value}
			style={valueStyle}
			onresize={({ width }) => (valueWidth = width)}
		/>
	</Container>
	{#if props.hovered && uiTheme.hoverHighlight}
		<!--
			Hover lift. When this readout sits on the ticker plate it fills the plate;
			with no plate (the compact bottom bar passes tiled=false) it must instead
			hug the two lines of text, or the highlight spills far past the cell the
			divider rules define — which is exactly what it did over the Bet cell.
		-->
		{#if props.tiled}
			<Graphics
				y={-20}
				draw={(g) => {
					const w = UI_BASE_FONT_SIZE * 3 * (326 / 73);
					const h = UI_BASE_FONT_SIZE * 3;
					g.clear();
					g.roundRect(-w / 2, 0, w, h, 24);
					g.fill({ color: 0xffffff, alpha: 0.12 });
				}}
			/>
		{:else}
			<Graphics
				draw={(g) => {
					// label sits at y=0, value at y=UI_BASE_FONT_SIZE — box wraps both
					// with a little air, sized to the widest value the readout shows
					const w = UI_BASE_FONT_SIZE * 5.4;
					const h = UI_BASE_FONT_SIZE * 2.5;
					g.clear();
					g.roundRect(-w / 2, -UI_BASE_FONT_SIZE * 0.4, w, h, 12);
					g.fill({ color: 0xffffff, alpha: 0.1 });
				}}
			/>
		{/if}
	{/if}

	{#if props.interactive && uiTheme.labelAffordance}
		<!--
			The hit area, drawn before the chevron so it sits under everything.

			A pixi Container has no hit area of its own - it hit-tests the union of
			its children's geometry. This readout's children are two Text nodes and a
			chevron that is a 2px stroked polyline, so the region that actually
			responded to a tap was the two words plus a hairline V, with a dead gap
			between them. Aiming for the chevron - the one part of the panel that
			LOOKS like a control - was the hardest thing on the bar to hit.

			A rectangle at alpha 0.004 fixes it: pixi hit-tests Graphics by geometry
			rather than by what you can see, and 0.004 is under a quarter of one 8-bit
			level, so it cannot tint the plate underneath. Not zero, because a
			fully transparent fill is the kind of thing a future optimisation is
			entitled to cull.

			Only drawn where the chevron is, so a game that does not opt into
			labelAffordance keeps exactly the hit area it has today.
		-->
		<Graphics
			draw={(g) => {
				// wraps the label, the value and the chevron, with a little air
				const w = UI_BASE_FONT_SIZE * 8.4;
				const h = UI_BASE_FONT_SIZE * 2.9;
				g.clear();
				g.roundRect(-w / 2, -UI_BASE_FONT_SIZE * 0.5, w, h, 12);
				g.fill({ color: 0xffffff, alpha: 0.004 });
			}}
		/>
		<!-- chevron marking this panel as tappable -->
		<Graphics
			x={UI_BASE_FONT_SIZE * 3.6}
			y={UI_BASE_FONT_SIZE * 1.1}
			draw={(g) => {
				const s = UI_BASE_FONT_SIZE * 0.3;
				g.clear();
				g.moveTo(-s, -s * 0.55);
				g.lineTo(0, s * 0.55);
				g.lineTo(s, -s * 0.55);
				g.stroke({ width: UI_BASE_FONT_SIZE * 0.16, color: accent.label, cap: 'round', join: 'round' });
			}}
		/>
	{/if}
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

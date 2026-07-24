<script lang="ts">
	import { Graphics, Sprite, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiSprite from './UiSprite.svelte';
	import type { ButtonIcon } from '../types';
	import type { Snippet } from 'svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';

	type Props = Omit<ButtonProps, 'children'> & {
		icon: ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
		variant?: 'dark' | 'light';
		textMode?: 'icon' | 'text';
		text?: string;
	};

	const {
		icon,
		active,
		variant = 'dark',
		textMode = 'icon',
		text,
		children: childrenFromParent,
		...buttonProps
	}: Props = $props();

	const backgroundColor = $derived.by(() => {
		if (buttonProps.disabled) return uiTheme.buttonFillDisabled;
		// an ON toggle (turbo, autoplay) needs to read as ON at a glance; a thicker
		// border alone was too subtle to register as state
		if (active && uiTheme.buttonFillActive !== null) return uiTheme.buttonFillActive;
		if (variant === 'light') return uiTheme.buttonFillLight;
		return uiTheme.buttonFill;
	});

	const iconSymbolMap: Partial<Record<ButtonIcon, string>> = {
		menu: '≡',
		menuExit: '✕',
		turbo: '⚡',
		decrease: '−',
		increase: '+',
		payTable: '▤',
		info: 'i',
		settings: '⚙',
		soundOn: '🔊',
		soundOff: '🔇',
		autoSpin: '▶',
	};

	// optical centering: a right-pointing triangle's visual mass sits left of
	// its glyph-box center, so nudge it right a touch inside the circle
	const iconOffsetXMap: Partial<Record<ButtonIcon, number>> = {
		autoSpin: 0.045,
	};

	const iconTextOverrideMap: Partial<Record<ButtonIcon, string>> = {};

	const iconFontSizeMultiplierMap: Partial<Record<ButtonIcon, number>> = {
		autoSpin: 1.3,
		turbo: 1.45,
		menu: 1.4,
		// the −/+ bet steppers are typographic glyphs, not emoji, so they stay as
		// text — bumped up so they read at a glance next to the big bet button
		decrease: 1.7,
		increase: 1.7,
	};

	// Per-icon scale for the drawn sprite icons (fraction of button width).
	// Default keeps a comfortable margin; autoSpin's play triangle needs more
	// presence so it is enlarged.
	const iconSpriteScaleMap: Partial<Record<ButtonIcon, number>> = {
		autoSpin: 0.82,
	};

	const isTextMode = $derived(textMode === 'text');
	const iconFontSize = $derived.by(() => {
		if (isTextMode) return UI_BASE_FONT_SIZE * 0.72;
		return UI_BASE_FONT_SIZE * (iconFontSizeMultiplierMap[icon] ?? 1.1);
	});
	const iconText = $derived.by(() => {
		if (text) return text;
		if (textMode === 'text') return i18nDerived[icon]();
		return iconTextOverrideMap[icon] ?? iconSymbolMap[icon] ?? i18nDerived[icon]();
	});
	const iconFill = $derived(uiTheme.buttonIconFill);
	const iconStroke = $derived(uiTheme.buttonIconStroke);
	// turbo bolt: outlined when idle, filled when active
	const boltColor = $derived(buttonProps.disabled ? 0xbdbdbd : uiTheme.buttonIconFill);
</script>

<Button {...buttonProps}>
	{#snippet children({ center, hovered, pressed })}
		<UiSprite
			{...center}
			anchor={0.5}
			width={buttonProps.sizes.width}
			height={buttonProps.sizes.height}
			backgroundColor={backgroundColor}
			borderColor={uiTheme.buttonBorder}
			borderWidth={active ? 10 : 6}
			borderRadius={buttonProps.sizes.width * 0.5}
			{...active
				? {
						alpha: 1,
					}
				: {}}
		/>

		{#if uiTheme.icons[icon]}
			<!-- drawn icon art (brass, with depth) replacing the text/emoji glyph;
			     opted into per game via uiTheme.icons, so games without it keep the
			     glyphs. Sized to sit inside the button with a small margin. -->
			{@const iconScale = iconSpriteScaleMap[icon] ?? 0.62}
			<Sprite
				{...center}
				anchor={0.5}
				key={uiTheme.icons[icon]}
				width={buttonProps.sizes.width * iconScale}
				height={buttonProps.sizes.width * iconScale}
			/>
		{:else if icon === 'turbo'}
			<!-- vector bolt instead of the ⚡ glyph: emoji glyphs ignore canvas
			     fill, so white/orange styling only works with a drawn shape -->
			<Graphics
				x={center.x}
				y={center.y}
				draw={(g) => {
					// 0.72: bolt body fills most of the circle so the hollow
					// interior reads clearly at UI size; x widened 1.4x so the
					// interior area reads bigger left-right
					const s = (buttonProps.sizes.width * 0.72) / 96;
					const sx = s * 1.4;
					g.poly([10 * sx, -48 * s, -22 * sx, 6 * s, -2 * sx, 6 * s, -12 * sx, 48 * s, 24 * sx, -10 * s, 2 * sx, -10 * s]);
					if (active) g.fill(0xffffff);
					g.stroke({ width: buttonProps.sizes.width * 0.04, color: boltColor, join: 'round' });
				}}
			/>
		{:else}
			<Text
				{...center}
				x={center.x + buttonProps.sizes.width * (iconOffsetXMap[icon] ?? 0)}
				anchor={0.5}
				text={iconText}
				style={{
					align: 'center',
					wordWrap: true,
					wordWrapWidth: buttonProps.sizes.width * (isTextMode ? 0.68 : 0.85),
					fontFamily: uiTheme.fontFamily,
					fontWeight: uiTheme.fontWeight,
					fontSize: iconFontSize,
					fill: iconFill,
					stroke: iconStroke,
					strokeThickness: 3,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowBlur: 2,
					dropShadowDistance: 2,
				}}
			/>
		{/if}

		{@render childrenFromParent?.()}
	{/snippet}
</Button>

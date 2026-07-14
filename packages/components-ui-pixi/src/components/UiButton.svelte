<script lang="ts">
	import { Graphics, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiSprite from './UiSprite.svelte';
	import type { ButtonIcon } from '../types';
	import type { Snippet } from 'svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from '../constants';

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
		if (buttonProps.disabled) return 0x5a5a5a;
		if (variant === 'light') return 0x8fe6ff;
		if (icon === 'turbo') return 0x2f2f2f;
		return 0x131313;
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
	const iconFill = 0xffffff;
	const iconStroke = 0x000000;
	// turbo bolt: white outline when idle, filled orange when active
	const boltColor = $derived(buttonProps.disabled ? 0xbdbdbd : 0xffffff);
</script>

<Button {...buttonProps}>
	{#snippet children({ center, hovered, pressed })}
		<UiSprite
			{...center}
			anchor={0.5}
			width={buttonProps.sizes.width}
			height={buttonProps.sizes.height}
			backgroundColor={backgroundColor}
			borderColor={0xffffff}
			borderWidth={active ? 10 : 6}
			borderRadius={buttonProps.sizes.width * 0.5}
			{...active
				? {
						alpha: 1,
					}
				: {}}
		/>

		{#if icon === 'turbo'}
			<!-- vector bolt instead of the ⚡ glyph: emoji glyphs ignore canvas
			     fill, so white/orange styling only works with a drawn shape -->
			<Graphics
				x={center.x}
				y={center.y}
				draw={(g) => {
					const s = (buttonProps.sizes.width * 0.55) / 96;
					g.poly([10 * s, -48 * s, -22 * s, 6 * s, -2 * s, 6 * s, -12 * s, 48 * s, 24 * s, -10 * s, 2 * s, -10 * s]);
					if (active) g.fill(0xffd75e);
					g.stroke({ width: buttonProps.sizes.width * 0.055, color: boltColor, join: 'round' });
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
					fontFamily: 'proxima-nova',
					fontWeight: '600',
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

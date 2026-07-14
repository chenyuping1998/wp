<script lang="ts">
	import { Text } from 'pixi-svelte';
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
		if (icon === 'turbo') return active ? 0xff7a00 : 0x2f2f2f;
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
	const iconFill = $derived.by(() => {
		if (icon === 'turbo') {
			if (buttonProps.disabled) return 0xbdbdbd;
			return active ? 0xffffff : 0xbdbdbd;
		}
		return 0xffffff;
	});
	const iconStroke = $derived(icon === 'turbo' && active ? 0x5a2a00 : 0x000000);
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

		<Text
			{...center}
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

		{@render childrenFromParent?.()}
	{/snippet}
</Button>

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
		noHover?: boolean;
		text?: string;
	};

	const {
		icon,
		active,
		variant = 'dark',
		textMode = 'icon',
		text,
		// opt out of the hover highlight for controls where it would be noise —
		// the bet steppers fire repeatedly and do not need to light up each time
		noHover = false,
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
		// U+21BA, not an emoji — themes without a drawn replay icon still get a
		// glyph that honours the canvas fill
		replay: '↺',
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
		// same drawing size as autoSpin — the two share an arc of the same radius,
		// so anything else would make them look like different-sized buttons
		replay: 0.82,
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
		{@const held = uiTheme.pressFeedback && pressed && !buttonProps.disabled}
		<!-- `button` is a uiTheme.sprites slot: undefined for every game, which
		     keeps the flat rounded rect this has always drawn. A game that supplies
		     a drawn disc gets it here, on every round control at once.

		     UiSprite ignores backgroundColor/borderColor once a sprite resolves, so
		     the three states the fill was carrying (idle / disabled / ON) have to be
		     carried some other way or the art ships stateless — a turbo toggle that
		     looks identical on and off. They are: `tint` below dims the plate when
		     the control is disabled, and the ring after it redraws the active
		     border over the art. Both are skipped entirely when there is no plate.

		     A game can also supply `buttonActive`: the same disc drawn LIT. When it
		     does, the ON state is carried by the art and the ring below is dropped —
		     a heavy ring stroked over a plate that is already lit is a second frame
		     nobody asked for. Games with only `button` keep the ring. -->
		{@const litPlate = active ? uiTheme.sprites.buttonActive : undefined}
		{@const plate = litPlate ?? uiTheme.sprites.button}
		<UiSprite
			{...center}
			key={litPlate ? 'buttonActive' : 'button'}
			anchor={0.5}
			{...plate && buttonProps.disabled
				? {
						// tint multiplies, so it can only darken — which is the right
						// direction for "unavailable" and the wrong one for "ON". ON is
						// the ring below.
						tint: 0x6b6b6b,
					}
				: {}}
			{...held
				? {
						// Shrunk about its own centre, which is what a physical button
						// does. Small on purpose: the bar is pressed every few seconds
						// and anything larger becomes a twitch.
						width: buttonProps.sizes.width * 0.93,
						height: buttonProps.sizes.height * 0.93,
					}
				: {
						width: buttonProps.sizes.width,
						height: buttonProps.sizes.height,
					}}
			backgroundColor={backgroundColor}
			borderColor={uiTheme.buttonBorder}
			borderWidth={active ? uiTheme.buttonBorderWidthActive : uiTheme.buttonBorderWidth}
			borderRadius={buttonProps.sizes.width * 0.5}
			{...active
				? {
						alpha: 1,
					}
				: {}}
		/>

		{#if plate && active && !litPlate}
			<!-- ON state for a control drawn from plate art. The rounded rect draws
			     this as a thicker border; a sprite has no border, so it is stroked
			     here instead, in the same colour and at the same width. -->
			<Graphics
				x={center.x}
				y={center.y}
				draw={(g) => {
					const w = buttonProps.sizes.width * (held ? 0.93 : 1);
					const h = buttonProps.sizes.height * (held ? 0.93 : 1);
					g.clear();
					g.roundRect(-w / 2, -h / 2, w, h, w * 0.5);
					g.stroke({ width: uiTheme.buttonBorderWidthActive, color: uiTheme.buttonBorder });
				}}
			/>
		{/if}

		{#if held}
			<!-- and a shadow over it, so the control reads as pushed into the bar
			     rather than merely smaller. Drawn at the pressed size, so its edge
			     lands on the plate's edge. -->
			<Graphics
				x={center.x}
				y={center.y}
				draw={(g) => {
					const w = buttonProps.sizes.width * 0.93;
					const h = buttonProps.sizes.height * 0.93;
					g.clear();
					g.roundRect(-w / 2, -h / 2, w, h, w * 0.5);
					g.fill({ color: 0x000000, alpha: 0.28 });
				}}
			/>
		{/if}

		{#if uiTheme.hoverHighlight && hovered && !buttonProps.disabled && !noHover}
			<!-- subtle lift while the cursor is over the control. A white overlay
			     rather than a tint: tint multiplies, so it can only darken. -->
			<Graphics
				x={center.x}
				y={center.y}
				draw={(g) => {
					const w = buttonProps.sizes.width;
					const h = buttonProps.sizes.height;
					g.clear();
					g.roundRect(-w / 2, -h / 2, w, h, w * 0.5);
					g.fill({ color: 0xffffff, alpha: 0.16 });
				}}
			/>
		{/if}

		{#if uiTheme.icons[icon]}
			<!-- drawn icon art (brass, with depth) replacing the text/emoji glyph;
			     opted into per game via uiTheme.icons, so games without it keep the
			     glyphs. Sized to sit inside the button with a small margin.

			     0.62 was tuned for a flat drawn circle (buttonFill/buttonBorder),
			     where the whole button face is available. A game whose `sprites.
			     button` plate has a rim eating into the diameter needs the icon
			     bigger to actually reach the recess — `buttonIconScale` lets a
			     game raise the FALLBACK only, so `iconSpriteScaleMap` entries
			     tuned for a specific icon (autoSpin/replay's 0.82, chosen for
			     their own shared arc radius) still win where set. Unset for
			     every game that hasn't asked for it, so this is a no-op
			     everywhere but where a game opts in. -->
			{@const iconScale = uiTheme.iconScales[icon] ?? iconSpriteScaleMap[icon] ?? uiTheme.buttonIconScale ?? 0.62}
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
					const s = (buttonProps.sizes.width * (uiTheme.turboIconScale ?? 0.72)) / 96;
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

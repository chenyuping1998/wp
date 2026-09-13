<script lang="ts">
	import { Graphics, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived } from 'state-shared';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { uiTheme } from '../theme.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const { stateXstateDerived, eventEmitter } = getContext();
	// The BOX, and therefore the hit area and the space the layout reserves.
	// Scaling this rather than only the plate art is the difference between a
	// button that is smaller and a button that merely looks smaller while still
	// swallowing presses across its old footprint.
	const box = $derived(UI_BASE_SIZE * uiTheme.buyBonusButtonScale);
	const sizes = $derived({ width: box, height: box });
	const disabled = $derived(!stateXstateDerived.isIdle());
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');

	// The plate art can be drawn larger than the button's box - see the theme. The
	// BOX is what positions and hit-tests; only the picture grows.
	const plate = $derived({
		width: sizes.width * uiTheme.buyBonusPlateScale,
		height: sizes.height * uiTheme.buyBonusPlateScale,
	});

	// The label goes with the button. Left absolute it would keep its full size
	// inside a shrunken plate, and the wrap width — which is measured against the
	// plate, not the text — would let it run past the edge.
	const labelScale = $derived(uiTheme.buyBonusButtonScale);

	const dimmed = $derived(disabled && uiTheme.buyBonusDisabledStyle === 'dim');
	// The caption dims WITH the plate. Fading the plate alone leaves the words
	// sitting at full strength on a darkened panel, which is the same mismatch
	// 'grey' has, just in the other direction.
	const labelAlpha = $derived(dimmed ? 0.55 : 1);

	// Breathing glow while the button is ready to be pressed, for games that ask
	// for it. Driven by a timer rather than a transition so it keeps going while
	// nothing else on screen is moving, which is exactly when it is needed.
	let idlePulse = $state(0);
	$effect(() => {
		if (!uiTheme.buyBonusIdleGlow) return;
		let phase = 0;
		const id = setInterval(() => {
			phase += 0.045;
			idlePulse = 0.5 + 0.5 * Math.sin(phase);
		}, 32);
		return () => clearInterval(id);
	});
	const idleLit = $derived(uiTheme.buyBonusIdleGlow && !disabled && !active);

	const openModal = () => (stateModal.modal = { name: 'buyBonus' });
	const disableActiveBetMode = () => (stateBet.activeBetModeKey = 'BASE');
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (active) {
			disableActiveBetMode();
		} else {
			openModal();
		}
	};

	const getState = (value: {
		active: boolean;
		disabled: boolean;
		hovered: boolean;
		pressed: boolean;
	}) => {
		// APPEARANCE only. What the button SAYS is decided by `active` alone - see
		// the label below - because hover and press are how a control looks and
		// `active` is what it does.
		//
		// The label used to be read off this, and the order here put `hovered`
		// ahead of `active`: moving the cursor over a button that was showing
		// DISABLE flipped it to BUY BONUS, so the one state where pressing it turns
		// a mode OFF was labelled as though it would turn one on.
		if (value.disabled) return 'disabled' as const;
		if (value.pressed) return 'pressed' as const;
		if (value.hovered) return 'hovered' as const;
		if (value.active) return 'active' as const;
		return 'default' as const;
	};
</script>

<Button {...props} {sizes} {disabled} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		{@const state = getState({
			active,
			disabled,
			hovered,
			pressed,
		})}

		{#if idleLit}
			<!--
				The "you can press this" light, under the plate.
				Stacked low-alpha rings, the same construction as the spin button's
				charge, sized to the ART rather than to the button box so it hugs the
				object instead of squaring it off.
			-->
			<Graphics
				{...center}
				draw={(g) => {
					const w = plate.width * uiTheme.buyBonusPlateInset.width;
					const h = plate.height * uiTheme.buyBonusPlateInset.height;
					g.clear();
					for (const [grow, weight] of [
						[0.42, 0.13],
						[0.26, 0.2],
						[0.12, 0.28],
					] as [number, number][]) {
						g.roundRect(
							(-w * (1 + grow)) / 2,
							(-h * (1 + grow)) / 2,
							w * (1 + grow),
							h * (1 + grow),
							h * 0.06,
						);
						g.fill({ color: uiTheme.buyBonusIdleGlowFill, alpha: weight * (0.35 + 0.65 * idlePulse) });
					}
				}}
			/>
		{/if}

		<UiSprite
			key="buyBonus"
			{...center}
			anchor={0.5}
			width={plate.width}
			height={plate.height}
			{...uiTheme.buyBonusPlateChrome
				? {
						backgroundColor: uiTheme.buyBonusFill,
						borderColor: uiTheme.buyBonusBorder,
						borderWidth: uiTheme.buyBonusBorderWidth,
						borderRadius: uiTheme.buyBonusCornerRadius,
					}
				: {}}
			{...(uiTheme.buyBonusIdleTint !== undefined && !disabled && !active
				? { tint: uiTheme.buyBonusIdleTint }
				: {})}
			{...disabled
				? dimmed
					? {
							// Darken, do not lighten, and keep the hue: the plate stays
							// recognisably the same object with the light off it.
							//
							// 0x4a4a4a first time round, which took it close to black - a
							// hole in the layout rather than a button that is off. The
							// point is to sit clearly below the enabled state, not to
							// disappear, and the faded caption already carries most of
							// that signal. This and labelAlpha above are the two numbers
							// to move if it needs to go further either way.
							tint: uiTheme.buyBonusDisabledTint ?? 0x767670,
							backgroundColor: uiTheme.buyBonusDisabledFill,
						}
					: {
							backgroundColor: 0xaaaaaa,
							// plate art ignores fills, so grey it down with tint instead
							tint: uiTheme.buyBonusDisabledTint ?? 0x8a8a8a,
						}
				: {}}
			{...active
				? {
						borderWidth: 10,
						borderColor: 0xffffff,
						tint: 0xfff2c0,
					}
				: {}}
		/>

		{#if uiTheme.buyBonusHoverStyle === 'outline' && hovered && !disabled}
			<Graphics
				{...center}
				draw={(g) => {
					// The plate's own edge, stroked. Sized to the ART - see
					// buyBonusPlateInset - so it sits on the object rather than on the
					// button box around it.
					const w = plate.width * uiTheme.buyBonusPlateInset.width;
					const h = plate.height * uiTheme.buyBonusPlateInset.height;
					const padX = w * uiTheme.buyBonusHighlightPad;
					const padY = h * uiTheme.buyBonusHighlightPad;
					g.clear();
					g.roundRect(-w / 2 - padX, -h / 2 - padY, w + padX * 2, h + padY * 2, h * 0.04);
					// Stroked, never filled, and at full alpha. A soft or translucent
					// line reads as a glow and a glow is what this replaced.
					g.stroke({
						width: uiTheme.buyBonusHoverOutlineWidth,
						color: uiTheme.buyBonusHoverOutlineColor,
						alpha: 1,
					});
				}}
			/>
		{:else if uiTheme.buyBonusHoverSprite && hovered && !disabled}
			<!--
				The plate's own incantation, lit. Additive, so it reads as the paper
				catching light rather than as something laid on top of it - a normal
				blend at any alpha is a lighter object in front, and this has to be
				the same object brighter.
			-->
			<UiSprite
				key={uiTheme.buyBonusHoverSprite}
				{...center}
				anchor={0.5}
				width={plate.width}
				height={plate.height}
				tint={uiTheme.buyBonusHoverSpriteTint}
				blendMode={uiTheme.buyBonusHoverSpriteBlend}
			/>
		{:else if uiTheme.hoverHighlight && hovered && !disabled}
			<!-- same subtle lift as the rail buttons; this one is assembled by hand
			     rather than through UiButton, so it needs its own overlay -->
			<Graphics
				{...center}
				draw={(g) => {
					// Sized to the PLATE ART, not to the button box. On a square button
					// with an object-shaped plate the old version drew a highlight half
					// again as wide as the thing it was highlighting.
					const w = plate.width * uiTheme.buyBonusPlateInset.width;
					const h = plate.height * uiTheme.buyBonusPlateInset.height;
					// PER AXIS. The standoff used to be a fraction of the HEIGHT on both
					// axes, which is the same number on a square plate and is not on a
					// tall one: Soul Seal's talisman is 111 wide by 198 high, so a pad of
					// 3% of the height put 5.4% of the width on each side and the
					// highlight read as a loose box round a narrow object.
					const padX = w * uiTheme.buyBonusHighlightPad;
					const padY = h * uiTheme.buyBonusHighlightPad;
					g.clear();
					g.roundRect(
						-w / 2 - padX,
						-h / 2 - padY,
						w + padX * 2,
						h + padY * 2,
						h * uiTheme.buyBonusHighlightRadius,
					);
					g.fill({ color: 0xffffff, alpha: 0.16 });
				}}
			/>
		{/if}

		<Text
			{...center}
			anchor={0.5}
			alpha={labelAlpha}
			text={active ? i18nDerived.disable() : i18nDerived.buyBonus()}
			style={{
				align: 'center',
				wordWrap: true,
				// Keep the wrap box inside the plate, not just inside the button. The
				// default is the 150px button minus its 7px border; a game whose plate
				// is an object rather than a panel narrows it - see the theme.
				wordWrapWidth: uiTheme.buyBonusLabelWrapWidth * labelScale,
				lineHeight: UI_BASE_FONT_SIZE * (uiTheme.buyBonusLabelSizeRatio + 0.04) * labelScale,
				fontFamily: uiTheme.fontFamily,
				fontWeight: uiTheme.fontWeight,
				fontSize: UI_BASE_FONT_SIZE * uiTheme.buyBonusLabelSizeRatio * labelScale,
				// themed, not hardcoded white: on GoBananas' olive plate the white
				// read as a different game's button sitting on the board. Defaults to
				// white, so Wild Party is unchanged.
				fill: uiTheme.buyBonusLabelFill,
			}}
		/>
	{/snippet}
</Button>

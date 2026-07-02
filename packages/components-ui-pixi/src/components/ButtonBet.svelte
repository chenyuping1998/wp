<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import UiSprite from './UiSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE * 1.12, height: UI_BASE_SIZE * 1.12 };
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered })}
				<Container {...center}>
					<UiSprite
						key="bet"
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
						backgroundColor={disabled || ['spin_disabled', 'stop_disabled'].includes(key)
							? 0x5a5a5a
							: 0x131313}
						borderColor={0xffffff}
						borderWidth={7}
						borderRadius={sizes.width * 0.5}
						alpha={0.92}
					/>
					{#if ['spin_default', 'spin_disabled'].includes(key)}
						<Text
							anchor={0.5}
							text={i18nDerived.bet()}
							style={{
								fontFamily: 'proxima-nova',
								fontWeight: '700',
								fontSize: UI_BASE_FONT_SIZE * 0.9,
								fill: 0xffffff,
								stroke: 0x000000,
								strokeThickness: 3,
								dropShadow: true,
								dropShadowColor: 0x000000,
								dropShadowBlur: 2,
								dropShadowDistance: 2,
							}}
						/>
					{:else}
						<Text
							anchor={0.5}
							text={i18nDerived.stop()}
							style={{
								fontFamily: 'proxima-nova',
								fontWeight: '700',
								fontSize: UI_BASE_FONT_SIZE * 0.9,
								fill: 0xffffff,
								stroke: 0x000000,
								strokeThickness: 3,
								dropShadow: true,
								dropShadowColor: 0x000000,
								dropShadowBlur: 2,
								dropShadowDistance: 2,
							}}
						/>
					{/if}
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>

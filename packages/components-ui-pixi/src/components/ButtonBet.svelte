<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import UiSprite from './UiSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import ButtonBetSpinIcon from './ButtonBetSpinIcon.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE * 1.12, height: UI_BASE_SIZE * 1.12 };
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center })}
				<Container {...center}>
					<UiSprite
						key="bet"
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
						backgroundColor={disabled || ['spin_disabled', 'stop_disabled'].includes(key)
							? uiTheme.buttonFillDisabled
							: uiTheme.betFill}
						borderColor={uiTheme.betBorder}
						borderWidth={7}
						borderRadius={sizes.width * 0.5}
						alpha={0.92}
					/>
					<!-- circular double-arrow: static when idle, spins while the reels
					     run, then finishes its turn and rests when they stop -->
					<ButtonBetSpinIcon
						spinning={['stop_default', 'stop_disabled'].includes(key)}
						radius={sizes.width * 0.22}
					/>
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>

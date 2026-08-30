<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived, stateModal } from 'state-shared';

	import UiSprite from './UiSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import ButtonBetSpinIcon from './ButtonBetSpinIcon.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();

	// The button STAYS PRESSABLE when the balance will not cover the stake.
	//
	// It used to be `disabled`, so a player who was short found a dead control and
	// no explanation. Certification: "when the player has insufficient balance for
	// the current play, the bet button should remain clickable and the appropriate
	// message should be displayed. Likewise when pressing the space key."
	//
	// It still LOOKS unavailable — the plate greys, on the same condition, through
	// ButtonBetProvider's 'spin_disabled' key. It just answers when pressed.
	const cannotAfford = $derived(!stateBetDerived.isBetCostAvailable());
	// Off by default, so a game that has not opted in keeps the disabled button
	// it has always had rather than a pressable one with nothing behind it.
	const explains = $derived(uiTheme.betButtonMessageOnInsufficientBalance);
	const disabled = $derived(cannotAfford && !explains);
	const sizes = { width: UI_BASE_SIZE * 1.12, height: UI_BASE_SIZE * 1.12 };

	// Space must not reach the game through an open dialog. The bet menu, the
	// feature-buy menu and the info panel are all modals, and space over any of
	// them used to spin the reels behind it.
	const modalOpen = $derived(stateModal.modal !== null);

	const guardedPress = (onpress: () => void) => () => {
		if (cannotAfford && explains) {
			// 'message', not 'autoSpinMessage'. The autoplay modal prefixes its
			// reason with "AUTO PLAY HAS STOPPED DUE TO", which is a claim about
			// something that did not happen when the player simply pressed bet.
			stateModal.modal = { name: 'message', message: 'insufficientFunds' };
			return;
		}
		onpress();
	};
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		{@const press = guardedPress(onpress)}
		<OnHotkey hotkey="Space" disabled={disabled || modalOpen} onpress={press} />
		<Button {...props} {sizes} onpress={press} {disabled}>
			{#snippet children({ center })}
				<Container {...center}>
					<UiSprite
						key="bet"
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
						backgroundColor={cannotAfford || ['spin_disabled', 'stop_disabled'].includes(key)
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

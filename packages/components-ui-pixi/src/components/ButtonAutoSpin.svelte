<script lang="ts">
	import { Container } from 'pixi-svelte';
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig, stateModal } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';
	import ButtonBetAutoSpinsCounter from './ButtonBetAutoSpinsCounter.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const active = $derived(stateBetDerived.hasAutoBetCounter());
	const cannotAfford = $derived(!stateBetDerived.isBetCostAvailable());
	const explains = $derived(stateConfig.explainInsufficientBalance);
	const disabled = $derived.by(() => {
		if (stateBet.isSpaceHold) return true;
		if (!context.stateXstateDerived.isIdle() && !stateBetDerived.hasAutoBetCounter()) return true;
		// Staying pressable when the player is short is the whole point: this
		// button is the ONLY way into the autoplay panel, so disabling it here
		// meant the message on the panel's own start button could never be
		// reached. Stake review, 2026-09-06, asked for the message on the
		// Autoplay route by name.
		if (cannotAfford && !explains) return true;
		return false;
	});

	const stopAutoSpin = () => (stateBet.autoSpinsCounter = 0);
	const openModal = () => (stateModal.modal = { name: 'autoSpin' });
	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		// Stopping a run in progress is always allowed — the player has already
		// paid for it and may be short precisely because it is running.
		if (stateBetDerived.hasAutoBetCounter()) {
			stopAutoSpin();
			return;
		}
		if (cannotAfford && explains) {
			// 'message', not 'autoSpinMessage': the autoplay modal prefixes its
			// reason with "AUTO PLAY HAS STOPPED DUE TO", and nothing has stopped.
			stateModal.modal = { name: 'message', message: 'insufficientFunds' };
			return;
		}
		openModal();
	};
</script>

<UiButton {...props} {sizes} {active} {onpress} {disabled} icon="autoSpin">
	<Container x={sizes.width * 0.5} y={sizes.height * 0.5}>
		<ButtonBetAutoSpinsCounter />
	</Container>
</UiButton>

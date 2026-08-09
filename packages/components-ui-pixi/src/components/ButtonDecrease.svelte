<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const options = $derived(stateConfig.betAmountOptions);
	// See ButtonIncrease: the ladder when the server gives one, stepBet otherwise.
	const smallest = $derived(options.length ? options[0] : stateConfig.minBet);
	// nothing is known until authenticate answers, and children render even when
	// it fails — so guard rather than stepping to undefined.
	const canStep = $derived(options.length > 0 || stateConfig.stepBet > 0);
	const disabled = $derived(
		!context.stateXstateDerived.isIdle() || !canStep || stateBet.betAmount === smallest,
	);

	const onpress = () => {
		if (!canStep) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (options.length) {
			const nextSmaller = [...options].sort((a, b) => b - a).find((option) => option < stateBet.betAmount);
			stateBetDerived.setBetAmount(nextSmaller ?? smallest);
			return;
		}

		stateBetDerived.setBetAmount(stateBet.betAmount - stateConfig.stepBet);
	};
</script>

<UiButton {...props} {sizes} {onpress} {disabled} icon="decrease" />

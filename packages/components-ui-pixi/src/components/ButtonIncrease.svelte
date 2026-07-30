<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const biggest = $derived(stateConfig.betAmountOptions[stateConfig.betAmountOptions.length - 1]);
	// see ButtonDecrease: options are empty until authenticate answers
	const disabled = $derived(
		!context.stateXstateDerived.isIdle() ||
			stateConfig.betAmountOptions.length === 0 ||
			stateBet.betAmount === biggest,
	);

	const onpress = () => {
		if (stateConfig.betAmountOptions.length === 0) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		const nextBigger = [...stateConfig.betAmountOptions]
			.sort((a, b) => a - b)
			.find((option) => option > stateBet.betAmount);

		stateBetDerived.setBetAmount(nextBigger ?? biggest);
	};
</script>

<UiButton {...props} {sizes} {onpress} {disabled} icon="increase" />

<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const smallest = $derived(stateConfig.betAmountOptions[0]);
	// betAmountOptions is empty until authenticate answers, and children render even
	// when it fails — so guard rather than stepping to undefined.
	const disabled = $derived(
		!context.stateXstateDerived.isIdle() ||
			stateConfig.betAmountOptions.length === 0 ||
			stateBet.betAmount === smallest,
	);

	const onpress = () => {
		if (stateConfig.betAmountOptions.length === 0) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		const nextSmaller = [...stateConfig.betAmountOptions]
			.sort((a, b) => b - a)
			.find((option) => option < stateBet.betAmount);

		stateBetDerived.setBetAmount(nextSmaller ?? smallest);
	};
</script>

<UiButton {...props} {sizes} {onpress} {disabled} icon="decrease" />

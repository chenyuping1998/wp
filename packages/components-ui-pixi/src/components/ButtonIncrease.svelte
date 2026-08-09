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
	// The ladder is the server's list of allowed stakes, so walk it when there is
	// one. stepBet is the fallback for a config that offers a continuous range
	// instead — either way the increment comes from the server, never from here.
	const biggest = $derived(options.length ? options[options.length - 1] : stateConfig.maxBet);
	const canStep = $derived(options.length > 0 || stateConfig.stepBet > 0);
	// see ButtonDecrease: nothing is known until authenticate answers
	const disabled = $derived(
		!context.stateXstateDerived.isIdle() || !canStep || stateBet.betAmount === biggest,
	);

	const onpress = () => {
		if (!canStep) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (options.length) {
			const nextBigger = [...options].sort((a, b) => a - b).find((option) => option > stateBet.betAmount);
			stateBetDerived.setBetAmount(nextBigger ?? biggest);
			return;
		}

		stateBetDerived.setBetAmount(stateBet.betAmount + stateConfig.stepBet);
	};
</script>

<UiButton {...props} {sizes} {onpress} {disabled} icon="increase" />

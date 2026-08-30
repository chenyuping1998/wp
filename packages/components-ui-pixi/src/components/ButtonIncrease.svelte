<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import { onDestroy } from 'svelte';

	import UiButton from './UiButton.svelte';
	import { createBetRepeat, markBetChanged } from '../platformUx.svelte';
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

	const step = () => {
		if (!canStep) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		// Starts the platformUx cooldown that keeps the bet button locked for a
		// moment after the stake moves. No-op when the game has not opted in.
		markBetChanged();

		if (options.length) {
			const nextBigger = [...options].sort((a, b) => a - b).find((option) => option > stateBet.betAmount);
			stateBetDerived.setBetAmount(nextBigger ?? biggest);
			return;
		}

		stateBetDerived.setBetAmount(stateBet.betAmount + stateConfig.stepBet);
	};

	// Hold to keep stepping — see createBetRepeat. Off unless the game opted into
	// uiTheme.platformUx, in which case one press is still one step and only a
	// held press repeats. Stopping on destroy matters: the steppers are disabled
	// (and can unmount) the moment the reels start, and an interval left running
	// would keep walking the stake through a round.
	const repeat = createBetRepeat(() => {
		if (disabled) return repeat.stop();
		step();
	});
	onDestroy(repeat.stop);

	const onpress = () => step();
</script>

<UiButton
	{...props}
	{sizes}
	{onpress}
	{disabled}
	onpressstart={repeat.start}
	onpressend={repeat.stop}
	icon="increase"
/>

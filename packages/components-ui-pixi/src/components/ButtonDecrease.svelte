<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import { onDestroy } from 'svelte';

	import UiButton from './UiButton.svelte';
	import { createBetRepeat, markBetChanged } from '../platformUx.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = $derived({
		width: UI_BASE_SIZE * uiTheme.railButtonScale,
		height: UI_BASE_SIZE * uiTheme.railButtonScale,
	});
	const options = $derived(stateConfig.betAmountOptions);
	// See ButtonIncrease: the ladder when the server gives one, stepBet otherwise.
	const smallest = $derived(options.length ? options[0] : stateConfig.minBet);
	// nothing is known until authenticate answers, and children render even when
	// it fails — so guard rather than stepping to undefined.
	const canStep = $derived(options.length > 0 || stateConfig.stepBet > 0);
	const disabled = $derived(
		!context.stateXstateDerived.isIdle() || !canStep || stateBet.betAmount === smallest,
	);

	const step = () => {
		if (!canStep) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		// Starts the platformUx cooldown that keeps the bet button locked for a
		// moment after the stake moves. No-op when the game has not opted in.
		markBetChanged();

		if (options.length) {
			const nextSmaller = [...options].sort((a, b) => b - a).find((option) => option < stateBet.betAmount);
			stateBetDerived.setBetAmount(nextSmaller ?? smallest);
			return;
		}

		stateBetDerived.setBetAmount(stateBet.betAmount - stateConfig.stepBet);
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
	icon="decrease"
/>

<script lang="ts">
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import type { EmitterEventModal } from 'components-ui-html/src/types';

	/**
	 * The − amount + stepper, this game's own.
	 *
	 * Replaces components-ui-html's BetMenuAmountToggle in the Bet menu and the
	 * Buy Bonus menu. That one draws its signs as TEXT — a "-" and a "+" at 2rem in
	 * whatever face the <button> falls back to — and a glyph is centred by its
	 * line box, not by its ink. The box was exactly centred (measured: 0px) and
	 * the "+" still sat visibly low, because a plus sign's ink hangs under the
	 * middle of the em box in most sans faces. Review read it as misaligned.
	 *
	 * So the signs here are not type. They are two bars drawn with CSS about the
	 * button's own centre, which cannot be off-centre whatever font loads.
	 */
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const options = $derived(stateConfig.betAmountOptions);
	const index = $derived(options.findIndex((option) => option === stateBet.betAmount));
	const downDisabled = $derived(index <= 0);
	const upDisabled = $derived(index === -1 || index >= options.length - 1);

	const step = (delta: number) => {
		const next = options[index + delta];
		if (next === undefined) return;
		// Through setBetAmount, like the shared toggle: a raw assignment skips the
		// server's limits and the affordability check.
		stateBetDerived.setBetAmount(next);
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
</script>

<div class="bet-stepper">
	<button
		class="sign"
		data-test="down-button"
		aria-label="Decrease bet"
		disabled={downDisabled}
		onclick={() => step(-1)}
	>
		<i class="bar"></i>
	</button>

	<span class="amount">{numberToCurrencyString(stateBet.betAmount)}</span>

	<button
		class="sign"
		data-test="up-button"
		aria-label="Increase bet"
		disabled={upDisabled}
		onclick={() => step(1)}
	>
		<i class="bar"></i>
		<i class="bar vertical"></i>
	</button>
</div>

<style lang="scss">
	.bet-stepper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.amount {
		// Wide enough for "$1,000.00" so the two buttons do not jump sideways
		// every time the amount gains or loses a digit.
		min-width: 7.5rem;
		text-align: center;
		font-family: var(--hm-number-font, sans-serif);
		font-weight: 700;
		font-size: 1.25rem;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		color: var(--capo-gold-light);
		text-shadow: 0 0 10px rgba(var(--capo-gold-rgb), 0.35);
	}

	.sign {
		position: relative;
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border-radius: 50%;
		border: 2px solid rgba(var(--capo-gold-rgb), 0.75);
		background: radial-gradient(
			circle at 50% 35%,
			rgba(var(--capo-wine-rgb), 0.95) 0%,
			rgba(var(--capo-ink-deep-rgb), 1) 78%
		);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(var(--capo-gold-light-rgb), 0.18);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.1s ease;

		&:hover:not(:disabled) {
			border-color: var(--capo-gold-light);
			box-shadow:
				0 0 14px rgba(var(--capo-gold-rgb), 0.45),
				inset 0 1px 0 rgba(var(--capo-gold-light-rgb), 0.25);
		}

		&:active:not(:disabled) {
			transform: scale(0.94);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.35;
		}

		&:focus-visible {
			outline: 2px solid var(--capo-gold-light);
			outline-offset: 2px;
		}
	}

	// Both bars are positioned from the button's centre with a translate, so
	// they are centred by geometry, never by font metrics.
	.bar {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 42%;
		height: 3px;
		border-radius: 2px;
		background: var(--capo-gold-light);
		transform: translate(-50%, -50%);

		&.vertical {
			transform: translate(-50%, -50%) rotate(90deg);
		}
	}
</style>

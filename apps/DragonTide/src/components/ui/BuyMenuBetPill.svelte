<script lang="ts">
	/**
	 * The compact bet strip shown while the feature-buy menu is open — the
	 * reference (Paperclip "Private Jet", 2026-11-07 capture) fades its console
	 * out in ~0.12 s and leaves one dark pill at the foot of the screen:
	 *
	 *     BALANCE $x   ▼   BET $y   ▲
	 *                      ‾‾‾‾  (level track)
	 *
	 * so the stake, and with it every card's price, can be changed without
	 * leaving the menu. Replaces the header's BetMenuAmountToggle. Same stepping
	 * rules as MummyBar (the server's ladder through setBetAmount, one press one
	 * step, markBetChanged for the spin cooldown).
	 */
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { i18nDerived, markBetChanged } from 'components-ui-pixi';
	import { BAR_FONT } from '../../game/fonts';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const options = $derived([...stateConfig.betAmountOptions].sort((a, b) => a - b));
	const biggest = $derived(options.length ? options[options.length - 1] : stateConfig.maxBet);
	const smallest = $derived(options.length ? options[0] : stateConfig.minBet);
	const canStep = $derived(options.length > 0 || stateConfig.stepBet > 0);
	const upDisabled = $derived(!canStep || stateBet.betAmount >= biggest);
	const downDisabled = $derived(!canStep || stateBet.betAmount <= smallest);
	const levelFrac = $derived.by(() => {
		if (options.length < 2) return 1;
		const i = Math.max(0, options.findIndex((o) => o >= stateBet.betAmount));
		return (i + 1) / options.length;
	});

	const step = (dir: 1 | -1) => {
		if (dir > 0 ? upDisabled : downDisabled) return;
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
		markBetChanged();
		if (options.length) {
			const next =
				dir > 0
					? options.find((o) => o > stateBet.betAmount)
					: [...options].reverse().find((o) => o < stateBet.betAmount);
			stateBetDerived.setBetAmount(next ?? (dir > 0 ? biggest : smallest));
			return;
		}
		stateBetDerived.setBetAmount(stateBet.betAmount + dir * stateConfig.stepBet);
	};
</script>

<div class="pill" style:--bar-font={BAR_FONT}>
	<div class="readout">
		<span class="label">{i18nDerived.balance()}</span>
		<span class="value">{numberToCurrencyString(stateBet.balanceAmount)}</span>
	</div>
	<button class="chev" aria-label="decrease amount" disabled={downDisabled} onclick={() => step(-1)}>
		<svg viewBox="-30 -20 60 40" aria-hidden="true"><path d="M-18 -8 L0 10 L18 -8" /></svg>
	</button>
	<div class="readout bet">
		<span class="label">{i18nDerived.betAmount()}</span>
		<span class="value">{numberToCurrencyString(stateBet.betAmount)}</span>
		<span class="track"><span class="fill" style:width={`${levelFrac * 100}%`}></span></span>
	</div>
	<button class="chev" aria-label="increase amount" disabled={upDisabled} onclick={() => step(1)}>
		<svg viewBox="-30 -20 60 40" aria-hidden="true"><path d="M-18 8 L0 -10 L18 8" /></svg>
	</button>
</div>

<style>
	/* above the Popup's click-to-close layer (2) and level with the menu (3) */
	.pill {
		position: fixed;
		z-index: 4;
		left: 50%;
		bottom: max(10px, env(safe-area-inset-bottom));
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 6px;
		max-width: calc(100vw - 32px);
		box-sizing: border-box;
		padding: 6px 10px 6px 20px;
		border-radius: 999px;
		background: rgba(23, 35, 41, 0.94);
		box-shadow: 0 6px 18px #0009;
		font-family: var(--bar-font);
		animation: in 120ms ease-out;
		user-select: none;
	}
	@keyframes in {
		from {
			opacity: 0;
		}
	}
	.readout {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		line-height: 1.05;
		min-width: 0;
		padding-right: 8px;
	}
	.readout.bet {
		align-items: center;
		padding: 0 4px;
	}
	.label {
		font-size: 11px;
		font-weight: 700;
		color: #ecc254;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.value {
		font-size: 18px;
		font-weight: 900;
		color: #fff;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.track {
		display: block;
		width: 100%;
		height: 3px;
		margin-top: 3px;
		border-radius: 2px;
		background: #ffffff33;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		background: #ecc254;
	}
	/* 44 px targets; colour only, never a scale. Hypno (2026-11-09): under the
	   cursor the chevron turns gold like the bar's own steppers — the
	   reference's light grey is a greyed-out look the house rules forbid —
	   and it goes dark for the moment it is held */
	.chev {
		width: 44px;
		height: 44px;
		flex: none;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.chev svg {
		width: 26px;
		height: 18px;
		overflow: visible;
	}
	.chev path {
		fill: none;
		stroke: #fff;
		stroke-width: 9;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition: stroke 60ms;
	}
	@media (hover: hover) {
		.chev:hover:not(:disabled) path {
			stroke: #ecc254;
		}
		.chev:hover:not(:disabled) {
			background: #ffffff14;
		}
	}
	.chev:active:not(:disabled) path {
		stroke: #4a4a4a;
	}
	.chev:disabled {
		cursor: default;
		opacity: 0.35;
	}
	.chev:focus-visible {
		outline: 2px solid #ecc254;
		outline-offset: -2px;
	}
</style>

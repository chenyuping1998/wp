<script lang="ts">
	/**
	 * The feature-buy confirmation, Sushi Monkey's own: the same paper, ink and
	 * terracotta as the menu card it follows, instead of the shared dialog's
	 * charcoal panel and system sans — which read as a different game the moment
	 * the paper menu handed over to it.
	 *
	 * Behaviour is the shared ModalBuyBonusConfirm's, line for line: the same
	 * confirm(), the same sound, and closing returns to the menu.
	 */
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateModal, stateUi, INFINITY_MARK } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { stateBonus, stateBonusDerived } from 'components-ui-html/src/stateBonus.svelte';
	import { i18nDerived } from 'components-ui-html/src/i18n/i18nDerived';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { numberToCurrencyString } from 'utils-shared/amount';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const mode = $derived(stateBonusDerived.selectedBetModeData());
	// the tier's accent on the menu card: OMAKASE (super) terracotta, DINNER ink
	const accent = $derived(stateBonus.selectedBetModeKey === 'SUPERBONUS' ? '#b87b60' : '#4a4846');

	const back = () => (stateModal.modal = { name: 'buyBonus' });
	// The real cost of this mode, not the base stake: a 100× buy on a $1 stake
	// is $100. isBetCostAvailable() cannot answer this — it reads the ACTIVE
	// mode, which is still BASE until confirm() switches it.
	const cost = $derived(stateBet.betAmount * mode.costMultiplier);
	// Engine guideline 222: an unaffordable buy must not reach /wallet/play.
	// This path broadcasts 'bet' straight to the game actor, past the bet
	// button's own balance guard, so it needs one of its own.
	const affordable = () => cost > 0 && cost <= stateBet.balanceAmount;
	const confirm = () => {
		stateBet.activeBetModeKey = stateBonus.selectedBetModeKey;

		if (mode.type === 'buy') {
			eventEmitter.broadcast({ type: 'bet' });
		}

		if (mode.type === 'activate') {
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}
	};
</script>

{#if stateModal.modal?.name === 'buyBonusConfirm'}
	<Popup zIndex={zIndex.dialog} onclose={back}>
		<div class="ticket" style:--accent={accent}>
			<h2 style={`color: ${accent} !important`}>{mode.text.title}</h2>
			<p>{mode.text.dialog}</p>
			<div class="price">
				{mode.costMultiplier}<small>×</small>
				<span>{numberToCurrencyString(cost)}</span>
			</div>
			<button
				class="ok"
				data-test="confirm-button"
				onclick={() => {
					if (!affordable()) {
						// same notice the bet button raises
						stateModal.modal = { name: 'message', message: 'insufficientFunds' };
						return;
					}
					confirm();
					eventEmitter.broadcast({ type: 'soundPressGeneral' });
					stateModal.modal = null;
				}}
			>
				{i18nDerived.confirm()}
			</button>
		</div>
	</Popup>
{/if}

<style>
	.ticket {
		--paper: #efeadc;
		--ink: #1e1b1a;
		--accent: #4a4846;
		position: relative;
		z-index: 3;
		width: min(500px, calc(100vw - 24px));
		max-height: calc(100vh - 20px);
		overflow: auto;
		box-sizing: border-box;
		padding: 22px 24px 20px;
		background: var(--paper);
		border: 6px solid var(--accent);
		/* the ink offset shadow the in-game plates carry */
		box-shadow: 8px 8px 0 var(--ink);
		color: var(--ink);
		font-family: var(--gb-body-font), Arial, sans-serif;
		text-align: center;
	}
	h2 {
		margin: 0 0 12px;
		font: 400 26px var(--gb-display-font, sans-serif);
		letter-spacing: 2px;
	}
	p {
		margin: 0 0 14px;
		padding: 12px 0;
		border-top: 2px dashed var(--accent);
		border-bottom: 2px dashed var(--accent);
		font-size: 14px;
		line-height: 1.45;
	}
	.price {
		color: var(--accent);
		font: 400 40px var(--gb-display-font, sans-serif);
		line-height: 1;
	}
	.price small { font-size: 23px; }
	.price span {
		display: block;
		margin-top: 4px;
		color: var(--ink);
		font: 700 14px var(--gb-body-font, sans-serif);
	}
	.ok {
		width: 100%;
		margin-top: 14px;
		padding: 12px 8px;
		border: 0;
		background: var(--accent);
		color: var(--paper);
		cursor: pointer;
		font: 400 17px var(--gb-display-font, sans-serif);
		letter-spacing: 1px;
	}
	.ok:hover, .ok:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
	.ok:active { transform: translate(2px, 2px); }
	@media (max-width: 520px), (max-height: 520px) {
		.ticket { padding: 14px 14px 12px; }
		h2 { font-size: 20px; margin-bottom: 8px; }
		p { font-size: 12px; padding: 8px 0; margin-bottom: 8px; }
		.price { font-size: 30px; }
		.ok { margin-top: 8px; padding: 9px 6px; }
	}
</style>

<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived } from 'state-shared';
	import { i18nDerived } from 'components-ui-html/src/i18n/i18nDerived';

	import assets from '../../game/assets';
	import { popupGhost } from './popupGhost';
	import { gameText } from '../../game/i18nText';

	/**
	 * The plain notification (insufficient balance, loss / single-win limit),
	 * raised by the shared bet machines as stateModal.modal = { name: 'message' }.
	 *
	 * This app never mounted one, so the insufficient-balance press set a modal
	 * that drew nothing: no notice on screen ([222]), and the invisible modal kept
	 * the space-hold bet disabled until something cleared it.
	 *
	 * Local rather than the shared ModalMessage so it wears this game's parchment
	 * card (waPanel, nine-sliced with its own parchment fill) instead of a white
	 * hairline box on the sepia scrim. The copy is the shared i18nDerived strings —
	 * the 16 real-money translations, and Stake's social wording ("balance",
	 * "amount", never "funds" / "bet") when ?social=true — so the two cannot drift.
	 */
	const messageMap = $derived({
		lossLimitReached: i18nDerived.lossLimitReached(),
		singleWinLimitReached: i18nDerived.singleWinLimitReached(),
		insufficientFunds: i18nDerived.insufficientFunds(),
	});

	const rtl = $derived(stateUrlDerived.lang() === 'ar' ? 'rtl' : undefined);
	const src = (key: string) => (assets as unknown as Record<string, { src?: string }>)[key]?.src ?? '';
	const close = () => (stateModal.modal = null);
</script>

{#if stateModal.modal?.name === 'message'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div
			class="wa-msg"
			use:popupGhost
			dir={rtl}
			role="alertdialog"
			aria-labelledby="wa-msg-title"
			style:--frame={`url("${src('waPanel')}")`}
		>
			<h2 id="wa-msg-title">{i18nDerived.notification()}</h2>
			<p data-test="message-content">{messageMap[stateModal.modal.message]}</p>
			<button type="button" class="ok" onclick={close}>{gameText('msgOk')}</button>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.wa-msg {
		/* above Popup's click-to-close layer (z 2 in the same stacking context) */
		position: relative;
		z-index: 100;
		box-sizing: border-box;
		width: min(92vw, 30rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		padding: 1.1rem 1.4rem 1.2rem;
		border-style: solid;
		border-width: 22px;
		border-image: var(--frame) 58 fill stretch;
		color: var(--capo-ink);
		text-align: center;
		font-family: var(--gb-body-font);
		filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.5));
	}

	h2 {
		margin: 0;
		font-family: var(--hm-title-font, var(--gb-display-font));
		font-size: 1.35rem;
		letter-spacing: 0.06em;
		color: var(--capo-wine-deep);
	}

	p {
		margin: 0;
		font-size: 1.02rem;
		line-height: 1.45;
		font-weight: 700;
		white-space: normal;
		overflow-wrap: anywhere;
	}

	.ok {
		min-width: 7rem;
		padding: 0.5rem 1.4rem;
		border: 2px solid var(--capo-gold-dark);
		border-radius: 8px;
		background: var(--capo-ink);
		color: var(--capo-bone);
		font-family: var(--hm-title-font, var(--gb-display-font));
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		cursor: pointer;

		&:hover,
		&:focus-visible {
			background: var(--capo-ink-deep);
			border-color: var(--capo-gold);
			color: var(--capo-gold-light);
			outline: none;
		}
	}

	@media (max-width: 500px) {
		.wa-msg {
			border-width: 16px;
			padding: 0.8rem 0.9rem 0.9rem;
		}
		h2 {
			font-size: 1.15rem;
		}
		p {
			font-size: 0.95rem;
		}
	}
</style>

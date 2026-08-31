<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	// A notification that is NOT about autoplay.
	//
	// The insufficient-balance message used to be raised through the autoplay
	// modal, because that was the only place it existed. That modal opens with
	// "AUTO PLAY HAS STOPPED DUE TO" and then the reason — correct when a run
	// actually stopped, and wrong when the player simply pressed the bet button
	// with too little balance and autoplay was never on. Certification caught it:
	// "the message appears as 'Autoplay has stopped due to insufficient balance',
	// but autoplay is not enabled."
	//
	// So the preamble is the part that belongs to autoplay, not the message. The
	// messages themselves are already whole sentences — "INSUFFICIENT FUNDS TO
	// PLACE THIS BET. PLEASE ADD FUNDS…" — and read correctly on their own.
	//
	// This is a separate component rather than a flag on ModalAutoSpinMessage so
	// that the autoplay path is untouched: nine other games in this workspace use
	// it, and none of them asked for anything here to change.
	const messageMap = $derived({
		lossLimitReached: i18nDerived.lossLimitReached(),
		singleWinLimitReached: i18nDerived.singleWinLimitReached(),
		insufficientFunds: i18nDerived.insufficientFunds(),
	});
</script>

{#if stateModal.modal?.name === 'message'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="100%">
			<BaseTitle>
				{i18nDerived.notification()}
			</BaseTitle>
			<BaseScrollable type="column">
				<div class="scrollY info-text" data-test="message-content">
					{messageMap[stateModal.modal.message]}
				</div>
			</BaseScrollable>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.info-text {
		text-align: center;
		max-height: 100px;
		max-width: 480px;
		border-radius: 8px;
		border: 1px solid white;
		white-space: normal;
		padding: 1rem;
	}
</style>

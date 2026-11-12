<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import { Popup } from 'components-shared';
	import { stateModal, stateSound } from 'state-shared';

	import BaseTitle from 'components-ui-html/src/components/BaseTitle.svelte';
	import BaseContent from 'components-ui-html/src/components/BaseContent.svelte';
	import BaseScrollable from 'components-ui-html/src/components/BaseScrollable.svelte';
	import { i18nDerived } from 'components-ui-html/src/i18n/i18nDerived';

	// Copy of components-ui-html's ModalSettings, only so it can mount the local
	// ModalSettingsSound (translated ON / OFF caption).
	import ModalSettingsSound from './ModalSettingsSound.svelte';
</script>

{#if stateModal.modal?.name === 'settings'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="100%">
			<BaseTitle>{i18nDerived.settings()}</BaseTitle>
			<BaseScrollable type="column">
				<wrap class="wrap">
					<ModalSettingsSound bind:value={stateSound.volumeValueMaster}>
						{i18nDerived.masterVolume()}
					</ModalSettingsSound>

					<ModalSettingsSound bind:value={stateSound.volumeValueMusic}>
						{i18nDerived.musicVolume()}
					</ModalSettingsSound>

					<ModalSettingsSound bind:value={stateSound.volumeValueSoundEffect}>
						{i18nDerived.soundEffectVolume()}
					</ModalSettingsSound>
				</wrap>
			</BaseScrollable>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		@media (min-width: 480px) {
			min-width: 360px;
		}

		@media (min-width: 800px) {
			min-width: 480px;
		}
	}
</style>

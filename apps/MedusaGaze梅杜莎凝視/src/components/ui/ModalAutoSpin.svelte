<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal,stateUi,AUTO_SPINS_TEXT_OPTIONS } from 'state-shared';
	import { scrollIntoView } from 'utils-shared/scroll';
	import { getContextLayout } from 'utils-layout';
	import BaseContent from 'components-ui-html/src/components/BaseContent.svelte';
	import BaseTitle from 'components-ui-html/src/components/BaseTitle.svelte';
	import BaseScrollable from 'components-ui-html/src/components/BaseScrollable.svelte';
	import BaseButtonWrap from 'components-ui-html/src/components/BaseButtonWrap.svelte';
	import AutoSpinsAdvanced from 'components-ui-html/src/components/AutoSpinsAdvanced.svelte';
	import AutoSpinsStartButton from 'components-ui-html/src/components/AutoSpinsStartButton.svelte';
	import { i18nDerived } from 'components-ui-html/src/i18n/i18nDerived';
	import MedusaChoiceGrid from './MedusaChoiceGrid.svelte';
	const {stateLayoutDerived}=getContextLayout();
	const options=$derived(stateLayoutDerived.layoutType()==='landscape'?AUTO_SPINS_TEXT_OPTIONS.filter(v=>v!=='1000'):AUTO_SPINS_TEXT_OPTIONS);
</script>

{#if stateModal.modal?.name==='autoSpin'}
	<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>
		<BaseContent maxWidth="100%">
			<BaseTitle>{i18nDerived.autoSpins()}</BaseTitle>
			<BaseScrollable type="column">
				{#snippet children({element})}
					<div data-test="number-of-rounds">{i18nDerived.numberOfRounds()}</div>
					<MedusaChoiceGrid label="Number of rounds" value={stateUi.autoSpinsText} {options} onchange={value=>stateUi.autoSpinsText=value}/>
					<div class="medusa-auto-advanced"><AutoSpinsAdvanced ontoggle={duration=>{if(element)scrollIntoView({element,duration});}}/></div>
				{/snippet}
			</BaseScrollable>
			<BaseButtonWrap type="full-width"><AutoSpinsStartButton/></BaseButtonWrap>
		</BaseContent>
	</Popup>
{/if}

<style>
.medusa-auto-advanced :global(.toggle),.medusa-auto-advanced :global([data-test="drop-down"]),.medusa-auto-advanced :global([data-test="drop-down"]::after){color:#102f36 !important}
</style>

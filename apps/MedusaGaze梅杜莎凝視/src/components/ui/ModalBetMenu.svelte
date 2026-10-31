<script lang="ts">
	import { Button,Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal,stateBet,stateBetDerived,stateConfig } from 'state-shared';
	import BaseContent from 'components-ui-html/src/components/BaseContent.svelte';
	import BaseTitle from 'components-ui-html/src/components/BaseTitle.svelte';
	import BaseScrollable from 'components-ui-html/src/components/BaseScrollable.svelte';
	import BaseButtonWrap from 'components-ui-html/src/components/BaseButtonWrap.svelte';
	import BaseIcon from 'components-ui-html/src/components/BaseIcon.svelte';
	import BaseButtonContent from 'components-ui-html/src/components/BaseButtonContent.svelte';
	import BetMenuAmountToggle from 'components-ui-html/src/components/BetMenuAmountToggle.svelte';
	import { i18nDerived } from 'components-ui-html/src/i18n/i18nDerived';
	import MedusaChoiceGrid from './MedusaChoiceGrid.svelte';
	const options=$derived(stateConfig.betMenuOptions.filter((v,i,a)=>a.indexOf(v)===i));
	const format=(value:number)=>value===options[options.length-1]?i18nDerived.max():Math.abs(value)>999999?`${(value/1000000).toFixed(2)}M`:Math.abs(value)>999?`${(value/1000).toFixed(2)}K`:value.toFixed(2);
</script>

{#if stateModal.modal?.name==='betAmountMenu'}
	<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>
		<BaseContent maxWidth="100%">
			<BaseTitle>{i18nDerived.betMenu()}</BaseTitle>
			<BaseScrollable type="column">
				<span>{i18nDerived.selectYourBet()}</span>
				<BetMenuAmountToggle/>
				<MedusaChoiceGrid label="Bet amount" value={stateBet.betAmount} {options} {format} onchange={value=>stateBetDerived.setBetAmount(value)}/>
			</BaseScrollable>
			<BaseButtonWrap type="full-width"><Button data-test="confirm-button" onclick={()=>stateModal.modal=null}><BaseIcon width="100%" height="3rem"/><BaseButtonContent>{i18nDerived.confirm()}</BaseButtonContent></Button></BaseButtonWrap>
		</BaseContent>
	</Popup>
{/if}

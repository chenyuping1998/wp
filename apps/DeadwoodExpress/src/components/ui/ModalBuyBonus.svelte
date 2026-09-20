<script lang="ts">
import { Popup } from 'components-shared';
import { zIndex } from 'constants-shared/zIndex';
import { stateModal,stateMetaDerived,stateBet } from 'state-shared';
import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';
import BetMenuAmountToggle from 'components-ui-html/src/components/BetMenuAmountToggle.svelte';
import { getContextEventEmitter } from 'utils-event-emitter';
import type { EmitterEventModal } from 'components-ui-html/src/types';
import { numberToCurrencyString } from 'utils-shared/amount';
import { getSocialTerms } from '../../game/socialTerms';
const {eventEmitter}=getContextEventEmitter<EmitterEventModal>();
const T=$derived(getSocialTerms());
const modes=$derived(stateMetaDerived.betModeMetaList().filter(x=>x.type==='buy'));
function choose(mode:string){stateBonus.selectedBetModeKey=mode;eventEmitter.broadcast({type:'buyBonusConfirm'});}
</script>
{#if stateModal.modal?.name==='buyBonus'}
<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>
<div class="menu"><h2>{T.featureMenuTitle}</h2><BetMenuAmountToggle/>
<div class="cards">{#each modes as mode,i}
<section style:--accent={i?'#e2b971':'#8dddc3'}>
<div class="art" style:background-image={`url('/assets/deadwood/${i?'background_feature':'background'}.png')`}><img src="/assets/deadwood/symbol_S.png" alt="Spectral ticket"/></div>
<h3>{mode.text.title}</h3><p>{mode.text.dialog}</p><strong>{mode.costMultiplier}×</strong>
<button onclick={()=>choose(mode.mode)}>{mode.text.button} · {numberToCurrencyString(stateBet.betAmount*mode.costMultiplier)}</button>
</section>{/each}</div></div>
</Popup>
{/if}
<style>.menu{position:relative;z-index:3;padding:24px;background:#0a211c;color:#e4e3d4;max-width:840px;max-height:85vh;overflow:auto;border:1px solid #aa8c55;text-align:center}h2,h3{font-family:Georgia;letter-spacing:2px}h2{color:#d9ba7c}.cards{display:flex;gap:20px;margin-top:20px}section{flex:1;min-width:0;border:1px solid var(--accent);background:#102a24;padding:16px}.art{height:120px;background-size:cover;background-position:center;display:flex;justify-content:center}.art img{height:110px;filter:drop-shadow(0 4px 10px #000)}h3{color:var(--accent);font-size:22px}p{font:14px/1.6 Saira,sans-serif;text-align:left}strong{display:block;color:var(--accent);font:40px Georgia;margin:12px}button{padding:12px;width:100%;background:#244539;border:1px solid var(--accent);color:#f1e6c8;cursor:pointer;font:15px Saira}@media(max-width:560px){.cards{flex-direction:column}.art{height:80px}.art img{height:75px}p{font-size:13px}.menu{padding:15px}}</style>

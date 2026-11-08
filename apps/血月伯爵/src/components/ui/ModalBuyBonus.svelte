<script lang="ts">
 import {Popup} from 'components-shared';import {zIndex} from 'constants-shared/zIndex';
 import {stateModal,stateMetaDerived,stateBet} from 'state-shared';import {stateBonus} from 'components-ui-html/src/stateBonus.svelte';
 import BetMenuAmountToggle from 'components-ui-html/src/components/BetMenuAmountToggle.svelte';
 import {getContextEventEmitter} from 'utils-event-emitter';import type {EmitterEventModal} from 'components-ui-html/src/types';
 const {eventEmitter}=getContextEventEmitter<EmitterEventModal>();const buys=$derived(stateMetaDerived.betModeMetaList().filter(x=>x.type==='buy'));
 const asset=(p:string)=>`${import.meta.env.BASE_URL}bloodmoon/${p}`;
 function choose(mode:string){stateBonus.selectedBetModeKey=mode;eventEmitter.broadcast({type:'buyBonusConfirm'});}
</script>
{#if stateModal.modal?.name==='buyBonus'}<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>
 <div class="blood-buy"><h1>ENTER THE BLOOD MOON</h1><BetMenuAmountToggle/><div class="cards">
  {#each buys as item,i}<article><div class="art" style={`background-image:url('${asset('scene/free.png')}')`}><img src={asset(i===0?'symbols/9.png':'character/free-idle.png')} alt=""/></div><h2>{item.text.title}</h2><p>{item.text.description}</p><strong>{(stateBet.betAmount*item.costMultiplier).toFixed(2)} {stateBet.currency}</strong><button onclick={()=>choose(item.mode)}>{item.costMultiplier}× · CONTINUE</button></article>{/each}
 </div></div></Popup>{/if}
<style>.blood-buy{max-width:1000px;padding:24px;color:#ebd9b4;font-family:Georgia,serif}h1{text-align:center;font-size:24px;letter-spacing:3px}.cards{display:flex;gap:18px;margin-top:25px}article{width:245px;background:#171019;border:1px solid #72513e;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;text-align:center;padding-bottom:18px}.art{height:160px;background-size:cover;overflow:hidden}.art img{height:210px;object-fit:contain}h2{font-size:19px;margin:20px 10px 4px}p{font:13px/1.6 system-ui;min-height:85px;margin:10px 18px;color:#b6afb3}strong{font-size:22px}button{margin:15px 18px 0;padding:13px;background:#653047;border:1px solid #b68b53;color:#ffe6ba;cursor:pointer;font-weight:700}@media(max-width:760px){.cards{flex-wrap:wrap;justify-content:center}.blood-buy{max-height:80vh;overflow:auto}.art{height:90px}.art img{height:150px}article{width:220px}p{min-height:0}}</style>

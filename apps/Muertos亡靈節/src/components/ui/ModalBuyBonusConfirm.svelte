<script lang="ts">
 import {tick} from 'svelte';
 import {zIndex} from 'constants-shared/zIndex';
 import {stateBet,stateBetDerived,stateModal,stateUi,stateUrlDerived,INFINITY_MARK} from 'state-shared';
 import {getContextEventEmitter} from 'utils-event-emitter';
 import {stateBonus,stateBonusDerived} from 'components-ui-html/src/stateBonus.svelte';
 import {i18nDerived} from 'components-ui-html/src/i18n/i18nDerived';
 import type {EmitterEventModal} from 'components-ui-html/src/types';
 import {numberToCurrencyString} from 'utils-shared/amount';
 const {eventEmitter}=getContextEventEmitter<EmitterEventModal>();
 const open=$derived(stateModal.modal?.name==='buyBonusConfirm');
 const mode=$derived(stateBonusDerived.selectedBetModeData());
 const cost=$derived(stateBet.betAmount*mode.costMultiplier);
 let panel:HTMLDivElement;
 const back=()=>stateModal.modal={name:'buyBonus'};
 // Keep the shared confirmation's mode switch, affordability guard and events.
 const confirm=()=>{
  const previousMode=stateBet.activeBetModeKey;
  stateBet.activeBetModeKey=stateBonus.selectedBetModeKey;
  if(!stateBetDerived.isBetCostAvailable()){
   stateBet.activeBetModeKey=previousMode;
   stateModal.modal={name:'message',message:'insufficientFunds'};
  }else{
   if(mode.type==='buy')eventEmitter.broadcast({type:'bet'});
   if(mode.type==='activate'){
    stateUi.autoSpinsLossLimitText=INFINITY_MARK;
    stateUi.autoSpinsSingleWinLimitText=INFINITY_MARK;
   }
   stateModal.modal=null;
  }
  eventEmitter.broadcast({type:'soundPressGeneral'});
 };
 $effect(()=>{if(open){void tick().then(()=>panel?.querySelector<HTMLButtonElement>('.confirm-back')?.focus());}});
 const keys=(e:KeyboardEvent)=>{
  if(!open)return;
  if(e.key==='Escape'){e.preventDefault();back();}
  if(e.key==='Tab'){
   const buttons=[...panel.querySelectorAll<HTMLButtonElement>('button')],first=buttons[0],last=buttons.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
 };
</script>
<svelte:window onkeydown={keys}/>
{#if open}
 <div class="mummy-confirm-layer" style:z-index={zIndex.dialog}>
  <button class="confirm-shade" aria-label="Back" onclick={back}></button>
  <div class="mummy-confirm" bind:this={panel} role="dialog" aria-modal="true" aria-labelledby="mummy-confirm-title">
   <header><h2 id="mummy-confirm-title">{mode.text.title}</h2><button class="confirm-back" aria-label="Back" onclick={back}>×</button></header>
   <p class="confirm-description">{mode.text.dialog}</p>
   <div class="confirm-price"><span>{mode.type==='activate'?'PRICE PER SPIN':'FEATURE PRICE'}</span><strong>{numberToCurrencyString(cost)}</strong></div>
   <div class="confirm-base"><span>{stateUrlDerived.social()?'PLAY AMOUNT':'BASE BET'}</span><span>{numberToCurrencyString(stateBet.betAmount)} <small>× {mode.costMultiplier}</small></span></div>
   <button class="confirm-submit" data-test="confirm-button" onclick={confirm}>{i18nDerived.confirm()}</button>
  </div>
 </div>
{/if}
<style>
 .mummy-confirm-layer{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Nunito','Segoe UI',Arial,sans-serif;color:#fff}
 .confirm-shade{position:absolute;inset:0;border:0;background:#081115bd;backdrop-filter:blur(6px)}
 .mummy-confirm{position:relative;box-sizing:border-box;width:min(480px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow-y:auto;padding:22px;border:1px solid #a48747;border-radius:12px;background:#2e2f32;box-shadow:0 16px 48px #0009}
 header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.mummy-confirm h2{margin:3px 0 0;color:#fff!important;font:800 24px/1.2 'Nunito','Segoe UI',Arial,sans-serif!important;letter-spacing:0;text-transform:none;text-shadow:none!important}
 .confirm-back{flex-shrink:0;min-width:36px;min-height:36px;border:0;background:transparent;color:#fff;font:400 28px/1 Arial;cursor:pointer}
 .confirm-description{margin:16px 0 20px;color:#d4d4d4;font-size:16px;line-height:1.5}
 .confirm-price{display:flex;flex-direction:column;gap:8px;padding:20px;border:1px solid #474239;border-radius:8px;background:#06070a;text-align:center}.confirm-price>span{font-size:12px;letter-spacing:.7px;color:#d4d4d4}.confirm-price strong{color:#ecc254;font:900 clamp(28px,7vw,40px)/1.15 'Nunito','Segoe UI',Arial,sans-serif;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
 .confirm-base{display:flex;justify-content:space-between;gap:12px;margin:14px 0 22px;color:#d4d4d4;font-size:13px}.confirm-base small{margin-left:6px;color:#ecc254;font-size:13px}
 .confirm-submit{width:100%;min-height:52px;padding:12px;border:0;border-radius:8px;background:#ecc254;color:#0a0804;font:900 18px/1.3 'Nunito','Segoe UI',Arial,sans-serif;cursor:pointer}.confirm-submit:hover{background:#f3d278;color:#0a0804}.confirm-submit:active{background:#d9b047}.mummy-confirm button:focus-visible{outline:2px solid #fff;outline-offset:-3px}
 @media(max-height:480px){.mummy-confirm{padding:14px 18px}.confirm-description{margin:8px 0 12px;font-size:14px}.confirm-price{padding:12px}.confirm-base{margin:10px 0 12px}}
</style>

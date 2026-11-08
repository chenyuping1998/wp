<script lang="ts">
 import {tick} from 'svelte';
 import {stateBet,stateBetDerived,stateConfig,stateModal,stateUrlDerived} from 'state-shared';
 import {numberToCurrencyString} from 'utils-shared/amount';
 import {getContextEventEmitter} from 'utils-event-emitter';
 import type {EmitterEventModal} from 'components-ui-html/src/types';
 import {i18nDerived,markBetChanged} from 'components-ui-pixi';
 import {zIndex} from 'constants-shared/zIndex';
 import {inlineBetAnchor} from '../../game/inlineBetAnchor.svelte';
 import {inlineBetLayout} from '../../game/inlineBetLayout';
 const {eventEmitter}=getContextEventEmitter<EmitterEventModal>();
 const open=$derived(stateModal.modal?.name==='betAmountMenu');
 const amounts=$derived([...new Set(stateConfig.betAmountOptions.length?stateConfig.betAmountOptions:stateConfig.betMenuOptions)].filter(v=>v>0).sort((a,b)=>a-b));
 let panel:HTMLDivElement,grid:HTMLDivElement;
 let box=$state({left:12,top:12,width:360,height:420});
 const close=()=>stateModal.modal=null;
 const measure=()=>{if(typeof window==='undefined')return;const a=inlineBetAnchor.measure?.()??{left:window.innerWidth*.5,top:window.innerHeight-90,width:80,height:60};box=inlineBetLayout(a,{width:window.innerWidth,height:window.innerHeight});};
 const choose=(value:number)=>{markBetChanged();stateBetDerived.setBetAmount(value);eventEmitter.broadcast({type:'soundPressGeneral'});};
 $effect(()=>{if(open){measure();void tick().then(()=>{const selected=grid?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');if(selected){grid.scrollTop=selected.offsetTop-grid.clientHeight*.5+selected.clientHeight*.5;selected.focus({preventScroll:true});}else panel?.focus();});}});
 const keys=(e:KeyboardEvent)=>{if(!open)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){
  const buttons=[...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }};
</script>
<svelte:window onresize={()=>requestAnimationFrame(measure)} onkeydown={keys}/>
{#if open}
 <div class="bet-layer" style:z-index={zIndex.modal}>
  <button class="bet-backdrop" aria-label="Close amount menu" onclick={close}></button>
  <div class="bet-panel" bind:this={panel} role="dialog" aria-modal="true" aria-labelledby="inline-bet-title" tabindex="-1" style:left={`${box.left}px`} style:top={`${box.top}px`} style:width={`${box.width}px`} style:max-height={`${box.height}px`}>
   <header><h2 id="inline-bet-title">{i18nDerived.betAmount()}</h2><button class="bet-close" aria-label="Close" onclick={close}>×</button></header>
   <div class="bet-current">{stateUrlDerived.social()?'PLAY AMOUNT':'BASE BET'} <strong>{numberToCurrencyString(stateBet.betAmount)}</strong></div>
   {#if (stateBetDerived.activeBetMode()?.costMultiplier??1)>1}<div class="bet-total">{stateUrlDerived.social()?'TOTAL PLAY AMOUNT':'TOTAL PER SPIN'}: {numberToCurrencyString(stateBetDerived.betCost())}</div>{/if}
   <div class="bet-amount-grid" bind:this={grid}>
    {#each amounts as amount (amount)}<button type="button" class:selected={stateBet.betAmount===amount} aria-pressed={stateBet.betAmount===amount} onclick={()=>choose(amount)}>{numberToCurrencyString(amount)}</button>{/each}
   </div>
   <footer><span>SCROLL FOR MORE</span><button type="button" class="bet-done" onclick={close}>DONE</button></footer>
  </div>
 </div>
{/if}
<style>
 .bet-layer{position:fixed;inset:0;pointer-events:none;font-family:'Nunito','Segoe UI',Arial,sans-serif;color:#fff}
 .bet-backdrop{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;pointer-events:auto}
 .bet-panel{position:fixed;display:flex;flex-direction:column;box-sizing:border-box;pointer-events:auto;padding:16px;border:1px solid #a48747;border-radius:12px;background:#2e2f32;box-shadow:0 12px 40px #0009;overflow:hidden}
 header{display:flex;align-items:center;justify-content:space-between;gap:12px}h2{margin:0;font:800 21px/1.2 'Nunito','Segoe UI',Arial,sans-serif}.bet-close{border:0;color:#fff;background:transparent;font:400 28px/1 Arial;cursor:pointer;min-width:36px;min-height:36px}
 .bet-current{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 12px;font-size:12px;color:#d4d4d4}.bet-current strong{font-size:21px;color:#ecc254;font-variant-numeric:tabular-nums}.bet-total{font-size:12px;color:#cfcbc0;margin:-4px 0 10px}
 .bet-amount-grid{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow-y:auto;min-height:90px;max-height:312px;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:#ecc254 #202124;padding:2px 6px 2px 2px}
 .bet-amount-grid button{border:1px solid #3a3b3f;border-radius:8px;background:#06070a;color:#fff;min-height:52px;padding:12px 6px;font:800 18px/1.2 'Nunito','Segoe UI',Arial,sans-serif;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;cursor:pointer}
 .bet-amount-grid button.selected{background:#ecc254;border-color:#ecc254;color:#0a0804}.bet-amount-grid button:focus-visible,.bet-done:focus-visible{outline:2px solid #fff;outline-offset:-3px}
 @media(hover:hover){.bet-amount-grid button:hover{border-color:#ecc254;background:#1a1c22}.bet-amount-grid button.selected:hover{background:#f3d278;color:#0a0804}}
 footer{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-top:12px;flex-shrink:0}footer span{font-size:10px;letter-spacing:.5px;color:#cacaca}.bet-done{border:0;border-radius:8px;padding:10px 24px;background:#ecc254;color:#0a0804;font:900 16px 'Nunito','Segoe UI',Arial,sans-serif;min-height:44px;cursor:pointer}
</style>

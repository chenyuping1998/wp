<script lang="ts">
 import {onMount} from 'svelte';
 import {getContext} from '../game/context';
 import {stateBet,stateModal} from 'state-shared';
 const context=getContext();
 let enabled=$state(false);
 let scenario=$state('');
 const scenarios=['baseNoWin','baseWin','baseBoxes','baseTrigger','bonusPlain','bonusTerritory','bonusRetrigger','superPlain','baseCap','bonusCap','superCap'];
 const selectScenario=(event:Event)=>{const url=new URL(location.href);const key=(event.currentTarget as HTMLSelectElement).value;if(key)url.searchParams.set('book',key);else url.searchParams.delete('book');location.href=url.href;};
const continueReview=()=>window.dispatchEvent(new Event('purrfia-review-continue'));
 onMount(()=>{const params=new URLSearchParams(location.search);enabled=import.meta.env.DEV&&params.has('mock');scenario=params.get('book')??'';});
</script>
{#if enabled}
 <div class="dev-controls" aria-label="Local mechanics review controls">
  <select aria-label="Scenario" value={scenario} onchange={selectScenario}><option value="">Cycle scenarios</option>{#each scenarios as name}<option value={name}>{name}</option>{/each}</select>
  <button onclick={()=>{context.stateLayout.showLoadingScreen=false;}}>Start game</button>
  <button disabled={!context.stateXstateDerived.isIdle()} onclick={()=>{stateBet.activeBetModeKey='BASE';context.eventEmitter.broadcast({type:'bet'});}}>Play base</button>
  <button disabled={!context.stateXstateDerived.isIdle()} onclick={()=>{stateBet.activeBetModeKey='BONUS';context.eventEmitter.broadcast({type:'bet'});}}>Play 100×</button>
  <button disabled={!context.stateXstateDerived.isIdle()} onclick={()=>{stateBet.activeBetModeKey='SUPER';context.eventEmitter.broadcast({type:'bet'});}}>Play 300×</button>
  <button onclick={continueReview}>Continue</button>
 </div>
{/if}
<style>.dev-controls{position:fixed;z-index:10000;top:4px;left:4px;display:flex;gap:4px;flex-wrap:wrap;max-width:95vw}.dev-controls button{background:#141826;color:#ffe6a0;border:1px solid #b58b49;padding:7px;border-radius:4px;font:12px Arial}.dev-controls button:disabled{opacity:.4}</style>

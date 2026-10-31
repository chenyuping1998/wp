<script lang="ts">
 import rigReview from '../game/characterRigData.json';
 let action=$state('push_monocle');
 const actions=Object.keys(rigReview.animations).filter(name=>name!=='breath');
 const inspectPose=()=>{const clip=(rigReview.animations as Record<string,{bones:Record<string,Record<string,{time?:number}[]>>}>)[action];const duration=Math.max(0,...Object.values(clip.bones).flatMap(b=>Object.values(b).flatMap(keys=>keys.map(k=>k.time??0))));context.eventEmitter.broadcast({type:'castInspect',name:action,time:duration*.5});};
 import {onMount} from 'svelte';
 import {getContext} from '../game/context';
 import {stateBet,stateModal,stateUi} from 'state-shared';
 const context=getContext();
 let enabled=$state(false);
 let scenario=$state('');
 const scenarios=['baseNoWin','baseWin','baseBoxes','baseTrigger','bonusPlain','bonusTerritory','bonusRetrigger','superPlain','baseCap','bonusCap','superCap'];
 const selectScenario=(event:Event)=>{const url=new URL(location.href);const key=(event.currentTarget as HTMLSelectElement).value;if(key)url.searchParams.set('book',key);else url.searchParams.delete('book');location.href=url.href;};
const continueReview=()=>window.dispatchEvent(new Event('purrfia-review-continue'));
 onMount(()=>{const params=new URLSearchParams(location.search);enabled=import.meta.env.DEV&&params.has('mock')&&!params.has('hideReview');scenario=params.get('book')??'';});
</script>
{#if enabled}
 <div class="dev-controls" aria-label="Local mechanics review controls">
  <button onclick={inspectPose}>Pose 50%</button>
  <select aria-label="Scenario" value={scenario} onchange={selectScenario}><option value="">Cycle scenarios</option>{#each scenarios as name}<option value={name}>{name}</option>{/each}</select>
  <button onclick={()=>{context.stateLayout.showLoadingScreen=false;}}>Start game</button>
  <button disabled={!context.stateXstateDerived.isIdle()} onclick={()=>{stateBet.activeBetModeKey='BASE';context.eventEmitter.broadcast({type:'bet'});}}>Play base</button>
  <button disabled={!context.stateXstateDerived.isIdle()} onclick={()=>{stateBet.activeBetModeKey='BONUS';context.eventEmitter.broadcast({type:'bet'});}}>Play 100×</button>
  <button disabled={!context.stateXstateDerived.isIdle()} onclick={()=>{stateBet.activeBetModeKey='SUPER';context.eventEmitter.broadcast({type:'bet'});}}>Play 300×</button>
  <button onclick={continueReview}>Continue</button><button onclick={()=>{stateBet.isTurbo=!stateBet.isTurbo;stateBet.turboLevel=2;}}>Turbo</button>
  <select aria-label="Character action" bind:value={action}>{#each actions as name}<option value={name}>{name}</option>{/each}</select><button onclick={()=>context.eventEmitter.broadcast({type:'castPlay',name:action,rate:.5})}>Act ½</button><button onclick={()=>context.eventEmitter.broadcast({type:'castPlay',name:'idle'})}>Idle</button><button onclick={()=>stateModal.modal={name:'gameRules'}}>Info</button><button onclick={()=>stateModal.modal={name:'payTable'}}>Win table</button>
  <output aria-label="Review status" data-loaded={context.stateApp.loaded} data-idle={context.stateXstateDerived.isIdle()} data-win={stateBet.winBookEventAmount} data-balance={stateBet.balanceAmount} data-territory={Math.max(...context.stateGame.cellMults.flat())} data-feature={context.stateGame.gameType} data-counter={stateUi.freeSpinCounterCurrent+':'+stateUi.freeSpinCounterTotal}>{context.stateXstate.value} · {context.stateGame.gameType} · win {stateBet.winBookEventAmount}</output>
 </div>
{/if}
<style>.dev-controls{position:fixed;z-index:10000;top:4px;left:4px;display:flex;gap:4px;flex-wrap:wrap;max-width:95vw}.dev-controls button{background:#141826;color:#ffe6a0;border:1px solid #b58b49;padding:7px;border-radius:4px;font:12px Arial}.dev-controls button:disabled{opacity:.4}</style>

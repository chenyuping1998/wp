<script lang="ts">
 import rigReview from '../game/characterRigData.json';
 let action=$state('encore_build');
 const actions=Object.keys(rigReview.animations).filter(name=>name!=='breath');
 const inspectPose=()=>{const clip=(rigReview.animations as Record<string,{bones:Record<string,Record<string,{time?:number}[]>>}>)[action];const duration=Math.max(0,...Object.values(clip.bones).flatMap(b=>Object.values(b).flatMap(keys=>keys.map(k=>k.time??0))));context.eventEmitter.broadcast({type:'castInspect',name:action,time:duration*.5});};
 import {getContext} from '../game/context';
 import {onMount} from 'svelte';import {eventEmitter} from '../game/eventEmitter';import {stateLayout} from '../game/stateLayout';import {stateBet,stateUi,stateModal} from 'state-shared';import {stateGame} from '../game/stateGame.svelte';
 const context=getContext();
 let enabled=$state(false),scenario=$state(new URLSearchParams(typeof location==='undefined'?'':location.search).get('book')??'baseWin');
 onMount(()=>enabled=import.meta.env.DEV&&new URLSearchParams(location.search).has('mock')&&!new URLSearchParams(location.search).has('hideReview')); 
 const go=()=>{stateLayout.showLoadingScreen=false;stateBet.activeBetModeKey=scenario.startsWith('super')?'SUPER':scenario.startsWith('bonus')?'BONUS':'BASE';eventEmitter.broadcast({type:'bet'});};
 const continuePanel=()=>window.dispatchEvent(new Event('parrot-review-continue'));
 const navigate=()=>{const u=new URL(location.href);u.searchParams.set('book',scenario);location.href=u.href;};
</script>
{#if enabled}<aside style="position:fixed;left:4px;top:4px;z-index:999999;background:#fff;color:#123;padding:6px;font:12px Arial;max-width:95vw">
 <button onclick={inspectPose}>Pose 50%</button><span>LOCAL MECHANICS REVIEW</span>
 <select aria-label="Scenario" bind:value={scenario} onchange={navigate}>{#each ['baseWin','baseEncore','baseEncoreHit','baseEncoreMiss','baseRecord','baseRecordMiss','baseTrigger','bonusPlain','bonusRetrigger','superPlain','superRetrigger'] as key}<option value={key}>{key}</option>{/each}</select>
 <button onclick={()=>stateLayout.showLoadingScreen=false}>Start</button><button onclick={go}>Play fixture</button>
 <button onclick={continuePanel}>Continue</button>
 <button onclick={()=>{stateBet.isTurbo=!stateBet.isTurbo;stateBet.turboLevel=2;}}>Turbo</button>
 <select aria-label="Character action" bind:value={action}>{#each actions as name}<option value={name}>{name}</option>{/each}</select><button onclick={()=>context.eventEmitter.broadcast({type:'castPlay',name:action,rate:.5})}>Act ½</button><button onclick={()=>context.eventEmitter.broadcast({type:'castPlay',name:'idle'})}>Idle</button><button onclick={()=>stateModal.modal={name:'gameRules'}}>Info</button><button onclick={()=>stateModal.modal={name:'payTable'}}>Win table</button>
 <output aria-label="Review status" data-loaded={context.stateApp.loaded} data-idle={context.stateXstateDerived.isIdle()} data-win={stateBet.winBookEventAmount} data-balance={stateBet.balanceAmount} data-volume={stateGame.volume} data-feature={stateGame.gameType} data-counter={stateUi.freeSpinCounterCurrent+':'+stateUi.freeSpinCounterTotal}>{stateGame.gameType} · volume ×{stateGame.volume} · win {stateBet.winBookEventAmount}</output>
</aside>{/if}

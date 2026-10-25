<script lang="ts">
 import {onMount} from 'svelte';import {eventEmitter} from '../game/eventEmitter';import {stateLayout} from '../game/stateLayout';import {stateBet} from 'state-shared';import {stateGame} from '../game/stateGame.svelte';
 let enabled=$state(false),scenario=$state(new URLSearchParams(typeof location==='undefined'?'':location.search).get('book')??'baseWin');
 onMount(()=>enabled=import.meta.env.DEV&&new URLSearchParams(location.search).has('mock'));
 const go=()=>{stateLayout.showLoadingScreen=false;stateBet.activeBetModeKey=scenario.startsWith('super')?'SUPER':scenario.startsWith('bonus')?'BONUS':'BASE';eventEmitter.broadcast({type:'bet'});};
 const continuePanel=()=>document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' '}));
 const navigate=()=>{const u=new URL(location.href);u.searchParams.set('book',scenario);location.href=u.href;};
</script>
{#if enabled}<aside style="position:fixed;left:4px;top:4px;z-index:999999;background:#fff;color:#123;padding:6px;font:12px Arial;max-width:95vw">
 <span>LOCAL MECHANICS REVIEW</span>
 <select aria-label="Scenario" bind:value={scenario} onchange={navigate}>{#each ['baseWin','baseEncore','baseEncoreHit','baseEncoreMiss','baseRecord','baseRecordMiss','baseTrigger','bonusPlain','bonusRetrigger','superPlain','superRetrigger'] as key}<option value={key}>{key}</option>{/each}</select>
 <button onclick={()=>stateLayout.showLoadingScreen=false}>Start</button><button onclick={go}>Play fixture</button>
 <button onclick={continuePanel}>Continue</button>
 <button onclick={()=>{stateBet.isTurbo=!stateBet.isTurbo;stateBet.turboLevel=2;}}>Turbo</button>
 <output aria-label="Review status">{stateGame.gameType} · volume ×{stateGame.volume} · win {stateBet.winBookEventAmount}</output>
</aside>{/if}

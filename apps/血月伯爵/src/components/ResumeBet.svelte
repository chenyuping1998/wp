<script lang="ts">
 import {onMount} from 'svelte';
 import {stateBet,stateReplay,stateUrlDerived} from 'state-shared';
 import {getContext} from '../game/context';
 import {resetBloodMoon} from '../game/bloodmoon.svelte';
 const context=getContext();const replay=stateUrlDerived.replay();
 onMount(()=>{if(replay){stateReplay.enabled=true;stateReplay.round=stateBet.betToResume;stateReplay.waiting=true;}else context.eventEmitter.broadcast({type:'resumeBet'});});
 $effect(()=>{if(!stateReplay.startRequested)return;stateReplay.startRequested=false;resetBloodMoon();stateBet.winBookEventAmount=0;stateBet.betToResume=stateReplay.round;if(stateBet.betToResume)stateBet.betToResume={...stateBet.betToResume,event:'0'};context.eventEmitter.broadcast({type:'resumeBet'});});
 $effect(()=>{if(!replay)return;if(context.stateXstate.value==='resumeBet')stateReplay.running=true;else if(context.stateXstate.value==='idle')stateReplay.running=false;});
</script>

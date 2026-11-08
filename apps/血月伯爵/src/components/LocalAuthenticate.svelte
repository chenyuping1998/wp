<script lang="ts">
 import {onMount,type Snippet} from 'svelte';
 import {stateBet,stateConfig} from 'state-shared';
 import {loadDemo} from '../game/demo';
 const {children}:{children:Snippet}=$props();let ready=$state(false);let error=$state('');
 onMount(async()=>{try{await loadDemo();stateBet.balanceAmount=10000;stateBet.currency='USD';stateBet.betAmount=1;stateBet.wageredBetAmount=1;stateBet.activeBetModeKey='BASE';stateConfig.betAmountOptions=[.1,.2,.5,1,2,5,10];stateConfig.betMenuOptions=stateConfig.betAmountOptions;stateConfig.minBet=.1;stateConfig.maxBet=10;stateConfig.stepBet=.1;ready=true;}catch(e){error=String(e);}});
</script>
{#if ready}{@render children()}{:else}<div class="boot">{error||'Loading Blood Moon…'}</div>{/if}
<style>.boot{position:fixed;inset:0;display:grid;place-items:center;color:#dbc5a3;background:#07191f;font:20px system-ui}</style>

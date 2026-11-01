<script lang="ts">
 // The bar's status line. Idle it alternates the station call with the one
 // rule; a round says TUNING IN; free spins name the show. Lines carry their
 // own break so the bar never wraps them mid-phrase ("READY TO / PLAY").
 // The clock only swaps a 5 s bucket, so the text is set when it changes,
 // not every frame.
 import {onMount} from 'svelte';
 import {uiTheme} from 'components-ui-pixi';
 import {getContext} from '../game/context';
 import {gameText} from '../game/i18nText';
 const c=getContext();let slot=$state(0);
 onMount(()=>{let id=0;const start=performance.now();const tick=(now:number)=>{const s=Math.floor((now-start)/5000)%2;if(s!==slot)slot=s;id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(id);uiTheme.barMessage='';};});
 $effect(()=>{uiTheme.barMessageFill=0xb8d080;
 uiTheme.barMessage=c.stateGame.gameType==='freegame'?gameText('ssAfterHours'):!c.stateXstateDerived.isIdle()?gameText('ssTuningIn'):slot?gameText('ssCollectTip'):gameText('ssReady');});
</script>

<script lang="ts">
 import { wheelState as w } from '../game/wheelState.svelte';
 import { stateGame } from '../game/stateGame.svelte';
 import { stateBet } from 'state-shared';
</script>

{#if stateGame.gameType === 'freegame'}
 <div class="held" aria-label="Held feature multiplier"><span>STEAM PRESSURE</span><strong>{w.held}×</strong></div>
{/if}
{#if w.visible}
 <div class="wheel-stage" role="status" aria-live="polite">
  <div class="wheel-title">{w.landed ? (w.selected > w.previous ? 'PRESSURE RISING' : 'PRESSURE HELD') : 'STOKE THE ENGINE'}</div>
  <div class="window" class:landed={w.landed}>
   <div class="dial" style:transform="rotate({w.rotation}deg)" style:transition-duration={stateBet.isTurbo ? '1.2s' : '2.3s'}>
    {#each w.values as value, i}
     <div class="number" style:transform="rotate({i * 360 / w.values.length}deg) translateY(-174px)"><b>{value}×</b></div>
    {/each}
   </div>
   <div class="pointer"></div>
   <div class="hub"><small>{w.landed ? 'ALL LINE WINS' : 'HELD MULTIPLIER'}</small><strong>{w.held}×</strong></div>
  </div>
  <div class="caption">{w.landed ? 'KEPT UNTIL THE JOURNEY ENDS' : 'THE MULTIPLIER NEVER FALLS'}</div>
 </div>
{/if}

<style>
.held{position:fixed;top:3%;left:50%;transform:translateX(-50%);z-index:30;pointer-events:none;background:#071a19eb;border:1px solid #bf9856;border-radius:5px;display:flex;gap:18px;align-items:center;padding:8px 20px;color:#e8dfc7;box-shadow:0 3px 20px #0008;font-family:Georgia,serif}.held span{font-size:10px;letter-spacing:2px}.held strong{font-size:28px;color:#8ef2d7}.wheel-stage{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;background:#020b10b8;backdrop-filter:blur(2px);color:#f7ebcf;font-family:Georgia,serif;animation:appear .25s ease-out}.wheel-title{font-size:clamp(18px,3vw,32px);letter-spacing:5px;margin-bottom:25px;text-shadow:0 2px 9px #000}.window{width:460px;height:245px;position:relative;overflow:hidden;filter:drop-shadow(0 0 24px #49b9a566);border-bottom:8px solid #ba955b}.dial{position:absolute;width:440px;height:440px;left:10px;top:15px;border-radius:50%;background:repeating-conic-gradient(#163b35 0deg 17deg,#26453b 17deg 18deg);border:12px ridge #b48a46;box-sizing:border-box;transition-property:transform;transition-timing-function:cubic-bezier(.12,.65,.09,1);box-shadow:inset 0 0 0 7px #101b18,inset 0 0 35px #000}.number{position:absolute;left:50%;top:50%;width:64px;margin-left:-32px;margin-top:-14px;text-align:center;color:#f4e2b4;font-size:23px;text-shadow:0 2px 2px #000}.pointer{position:absolute;top:0;left:50%;transform:translateX(-50%);border-left:15px solid transparent;border-right:15px solid transparent;border-top:34px solid #fff0ac;filter:drop-shadow(0 3px 5px #000)}.hub{position:absolute;bottom:-76px;left:50%;transform:translateX(-50%);border-radius:50%;width:230px;height:230px;background:radial-gradient(circle,#173b35,#071413 70%);border:9px ridge #c9a45d;display:flex;flex-direction:column;align-items:center;padding-top:32px;box-sizing:border-box;box-shadow:0 0 25px #000}.hub small{font-size:10px;letter-spacing:2px}.hub strong{font-size:70px;color:#d8ffe7;text-shadow:0 0 20px #74eac1}.landed .hub{box-shadow:0 0 45px #7deacc}.caption{font:11px Arial,sans-serif;letter-spacing:3px;margin-top:25px;color:#a3c5b7}@keyframes appear{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@media(max-width:520px){.window{zoom:.72}.wheel-title{letter-spacing:2px}.caption{font-size:9px;letter-spacing:1px}.held{top:1%;padding:4px 12px}.held strong{font-size:21px}}
</style>

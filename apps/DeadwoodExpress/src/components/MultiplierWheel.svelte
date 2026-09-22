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
   <div class="dial" style:--step={`${360 / Math.max(1, w.values.length)}deg`} style:--half-step={`${-180 / Math.max(1, w.values.length)}deg`} style:transform="rotate({w.rotation}deg)" style:transition-duration={stateBet.isTurbo ? '2s' : '4.2s'}>
    {#each w.values as value, i}
     <div class="number" class:high={value >= 40} class:very-high={value >= 100} class:max={value === Math.max(...w.values)} style:transform="rotate({i * 360 / w.values.length}deg) translateY(-310px)"><b>{value}×</b></div>
    {/each}
   </div>
   <div class="pointer"></div>
   <div class="hub"><small>{w.landed ? 'ALL LINE WINS' : 'HELD MULTIPLIER'}</small><strong>{w.held}×</strong></div>
  </div>
  <div class="caption">{w.landed ? 'KEPT UNTIL THE JOURNEY ENDS' : 'THE MULTIPLIER NEVER FALLS'}</div>
 </div>
{/if}

<style>
.held{position:fixed;top:3%;left:50%;transform:translateX(-50%);z-index:30;pointer-events:none;background:#071a19eb;border:1px solid #bf9856;border-radius:5px;display:flex;gap:18px;align-items:center;padding:8px 20px;color:#e8dfc7;box-shadow:0 3px 20px #0008;font-family:Georgia,serif}.held span{font-size:10px;letter-spacing:2px}.held strong{font-size:28px;color:#8ef2d7}.wheel-stage{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;background:#020b10b8;backdrop-filter:blur(2px);color:#f7ebcf;font-family:Georgia,serif;animation:appear .25s ease-out}.wheel-title{font-size:clamp(22px,3.4vw,40px);letter-spacing:6px;margin-bottom:16px;text-shadow:0 2px 9px #000}.window{width:820px;height:430px;position:relative;overflow:hidden;filter:drop-shadow(0 0 32px #49b9a577);border-bottom:12px solid #ba955b}.dial{position:absolute;width:790px;height:790px;left:15px;top:18px;border-radius:50%;background:repeating-conic-gradient(from var(--half-step),#173b35 0 calc(var(--step) - 2deg),#527064 calc(var(--step) - 2deg) var(--step));border:16px ridge #b48a46;box-sizing:border-box;transition-property:transform;transition-timing-function:cubic-bezier(.12,.65,.09,1);box-shadow:inset 0 0 0 11px #101b18,inset 0 0 54px #000}.number{position:absolute;left:50%;top:50%;width:98px;margin-left:-49px;margin-top:-21px;text-align:center;color:#f7e8bd;font-size:32px;line-height:42px;text-shadow:0 3px 3px #000,0 0 7px #000}.number.high{color:#ffd36d;text-shadow:0 3px 3px #000,0 0 12px #d68a24}.number.very-high{color:#ff8f72;text-shadow:0 3px 3px #000,0 0 14px #ff543b}.number.max{color:#ff65c9;font-size:36px;text-shadow:0 3px 3px #000,0 0 17px #ff2aa9}.pointer{position:absolute;top:0;left:50%;transform:translateX(-50%);border-left:23px solid transparent;border-right:23px solid transparent;border-top:52px solid #fff0ac;filter:drop-shadow(0 3px 5px #000)}.hub{position:absolute;bottom:-110px;left:50%;transform:translateX(-50%);border-radius:50%;width:330px;height:330px;background:radial-gradient(circle,#173b35,#071413 70%);border:12px ridge #c9a45d;display:flex;flex-direction:column;align-items:center;padding-top:51px;box-sizing:border-box;box-shadow:0 0 28px #000}.hub small{font-size:13px;letter-spacing:2px}.hub strong{font-size:98px;color:#d8ffe7;text-shadow:0 0 22px #74eac1}.landed .hub{box-shadow:0 0 52px #7deacc}.caption{font:12px Arial,sans-serif;letter-spacing:4px;margin-top:18px;color:#a3c5b7}@keyframes appear{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@media(max-width:860px){.window{zoom:.72}.wheel-title{letter-spacing:3px}.caption{font-size:9px;letter-spacing:1px}.held{top:1%;padding:4px 12px}.held strong{font-size:21px}}@media(max-height:650px) and (min-width:861px){.window{zoom:.72}.wheel-title{font-size:28px;margin-bottom:10px}.caption{margin-top:10px}}
</style>

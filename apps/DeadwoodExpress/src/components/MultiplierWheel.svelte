<script lang="ts">
 import { wheelState as w, WHEEL_SPIN_MS } from '../game/wheelState.svelte';
 import { stateGame } from '../game/stateGame.svelte';
 import { stateBet } from 'state-shared';

 // Geometry as fractions of the dial diameter --d, so one number sizes it.
 const R_OUT = 0.455; // outer edge of the tiles, inside the brass rim
 const R_IN = 0.3; // inner edge of the tiles, just outside the hub
 const GAP = 0.009; // dark seam between neighbouring tiles

 const n = $derived(Math.max(1, w.values.length));
 const step = $derived(360 / n);
 // Tile width at its outer edge: the chord of one segment, less the seam.
 const chord = $derived(2 * R_OUT * Math.sin(Math.PI / n) - GAP);
 const top = $derived(Math.max(...w.values));
 const hitIndex = $derived(w.values.indexOf(w.selected));

 // Numeral size per tile, as a fraction of --d. A fixed size put three digits
 // past the tile edge on the 20-tile wheel ("110×" is 2.4 em wide in bold
 // Georgia, "200×" 2.7 em). The face is a trapezoid, so what has to fit is the
 // width at the numeral's BOTTOM edge, which is lower the bigger the numeral:
 //   face width at depth y  = top − slope·y
 //   numeral spans depth    PAD .. PAD + fs
 //   need  em·fs ≤ FILL·(top − slope·(PAD + fs))
 //   so    fs ≤ FILL·(top − slope·PAD) / (em + FILL·slope)
 const NUMERAL_FONT = 'bold 100px Georgia, serif';
 const measure = (() => {
  const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  if (ctx) ctx.font = NUMERAL_FONT;
  // em width; 0.7 per character is a safe over-estimate if canvas is missing
  return (text: string) => (ctx ? ctx.measureText(text).width / 100 : text.length * 0.7);
 })();
 const INSET = 0.008; // .face inset from the tile's brass edge
 const PAD = 0.018; // .face padding-top
 const FILL = 0.88; // leave a little air either side
 const fit = $derived.by(() => {
  const faceH = R_OUT - R_IN - 2 * INSET;
  const top = chord - 2 * INSET;
  const bottom = (chord + GAP) * (R_IN / R_OUT) - GAP - 2 * INSET;
  const slope = (top - bottom) / faceH;
  return (em: number) => (FILL * (top - slope * PAD)) / (em + FILL * slope);
 });
 const fontFor = (value: number, hit: boolean) => Math.min(hit ? 0.056 : 0.046, fit(measure(`${value}×`)));
</script>

{#if stateGame.gameType === 'freegame'}
 <div class="held" aria-label="Held feature multiplier"><span>STEAM PRESSURE</span><strong>{w.held}×</strong></div>
{/if}
{#if w.visible}
 <div class="wheel-stage" role="status" aria-live="polite">
  <div class="wheel-title">{w.landed ? (w.selected > w.previous ? 'PRESSURE RISING' : 'PRESSURE HELD') : 'STOKE THE ENGINE'}</div>
  <div
   class="window"
   class:landed={w.landed}
   style:--r-out={R_OUT}
   style:--r-in={R_IN}
   style:--chord={chord}
  >
   <div class="rim"></div>
   <div
    class="dial"
    style:transform="rotate({w.rotation}deg)"
    style:transition-duration={`${stateBet.isTurbo ? WHEEL_SPIN_MS.turbo : WHEEL_SPIN_MS.normal}ms`}
   >
    {#each w.values as value, i}
     <div class="slot" style:transform="rotate({i * step}deg)">
      <div
       class="tile"
       class:high={value >= 40}
       class:very-high={value >= 100}
       class:max={value === top}
       class:hit={w.landed && i === hitIndex}
      >
       <div class="face"><b style:--fs={fontFor(value, w.landed && i === hitIndex)}>{value}×</b></div>
      </div>
     </div>
    {/each}
   </div>
   <div class="pointer"></div>
   <div class="hub">
    <div class="hub-ring"></div>
    <small>{w.landed ? 'ALL LINE WINS' : 'HELD MULTIPLIER'}</small>
    <strong>{w.held}×</strong>
   </div>
  </div>
  <div class="caption">{w.landed ? 'KEPT UNTIL THE JOURNEY ENDS' : 'THE MULTIPLIER NEVER FALLS'}</div>
 </div>
{/if}

<style>
 .held{position:fixed;top:3%;left:50%;transform:translateX(-50%);z-index:30;pointer-events:none;background:#071a19eb;border:1px solid #bf9856;border-radius:5px;display:flex;gap:18px;align-items:center;padding:8px 20px;color:#e8dfc7;box-shadow:0 3px 20px #0008;font-family:Georgia,serif}
 .held span{font-size:10px;letter-spacing:2px}
 .held strong{font-size:28px;color:#8ef2d7}

 .wheel-stage{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;pointer-events:none;background:linear-gradient(#020b1066,#020b10cc 45%);backdrop-filter:blur(2px);color:#f7ebcf;font-family:Georgia,serif;animation:appear .3s ease-out}
 .wheel-title{font-size:clamp(20px,3.2vw,40px);letter-spacing:6px;margin-bottom:10px;text-shadow:0 2px 9px #000}
 .caption{position:absolute;bottom:10px;left:0;right:0;text-align:center;font:clamp(9px,1vw,12px) Arial,sans-serif;letter-spacing:4px;color:#a3c5b7;text-shadow:0 1px 4px #000}

 /*
  The dial rises from the bottom of the screen like a half-buried gauge: only
  its upper half shows. --d is the whole dial; it grows until the visible half
  plus the title would stop fitting the height, the width, or 1040px.
 */
 .window{--d:min(1040px,94vw,calc((100vh - 110px) / 0.56));width:var(--d);height:calc(var(--d) * 0.56);position:relative;overflow:hidden;filter:drop-shadow(0 0 30px #49b9a566)}

 .rim,.dial{position:absolute;left:0;top:0;width:var(--d);height:var(--d);border-radius:50%}
 /* brass rim and the dark well the tiles sit in */
 .rim{background:radial-gradient(circle,transparent calc(var(--d) * 0.462),#0c1715 calc(var(--d) * 0.463),#0c1715 calc(var(--d) * 0.468),#e5c27a calc(var(--d) * 0.472),#8a6327 calc(var(--d) * 0.485),#c9a45d calc(var(--d) * 0.494),#3b2a10 calc(var(--d) * 0.5)),radial-gradient(circle,#06100f 55%,#0d1c1a 92%);box-shadow:inset 0 0 40px #000}
 .dial{transition-property:transform;transition-timing-function:cubic-bezier(.16,.62,.1,1)}

 /* One slot per value: a column from the centre up to the outer tile edge,
    turned to its angle. The tile is the top part of it. */
 .slot{position:absolute;left:50%;bottom:50%;width:calc(var(--d) * var(--chord));height:calc(var(--d) * var(--r-out));margin-left:calc(var(--d) * var(--chord) / -2);transform-origin:50% 100%}
 .tile{--k:calc((1 - var(--r-in) / var(--r-out)) * 50%);position:absolute;left:0;right:0;top:0;height:calc(var(--d) * (var(--r-out) - var(--r-in)));clip-path:polygon(0 0,100% 0,calc(100% - var(--k)) 100%,var(--k) 100%);background:linear-gradient(#f3d58d,#9c7530 45%,#5d4214);transition:filter .3s}
 /* bevelled face, inset from the brass edge */
 .face{position:absolute;inset:calc(var(--d) * 0.008);clip-path:polygon(0 0,100% 0,calc(100% - var(--k)) 100%,var(--k) 100%);background:radial-gradient(ellipse at 50% 20%,#2c5a50,#143530 60%,#0b1f1c);box-shadow:inset 0 0 12px #000;display:flex;justify-content:center;padding-top:calc(var(--d) * 0.018)}
 .face b{font:bold calc(var(--d) * var(--fs)) Georgia,serif;line-height:1;color:#f7e8bd;white-space:nowrap;letter-spacing:-1px;text-shadow:0 3px 3px #000,0 0 7px #000}
 .tile.high .face b{color:#ffd36d;text-shadow:0 3px 3px #000,0 0 12px #d68a24}
 .tile.very-high .face b{color:#ff8f72;text-shadow:0 3px 3px #000,0 0 14px #ff543b}
 .tile.max .face b{color:#ff65c9;text-shadow:0 3px 3px #000,0 0 17px #ff2aa9}
 /* the tile the pointer settled on: lit, like the reference's 32× */
 .tile.hit{filter:brightness(1.35) drop-shadow(0 0 14px #ff5ccf)}
 .tile.hit .face{background:radial-gradient(ellipse at 50% 20%,#4d7d70,#1f4a42 60%,#12302b)}
 .tile.hit .face b{color:#ff7ad6;text-shadow:0 3px 3px #000,0 0 18px #ff2aa9,0 0 30px #ff2aa9}

 .pointer{position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:calc(var(--d) * 0.024) solid transparent;border-right:calc(var(--d) * 0.024) solid transparent;border-top:calc(var(--d) * 0.05) solid #fff0ac;filter:drop-shadow(0 3px 5px #000)}

 /* hub centred on the dial's centre, so its lower half is off the window */
 .hub{position:absolute;left:50%;top:calc(var(--d) * 0.5);width:calc(var(--d) * 0.56);height:calc(var(--d) * 0.56);transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#1d4a42,#081715 68%);box-shadow:0 0 30px #000,inset 0 0 30px #000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:calc(var(--d) * 0.06);box-sizing:border-box}
 .hub-ring{position:absolute;inset:0;border-radius:50%;border:calc(var(--d) * 0.016) solid #3fb59a;box-shadow:0 0 0 calc(var(--d) * 0.009) #c9a45d,inset 0 0 0 calc(var(--d) * 0.006) #0a1a17}
 .hub small{font-size:calc(var(--d) * 0.014);letter-spacing:2px;color:#cfe9df}
 .hub strong{font-size:calc(var(--d) * 0.12);line-height:1.05;color:#ffe08a;text-shadow:0 4px 0 #6b4a12,0 0 24px #f3b94a}
 .landed .hub{box-shadow:0 0 52px #7deacc,inset 0 0 30px #000}

 @keyframes appear{from{opacity:0;transform:translateY(4%)}to{opacity:1;transform:none}}
 /* Portrait: the bottom of the screen is the bet controls, so the dial sits
    over the board instead of rising from the foot, with its caption under it. */
 @media(orientation:portrait){.wheel-stage{justify-content:center}.caption{position:static;margin-top:10px}}
 @media(max-width:860px){.wheel-title{letter-spacing:3px}.caption{letter-spacing:1px}.held{top:1%;padding:4px 12px}.held strong{font-size:21px}}
</style>

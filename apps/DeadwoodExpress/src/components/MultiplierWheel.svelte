<script lang="ts">
 import { wheelState as w } from '../game/wheelState.svelte';
 import { stateGame } from '../game/stateGame.svelte';
 import { getContext } from '../game/context';

 // The held-multiplier plate sits ON the housing's top rail, centred on it like
 // a nameplate: prominent, and clear of the top row of symbols. Computed from the
 // board rather than a fixed % of the viewport — the board scales per aspect
 // (BOARD_SCALE_WIDE), and at 3% it sat across the frame at some sizes; moving it
 // under the logo instead (2026-09-26) made it too easy to miss.
 const context = getContext();
 const HOUSING_PAD = 24.5; // BoardFrame: outer roundRect 22 + half its 5px stroke
 const railY = $derived.by(() => {
  const main = context.stateLayoutDerived.mainLayout();
  const anchorY = typeof main.anchor === 'number' ? main.anchor : main.anchor.y;
  const board = context.stateGameDerived.boardLayout();
  const top = board.y - (board.height * board.scale) / 2 - HOUSING_PAD;
  return main.y + (top - main.height * anchorY) * main.scale;
 });

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
 // the display face, "200×" 2.7 em). The face is a trapezoid, so what has to fit is the
 // width at the numeral's BOTTOM edge, which is lower the bigger the numeral:
 //   face width at depth y  = top − slope·y
 //   numeral spans depth    PAD .. PAD + fs
 //   need  em·fs ≤ FILL·(top − slope·(PAD + fs))
 //   so    fs ≤ FILL·(top − slope·PAD) / (em + FILL·slope)
 // Cinzel, the game's display face (app.html @font-face). It was bold Georgia.
 const NUMERAL_FONT = '800 100px Cinzel, serif';
 const measure = (() => {
  const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  // em width; 0.7 per character is a safe over-estimate if canvas is missing.
  // The font is set per call: set once at mount it measured the fallback serif
  // whenever Cinzel had not finished loading yet.
  return (text: string) => {
   if (!ctx) return text.length * 0.7;
   ctx.font = NUMERAL_FONT;
   return ctx.measureText(text).width / 100;
  };
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

{#if stateGame.gameType === 'freegame' && !stateGame.featureSplashShow && !stateGame.fullscreenOverlay}
 <div class="held" style:top={`${railY}px`} aria-label="Held feature multiplier"><span>STEAM PRESSURE</span><strong>{w.held}<i class="x">×</i></strong></div>
{/if}
{#if w.visible}
 <!-- Painted materials (design/build_wheel_materials.py) passed in as custom
      properties: an inline style is not rewritten by Vite, so the static
      ./assets path resolves against the page like every other runtime asset. -->
 <div
  class="wheel-stage"
  role="status"
  aria-live="polite"
  style:--brass="url(./assets/deadwood/wheel_brass.jpg)"
  style:--enamel="url(./assets/deadwood/wheel_enamel.jpg)"
 >
  <div class="wheel-title">{w.landed ? (w.selected > w.previous ? 'PRESSURE RISING' : 'PRESSURE HELD') : 'STOKE THE ENGINE'}</div>
  <div
   class="window"
   class:landed={w.landed}
   style:--r-out={R_OUT}
   style:--r-in={R_IN}
   style:--chord={chord}
  >
   <div class="well"></div>
   <div class="rim"></div>
   <div
    class="dial"
    style:transform="rotate({w.rotation}deg)"
    style:transition-duration={`${w.spinMs}ms`}
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
       <div class="face"><b style:--fs={fontFor(value, w.landed && i === hitIndex)}>{value}<i class="x">×</i></b></div>
      </div>
     </div>
    {/each}
   </div>
   <div class="pointer"></div>
   <div class="hub">
    <div class="hub-ring"></div>
    <small>{w.landed ? 'ALL LINE WINS' : 'HELD MULTIPLIER'}</small>
    <strong>{w.held}<i class="x">×</i></strong>
   </div>
  </div>
  <div class="caption">{w.landed ? 'KEPT UNTIL THE JOURNEY ENDS' : 'THE MULTIPLIER NEVER FALLS'}</div>
 </div>
{/if}

<style>
 .held{position:fixed;left:50%;transform:translate(-50%,-50%);z-index:30;pointer-events:none;background:#071a19eb;border:1px solid #bf9856;border-radius:5px;display:flex;gap:18px;align-items:center;padding:8px 20px;color:#e8dfc7;box-shadow:0 3px 20px #0008;font-family:Cinzel,serif;font-weight:700}
 .held span{font:600 10px Saira,sans-serif;letter-spacing:2px}
 .held strong{font-size:28px;color:#8ef2d7}

 .wheel-stage{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;pointer-events:none;background:linear-gradient(#020b1066,#020b10cc 45%);backdrop-filter:blur(2px);color:#f7ebcf;font-family:Cinzel,serif;font-weight:700;animation:appear .3s ease-out}
 .wheel-title{font-size:clamp(20px,3.2vw,40px);letter-spacing:6px;margin-bottom:10px;text-shadow:0 2px 9px #000}
 .caption{position:absolute;bottom:10px;left:0;right:0;text-align:center;font:600 clamp(9px,1vw,12px) Saira,sans-serif;letter-spacing:4px;color:#a3c5b7;text-shadow:0 1px 4px #000}

 /*
  The dial rises from the bottom of the screen like a half-buried gauge: only
  its upper half shows. --d is the whole dial; it grows until the visible half
  plus the title would stop fitting the height, the width, or 1040px.
 */
 .window{--d:min(1040px,94vw,calc((100vh - 110px) / 0.56));width:var(--d);height:calc(var(--d) * 0.56);position:relative;overflow:hidden;filter:drop-shadow(0 0 30px #49b9a566)}

 .rim,.dial{position:absolute;left:0;top:0;width:var(--d);height:var(--d);border-radius:50%}
 /*
  Every surface below is a painted texture cut from the bonus plate (brass,
  teal enamel); the gradients on top are only light and shade. Until 2026-09-30
  the gradients WERE the surfaces — the review's "gradient fills".
 */
 .rim,.well{position:absolute;left:0;top:0;width:var(--d);height:var(--d);border-radius:50%}
 /* the dark well the tiles sit in */
 .well{background:radial-gradient(circle,#0000 40%,#000a 92%),var(--enamel) center/calc(var(--d) * 0.35);filter:brightness(.55)}
 /* brass rim: the texture, cut to a ring, with a bevel of light over it */
 .rim{background:radial-gradient(circle,#000c calc(var(--d) * 0.468),#fff0c055 calc(var(--d) * 0.473),#0000 calc(var(--d) * 0.482),#0000 calc(var(--d) * 0.49),#000a calc(var(--d) * 0.5)),var(--brass) center/calc(var(--d) * 0.22);-webkit-mask:radial-gradient(circle,#0000 calc(var(--d) * 0.464),#000 calc(var(--d) * 0.466));mask:radial-gradient(circle,#0000 calc(var(--d) * 0.464),#000 calc(var(--d) * 0.466))}
 .dial{transition-property:transform;transition-timing-function:cubic-bezier(.16,.62,.1,1)}

 /* One slot per value: a column from the centre up to the outer tile edge,
    turned to its angle. The tile is the top part of it. */
 .slot{position:absolute;left:50%;bottom:50%;width:calc(var(--d) * var(--chord));height:calc(var(--d) * var(--r-out));margin-left:calc(var(--d) * var(--chord) / -2);transform-origin:50% 100%}
 .tile{--k:calc((1 - var(--r-in) / var(--r-out)) * 50%);position:absolute;left:0;right:0;top:0;height:calc(var(--d) * (var(--r-out) - var(--r-in)));clip-path:polygon(0 0,100% 0,calc(100% - var(--k)) 100%,var(--k) 100%);background:linear-gradient(#fff0c066,#0000 35%,#0000 60%,#0008),var(--brass) center/calc(var(--d) * 0.16);transition:filter .3s}
 /* bevelled face, inset from the brass edge */
 .face{position:absolute;inset:calc(var(--d) * 0.008);clip-path:polygon(0 0,100% 0,calc(100% - var(--k)) 100%,var(--k) 100%);background:radial-gradient(ellipse at 50% 20%,#5ab09a40,#0000 55%,#0008),var(--enamel) center/calc(var(--d) * 0.3);box-shadow:inset 0 0 12px #000;display:flex;justify-content:center;padding-top:calc(var(--d) * 0.018)}
 .face b{font:800 calc(var(--d) * var(--fs)) Cinzel,serif;line-height:1;color:#f7e8bd;white-space:nowrap;letter-spacing:-1px;text-shadow:0 3px 3px #000,0 0 7px #000}
 .tile.high .face b{color:#ffd36d;text-shadow:0 3px 3px #000,0 0 12px #d68a24}
 .tile.very-high .face b{color:#ff8f72;text-shadow:0 3px 3px #000,0 0 14px #ff543b}
 /* the top value burns spectral teal, the ghost-train headlamp — it was Miami pink */
 .tile.max .face b{color:#b8fff0;text-shadow:0 3px 3px #000,0 0 17px #2fe0b4}
 /* the tile the pointer settled on: lit, like the reference's 32× */
 .tile.hit{filter:brightness(1.35) drop-shadow(0 0 14px #5fe8c8)}
 .tile.hit .face{background:radial-gradient(ellipse at 50% 20%,#8ef2d780,#0000 65%),var(--enamel) center/calc(var(--d) * 0.3)}
 .tile.hit .face b{color:#fff3c4;text-shadow:0 3px 3px #000,0 0 18px #f0b440,0 0 30px #2fe0b4}

 .pointer{position:absolute;top:0;left:50%;transform:translateX(-50%);width:calc(var(--d) * 0.048);height:calc(var(--d) * 0.05);clip-path:polygon(0 0,100% 0,50% 100%);background:linear-gradient(90deg,#fff3,#fff8 45%,#0006 55%,#0003),var(--brass) center/calc(var(--d) * 0.1);filter:drop-shadow(0 3px 5px #000)}

 /* hub centred on the dial's centre, so its lower half is off the window */
 .hub{position:absolute;left:50%;top:calc(var(--d) * 0.5);width:calc(var(--d) * 0.56);height:calc(var(--d) * 0.56);transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#4fb49a33,#0000 45%,#000b 70%),var(--enamel) center/calc(var(--d) * 0.4);box-shadow:0 0 30px #000,inset 0 0 30px #000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:calc(var(--d) * 0.06);box-sizing:border-box}
 .hub-ring{position:absolute;inset:0;border-radius:50%;border:calc(var(--d) * 0.016) solid #3fb59a;box-shadow:0 0 0 calc(var(--d) * 0.009) #c9a45d,inset 0 0 0 calc(var(--d) * 0.006) #0a1a17}
 .hub small{font:600 calc(var(--d) * 0.014) Saira,sans-serif;letter-spacing:2px;color:#cfe9df}
 .hub strong{font-size:calc(var(--d) * 0.12);line-height:1.05;color:#ffe08a;text-shadow:0 4px 0 #6b4a12,0 0 24px #f3b94a}
 .landed .hub{box-shadow:0 0 52px #7deacc,inset 0 0 30px #000}

 /* Cinzel's × is cap-height, so "1×" read as "1X" — set it smaller, on the
    numerals' midline */
 .x{font-style:normal;font-size:.62em;vertical-align:.18em;margin-left:.04em}

 @keyframes appear{from{opacity:0;transform:translateY(4%)}to{opacity:1;transform:none}}
 /* Portrait: the bottom of the screen is the bet controls, so the dial sits
    over the board instead of rising from the foot, with its caption under it. */
 @media(orientation:portrait){.wheel-stage{justify-content:center}.caption{position:static;margin-top:10px}}
 @media(max-width:860px){.wheel-title{letter-spacing:3px}.caption{letter-spacing:1px}.held{padding:4px 12px}.held strong{font-size:21px}}
</style>

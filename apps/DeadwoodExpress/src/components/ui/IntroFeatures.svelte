<script lang="ts">
import { stateApp } from '../../game/stateApp';
import { stateLayout } from '../../game/stateLayout';
import config from '../../game/config';
let props:{onclose?:()=>void}=$props();
let show=$state(true);
// Ambient life for the opening card (2026-09-30). It was a still picture with a
// still figure — the first screen a reviewer sees. The scene drifts, fog crosses
// it and cold motes rise, all from the game's own fx_glow sprite; the conductor's
// body is NOT swayed (a whole-figure rotate reads as the body rocking — see
// HANDOFF §4), only the ghost-light behind him breathes.
const motes=Array.from({length:16},(_,i)=>({x:(i*61)%100,d:9+((i*37)%9),delay:-((i*13)%17),s:6+((i*29)%18)}));
function close(){if(!stateApp.loaded)return;show=false;stateLayout.showLoadingScreen=false;props.onclose?.();}
// Fit the card to the window (Stake review, 2026-10-04: "The Intro screen cannot
// be passed" in Popout S and L). The card was laid out in fixed px, so in a small
// popout the logo ran off the top and the button off the bottom, with no way to
// reach it. It is now measured at its natural size and scaled down to fit, and a
// click/tap anywhere — or Enter — continues (not Space: that is the spin key) once the game has loaded.
let card=$state<HTMLElement>();
let fit=$state(1);
function measure(){if(!card)return;const w=card.offsetWidth,h=card.offsetHeight;if(!w||!h)return;fit=Math.min(1,(window.innerHeight*0.96)/h,(window.innerWidth*0.98)/w);}
$effect(()=>{if(!card)return;measure();const ro=new ResizeObserver(measure);ro.observe(card);window.addEventListener('resize',measure);return()=>{ro.disconnect();window.removeEventListener('resize',measure);};});
function onkey(e:KeyboardEvent){if(!show)return;if(e.key==='Enter'){e.preventDefault();close();}}
</script>
<svelte:window onkeydown={onkey}/>
{#if show}
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="intro" class:ready={stateApp.loaded} onclick={close}>
<div class="drift"><img class="scene" src="./assets/deadwood/background.png" alt=""/></div>
<img class="fog f1" src="./assets/deadwood/fx_glow.png" alt=""/>
<img class="fog f2" src="./assets/deadwood/fx_glow.png" alt=""/>
<img class="fog f3" src="./assets/deadwood/fx_glow.png" alt=""/>
<div class="shade"></div>
{#each motes as m, i (i)}<img class="mote" src="./assets/deadwood/fx_glow.png" alt="" style:left={`${m.x}%`} style:width={`${m.s}px`} style:animation-duration={`${m.d}s`} style:animation-delay={`${m.delay}s`}/>{/each}
<img class="aura" src="./assets/deadwood/fx_glow.png" alt=""/>
<img class="conductor" src="./assets/deadwood/conductor.png" alt="The spectral conductor"/>
<main bind:this={card} style:transform={`scale(${fit})`}>
<div class="studio">SILVERSTARS STUDIO</div>
<img class="logo" src="./assets/deadwood/logo.png" alt="Deadwood Express"/>
<div class="rule"></div>
<p class="tagline">THE LAST TRAIN NEVER STOPS</p>
<div class="features"><section><strong>THE PRESSURE WHEEL</strong><p>Every winning free spin turns the wheel. The new multiplier powers every line win immediately.</p></section><section><strong>ONLY UP FROM HERE</strong><p>Your multiplier never falls. Empty spins preserve the pressure until the journey ends.</p></section></div>
<div class="facts">{config.numReels} REELS × {config.numRows[0]} ROWS · {Object.keys(config.paylines).length} LINES · MAX {config.betModes.base.max_win.toLocaleString()}×</div>
<button onclick={(e)=>{e.stopPropagation();close();}} style:--brass="url(./assets/deadwood/wheel_brass.jpg)" disabled={!stateApp.loaded}>{stateApp.loaded?'BOARD THE EXPRESS':'PREPARING YOUR JOURNEY…'}</button>
</main>
</div>
{/if}
<style>
.intro{position:fixed;inset:0;z-index:10000;background:#071414;color:#eee4cb;display:flex;align-items:center;justify-content:center;overflow:hidden}.scene,.shade{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.shade{background:linear-gradient(90deg,#06100f11,#051511e8 45%,#05120fea)}.conductor{position:absolute;height:90%;bottom:0;left:2%;max-width:45%;object-fit:contain;filter:drop-shadow(0 0 30px #4ba88a55)}main{position:relative;width:55%;max-width:720px;margin-left:30%;text-align:center;padding:24px;transform-origin:center center;flex-shrink:0}.intro.ready{cursor:pointer}.studio{font:11px Saira,sans-serif;letter-spacing:5px;color:#a3c4b4}.logo{width:88%;height:180px;object-fit:contain}.rule{height:1px;background:#ac895a;margin:12px auto;width:70%}.tagline{font:700 14px Cinzel,serif;letter-spacing:4px;color:#e5bc76}.features{display:flex;gap:25px;margin:26px 0;text-align:left}.features section{flex:1;border-left:2px solid #ad8a50;padding-left:16px}.features strong{font:800 15px Cinzel,serif;letter-spacing:1px;color:#a4ecd2}.features p{font:15px/1.55 Saira,sans-serif;color:#d4dbce}.facts{font:11px Saira;letter-spacing:2px;color:#b6bfaf}button{margin-top:25px;border:2px solid #3b2a10;border-radius:6px;background:linear-gradient(#fff2c455,#0000 40%,#0007),var(--brass) center/180px;color:#2a1a06;font:800 17px Cinzel,serif;letter-spacing:3px;padding:16px 28px;cursor:pointer;text-shadow:0 1px 0 #f6d99a88;box-shadow:inset 0 0 0 2px #e8c77a99,inset 0 -3px 6px #0008,0 4px 14px #000a,0 0 30px #6abda333;transition:filter .2s,transform .2s}button:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-1px)}button:disabled{opacity:.55;cursor:wait}
.drift{position:absolute;inset:0;animation:drift 38s ease-in-out infinite alternate}.drift .scene{position:absolute}
@keyframes drift{from{transform:scale(1.04) translate(-1%,0)}to{transform:scale(1.1) translate(1.2%,-1%)}}
.fog{position:absolute;pointer-events:none;opacity:.14;filter:hue-rotate(0deg);mix-blend-mode:screen;height:34vh;width:110vw}
.f1{bottom:4vh;left:-60vw;animation:fog 46s linear infinite}.f2{bottom:18vh;left:-80vw;opacity:.1;animation:fog 64s linear infinite -20s}.f3{bottom:-6vh;left:-70vw;opacity:.16;animation:fog 52s linear infinite -35s}
@keyframes fog{from{transform:translateX(0)}to{transform:translateX(180vw)}}
.mote{position:absolute;bottom:-4vh;opacity:0;pointer-events:none;mix-blend-mode:screen;filter:sepia(1) hue-rotate(120deg) saturate(3);animation:rise linear infinite}
@keyframes rise{0%{transform:translate(0,0);opacity:0}15%{opacity:.7}50%{transform:translate(18px,-55vh)}85%{opacity:.5}100%{transform:translate(-10px,-108vh);opacity:0}}
.aura{position:absolute;left:4%;bottom:18%;height:70%;width:34%;pointer-events:none;mix-blend-mode:screen;filter:sepia(1) hue-rotate(120deg) saturate(2.5);animation:aura 4.6s ease-in-out infinite}
@keyframes aura{0%,100%{opacity:.18}50%{opacity:.38}}
@media(prefers-reduced-motion:reduce){.drift,.fog,.mote,.aura{animation:none}.mote{display:none}}@media(max-width:650px){.aura{opacity:.1;left:-10%;width:80%}.conductor{opacity:.32;left:-20%;max-width:90%;height:85%}.shade{background:#061814b8}main{margin:0;width:100%;padding:22px}.logo{height:150px}.features{margin:18px 0;gap:14px}.features p{font-size:13px}.tagline{font-size:11px;letter-spacing:2px}}
</style>

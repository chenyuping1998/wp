<script lang="ts">
import { base } from '$app/paths';
import { stateApp } from '../../game/stateApp';
import { stateLayout } from '../../game/stateLayout';
import config from '../../game/config';
let props:{onclose?:()=>void}=$props();
let show=$state(true);
function close(){if(!stateApp.loaded)return;show=false;stateLayout.showLoadingScreen=false;props.onclose?.();}
</script>
{#if show}
<div class="intro">
<img class="scene" src={`${base}/assets/deadwood/background.png`} alt=""/>
<div class="shade"></div>
<img class="conductor" src={`${base}/assets/deadwood/conductor.png`} alt="The spectral conductor"/>
<main>
<div class="studio">SILVERSTARS STUDIO</div>
<img class="logo" src={`${base}/assets/deadwood/logo.png`} alt="Deadwood Express"/>
<div class="rule"></div>
<p class="tagline">THE LAST TRAIN NEVER STOPS</p>
<div class="features"><section><strong>THE PRESSURE WHEEL</strong><p>Every paying free spin turns the wheel. The new multiplier powers every line win immediately.</p></section><section><strong>ONLY UP FROM HERE</strong><p>Your multiplier never falls. Empty spins preserve the pressure until the journey ends.</p></section></div>
<div class="facts">{config.numReels} × {config.numRows[0]} REELS · {Object.keys(config.paylines).length} LINES · MAX {config.betModes.base.max_win.toLocaleString()}×</div>
<button onclick={close} disabled={!stateApp.loaded}>{stateApp.loaded?'BOARD THE EXPRESS':'PREPARING YOUR JOURNEY…'}</button>
</main>
</div>
{/if}
<style>
.intro{position:fixed;inset:0;z-index:10000;background:#071414;color:#eee4cb;display:flex;align-items:center;justify-content:center;overflow:hidden}.scene,.shade{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.shade{background:linear-gradient(90deg,#06100f11,#051511e8 45%,#05120fea)}.conductor{position:absolute;height:90%;bottom:0;left:2%;max-width:45%;object-fit:contain;filter:drop-shadow(0 0 30px #4ba88a55)}main{position:relative;width:55%;max-width:720px;margin-left:30%;text-align:center;padding:24px}.studio{font:11px Saira,sans-serif;letter-spacing:5px;color:#a3c4b4}.logo{width:88%;height:180px;object-fit:contain}.rule{height:1px;background:#ac895a;margin:12px auto;width:70%}.tagline{font:14px Georgia;letter-spacing:4px;color:#e5bc76}.features{display:flex;gap:25px;margin:26px 0;text-align:left}.features section{flex:1;border-left:2px solid #ad8a50;padding-left:16px}.features strong{font:15px Georgia;color:#a4ecd2}.features p{font:15px/1.55 Saira,sans-serif;color:#d4dbce}.facts{font:11px Saira;letter-spacing:2px;color:#b6bfaf}button{margin-top:25px;border:1px solid #d4b477;background:#163c31;color:#f3e7c8;font:17px Georgia;letter-spacing:3px;padding:16px 25px;cursor:pointer;box-shadow:0 0 30px #6abda322}button:disabled{opacity:.5;cursor:wait}@media(max-width:650px){.conductor{opacity:.32;left:-20%;max-width:90%;height:85%}.shade{background:#061814b8}main{margin:0;width:100%;padding:22px}.logo{height:150px}.features{margin:18px 0;gap:14px}.features p{font-size:13px}.tagline{font-size:11px;letter-spacing:2px}}
</style>

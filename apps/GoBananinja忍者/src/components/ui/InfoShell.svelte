<script lang="ts">
 import { stateModal } from 'state-shared';
 import { base } from '$app/paths';
 import type { Snippet } from 'svelte';
 import config from '../../game/config';
 import { getSocialTerms } from '../../game/socialTerms';
 import MechanicGuide from './MechanicGuide.svelte';
 const { kind, children }: {kind:'rules'|'paytable';children:Snippet}=$props();
 const T=getSocialTerms();
 const rows=config.numRows?.[0]??4;
 const reels=config.numReels;
 const ways=(config.numRows??[]).reduce((a:number,b:number)=>a*b,1);
 const navigate=(name:'gameRules'|'payTable')=>{stateModal.modal={name};};
</script>
<div class="info-shell">
 <header class="journal-head">
  <img class="journal-crest" src={`${base}/assets/sprites/featureUiV2/crest.png`} alt="" width="72" height="72" />
  <div><span class="journal-kicker">SHINOBI FIELD MANUAL</span><h2 id="information-title">Go Bananinja</h2><p>Read the blade. Learn the split.</p></div>
  <span class="journal-edition" aria-hidden="true">01<br/>NIN</span>
 </header>
 <nav class="journal-tabs" aria-label="Game information">
  <button class:chosen={kind==='rules'} aria-current={kind==='rules'?'page':undefined} onclick={()=>navigate('gameRules')}>How to play <span>01</span></button>
  <button class:chosen={kind==='paytable'} aria-current={kind==='paytable'?'page':undefined} onclick={()=>navigate('payTable')}>{T.payTableCaps} <span>02</span></button>
 </nav>
 <div class="journal-facts"><span><b>{rows} × {reels}</b> Base grid</span><span><b>{ways.toLocaleString()}</b> {T.ways}</span><span><b>→</b> Left to right</span></div>
 {#if kind==='rules'}<MechanicGuide />{/if}
 <div class="info-content">{@render children()}</div>
</div>
<style>
 .info-shell{--ink:#0a1b28;--raised:#193443;--trim:#c5a46a;--glow:#f6d7a0;color:#f4edda;background:var(--ink);border:1px solid color-mix(in srgb,var(--trim) 65%,transparent);border-radius:20px;box-shadow:0 24px 90px #0008,inset 0 1px #fff1;overflow:hidden;text-align:left}
 .journal-head{position:relative;display:flex;gap:18px;align-items:center;padding:26px 28px 22px;background:radial-gradient(ellipse at 90% 0,color-mix(in srgb,var(--trim) 16%,transparent),transparent 65%),linear-gradient(135deg,var(--raised),var(--ink));border-bottom:1px solid #ffffff0d}
 .journal-crest{width:72px;height:72px;flex:none;filter:drop-shadow(0 5px 8px #0007)}
 .journal-kicker{font:600 10px/1.4 system-ui;letter-spacing:.24em;color:var(--trim)}
 h2{margin:4px 0 5px;font-size:clamp(21px,3.5vw,30px);font-weight:400;line-height:1.15;color:#fff1d4}
 .journal-head p{font:400 13px/1.5 system-ui;margin:0;color:#bac8c7}
 .journal-edition{margin-left:auto;margin-right:17px;padding-left:12px;align-self:flex-start;text-align:center;font:600 11px/1.8 system-ui;letter-spacing:.13em;color:var(--trim);opacity:.65}
 .journal-tabs{display:flex;gap:5px;background:#0002;padding:10px 22px 0;border-bottom:1px solid color-mix(in srgb,var(--trim) 35%,transparent);position:sticky;top:0;z-index:3;backdrop-filter:blur(16px)}
 button{appearance:none;flex:1;border:0;background:transparent;color:#aebfbe;padding:14px 10px 15px;font:600 14px/1.2 system-ui;cursor:pointer;border-bottom:2px solid transparent;display:flex;justify-content:center;gap:18px;align-items:center;transition:color .15s,background .15s}
 button span{font:500 10px system-ui;opacity:.55}
 button.chosen{color:#fff1d4;border-bottom-color:var(--trim);background:linear-gradient(0deg,color-mix(in srgb,var(--trim) 12%,transparent),transparent)}
 button:hover{color:var(--glow);background:#fff1}button:focus-visible{outline:2px solid var(--glow);outline-offset:-4px;border-radius:4px}
 .journal-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:15px 24px;color:#9eb5b4;font:400 11px system-ui;letter-spacing:.02em;border-bottom:1px solid #fff1}
 .journal-facts span+span{border-left:1px solid #fff1;padding-left:16px}.journal-facts b{display:block;font-size:17px;line-height:1.5;color:#e9d9b5;font-weight:600}
 .info-content{padding:8px 24px 24px}
 @media(max-width:520px){.journal-head{padding:21px 16px;gap:12px}.journal-crest{width:54px;height:54px}.journal-edition{display:none}.journal-head p{font-size:12px}.journal-tabs{padding:5px 10px 0}.journal-facts{padding:12px 16px;gap:4px}.journal-facts span+span{padding-left:10px}.info-content{padding:4px 14px 20px}}
</style>

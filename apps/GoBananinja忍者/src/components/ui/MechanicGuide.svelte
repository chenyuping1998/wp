<script lang="ts">
 import assets from '../../game/assets';
 import config from '../../game/config';
 const rows=config.numRows?.[0]??4;
 let active=$state(false);
 const image=(key:keyof typeof assets)=>(assets[key] as {src?:string}).src??'';
 const match=image('gbL2'), other=image('gbL5'), prop=image('gbM');
 const count=Math.min(2,rows);
 const ways=$derived(count*count*count*(active?2:1));
</script>
<section class="mechanic-guide" aria-labelledby="mechanic-demo-title">
 <div class="demo-top"><div><span>TRY THE MECHANIC</span><h3 id="mechanic-demo-title">One blade. Twice the ways.</h3></div><img src={prop} alt="" /></div>
 <div class="demo-board" aria-hidden="true">
 {#each [0,1,2] as reel}<div class="demo-reel" class:engaged={reel===2&&active}>
 {#each Array(rows) as _,row}<div class="demo-cell" class:matching={row<count} class:split={reel===2&&active}>
 <img src={row<count?match:other} alt="" />{#if reel===2&&active}<img src={row<count?match:other} alt="" />{/if}</div>{/each}
 <b>{reel===2&&active?count*2:count} matching</b></div>{/each}</div>
 <div class="demo-foot"><p aria-live="polite">{count} × {count} × {active?count*2:count} = <b>{ways} ways</b></p><button onclick={()=>active=!active} aria-pressed={active}>{active?'Reset example':'Split reel 3'} <span aria-hidden="true">↗</span></button></div>
 <p class="demo-note">Illustration only. Use the tabs for full rules and symbol values.</p>
</section>
<style>
 .mechanic-guide{margin:20px 24px 12px;border:1px solid color-mix(in srgb,var(--trim) 35%,transparent);border-radius:13px;padding:16px 18px 13px;background:radial-gradient(ellipse at 85% 0,color-mix(in srgb,var(--glow) 7%,transparent),transparent 70%),linear-gradient(120deg,#ffffff04,transparent)}
 .demo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.demo-top span{font:600 9px system-ui;letter-spacing:.2em;color:var(--trim)}.demo-top h3{font-size:17px;margin:5px 0;color:#f5e8ce;font-weight:400}.demo-top img{height:58px;width:58px;object-fit:contain;filter:drop-shadow(0 4px 9px #0008)}
 .demo-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:330px;margin:0 auto 12px}.demo-reel{display:grid;gap:3px;background:#0003;border:1px solid #ffffff12;border-radius:8px;padding:5px;transition:border-color .2s}.demo-reel.engaged{border-color:var(--trim);background:color-mix(in srgb,var(--glow) 7%,transparent)}
 .demo-cell{display:flex;justify-content:center;gap:2px;height:31px;border-radius:3px;background:#ffffff03;overflow:hidden}.demo-cell img{height:31px;width:32px;object-fit:contain;opacity:.3}.demo-cell.matching img{opacity:1}.demo-cell.split img{width:27px;animation:unfold .35s ease-out both}
 .demo-reel b{font:600 11px system-ui;color:var(--trim);text-align:center;padding-top:4px}
 .reaction{display:flex;gap:12px;align-items:center;justify-content:center;margin-bottom:13px}.reaction .demo-reel{width:70px}.reaction .arrow{color:var(--trim);font-size:24px}.reaction .demo-cell img{opacity:1}.reaction .engaged img{animation:unfold .4s ease-out both}.reaction-caption{max-width:150px;font:400 13px/1.5 system-ui;color:#b2c9c2}.reaction-caption b{display:block;color:var(--glow);font-size:17px;margin-bottom:4px}
 .demo-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #ffffff0d;padding-top:12px}.demo-foot p{font:500 13px/1.5 system-ui;margin:0;color:#d8e3d7}.demo-foot p b{color:var(--glow)}
 button{border:1px solid var(--trim);border-radius:6px;padding:10px 13px;background:color-mix(in srgb,var(--trim) 12%,transparent);color:#f9e5c2;font:600 12px system-ui;cursor:pointer;min-height:42px;flex:none;transition:background .15s}button:hover{background:color-mix(in srgb,var(--trim) 24%,transparent)}button:focus-visible{outline:2px solid var(--glow);outline-offset:3px}button span{margin-left:8px}
 .demo-note{font:400 11px/1.5 system-ui;color:#96aaa8;margin:10px 0 0}
 @keyframes unfold{from{transform:scaleX(.15);opacity:.3}to{transform:scaleX(1);opacity:1}}
 @media(max-width:520px){.mechanic-guide{margin:16px 14px 10px;padding:13px}.demo-foot{flex-wrap:wrap}.demo-foot button{width:100%}.demo-cell,.demo-cell img{height:27px}.demo-board{gap:5px}.demo-top h3{font-size:15px}.reaction-caption{font-size:12px}}
 @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>

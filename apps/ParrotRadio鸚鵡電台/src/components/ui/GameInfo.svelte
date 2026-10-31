<script lang="ts">
 import {Popup} from 'components-shared';
 import {zIndex} from 'constants-shared/zIndex';
 import {stateModal,LEGAL_NOTICE} from 'state-shared';
 import {createGameInfo} from '../../game/gameInfo';
 const data=createGameInfo();
 const table=$derived(stateModal.modal?.name==='payTable');
 const visible=$derived(table||stateModal.modal?.name==='gameRules');
 const close=()=>stateModal.modal=null;
</script>
{#if visible}
 <Popup zIndex={zIndex.modal} onclose={close}>
  <article class="game-info" class:parrot={data.kind==='parrot'} role="dialog" aria-modal="true" aria-label={data.title+' '+(table?data.tableLabel:data.rulesLabel)}>
   <header><div><p class="eyebrow">{data.title}</p><h1>{table?data.tableLabel:data.rulesLabel}</h1></div><button class="info-close" aria-label={data.closeLabel} onclick={close}>×</button></header>
   <nav aria-label={data.navLabel}><button class:chosen={!table} onclick={()=>stateModal.modal={name:'gameRules'}}>{data.rulesLabel}</button><button class:chosen={table} onclick={()=>stateModal.modal={name:'payTable'}}>{data.tableLabel}</button></nav>
   <div class="info-body">
    <div class="facts"><div><span>{data.boardLabel}</span><strong>{data.board}</strong></div><div><span>RTP</span><strong>{data.rtp}</strong></div><div><span>{data.maxLabel}</span><strong>10,000×</strong></div></div>
    {#if table}
     <section><h2>{data.matchTitle}</h2><p>{data.matchRule}</p><div class="table-scroll"><table class="symbol-table"><thead><tr><th>{data.symbolLabel}</th>{#each data.tierLabels as tier}<th>{tier}</th>{/each}</tr></thead><tbody>{#each data.symbols as symbol}<tr><th><img src={symbol.src} alt=""/><span>{symbol.label}</span></th>{#each symbol.values as value}<td>{value}×</td>{/each}</tr>{/each}</tbody></table></div><p class="note">{data.multipleNote}</p></section>
     {#each data.specials as item}<section class="special"><img src={item.src} alt=""/><div><h2>{item.title}</h2><p>{item.body}</p></div></section>{/each}
    {:else}
     {#each data.sections as section}<section><h2>{section.title}</h2><p>{section.body}</p></section>{/each}
     <section><h2>{data.modesLabel}</h2><div class="table-scroll"><table><thead><tr><th>{data.modeLabel}</th><th>{data.entryLabel}</th><th>RTP</th><th>{data.maxLabel}</th></tr></thead><tbody>{#each data.modes as mode}<tr><th>{mode.label}</th><td>{mode.entry}×</td><td>{mode.rtp}</td><td>{mode.max}×</td></tr>{/each}</tbody></table></div><p class="note">{data.multipleNote}</p></section>
     <section><h2>{data.controlsLabel}</h2><div class="controls">{#each data.controls as control}<div class="control"><span class="control-mark" aria-hidden="true">{control.mark}</span><div><h3>{control.title}</h3><p>{control.body}</p></div></div>{/each}</div></section>
    {/if}
    <footer>{LEGAL_NOTICE}</footer>
   </div>
  </article>
 </Popup>
{/if}
<style>
 .game-info{display:none;--accent:#9b6f2e;--header:#211b1b;position:relative;z-index:100;width:min(880px,calc(100vw - 36px));max-height:min(800px,88dvh);flex-direction:column;border:1px solid #c4a56b;border-radius:16px;background:#f5f0e6;color:#252b32;box-shadow:0 22px 80px #0008;overflow:hidden;font:15px/1.65 var(--gb-body-font),Arial,sans-serif}
 :global(.top-layer)>.game-info{display:flex}.parrot{--accent:#23798b;--header:#133545}
 :global(.pop-up-wrap:has(.game-info) .close-button-wrap){display:none}
 header{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:22px 28px;background:var(--header);color:#fff7df;border-bottom:1px solid #c4a56b}
 .eyebrow{margin:0 0 2px;color:#d5b478;font:600 12px/1.5 Arial,sans-serif;letter-spacing:.18em}h1{margin:0;font:600 26px/1.3 var(--gb-body-font),Arial,sans-serif}
 .info-close{width:40px;height:40px;flex:none;border:1px solid #d6bd8b66;border-radius:50%;background:#ffffff08;color:#fff7df;font:26px Arial;cursor:pointer}.info-close:hover{background:#ffffff20}
 nav{display:flex;gap:6px;padding:12px 28px 0;border-bottom:1px solid #d9d0bf;background:#eee7da}nav button{padding:9px 22px;border:0;border-bottom:3px solid transparent;background:none;color:#62656a;font:600 14px var(--gb-body-font),Arial;cursor:pointer}nav .chosen{border-bottom-color:var(--accent);color:var(--header)}
 .info-body{overflow-y:auto;overscroll-behavior:contain;padding:24px 28px;scrollbar-width:thin;scrollbar-color:#b9a887 #ede5d5;min-height:0}
 .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 24px}.facts>div{padding:12px 16px;border:1px solid #d9cbb2;border-radius:8px;background:#fffaf2}.facts span{display:block;color:#6a6b6e;font-size:12px}.facts strong{color:var(--header);font:700 21px/1.5 Arial,sans-serif;letter-spacing:.01em}
 section{margin:0 0 24px;padding-bottom:20px;border-bottom:1px solid #ddd3c0}h2{margin:0 0 9px;font-size:18px;line-height:1.4;color:var(--header);padding-left:12px;border-left:3px solid var(--accent)}p{margin:0;color:#404750;overflow-wrap:anywhere}h3{margin:0 0 3px;font-size:14px;color:var(--header)}
 .table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px;margin-top:14px}th,td{padding:12px;text-align:center;border-bottom:1px solid #ddd3c0;font-variant-numeric:tabular-nums}thead th{color:#6d6049;font-size:12px;white-space:nowrap;background:#e9e0cf}tbody th{text-align:left;font-weight:600}.symbol-table th:first-child{width:32%}.symbol-table img{width:56px;height:56px;object-fit:contain;vertical-align:middle;margin-right:12px}.symbol-table td{font-weight:700;color:var(--header);white-space:nowrap}
 .special{display:flex;gap:18px;align-items:center}.special>img{width:72px;height:72px;object-fit:contain;flex:none}.note{font-size:12px;color:#6d6d70;margin-top:12px}.controls{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}.control{display:flex;gap:12px;align-items:flex-start}.control p{font-size:13px;line-height:1.5}.control-mark{width:38px;height:38px;display:grid;place-items:center;flex:none;border:1px solid #c4ac7a;border-radius:50%;background:var(--header);color:#fff0c3;font:20px Arial}footer{font-size:11px;line-height:1.5;color:#767575;margin-top:12px}
 button:focus-visible{outline:3px solid #46a8bf;outline-offset:2px}
 @media(max-width:560px){.game-info{width:calc(100vw - 20px);max-height:92dvh;font-size:14px}header{padding:17px 18px}h1{font-size:22px}nav{padding:8px 14px 0}.info-body{padding:18px 16px}.facts{gap:6px}.facts>div{padding:10px}.facts span{font-size:11px}.facts strong{font-size:18px}.controls{grid-template-columns:1fr}th,td{padding:9px 7px}.symbol-table img{width:42px;height:42px;display:block;margin:0 auto 4px}.symbol-table th:first-child{text-align:center}.symbol-table th span{font-size:11px}.special{gap:10px}.special>img{width:54px;height:54px}}
 @media(max-height:500px){.game-info{max-height:94dvh}header{padding:12px 20px}h1{font-size:20px}.info-body{padding:16px 20px}}
 @media(max-width:360px){.facts>div{padding:9px 8px}.facts strong{font-size:15px}.facts span{font-size:10px}nav button{padding:9px 16px}}
</style>

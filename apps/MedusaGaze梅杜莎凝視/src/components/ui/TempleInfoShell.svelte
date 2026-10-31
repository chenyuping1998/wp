<script lang="ts" module>
 let changedView=false;
</script>
<script lang="ts">
 import {onMount,type Snippet} from 'svelte';
 import {stateModal} from 'state-shared';
 import {zIndex} from 'constants-shared/zIndex';
 import {getContext} from '../../game/context';
 import {socialTerms} from '../../game/socialTerms';
 const props=$props<{view:'rules'|'pays';chapters:{id:string;label:string}[];children:Snippet}>();
 const context=getContext(),T=socialTerms();let panel:HTMLElement;let scroll:HTMLElement;
 const close=()=>{context.eventEmitter.broadcast({type:'soundInterface',cue:'close'});stateModal.modal=null;};
 const switchView=(view:'rules'|'pays')=>{if(view===props.view)return;changedView=true;stateModal.modal={name:view==='rules'?'gameRules':'payTable'};};
 const jump=(id:string)=>{context.eventEmitter.broadcast({type:'soundInterface',cue:'tab'});scroll.querySelector<HTMLElement>(`[data-chapter="${id}"]`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
 function keys(event:KeyboardEvent){
  if(event.key==='Escape'){event.preventDefault();close();}
  if(event.key==='Tab'){
   const buttons=[...panel.querySelectorAll<HTMLElement>('button,a[href],input,[tabindex="0"]')].filter(e=>e.offsetParent!==null);
   const first=buttons[0],last=buttons.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
 }
 onMount(()=>{
  const previous=document.activeElement as HTMLElement|null;
  panel.querySelector<HTMLButtonElement>(changedView?'.temple-tabs .active':'.temple-close')?.focus();
  context.eventEmitter.broadcast({type:'soundInterface',cue:changedView?'tab':'open'});changedView=false;
  return()=>previous?.focus?.();
 });
</script>

<svelte:window onkeydown={keys}/>
<div class="temple-info-overlay" style:z-index={zIndex.modal}>
 <button class="temple-backdrop" aria-label="Close game information" onclick={close}></button>
 <article class="temple-info" role="dialog" aria-modal="true" aria-label="Medusa Gaze game information" tabindex="-1" bind:this={panel}>
  <header class="temple-top">
   <div class="temple-brand"><span class="temple-seal" aria-hidden="true">Ω</span><div><small>THE TEMPLE ARCHIVE</small><strong>MEDUSA GAZE</strong></div></div>
   <button class="temple-close" aria-label="Close information" onclick={close}>×</button>
   <nav class="temple-tabs" aria-label="Information pages">
    <button class:active={props.view==='rules'} aria-current={props.view==='rules'?'page':undefined} onclick={()=>switchView('rules')}>GAME GUIDE</button>
    <button class:active={props.view==='pays'} aria-current={props.view==='pays'?'page':undefined} onclick={()=>switchView('pays')}>{T.payTableTitle}</button>
   </nav>
  </header>
  <nav class="temple-chapters" aria-label="Guide chapters">
   {#each props.chapters as chapter,i(chapter.id)}<button onclick={()=>jump(chapter.id)}><span>{String(i+1).padStart(2,'0')}</span>{chapter.label}</button>{/each}
  </nav>
  <div class="temple-scroll" bind:this={scroll} tabindex="0" aria-label="Information content">{@render props.children()}</div>
  <footer>MEDUSA GAZE <span>◆</span> {props.view==='rules'?'YOUR GUIDE TO THE TEMPLE':T.payTableTitle}</footer>
 </article>
</div>

<style>
 .temple-info-overlay{position:fixed;inset:0;display:grid;place-items:center;padding:22px;box-sizing:border-box;font-family:var(--gb-body-font,sans-serif)}
 .temple-backdrop{position:absolute;inset:0;border:0;background:#061d26d9;backdrop-filter:blur(9px);cursor:default}
 .temple-info{position:relative;display:flex;flex-direction:column;width:min(1000px,100%);max-height:calc(100dvh - 44px);min-height:0;overflow:hidden;background:#f5efdf;color:#153b43;border:2px solid #d1ad62;border-radius:20px;box-shadow:0 0 0 5px #123b43,0 24px 80px #0009;outline:none;animation:temple-in .2s ease-out}
 .temple-top{position:relative;padding:20px 28px 0;background:linear-gradient(120deg,#123e48,#08272f);color:#ffefbf;border-bottom:1px solid #c6a45d}
 .temple-brand{display:flex;align-items:center;gap:12px;padding-right:48px}.temple-brand small{display:block;color:#c8d9ca;font-size:10px;letter-spacing:.22em;margin-bottom:5px}.temple-brand strong{font:400 24px var(--gb-display-font,sans-serif);letter-spacing:.04em}
 .temple-seal{display:grid;place-items:center;flex-shrink:0;width:46px;height:46px;border:1px solid #d1ad62;outline:1px solid #d1ad6255;outline-offset:4px;border-radius:50%;color:#f9d989;font:700 30px Georgia,serif}
 .temple-close{position:absolute;right:18px;top:16px;width:42px;height:42px;border:1px solid #d6bb7d;border-radius:50%;background:#f8efd8;color:#123d44;font:400 32px/1 sans-serif;cursor:pointer}
 .temple-tabs{display:flex;gap:25px;margin-top:18px}.temple-tabs button{padding:12px 0;border:0;border-bottom:3px solid transparent;background:none;color:#b7cbc7;font:700 12px var(--gb-body-font);letter-spacing:.1em;cursor:pointer}.temple-tabs button.active{border-color:#f2cc74;color:#ffe7a5}
 .temple-chapters{display:flex;gap:7px;flex-wrap:wrap;padding:12px 26px;background:#e8e1ce;border-bottom:1px solid #c5b68c}.temple-chapters button{display:flex;align-items:center;gap:6px;padding:7px 11px;background:#faf5e7;border:1px solid #b4b09a;border-radius:6px;color:#173e44;font:700 12px var(--gb-body-font);cursor:pointer}.temple-chapters span{color:#8b641e;font-size:10px}
 button:hover{filter:brightness(1.12)}button:focus-visible{outline:3px solid #d89829;outline-offset:3px}.temple-tabs button:hover{color:#fff1c2}.temple-scroll{min-height:0;overflow:auto;overscroll-behavior:contain;scroll-padding-top:18px;scrollbar-color:#a78b4f #e8e1ce;outline:none}
 footer{padding:10px 24px;display:flex;justify-content:center;gap:14px;color:#64756c;border-top:1px solid #d7c9a7;font-size:9px;font-weight:700;letter-spacing:.15em;background:#eee7d6}footer span{color:#a98a42}
 @keyframes temple-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
 @media(max-width:600px){.temple-info-overlay{padding:10px}.temple-info{max-height:calc(100dvh - 20px);border-radius:13px}.temple-top{padding:18px 18px 0}.temple-brand strong{font-size:20px}.temple-brand small{font-size:8px}.temple-seal{width:36px;height:36px;font-size:25px}.temple-close{right:12px;top:14px;width:38px;height:38px}.temple-chapters{padding:10px 14px;gap:5px}.temple-chapters button{font-size:11px;padding:7px 8px}.temple-tabs{gap:20px;margin-top:12px}footer{font-size:8px;padding:9px}}
 @media(max-height:480px){.temple-info-overlay{padding:8px}.temple-info{max-height:calc(100dvh - 16px)}.temple-top{padding-top:10px}.temple-brand strong{font-size:17px}.temple-brand small,.temple-seal{display:none}.temple-tabs{margin-top:0}.temple-tabs button{padding:8px 0}.temple-close{top:8px;width:34px;height:34px}.temple-chapters{padding:6px 18px}footer{display:none}}
 @media(prefers-reduced-motion:reduce){.temple-info{animation:none}}

 @media(max-width:600px){.temple-close{width:44px;height:44px;top:12px;right:12px}}
 @media(max-width:350px){.temple-brand strong{font-size:17px}.temple-brand small{font-size:7px;letter-spacing:.14em}.temple-seal{width:31px;height:31px;font-size:23px}.temple-brand{gap:10px}.temple-chapters button{font-size:10px;padding:7px 6px}.temple-tabs button{font-size:11px}}
 </style>

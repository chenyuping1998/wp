<script lang="ts">
 import { onMount, type Snippet } from 'svelte';
 const { children, zIndex, onclose }: {children:Snippet;zIndex:number;onclose:()=>void}=$props();
 let dialog:HTMLDivElement;
 let closeButton:HTMLButtonElement;
 onMount(()=>{
  const prior=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';closeButton.focus();
  return ()=>{document.body.style.overflow=overflow;prior?.focus();};
 });
 const keyboard=(event:KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();onclose();return;}
  if(event.key!=='Tab')return;
  const items=Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')).filter(item=>item.offsetParent!==null);
  const first=items[0],last=items.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 };
</script>
<svelte:window onkeydown={keyboard}/>
<div class="pop-up-wrap info-popup" style:z-index={zIndex}>
 <button class="info-veil" aria-label="Close information" tabindex="-1" onclick={onclose}></button>
 <div class="information-dialog" bind:this={dialog} role="dialog" aria-modal="true" aria-labelledby="information-title" tabindex="-1">
  <button class="information-close" bind:this={closeButton} aria-label="Close information" onclick={onclose}>×</button>
  {@render children()}
 </div>
</div>
<style>
 .info-popup{position:fixed;inset:0;display:grid!important;place-items:center;font-family:var(--gb-body-font,system-ui);color:#f5eddb}
 .info-veil{position:absolute;inset:0;width:100%;height:100%;border:0;background:#030c15d9;backdrop-filter:blur(12px);cursor:default}
 .information-dialog{position:relative;z-index:2;max-width:96vw;outline:none}
 .information-close{position:absolute;right:9px;top:9px;z-index:110;display:grid;place-items:center;width:32px;height:32px;border:1px solid #c5a46a80;border-radius:50%;background:#0b202bdd;color:#f6dfb2;font:400 24px/1 system-ui;cursor:pointer}
 .information-close:hover{background:#2e454c}.information-close:focus-visible{outline:2px solid #f5d7a1;outline-offset:2px}
</style>

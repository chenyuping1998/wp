<script lang="ts">
 import { onMount } from 'svelte';
 let root: HTMLDetailsElement;
 let sections = $state<{title:string;target:HTMLElement}[]>([]);
 let expanded = $state(false);
 const jump = (target:HTMLElement) => {
  const scroller = root.closest<HTMLElement>('.info-page');
  if (!scroller) return;
  expanded = false;
  // Closing the index changes layout. Measure after Svelte commits that change.
  requestAnimationFrame(() => {
   if (!target.isConnected) return;
   const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 78;
   scroller.scrollTo({top:Math.max(0,top),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   target.focus({preventScroll:true});
  });
 };
 onMount(() => {
  const content = root.parentElement?.querySelector('.info-content');
  sections = Array.from(content?.querySelectorAll<HTMLElement>('h3')??[]).map(target=>{
   target.tabIndex=-1;
   return {title:target.textContent?.trim()??'',target};
  }).filter(section=>section.title.length>0);
 });
</script>
<details class="section-index" bind:this={root} bind:open={expanded}>
 <summary>Explore the guide <span>{sections.length} sections <b aria-hidden="true">⌄</b></span></summary>
 <nav aria-label="Information sections">
  {#each sections as section, i}<button onclick={()=>jump(section.target)}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{section.title}<b aria-hidden="true">↗</b></button>{/each}
 </nav>
</details>
<style>
 .section-index{margin:14px 24px;border:1px solid #ffffff1a;border-radius:10px;background:#0002;color:#d5e1d8}
 summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;cursor:pointer;font:600 12px/1.5 system-ui;list-style:none}
 summary::-webkit-details-marker{display:none}summary>span{font-weight:400;color:var(--trim);white-space:nowrap}summary b{display:inline-block;margin-left:10px;transition:transform .15s}.section-index[open] summary b{transform:rotate(180deg)}
 nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:0 8px 8px}
 button{display:flex;align-items:center;gap:10px;text-align:left;min-height:44px;padding:9px;border:1px solid transparent;background:#ffffff04;border-radius:6px;color:#e3e7d8;font:500 12px/1.5 system-ui;cursor:pointer}
 button>span{font-size:10px;color:var(--trim);opacity:.7}button>b{margin-left:auto;color:var(--trim);font-weight:400}button:hover{background:#ffffff0c;border-color:#ffffff1a}
 button:focus-visible,summary:focus-visible{outline:2px solid var(--glow);outline-offset:2px;border-radius:6px}
 @media(max-width:520px){.section-index{margin:12px 14px}nav{grid-template-columns:1fr}}
 @media(prefers-reduced-motion:reduce){summary b{transition:none}}
</style>

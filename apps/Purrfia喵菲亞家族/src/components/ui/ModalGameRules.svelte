<script lang="ts">
 import {Popup} from 'components-shared';
 import {zIndex} from 'constants-shared/zIndex';
 import {stateModal,LEGAL_NOTICE} from 'state-shared';
 import {purrfiaText} from '../../game/purrfiaText';
 const sections=[{title:'clusterTitle',body:'cluster'},{title:'boxesTitle',body:'boxes'},{title:'territoryTitle',body:'territory'},{title:'freeTitle',body:'free'},{title:'buyTitle',body:'bonus'},{title:'buyTitle',body:'super'}] as const;
</script>
{#if stateModal.modal?.name==='gameRules'}
 <Popup zIndex={zIndex.dialog} onclose={()=>stateModal.modal=null}>
  <div class="rules"><h1>PURRFIA</h1>
  {#each sections as section}<h2>{purrfiaText(section.title)}</h2><p>{purrfiaText(section.body)}</p>{/each}
  <p>100× / 300×</p><p>{purrfiaText('max')}</p><p>{purrfiaText('controls')}</p><p>{LEGAL_NOTICE}</p></div>
 </Popup>
{/if}
<style>.rules{max-width:820px;max-height:78vh;overflow:auto;padding:24px;color:#f4f1ea;background:#141826;font:16px/1.6 var(--gb-body-font)}h1,h2{color:#f2c14e}h2{font-size:20px;margin-top:24px}</style>


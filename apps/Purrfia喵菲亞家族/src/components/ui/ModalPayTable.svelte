<script lang="ts">
 import {Popup} from 'components-shared';
 import {zIndex} from 'constants-shared/zIndex';
 import {stateModal,stateUrlDerived} from 'state-shared';
 import config from '../../game/config';
 import assets from '../../game/assets';
 import {purrfiaText} from '../../game/purrfiaText';
 const labels:Record<string,[string,string]>={H1:['Goldfish bowl','金魚缸'],H2:['Salmon tin','鮭魚罐頭'],H3:['Yarn ball','毛線球'],H4:['Catnip plant','貓薄荷'],L1:['Spade paw','黑桃貓掌'],L2:['Heart paw','紅心貓掌'],L3:['Diamond paw','方塊貓掌'],L4:['Club paw','梅花貓掌']};
 const tiers=[5,6,9,13];
 const rows=Object.entries(config.symbols).filter(([name])=>name in labels).map(([name,entry])=>({name,src:(assets as Record<string,{src:string}>)['mg'+name].src,pays:tiers.map(n=>Number(((entry.paytable??[]).find(p=>String(n) in p) as Record<string,number>|undefined)?.[String(n)]??0))}));
</script>
{#if stateModal.modal?.name==='payTable'}
 <Popup zIndex={zIndex.dialog} onclose={()=>stateModal.modal=null}>
 <div class="table"><h1>PURRFIA</h1><p>{purrfiaText('cluster')}</p><table><thead><tr><th></th>{#each ['5','6–8','9–12','13+'] as tier}<th>{tier}</th>{/each}</tr></thead><tbody>
 {#each rows as row}<tr><th><img src={row.src} alt=""/><span>{labels[row.name][stateUrlDerived.lang()==='zh'?1:0]}</span></th>{#each row.pays as pay}<td>{pay}×</td>{/each}</tr>{/each}
 </tbody></table><p>{purrfiaText('territory')}</p><p>{purrfiaText('free')}</p><p>{purrfiaText('max')}</p></div>
 </Popup>
{/if}
<style>.table{max-width:850px;max-height:78vh;overflow:auto;padding:20px;color:#f4f1ea;background:#141826;font:15px/1.5 var(--gb-body-font)}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #5b4230;padding:12px;text-align:center}th img{width:52px;vertical-align:middle}th span{display:block;font-size:12px}h1{color:#f2c14e}@media(max-width:480px){th,td{padding:7px;font-size:12px}.table{padding:10px}th img{width:36px}}</style>


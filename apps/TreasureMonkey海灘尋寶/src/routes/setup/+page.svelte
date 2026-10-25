<script lang="ts">
 import { dev } from '$app/environment';
 import { base } from '$app/paths';
 import config from '../../game/config';
 let imageReady = $state(true);
 const prices = Object.values(config.betModes).filter(mode => mode.buyBonus).map(mode => mode.cost);
</script>

<svelte:head><title>Treasure Monkey · 開案預覽</title></svelte:head>

{#if dev}
 <main>
  <header><a class="brand" href={`${base}/setup`}>TREASURE MONKEY <span>海灘尋寶</span></a><span class="status">整合預覽 · 02</span></header>
  <section class="intro"><div><p class="eyebrow">A SUNNY DAY. A NEW DISCOVERY.</p><h1>下一次嗶聲，<br />會挖到什麼？</h1><p class="lead">阿寶叔與小救的海灘尋寶計畫。<br />明亮海岸、俐落裝備，還有藏在沙裡的驚喜。</p></div><aside><span class="small">已確立的遊戲規格</span><div class="facts"><strong>5 × 4<small>盤面</small></strong><strong>14<small>中獎線</small></strong><strong>3<small>免費遊戲等級</small></strong></div><p>整輪擴展 Wild · 多格倍率探測區<br />三階入口 {prices.join(' / ')}×</p></aside></section>
  <section class="sample"><div class="sectionline"><h2>海灘風格提案</h2><span>已依此方向製作獨立素材</span></div>{#if imageReady}<a href={`${base}/preview/style_test_v2.png`} target="_blank" rel="noreferrer"><img src={`${base}/preview/style_test_v2.png`} alt="海灘尋寶風格樣張：五乘四盤面與穿著專業探測工作服的阿寶叔" onerror={() => imageReady = false} /></a>{:else}<div class="pending">風格樣張製作中</div>{/if}<p class="caption">此圖為畫風參考。即時預覽已使用獨立背景、12 個符號與人物分件。</p></section>
  <section class="cards"><article><span class="number">01 / 人物</span><h2>整齊、專業，仍然有趣</h2><p>阿寶叔：短袖工作衫、探測背心、工具腰帶與包頭鞋。小救：完整救生員制服、腰包與鏟子。</p></article><article><span class="number">02 / 演出</span><h2>從沙地揭開驚喜</h2><p>探測器掃過整輪；倍率框化為沙地探測區。每個覆蓋範圍都對齊實際遊戲事件。</p></article><article><span class="number">03 / 音樂音效</span><h2>讓每次發現都有聲音</h2><p>已加入兩首原創合成配樂與 33 個音效；轉輪、探測器、探測區及海浪轉場皆有對應演出。</p></article></section>
  <footer><a class="button" href="/studio">檢視美術、動畫與音效 ↗</a><p>本款素材已接入；正式數學與平台連線仍待驗證。</p><a class="button" href={`${base}/`}>開啟引擎入口 <span>↗</span></a><small>引擎入口需要有效平台連線。</small></footer>
 </main>
{:else}
 <main><h1>Treasure Monkey</h1><a href={`${base}/`}>開啟遊戲</a></main>
{/if}

<style>:global(html){overflow:auto}:global(body){overflow:auto}
 :global(body){margin:0;background:#fff7e5;color:#2a1a12;font-family:'Segoe UI','Microsoft JhengHei',sans-serif}
 :global(*){box-sizing:border-box}main{max-width:1400px;margin:auto;padding:0 5vw 50px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2a1a12;padding:28px 0}.brand{font-weight:900;letter-spacing:.06em;text-decoration:none;color:inherit;font-size:21px}.brand span{font-size:13px;font-weight:500;margin-left:16px;letter-spacing:.1em}.status{border:1px solid #2a1a12;padding:7px 12px;border-radius:30px;font-size:12px}.intro{display:grid;grid-template-columns:1.3fr 1fr;gap:70px;padding:58px 0 46px;align-items:end}.eyebrow,.small,.number{font-size:11px;letter-spacing:.13em;font-weight:700}.eyebrow{color:#237986}h1{font-size:clamp(40px,5vw,68px);line-height:1.16;margin:18px 0;font-weight:850;letter-spacing:-.045em}.lead{font-size:16px;line-height:1.8;color:#6e5546;margin:0}aside{border-top:4px solid #249fa4;padding-top:20px}aside p{font-size:13px;color:#6e5546;line-height:1.9}.facts{display:flex;gap:38px;margin:22px 0}.facts strong{font-size:36px;letter-spacing:-.04em;white-space:nowrap}.facts small{display:block;font-size:11px;font-weight:500;letter-spacing:.05em;margin-top:6px}.sectionline{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.sectionline h2{font-size:17px;margin:0}.sectionline span,.caption{font-size:12px;color:#806452}.sample img{display:block;width:100%;border:2px solid #2a1a12;border-radius:10px}.caption{margin:12px 0}.pending{height:300px;border:2px dashed #a59073;display:grid;place-items:center}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:38px}.cards article{border-top:1px solid #b9a484;padding:22px 0}.number{color:#217f87}.cards h2{font-size:19px;line-height:1.4}.cards p{font-size:14px;line-height:1.9;color:#755a48}footer{margin-top:15px;padding-top:26px;border-top:2px solid #2a1a12;display:flex;align-items:center;gap:20px;flex-wrap:wrap}footer p{font-size:13px;flex:1}footer small{font-size:11px;color:#806452}.button{display:flex;gap:25px;background:#cb4434;color:#fff7e5;border:2px solid #2a1a12;border-radius:6px;padding:13px 20px;text-decoration:none;font-weight:700;font-size:14px}.button:hover{background:#a83327}.button:focus-visible,a:focus-visible{outline:3px solid #249fa4;outline-offset:5px}@media(max-width:700px){main{padding:0 20px 30px}header{padding:20px 0}.brand{font-size:15px}.brand span{display:block;margin:5px 0 0;font-size:11px}.intro{grid-template-columns:1fr;gap:32px;padding:35px 0}.facts{justify-content:space-between}.facts strong{font-size:32px}.cards{grid-template-columns:1fr;gap:0;margin-top:24px}.cards article{padding:18px 0}.sectionline{align-items:start;gap:8px}.sectionline span{max-width:130px;text-align:right;font-size:10px}footer{gap:12px}footer p{flex-basis:100%}h1{font-size:46px}}
</style>




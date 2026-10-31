<script lang="ts">
 import assets from '../../game/assets';
 import config from '../../game/config';
 import {socialTerms} from '../../game/socialTerms';
 const T=socialTerms();
 const stats=[{value:`${config.numReels}×${config.numRows[0]}`,label:'THE BOARD'},{value:'8+',label:'MATCH ANYWHERE'},{value:`${(config.rtp*100).toFixed(2)}%`,label:'RTP'},{value:`${config.betModes.base.max_win.toLocaleString()}×`,label:'MAX WIN'}];
 const steps=[
  {image:assets.mgH1.src,title:'Gather the treasures',text:`8 or more matching symbols anywhere on the board ${T.pay}. They do not need to touch.`},
  {image:assets.mgH2.src,title:'Stone. Shatter. Tumble.',text:'Winning symbols turn to stone and break away. New symbols fall in, and the chain can continue.'},
  {image:assets.mgS.src,title:'Awaken the Aegis',text:`${config.freeSpins.trigger}+ Aegis award ${config.freeSpins.spins} Free Spins, where Medusa’s multiplier total can grow.`},
 ];
</script>
<section class="temple-guide" data-chapter="how">
 <div class="temple-hero" style:background-image={`linear-gradient(90deg,#0b3548f2 0%,#103c46d9 48%,#14383b18 100%),url('${assets.mgBgBase.src}')`}>
  <div class="hero-copy"><small>WELCOME TO MEDUSA'S REALM</small><h2>A gaze worth<br/>remembering.</h2><p>Discover the treasures.<br/>Watch the stone come alive.</p></div>
  <img class="aegis-art" src={assets.mgS.src} alt="The golden Aegis with Medusa's portrait"/>
  <div class="meander" aria-hidden="true"></div>
 </div>
 <ul class="temple-stats">{#each stats as stat(stat.label)}<li><b>{stat.value}</b><span>{stat.label}</span></li>{/each}</ul>
 <div class="guide-intro"><span>QUICK GUIDE</span><h3>Three steps into the temple</h3></div>
 <ol class="temple-steps">{#each steps as step,i(step.title)}<li><div class="step-art"><span>{['I','II','III'][i]}</span><img src={step.image} alt=""/></div><div><h4>{step.title}</h4><p>{step.text}</p></div></li>{/each}</ol>
</section>
<style>
 .temple-guide{margin-bottom:26px}.temple-hero{position:relative;min-height:240px;border:1px solid #ba9a50;border-radius:10px 10px 0 0;overflow:hidden;background-size:cover;background-position:center 40%;color:#fff5dc}
 .hero-copy{position:relative;padding:32px;z-index:1;width:65%;box-sizing:border-box}.hero-copy small{font-size:10px;letter-spacing:.16em;color:#e4c785}.hero-copy h2{font:400 clamp(23px,3.4vw,35px)/1.18 var(--gb-display-font);margin:13px 0;color:#fff0c7;text-align:left}.hero-copy p{font-size:13px;line-height:1.65;margin:0;color:#deece3}
 .aegis-art{position:absolute;right:5%;top:21px;width:205px;height:205px;object-fit:contain;filter:drop-shadow(0 9px 10px #0005);transform:rotate(6deg)}
 .meander{position:absolute;left:0;right:0;bottom:0;height:7px;background:repeating-linear-gradient(90deg,#c9aa5d 0 3px,transparent 3px 14px);border-block:1px solid #c9aa5d;opacity:.8}
 .temple-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0;list-style:none;padding:15px 9px;background:#123b43;border:1px solid #ba9a50;border-top:0;border-radius:0 0 10px 10px}.temple-stats li{text-align:center;padding:3px 6px;min-width:0}.temple-stats li+li{border-left:1px solid #a88b4f77}.temple-stats b{display:block;font:700 clamp(17px,2.5vw,24px) var(--gb-body-font);font-variant-numeric:tabular-nums;color:#ffe39a;white-space:nowrap}.temple-stats span{display:block;font-size:8px;font-weight:700;letter-spacing:.12em;color:#d2e2d7;margin-top:7px}
 .guide-intro{margin:24px 0 13px}.guide-intro span{font-size:10px;letter-spacing:.15em;color:#8c681f;font-weight:800}.guide-intro h3{font:400 20px var(--gb-display-font);margin:7px 0;color:#173e43}
 .temple-steps{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0;padding:0}.temple-steps li{padding:18px 15px;background:#fffaf0;border:1px solid #cec3a4;border-radius:9px;box-shadow:0 3px 0 #d9cfb8}.step-art{position:relative;height:82px;margin-bottom:13px}.step-art img{display:block;width:80px;height:80px;margin:auto;object-fit:contain}.step-art span{position:absolute;top:0;left:0;display:grid;place-items:center;border:1px solid #b99d58;border-radius:50%;width:24px;height:24px;color:#8b641f;font:700 11px Georgia,serif}.temple-steps h4{font-size:14px;margin:0 0 8px;color:#173e43}.temple-steps p{font-size:13px;line-height:1.6;color:#40574f;margin:0}
 @media(max-width:600px){.temple-hero{min-height:205px}.hero-copy{padding:23px 20px;width:72%}.hero-copy small{font-size:8px}.hero-copy h2{font-size:23px}.hero-copy p{font-size:11px}.aegis-art{width:145px;height:145px;top:43px;right:-19px;opacity:.9}.temple-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:13px 0}.temple-stats li:nth-child(3){border-left:0}.temple-stats b{font-size:20px}.temple-steps{grid-template-columns:1fr;gap:10px}.temple-steps li{display:grid;grid-template-columns:65px minmax(0,1fr);align-items:center;gap:15px;padding:15px}.step-art{height:65px;margin:0}.step-art img{width:62px;height:62px}.step-art span{left:-5px;top:-5px;width:20px;height:20px;font-size:9px}.temple-steps h4{margin-bottom:5px}.temple-steps p{font-size:13px}.guide-intro h3{font-size:18px}}

 @media(min-width:601px){.temple-hero{min-height:192px}.hero-copy{padding:22px 30px}.hero-copy h2{font-size:30px;margin:10px 0}.hero-copy p{font-size:12px}.aegis-art{width:170px;height:170px;top:15px}.temple-stats{padding:11px 9px}.temple-stats b{font-size:22px}}
 @media(max-width:350px){.hero-copy{width:78%;padding:22px 16px}.hero-copy h2{font-size:20px;letter-spacing:-.02em}.hero-copy small{font-size:7px}.aegis-art{width:120px;height:120px;right:-18px;top:70px}.temple-stats b{font-size:18px}.temple-stats span{font-size:7px}.guide-intro h3{font-size:16px}}
 </style>

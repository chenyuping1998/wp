// Presentation-only probe of the final production art at portrait sizes.
// This injected event is separate from the complete real-book mock regression.
const {chromium}=require('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const OUT='/Users/stone/stake-engine/dist/sumomonkey-v5-detail/playtest';
(async()=>{
 const browser=await chromium.launch({headless:false,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/?hmdebug=1&rgs_url=stub.local&sessionID=portrait-probe&currency=USD&lang=en');
 await page.waitForFunction(()=>!!window.__SUMO_QA__&&!!window.__PIXI_APP__);
 await page.waitForTimeout(7000);await page.keyboard.press('Space');await page.waitForTimeout(1800);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:width===390?844:568});
  await page.evaluate(()=>{void window.__SUMO_QA__.events.broadcastAsync({type:'banditLevelUp',level:1,levelsGained:1,mult:1,spinsAdded:5})});
  await page.waitForTimeout(650);await page.screenshot({path:OUT+`/v5-portrait-cutin-${width}-guard.png`});
  await page.waitForTimeout(450);await page.screenshot({path:OUT+`/v5-portrait-cutin-${width}-punch.png`});
  await page.waitForTimeout(2800);
 }
 fs.writeFileSync(OUT+'/v5-mobile-cutin.json',JSON.stringify({type:'presentation event injection; no additional bet',errors,sizes:['390x844','320x568']}));
 if(errors.length)throw Error(errors.join('; '));await browser.close();console.log('PASS portrait cut-in guard/punch at390x844 and320x568');
})().catch(e=>{console.error(e);process.exit(1)});

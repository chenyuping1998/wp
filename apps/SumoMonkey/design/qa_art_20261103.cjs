// Actual production renderer + published books; observers live only in dist.
const {chromium}=require('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const path=require('path');
const OUT=path.join(__dirname,'qa/art_20261103');
const URL='http://127.0.0.1:8023/?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en';
(async()=>{
 const browser=await chromium.launch({headless:false,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:810}});
 const errors=[],httpErrors=[],captures=[];let roundEnds=0;
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.text().includes('[stub]')&&m.text().includes('/wallet/end-round'))roundEnds++});
 page.on('response',r=>{if(r.status()>=400)httpErrors.push([r.status(),r.url()])});
 const shot=async(name)=>{await page.screenshot({path:path.join(OUT,name+'.png')});captures.push(name);console.log('capture',name)};
 // Hold the post-preload win sheet to inspect the real loading-screen logo.
 await page.route(/sumoWinPlates\/bananas/,async route=>{
  await new Promise(r=>setTimeout(r,4500));await route.continue();
 });
 await page.goto(URL);
 await page.waitForFunction(()=>!!window.__PIXI_APP__&&!!window.__SUMO_QA__);
 await page.locator('.wp-loader').waitFor({state:'hidden'});await page.waitForTimeout(250);await shot('loading-desktop');
 const visibleTexts=()=>page.evaluate(()=>{const out=[];function w(n,a=1){if(n.visible===false)return;a*=n.alpha??1;if(a<.2)return;if(n.text)out.push(n.text);for(const c of n.children||[])w(c,a)}w(window.__PIXI_APP__.stage);return out});
 await page.waitForFunction(()=>{let yes=false;function w(n,a=1){if(n.visible===false)return;a*=n.alpha??1;if(a<.2)return;if(n.text&&/PRESS.*CONTINUE/i.test(n.text))yes=true;for(const c of n.children||[])w(c,a)}w(window.__PIXI_APP__.stage);return yes});
 await page.waitForTimeout(600);await shot('intro-desktop');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await shot('intro-portrait');
 await page.keyboard.press('Space');await page.waitForTimeout(2500);
 await shot('board-4-portrait');
 await page.setViewportSize({width:1440,height:810});await page.waitForTimeout(500);await shot('board-4-desktop');
 await page.setViewportSize({width:400,height:225});await page.waitForTimeout(500);await shot('board-popout');
 await page.setViewportSize({width:1440,height:810});await page.waitForTimeout(400);
 await page.evaluate(()=>{
  const q=window.__SUMO_QA__;q.pending={};q.show={};
  const sync=q.events.broadcast,async=q.events.broadcastAsync;
  q.events.broadcast=e=>{if(/Show$/.test(e.type))q.show[e.type.slice(0,-4)]=true;if(/Hide$/.test(e.type))q.show[e.type.slice(0,-4)]=false;return sync(e)};
  q.events.broadcastAsync=e=>{q.pending[e.type]=(q.pending[e.type]||0)+1;return async(e).finally(()=>q.pending[e.type]--)};
  const spin=q.derived.enhancedBoard.spin,seen=new Set();
  q.derived.enhancedBoard.spin=async(...args)=>{
   const result=await spin(...args),g=q.state;
   if(g.gameType==='freegame'&&g.rows>=5&&!seen.has(g.rows)){
    seen.add(g.rows);await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;q.gate=null;resolve()};q.gate={rows:g.rows,resume:finish};setTimeout(finish,30000)});
   }return result;
  };
 });
 await page.evaluate(()=>window.__stub.force(window.__STUB_CATALOGUE__.BASE.collect));
 await page.keyboard.press('Space');
 await page.waitForFunction(()=>window.__stub.stats().rounds>=1,{timeout:45000});
 for(let i=0;i<160&&roundEnds<1;i++)await page.waitForTimeout(250);
 if(roundEnds<1)throw Error('Base round did not end');
 await page.waitForTimeout(500);
 // Open the real buy menu via its rendered button position (find scene text).
 const buy=await page.evaluate(()=>{let found;function w(n,a=1){if(n.visible===false)return;a*=n.alpha??1;if(a<.2)return;if(n.text==='BUY BONUS'){const b=n.getBounds();found={x:b.x+b.width/2,y:b.y+b.height/2}}for(const c of n.children||[])w(c,a)}w(window.__PIXI_APP__.stage);return found});
 if(!buy)throw Error('BUY BONUS text not found');
 await page.mouse.click(buy.x,buy.y);await page.waitForTimeout(600);
 await page.evaluate(()=>window.__stub.force(window.__STUB_CATALOGUE__.BONUS.level3));
 console.log('buy modal',await page.locator('body').innerText());
 await page.locator('.menu .buy:not([disabled])').filter({hasText:'100'}).last().click();
 await page.waitForTimeout(300);await page.locator('[data-test="confirm-button"]').last().click();
 const rows=new Set([4]);let ends=0;
 const started=Date.now();
 while(Date.now()-started<360000){
  await page.waitForTimeout(180);
  const s=await page.evaluate(()=>({gate:window.__SUMO_QA__.gate?.rows,stats:window.__stub.stats(),rows:window.__SUMO_QA__.state.rows}));
  rows.add(s.rows);ends=s.stats.rounds;
  if(s.gate){
   await shot(`board-${s.gate}-desktop`);
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(450);await shot(`board-${s.gate}-portrait`);
   await page.setViewportSize({width:1440,height:810});await page.waitForTimeout(300);
   await page.evaluate(()=>window.__SUMO_QA__.gate?.resume());
  }
  const texts=await visibleTexts();
  if(texts.some(t=>/PRESS.*CONTINUE/i.test(t)))await page.keyboard.press('Space');
  if(roundEnds>=2)break;
 }
 const result={roundEnds,errors,httpErrors,rows:[...rows].sort(),captures,stats:await page.evaluate(()=>window.__stub.stats())};
 fs.writeFileSync(path.join(OUT,'runtime.json'),JSON.stringify(result,null,2));
 await browser.close();console.log(JSON.stringify(result));
 if(errors.length||httpErrors.length||roundEnds<2||![5,6,7].every(n=>rows.has(n)))throw Error('art runtime acceptance failed');
})().catch(e=>{console.error(e);process.exit(1)});

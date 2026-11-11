const puppeteer=require('puppeteer-core');
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();await page.setViewport({width:1280,height:720});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const game=process.argv[2]||'TurfWar';
 await page.goto(`http://localhost:4260/${game}/?rgs_url=stub.local&sessionID=local-art-review&currency=USD&lang=en&hmdebug=1&forceBook=11`,{waitUntil:'networkidle0'});
 await new Promise(r=>setTimeout(r,3000));
 console.log('body',await page.evaluate(()=>document.body.innerText.slice(-2500)));console.log('errors',errors);await page.screenshot({path:`/tmp/${game}-intro.png`});
 await page.mouse.click(640,400);await new Promise(r=>setTimeout(r,3500));
 console.log('after intro',await page.evaluate(()=>({text:document.body.innerText.slice(-1200),game:window.__HM_GAME__?.()})));await page.screenshot({path:`/tmp/${game}-base.png`});
 await page.keyboard.press('Space');
 for(let i=0;i<14;i++){await new Promise(r=>setTimeout(r,2000));let state=await page.evaluate(()=>window.__HM_GAME__?.());console.log(i,state);if(state?.gameType==='freegame'){await page.screenshot({path:`/tmp/${game}-fg.png`});break;}}
 await page.evaluate(()=>window.__HM_TURBO__?.(true));
 await page.mouse.click(640,600);
 let returned=false;
 for(let i=0;i<100;i++) {
   await new Promise(r=>setTimeout(r,800));
   const st=await page.evaluate(()=>window.__HM_GAME__?.());
   if(i===3) await page.screenshot({path:`/tmp/${game}-fg-playing.png`});
   const text=await page.evaluate(()=>document.body.innerText);
   if(st?.gameType==='freegame') await page.mouse.click(640,600);
   if(st?.gameType==='basegame') {returned=true;break;}
 }
 await page.screenshot({path:`/tmp/${game}-returned.png`});
 console.log('returned',returned,'final errors',errors);
 await page.setViewport({width:390,height:720});
 await new Promise(r=>setTimeout(r,700));await page.screenshot({path:`/tmp/${game}-portrait.png`});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const GATE=true;
const alpha=JSON.parse(fs.readFileSync('/Users/stone/stake-engine/dist/sumomonkey-polish/playtest/boxing-alpha-bounds.json','utf8'));
const OUT='/Users/stone/stake-engine/dist/sumomonkey-polish/playtest';
(async()=>{
 const browser=await chromium.launch({headless:false,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:900}});let ends=0;const errors=[],badResponses=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});
 page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('CONSOLE ERROR',m.text())}if(m.text().includes('[stub]')){if(m.text().includes('/wallet/end-round'))ends++;console.log(m.text())}});
 page.on('response',r=>{if(r.status()>=400){badResponses.push(r.status()+' '+r.url());console.log('HTTP',r.status(),r.url())}});
 await page.goto('http://127.0.0.1:4197/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en');
 await page.waitForFunction(()=>!!window.__SUMO_QA__&&!!window.__PIXI_APP__);
 await page.evaluate((gate)=>{
  const q=window.__SUMO_QA__;q.pending={};q.show={};
  const sync=q.events.broadcast,async=q.events.broadcastAsync;
  q.events.broadcast=(e)=>{if(/Show$/.test(e.type))q.show[e.type.slice(0,-4)]=true;if(/Hide$/.test(e.type))q.show[e.type.slice(0,-4)]=false;return sync(e)};
  q.events.broadcastAsync=(e)=>{q.pending[e.type]=(q.pending[e.type]||0)+1;return async(e).finally(()=>q.pending[e.type]--)};
  if(gate){const spin=q.derived.enhancedBoard.spin,seen=new Set();q.derived.enhancedBoard.spin=async(...args)=>{const result=await spin(...args);const g=q.state;if(g.gameType==='freegame'&&g.rows>=5&&!seen.has(g.rows)){seen.add(g.rows);await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;q.gate=null;resolve()};q.gate={rows:g.rows,resume:finish};setTimeout(finish,8000)})}return result}}
 },GATE);
 const sampleCast=()=>page.evaluate((alpha)=>{const cast=window.__SUMO_QA__.state.gameType==='freegame'?'fg':'mg',parts=[];let bounds={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity};function walk(n,a=1){if(n.visible===false)return;a*=n.alpha??1;if(a<.1)return;if(String(n.label||'').startsWith('sumo ')){const name=n.label.slice(5),t=n.worldTransform,l=n.localTransform;parts.push({name,world:[t.a,t.b,t.c,t.d,t.tx,t.ty],local:[l.a,l.b,l.c,l.d,l.tx,l.ty]});const bb=alpha[cast]?.[name]?.alphaBounds;if(bb){for(const [x,y] of [[bb[0],bb[1]],[bb[2],bb[1]],[bb[2],bb[3]],[bb[0],bb[3]]]){const wx=t.a*x+t.c*y+t.tx,wy=t.b*x+t.d*y+t.ty;bounds.left=Math.min(bounds.left,wx);bounds.top=Math.min(bounds.top,wy);bounds.right=Math.max(bounds.right,wx);bounds.bottom=Math.max(bounds.bottom,wy)}}}for(const c of n.children||[])walk(c,a)}walk(window.__PIXI_APP__.stage);return{cast,parts,bounds,viewport:{width:innerWidth,height:innerHeight}}},alpha);
 const movement=(a,b)=>({local:a.parts.filter((p,i)=>b.parts[i]&&p.local.some((v,j)=>Math.abs(v-b.parts[i].local[j])>.0001)).map(p=>p.name),world:a.parts.filter((p,i)=>b.parts[i]&&p.world.some((v,j)=>Math.abs(v-b.parts[i].world[j])>.0001)).map(p=>p.name)});
 await page.waitForTimeout(7000);
 const press=await page.evaluate(()=>{let yes=false;function walk(n,alpha=1){if(n.visible===false)return;alpha*=n.alpha??1;if(alpha<.2)return;if(n.text&&/PRESS.*(CONTINUE|ANYWHERE)/i.test(n.text))yes=true;for(const c of n.children||[])walk(c,alpha)}walk(window.__PIXI_APP__.stage);return yes});
 if(press)await page.keyboard.press('Space');await page.waitForTimeout(5000);
 await page.screenshot({path:OUT+'/redissect-final-desktop.png'});const mgA=await sampleCast();await page.waitForTimeout(750);await page.screenshot({path:OUT+'/redissect-final-ambient-second.png'});const mgB=await sampleCast();const mgMotion={before:mgA,after:mgB,moved:movement(mgA,mgB)};console.log('MG MOTION/BOUNDS',JSON.stringify(mgMotion));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1500);await page.screenshot({path:OUT+'/redissect-final-portrait.png'});await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(500);
 await page.evaluate(()=>window.__stub.force(window.__STUB_CATALOGUE__.BASE.collect));await page.mouse.click(1200,800);
 for(let i=0;i<80&&ends<1;i++){await page.waitForTimeout(250);const press=await page.evaluate(()=>{let yes=false;function w(n,a=1){if(n.visible===false)return;a*=n.alpha??1;if(a<.2)return;if(n.text&&/PRESS.*(CONTINUE|ANYWHERE)/i.test(n.text))yes=true;for(const c of n.children||[])w(c,a)}w(window.__PIXI_APP__.stage);return yes});if(press)await page.keyboard.press('Space');}
 console.log('BASE END',ends,await page.evaluate(()=>window.__stub.stats()));
 await page.waitForTimeout(2000);await page.mouse.click(150,417);await page.waitForTimeout(800);console.log('BUY MODAL',await page.locator('body').innerText());await page.evaluate(()=>window.__stub.force(window.__STUB_CATALOGUE__.BONUS.level3));await page.getByRole('button',{name:'BUY 100×',exact:false}).last().click();await page.waitForTimeout(400);await page.locator('[data-test="confirm-button"]').last().click();
 const captured=new Set();const seenRows=new Set([4]),spinsSeen=new Set();let portrait=false,upgrade=false;let viewport='desktop';let fgMotion=null;let rewardCaptured=false;
 for(let i=0;i<1000&&ends<2;i++){
  await page.waitForTimeout(200);
  const s=await page.evaluate(()=>{const q=window.__SUMO_QA__,g=q.state;let press=false;function walk(n,a=1){if(n.visible===false)return;a*=n.alpha??1;if(a<.2)return;if(n.text&&/PRESS.*(CONTINUE|ANYWHERE)/i.test(n.text))press=true;for(const c of n.children||[])walk(c,a)}walk(window.__PIXI_APP__.stage);const blocking=Object.entries(q.pending).some(([k,v])=>v>0&&/winUpdate|freeSpinIntroUpdate|freeSpinOutroCountUp|banditLevelUp|banditCollect|transition/.test(k));return{gateRows:q.gate?.rows??null,rows:g.rows,sourceRows:g.sourceRows,gameType:g.gameType,stopped:g.board.every(r=>r.reelState.motion==='stopped'),expanding:g.boardExpansion.active,blocking,press,levelUp:q.pending.banditLevelUp>0,lit:!!g.winLitCells,fs:q.show.freeSpinCounter,win:q.show.win,status:document.querySelector('.slice-status')?.textContent??''};});
  seenRows.add(s.rows);if(/\+5.*EXTRA SPINS/i.test(s.status))spinsSeen.add(s.status);
  if(s.gateRows){
   await page.screenshot({path:OUT+`/redissect-fg-${s.gateRows}-rows.png`});captured.add(s.gateRows);console.log('REAL STOPPED REVEAL',s.gateRows);
   if(s.gateRows===7){const fgA=await sampleCast();await page.waitForTimeout(750);await page.screenshot({path:OUT+'/redissect-fg7-motion-second.png'});const fgB=await sampleCast();fgMotion={before:fgA,after:fgB,moved:movement(fgA,fgB)};console.log('FG MOTION/BOUNDS',JSON.stringify(fgMotion));await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);await page.screenshot({path:OUT+'/redissect-portrait-fg7.png'});portrait=true;await page.setViewportSize({width:320,height:568});await page.waitForTimeout(400);await page.screenshot({path:OUT+'/polish-portrait-fg7-small.png'});await page.setViewportSize({width:430,height:932});await page.waitForTimeout(400);await page.screenshot({path:OUT+'/polish-portrait-fg7-large.png'});await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(400)}
   await page.evaluate(()=>window.__SUMO_QA__.gate?.resume());
  }
  if(/EXTRA SPINS.*ROWS/.test(s.status)&&!rewardCaptured){rewardCaptured=true;await page.screenshot({path:OUT+'/polish-upgrade-result-desktop.png'});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);await page.screenshot({path:OUT+'/polish-real-upgrade-result-portrait.png'});await page.setViewportSize({width:1440,height:900});}
  if(s.press)await page.keyboard.press('Space');
  if(s.levelUp&&!upgrade){upgrade=true;await page.waitForTimeout(800);await page.screenshot({path:OUT+'/redissect-tier-motion.png'});await page.waitForTimeout(250);await page.screenshot({path:OUT+'/redissect-tier-motion-second.png'});await page.waitForTimeout(250);await page.screenshot({path:OUT+'/redissect-tier-motion-third.png'});}
  if(s.gameType==='freegame'&&s.rows>=5&&s.sourceRows===s.rows&&s.stopped&&!s.expanding&&!s.blocking&&!s.lit&&!s.win&&s.fs){
   if(viewport==='desktop'&&!captured.has(s.rows)){captured.add(s.rows);await page.screenshot({path:OUT+`/redissect-fg-${s.rows}-rows.png`});console.log('CAPTURED',s.rows);}
   if(s.rows===7&&viewport==='desktop'&&!portrait){await page.setViewportSize({width:390,height:844});viewport='portrait';await page.waitForTimeout(500);}
   else if(s.rows===7&&viewport==='portrait'&&!portrait){portrait=true;await page.screenshot({path:OUT+'/redissect-portrait-fg7.png'});await page.setViewportSize({width:1440,height:900});viewport='desktop';}
  }
  if(i%75===0)console.log('BONUS',i,s,'ends',ends);
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{void window.__SUMO_QA__.events.broadcastAsync({type:'banditLevelUp',level:1,levelsGained:1,mult:1,spinsAdded:5})});
 await page.waitForTimeout(2400);await page.screenshot({path:OUT+'/polish-upgrade-result-portrait.png'});
 await page.waitForTimeout(1600);
 const result={ends,errors,badResponses,captured:[...captured],portrait,seenRows:[...seenRows],spinsSeen:[...spinsSeen],mgMotion,fgMotion,stats:await page.evaluate(()=>window.__stub.stats())};fs.writeFileSync(OUT+'/redissect-full-qa.json',JSON.stringify(result,null,2));console.log('FINAL',JSON.stringify(result));
 if(ends!==2||errors.length||badResponses.length||captured.size!==3||spinsSeen.size!==3)throw new Error('Full real-book QA failed');
 await browser.close();
})();

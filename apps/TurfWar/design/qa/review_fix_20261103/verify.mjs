import fs from 'node:fs';import {connect,boot,sleep,saveRecording} from './cdp.mjs';
const c=await connect();const out=new URL('.',import.meta.url).pathname;const variant=process.argv[2]||'after';const w=+(process.argv[3]||390),h=+(process.argv[4]||844);const url=`http://localhost:${variant==='before'?8020:8021}/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`;
const texts=`(()=>{const a=[];function walk(n,v=true,alpha=1){v=v&&n.visible!==false;alpha*=n.alpha??1;if(n.text&&v&&alpha>.05){const b=n.getBounds();a.push({text:n.text,x:b.x,y:b.y,width:b.width,height:b.height})}n.children?.forEach(c=>walk(c,v,alpha))}walk(__PIXI_APP__.stage);return a})()`;
const report={variant,viewport:{w,h},rounds:[],consoleErrors:[],networkErrors:[]};c.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')report.consoleErrors.push(m.params.exceptionDetails);if(m.method==='Network.responseReceived'&&m.params.response.status>=400)report.networkErrors.push({url:m.params.response.url,status:m.params.response.status})});
await c.send('Runtime.enable');await c.send('Network.enable');await boot(c,url,w,h);await c.shot(out+`${variant}-${w}-idle.png`);
await c.ev('__recordStart()');if(process.argv[6]==='turbo'){await c.click(w*.952,h*.898);await sleep(200);if(!await c.ev('__HM_GAME__().isTurbo'))throw Error('Turbo control did not activate')}
for(const id of (process.argv[5]||'64,1,1546,11,29,50').split(',').map(Number)){
 await c.ev(`__stub.force(${id});__HM_TRACE__=[]`);if(process.argv[6]==='turbo')await c.click(w*.824,h*.898);else await c.key();const started=Date.now();let lastClick=0;const prompts=[];let complete=false;
 for(let i=0;i<240;i++){
  await sleep(500);const trace=await c.ev('__HM_TRACE__');
  if(trace.some(t=>t.type==='finalWin'&&t.phase==='exit')){complete=true;break}
  const t=await c.ev(texts);const prompt=t.find(t=>/PRESS ANYWHERE|TAP.*CONTINUE|CLICK.*CONTINUE/i.test(t.text));
  if(prompt&&Date.now()-lastClick>1700){prompts.push(prompt.text);if(prompts.length===1)await c.shot(out+`${variant}-${w}-book${id}-prompt.png`);if(process.argv[6]==='turbo')await c.click(w*.5,h*.55);else await c.key();lastClick=Date.now()}
  if(i===24)await c.shot(out+`${variant}-${w}-book${id}-mid.png`);
 }
 const result=await c.ev(`({game:__HM_GAME__(),trace:__HM_TRACE__,audio:__HM_AUDIO__(),reels:__HM_REELS__(),text:${texts},errors:window.__QA_ERRORS__||[]})`);
 report.rounds.push({id,complete,duration:Date.now()-started,prompts,...result});console.log(variant,w,'book',id,complete,report.rounds.at(-1).duration,result.game);fs.writeFileSync(out+`${variant}-${w}-report.json`,JSON.stringify(report,null,2));
 await c.shot(out+`${variant}-${w}-book${id}-end.png`);if(!complete)break;
}
report.mix=await c.ev('__mixStats');fs.writeFileSync(out+`${variant}-${w}-report.json`,JSON.stringify(report,null,2));await saveRecording(c,out+`${variant}-${w}-gameplay.webm`);c.ws.close();

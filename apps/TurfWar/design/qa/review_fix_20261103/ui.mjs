import fs from 'node:fs';import {connect,boot,sleep,saveRecording} from './cdp.mjs';
const c=await connect(),out=new URL('.',import.meta.url).pathname;
const url='http://localhost:8021/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en';
const report={};const assert=(x,msg)=>{if(!x)throw Error(msg)};
const visibleButtons=`[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&getComputedStyle(b).visibility!=='hidden'&&b.closest('[aria-hidden="true"]')===null)`;
async function button(text){const rect=await c.ev(`(()=>{const b=${visibleButtons}.find(b=>b.innerText.trim()===${JSON.stringify(text)});if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);assert(rect,'button missing: '+text);await c.click(rect.x,rect.y);await sleep(350)}
async function tap(x,y){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(450)}
async function volumes(values){await c.ev(`(()=>{const a=[...document.querySelectorAll('input[type="range"]')].filter(e=>e.getBoundingClientRect().width>0);${JSON.stringify(values)}.forEach((v,i)=>{a[i].value=v;a[i].dispatchEvent(new Event('input',{bubbles:true}))});return a.map(e=>e.value)})()`);await sleep(200)}
await boot(c,url,390,844);await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
await tap(35,720);report.betMenu=await c.ev('document.body.innerText');assert(report.betMenu.includes('BET MENU'),'stake field edge did not open menu');await c.shot(out+'mobile-bet-menu.png');await button('2.00');await button('CONFIRM');
await c.ev('__stub.force(64)');await tap(308,735);await sleep(5000);report.touchSpin=await c.ev('__stub.stats()');assert(report.touchSpin.rounds===1&&report.touchSpin.wagered===2,'touch spin did not use selected $2 stake');
await tap(55,811);await c.shot(out+'mobile-menu.png');await tap(55,662);report.settings=await c.ev('document.body.innerText');console.log('SETTINGS',report.settings);assert(report.settings.includes('MASTER VOLUME'),'settings did not open');await c.shot(out+'mobile-settings.png');
await volumes([100,100,100]);await c.ev('__recordStart()');
await c.ev(`(()=>{__HM_EMIT__({type:'soundReelTensionStart',rate:1.25});for(const name of ['sfx_scatter_stop_3','sfx_multiplier_landing','sfx_winlevel_big','sfx_multiplier_update','sfx_wild_explode'])__HM_EMIT__({type:'soundOnce',name})})()`);await sleep(2400);report.fullVolumeMix=await c.ev('__mixStats');console.log('MIX',report.fullVolumeMix);assert(report.fullVolumeMix.peak<1,'full-volume bus overload');
await volumes([0,100,100]);await sleep(300);await c.ev('__mixStats={peak:0,rmsMax:0,clipped:0,samples:0}');await sleep(500);report.mutedMix=await c.ev('__mixStats');report.mutedAudio=await c.ev('__HM_AUDIO__()');assert(report.mutedMix.peak<.00001,'mute did not silence active sources');
await c.ev('__HM_EMIT__({type:"soundReelTensionStop"})');await volumes([75,75,75]);await button('×');await saveRecording(c,out+'mix-full-volume-and-mute.webm');
for(const [w,h] of [[320,568],[390,844],[1280,720],[640,420]]){
 await boot(c,url,w,h);await c.shot(out+`final-${w}x${h}.png`);const info=await c.ev('({w:innerWidth,h:innerHeight,scrollX:document.documentElement.scrollWidth-innerWidth,scrollY:document.documentElement.scrollHeight-innerHeight,errors:__QA_ERRORS__})');report[`${w}x${h}`]=info;assert(info.scrollX===0&&info.scrollY===0&&info.errors.length===0,'layout overflow/runtime exception');
}
await boot(c,url.replace('currency=USD','currency=XGC')+'&social=true',390,844);await c.shot(out+'social-mobile.png');await tap(35,720);report.socialBetMenu=await c.ev('document.body.innerText');assert(!/\bBET\b/i.test(report.socialBetMenu),'bet wording in social menu');await c.shot(out+'social-amount-menu.png');
fs.writeFileSync(out+'ui-report.json',JSON.stringify(report,null,2));console.log('UI PASS');c.ws.close();

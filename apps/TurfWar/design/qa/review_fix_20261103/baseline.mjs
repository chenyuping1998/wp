import fs from 'node:fs';import {connect,sleep,saveRecording,boot} from './cdp.mjs';
const out=new URL('.',import.meta.url).pathname;const c=await connect();
console.log(await c.ev(`(()=>{const d=__STUB_DATA__.BASE;return {keys:Object.keys(d),sample:Object.keys(d.books).slice(0,5),book:d.books[1]?.events?.map(e=>e.type),big:Object.entries(d.books).filter(([i,b])=>b.events?.some(e=>e.type==='bigScore')).slice(0,3).map(([i,b])=>i)}})()`));
await c.ev('__recordStart()');await c.shot(out+'before-desktop.png');
for(const id of [64,1]){await c.ev(`__stub.force(${id});__HM_TRACE__=[]`);await c.key();await sleep(9000);console.log('round',id,await c.ev('({game:__HM_GAME__(),trace:__HM_TRACE__})'))}
await c.ev(`__HM_EMIT__({type:'bigScorePlay',mult:20,pays:true})`);await sleep(1900);await c.shot(out+'before-bigscore.png');await c.ev(`__HM_EMIT__({type:'bigScoreClear'})`);
await saveRecording(c,out+'before-desktop.webm');fs.writeFileSync(out+'before-audio-events.json',JSON.stringify(await c.ev('__audioEvents'),null,2));
await boot(c,'http://localhost:8020/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en',390,844);await c.shot(out+'before-mobile.png');
c.ws.close();

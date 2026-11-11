import fs from 'node:fs';import {connect,boot,sleep} from './cdp.mjs';const c=await connect();const out=new URL('.',import.meta.url).pathname;
await boot(c,'http://localhost:8021/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en',1280,720);
await c.ev(`__HM_EMIT__({type:'framesClear'});__HM_EMIT__({type:'framesNew',frames:[{reel:1,row:2,size:1,mult:2}]})`);await sleep(650);
const result=[];
for(const [type,mult] of [['framesUpdate',5],['framesDoubled',10]]){
 const data=await c.ev(`new Promise(resolve=>{const before=__HM_AUDIO__().cues.length;const began=performance.now();const audioBefore=__HM_AUDIO__();const samples=[];function text(){let found=[];function walk(n){if(n.text===${JSON.stringify(mult+'x')}&&n.visible!==false)found.push(n.text);n.children?.forEach(walk)}walk(__PIXI_APP__.stage);return found.length>0}let previous=0;const timer=setInterval(()=>{const now=performance.now()-began;const cues=__HM_AUDIO__().cues.slice(before).filter(c=>c.name==='mult_update');samples.push({ms:now,shown:text(),cueCount:cues.length});if(now>620){clearInterval(timer);resolve({type:${JSON.stringify(type)},samples,cues})}},8);__HM_EMIT__({type:${JSON.stringify(type)},frames:[{reel:1,row:2,size:1,mult:${mult}}]})})`);
 const shown=data.samples.find(s=>s.shown),cue=data.samples.find(s=>s.cueCount>0);if(!shown||!cue||Math.abs(shown.ms-cue.ms)>30||cue.ms<120)throw Error('early/late multiplier audio '+JSON.stringify(data));result.push({...data,firstShown:shown.ms,firstCue:cue.ms});
}
fs.writeFileSync(out+'multiplier-sync.json',JSON.stringify(result,null,2));console.log(result.map(r=>({type:r.type,valueAt:r.firstShown,cueAt:r.firstCue})));c.ws.close();

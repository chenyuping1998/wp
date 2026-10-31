// Exercise the actual sound script and presentation director without an RGS bet.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url));
const ts=require('typescript');
const transpile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm,'').replace(/^export\s*\{\s*\};?\s*$/gm,'');
const src=fs.readFileSync(new URL('../src/components/Sound.svelte',import.meta.url),'utf8');
const js=transpile(src.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]);
const param=()=>({value:1,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
const sources=[];let pending=[],defer=false,handlers,mount,clock=0,id=0;
const timers=new Map();
class Node {
 constructor(){this.gain=param();this.playbackRate=param();this.connections=[];}
 connect(n){this.connections.push(n);return n;} disconnect(){}
 start(){sources.push(this);} stop(at){this.stopAt=at;this.stopped=true;this.onended?.();}
}
class AudioContext {
 constructor(){this.currentTime=0;this.state='running';this.destination=new Node();}
 createDynamicsCompressor(){const n=new Node();for(const k of ['threshold','knee','ratio','attack','release'])n[k]=param();return n;}
 createGain(){return new Node();}createBufferSource(){return new Node();}
 decodeAudioData(){const b={sampleRate:48000,length:48000*120,numberOfChannels:2,getChannelData(){return {subarray(start,end){return {start,end};}};}};return defer?new Promise(r=>pending.push(()=>r(b))):Promise.resolve(b);}
 createBuffer(channels,frames,rate){return {numberOfChannels:channels,length:frames,sampleRate:rate,duration:frames/rate,copied:[],copyToChannel(a,ch){this.copied[ch]=a;}};}
 resume(){return Promise.resolve();}close(){return Promise.resolve();}
}
const sandbox={AudioContext,base:'',console,musicLoops:JSON.parse(fs.readFileSync(new URL('../src/game/sampledAudioLoops.json',import.meta.url),'utf8')),
 getContext:()=>({eventEmitter:{subscribeOnMount:h=>handlers=h},stateGame:{scatterCounter:0}}),
 stateBet:{isTurbo:false,activeBetModeKey:'BASE'},HOLD_AND_SPIN_MODE_KEY:'HOLDANDSPIN',
 stateSoundDerived:{volumeMusic:()=>.7,volumeSoundEffect:()=>.8},performance:{now:()=>clock},
 fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}),
 $effect:fn=>fn(),onMount:fn=>mount=fn,waitForTimeout:async()=>{},
 setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:i=>timers.delete(i),setInterval:()=>++id,clearInterval:()=>{}};
vm.createContext(sandbox);vm.runInContext(js+'\nglobalThis.api={load,playCnSfx,playCnLoop,stopCnSfx,playBgm,stopBgm,voices,loops,buffers,CN_SFX_FILES,BGM_FILES};',sandbox);
const a=sandbox.api,flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
const runEnd=()=>{for(const [id,t]of [...timers])if(t.ms===120){timers.delete(id);t.fn();}};
for(const n of ['coin_shimmer','win_rollup_loop','win_rollup_end','btn'])await a.load(a.CN_SFX_FILES[n]);
handlers.soundPressGeneral();await flush();assert([...a.voices].some(v=>v.name==='btn'));
handlers.soundLoop({name:'sfx_bigwin_coinloop'});await flush();assert(a.loops.has('win_rollup_loop'));
const count=sources.length;handlers.soundLoop({name:'sfx_bigwin_coinloop'});await flush();assert.equal(sources.length,count);
const bed=a.loops.get('win_rollup_loop');handlers.soundStop({name:'sfx_bigwin_coinloop'});handlers.soundStop({name:'sfx_bigwin_coinloop'});assert.equal(bed.source.stopAt,.12);runEnd();await flush();
assert.equal([...a.voices].filter(v=>v.name==='win_rollup_end').length,1);
a.buffers.delete(a.CN_SFX_FILES.win_rollup_loop);defer=true;
handlers.soundLoop({name:'sfx_bigwin_coinloop'});await flush();handlers.soundStop({name:'sfx_bigwin_coinloop'});pending.splice(0).forEach(fn=>fn());await flush();assert(!a.loops.has('win_rollup_loop'));runEnd();await flush();defer=false;
for(let i=1;i<=5;i++){
 await a.load(a.CN_SFX_FILES[`reel_stop_${i}`]);handlers.soundOnce({name:`sfx_reel_stop_${i}`});await flush();
 const v=[...a.voices].findLast(v=>v.name===`reel_stop_${i}`);assert(v);assert.equal(v.source.playbackRate.value,1);
}
sandbox.stateBet.isTurbo=true;handlers.soundOnce({name:'sfx_reel_stop_5'});await flush();assert([...a.voices].findLast(v=>v.name==='reel_stop_5').level<=.24);
await a.playBgm('base');const music=[...a.voices].find(v=>v.category==='music');assert(music.source.loop);assert.equal(music.source.buffer.sampleRate,48000);assert.equal(music.source.buffer.length,Math.round(sandbox.musicLoops.bgm_main.frames*48000/44100));
// One-shot cancellation before decode and bounded overlapping effects.
a.buffers.delete(a.CN_SFX_FILES.spin);defer=true;const late=a.playCnSfx('spin');await flush();a.stopCnSfx('spin');pending.splice(0).forEach(fn=>fn());await late;assert(![...a.voices].some(v=>v.name==='spin'));defer=false;
for(let i=0;i<40;i++)a.playCnSfx('btn');await flush();assert([...a.voices].filter(v=>v.category==='effect'&&!v.source.loop).length<=18);
const cleanup=mount();await flush();a.buffers.delete(a.CN_SFX_FILES.win_rollup_loop);defer=true;handlers.soundLoop({name:'sfx_bigwin_coinloop'});await flush();cleanup();const stoppedCount=sources.length;pending.splice(0).forEach(fn=>fn());await flush();runEnd();await flush();assert.equal(sources.length,stoppedCount);assert.equal(a.voices.size,0);
const mathSource=fs.readFileSync(new URL('../src/game/presentationMotion.ts',import.meta.url),'utf8');
const motion=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(mathSource,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022})).toString('base64'));
for(const turbo of [false,true]){
 let prev=1;
 for(let age=0;age<=500;age+=2){const p=motion.reelLook('bouncing',age,turbo,1);assert(p.blur<=prev+1e-9);prev=p.blur;assert(p.landing>=0&&p.landing<=1);}
 assert.equal(motion.reelLook('bouncing',200,turbo,1).blur,0);
 assert.equal(motion.reelLook('spinning',200,turbo,0).blur,1);
 assert.equal(motion.reelLook('stopped',500,turbo,1).blur,0);
}
assert.equal(motion.frameStep(100000,0,false),.05);assert.equal(motion.frameStep(100000,0,true),0);
for(const fps of [30,60,144]){let t=0;for(let i=1;i<=fps;i++)t+=motion.frameStep(i*1000/fps,(i-1)*1000/fps,false);assert(Math.abs(t-1)<1e-8);}
const dir=fs.readFileSync(new URL('../src/components/PresentationDirector.svelte',import.meta.url),'utf8');
let directorMount,directorHandlers,raf=0;const callbacks=new Map();const state={clock:0,energy:0,reels:Array.from({length:5},()=>({blur:0,landing:0,rail:0}))};
const board=Array.from({length:5},()=>({reelState:{motion:'stopped'}}));
const d={...motion,presentation:state,stateBet:{isTurbo:false},document:{hidden:false},performance:{now:()=>0},
 getContext:()=>({stateGame:{board},eventEmitter:{subscribeOnMount:h=>directorHandlers=h}}),onMount:fn=>directorMount=fn,
 requestAnimationFrame:fn=>{callbacks.set(++raf,fn);return raf;},cancelAnimationFrame:id=>callbacks.delete(id)};
vm.createContext(d);vm.runInContext(transpile(dir.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]),d);
const stopDirector=directorMount();const tick=now=>{const [id,fn]=callbacks.entries().next().value;callbacks.delete(id);fn(now);};
board[0].reelState.motion='spinning';for(let i=1;i<=10;i++)tick(i*16);assert(state.reels[0].blur>.9);
board[0].reelState.motion='bouncing';for(let i=11;i<=23;i++)tick(i*16);assert.equal(state.reels[0].blur,0);
directorHandlers.soundFreeGameBell();for(let i=24;i<=30;i++)tick(i*16);assert(state.energy>0);
const before=state.clock;d.document.hidden=true;tick(99999);assert.equal(state.clock,before);stopDirector();assert.equal(callbacks.size,0);assert.equal(state.energy,0);
console.log('PASS: actual audio handlers (UI, five stops, turbo, gapless 48k BGM, rollup dedupe/skip/late decode/unmount, bounded voices); continuous reel blur, FPS-independent clock, hidden-tab pause and director cleanup');

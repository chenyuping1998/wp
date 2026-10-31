<script lang="ts" module>
 export type EmitterEventSound =
 | {type:'soundOnce';name:string;forcePlay?:boolean}|{type:'soundMusic';name:string}|{type:'soundLoop';name:string}
 | {type:'soundStop';name:string}|{type:'soundFade';name:string;from:number;to:number;duration:number}
 | {type:'soundCue';cue:string;rate?:number;priority?:number}|{type:'soundReset'}
 | {type:'soundFreeGameBell'}|{type:'soundBigWinBlast';tier?:1|2|3|4|5}|{type:'soundTumbleHit';chain:number}
 | {type:'soundTransitionBlast'}|{type:'soundEntryReveal'}|{type:'soundReelTensionStart'}|{type:'soundReelTensionStop'}
 | {type:'soundScatterCounterIncrease'}|{type:'soundScatterCounterClear'};
</script>
<script lang="ts">
 import {onMount,onDestroy} from 'svelte';
 import {base} from '$app/paths';
 import {stateSoundDerived} from 'state-shared';
 import {getContext} from '../game/context';
 import {GAME_AUDIO} from '../game/audioManifest';
 const context=getContext();
 const CAT=false;
 const aliases:Record<string,string>={bgm_main:'bgm_base',bgm_freespin:CAT?'bgm_feature':'bgm_feature_l1',
 sfx_btn_general:'sfx_button',sfx_btn_spin:'sfx_spin',sfx_reel_stop_1:'sfx_drop',sfx_reel_stop_2:'sfx_drop',sfx_reel_stop_3:'sfx_drop',sfx_reel_stop_4:'sfx_drop',sfx_reel_stop_5:'sfx_drop',
 sfx_fs_respins:'sfx_fg_plus5',jng_intro_fs:'stinger_fg_intro',sfx_superfreespin:'stinger_fg_intro',sfx_youwon_panel:CAT?'sfx_page_turn':'sfx_ticket',sfx_winlevel_end:'sfx_bigwin_end',sfx_popup:'sfx_button',sfx_transition:'stinger_fg_intro',
 sfx_scatter_1:CAT?'sfx_ring_land':'sfx_mic_land',sfx_scatter_2:CAT?'sfx_ring_land':'sfx_mic_land',sfx_scatter_3:CAT?'sfx_ring_land':'sfx_mic_land',sfx_scatter_4:CAT?'sfx_ring_trigger':'sfx_mic_trigger',sfx_scatter_5:CAT?'sfx_ring_trigger':'sfx_mic_trigger'};
 type Voice={source:AudioBufferSourceNode;gain:GainNode;cue:string;priority:number;loop:boolean};
 let engine:AudioContext|null=null,musicBus:GainNode|null=null,effectBus:GainNode|null=null;
 let disposed=false,generation=0,musicRequest=0,currentMusic='',epoch=0;
 const buffers=new Map<string,Promise<AudioBuffer>>(),voices=new Set<Voice>(),stems:GainNode[]=[];
 const cueName=(name:string)=>aliases[name]??name;
 function init(){
  if(disposed)return null;
  if(!engine){engine=new AudioContext();musicBus=engine.createGain();effectBus=engine.createGain();const limiter=engine.createDynamicsCompressor();limiter.threshold.value=-3;limiter.ratio.value=16;limiter.knee.value=3;limiter.attack.value=.002;limiter.release.value=.1;musicBus.connect(limiter);effectBus.connect(limiter);limiter.connect(engine.destination);volume();}
  void engine.resume();return engine;
 }
 function volume(){if(engine&&musicBus&&effectBus){musicBus.gain.setTargetAtTime(stateSoundDerived.volumeMusic(),engine.currentTime,.03);effectBus.gain.setTargetAtTime(stateSoundDerived.volumeSoundEffect(),engine.currentTime,.03);}}
 function load(name:string){const cue=cueName(name);const ac=init();if(!ac||!GAME_AUDIO[cue])return null;
  if(!buffers.has(cue))buffers.set(cue,fetch(`${base}/assets/audio/parrot/${GAME_AUDIO[cue]}`).then(r=>{if(!r.ok)throw Error(`Audio ${cue}: ${r.status}`);return r.arrayBuffer();}).then(b=>ac.decodeAudioData(b)));
  return buffers.get(cue)!;
 }
 function stop(v:Voice,seconds=.15){if(!engine)return;v.gain.gain.cancelScheduledValues(engine.currentTime);v.gain.gain.setTargetAtTime(0,engine.currentTime,seconds/4);try{v.source.stop(engine.currentTime+seconds);}catch{}voices.delete(v);}
 function reset(){generation++;for(const v of voices)if(!v.loop||v.priority>0)stop(v);}
 async function play(name:string,rate=1,priority=3,loop=false){
  const cue=cueName(name),pending=load(cue),run=generation;if(!pending)return;
  if(loop&&[...voices].some(v=>v.cue===cue&&v.loop))return;
  try{const buffer=await pending;if(disposed||!engine||!effectBus||run!==generation)return;
   const existing=[...voices].filter(v=>!v.loop);
   if(existing.length>=12){const oldest=existing.find(v=>v.priority>=priority);if(oldest)stop(oldest,.03);else return;}
   if(priority===2)for(const v of existing)if(v.priority===2&&v.cue.startsWith('vo_')===cue.startsWith('vo_'))stop(v,.04);
   const source=engine.createBufferSource(),gain=engine.createGain();source.buffer=buffer;source.playbackRate.value=rate;source.loop=loop;source.connect(gain);gain.connect(effectBus);
   const voice={source,gain,cue,priority,loop};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();};source.start();
   if((priority<=2||cue.includes('hold'))&&musicBus){const now=engine.currentTime;musicBus.gain.cancelScheduledValues(now);musicBus.gain.setTargetAtTime(stateSoundDerived.volumeMusic()*(priority===1?.25:.5),now,.025);musicBus.gain.setTargetAtTime(stateSoundDerived.volumeMusic(),now+Math.min(buffer.duration,2),.1);}
  }catch(error){console.warn('[audio]',cue,error);}
 }
 async function music(feature:boolean){
  const key=feature?'feature':'base';if(currentMusic===key)return;currentMusic=key;const request=++musicRequest;
  for(const v of voices)if(v.loop)stop(v,.3);stems.length=0;
  const names=feature?(CAT?['bgm_feature']:['bgm_feature_l1','bgm_feature_l2','bgm_feature_l3','bgm_feature_l4']):['bgm_base'];
  try{const data=await Promise.all(names.map(n=>load(n)));if(disposed||request!==musicRequest||!engine||!musicBus)return;epoch=engine.currentTime+.05;
   data.forEach((buffer,i)=>{if(!buffer||!engine||!musicBus)return;const source=engine.createBufferSource(),gain=engine.createGain();source.buffer=buffer;source.loop=true;source.loopEnd=buffer.duration;source.connect(gain);gain.connect(musicBus);const target=i===0?1:0;gain.gain.setValueAtTime(target,epoch);stems.push(gain);const voice={source,gain,cue:names[i],priority:0,loop:true};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();};source.start(epoch);});tier(true);
  }catch(error){console.warn('[music]',error);}
 }
 function tier(immediate=false){if(CAT||!engine||currentMusic!=='feature'||!stems.length)return;const value=context.stateGame.volume;const thresholds=[1,5,9,15];const levels=[1,.58,.48,.35];const bar=240/124;const at=immediate?epoch:epoch+Math.ceil(Math.max(0,engine.currentTime-epoch)/bar)*bar;
  stems.forEach((gain,i)=>{gain.gain.cancelScheduledValues(at);gain.gain.setTargetAtTime(value>=thresholds[i]?levels[i]:0,at,.12);});
 }
 onMount(()=>{init();void music(context.stateGame.gameType==='freegame');const visibility=()=>{if(document.hidden)void engine?.suspend();else void engine?.resume();};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);});
 $effect(()=>{stateSoundDerived.volumeMusic();stateSoundDerived.volumeSoundEffect();volume();});
 $effect(()=>{const feature=context.stateGame.gameType==='freegame';if(engine)void music(feature);});
 $effect(()=>{context.stateGame.volume;tier();});
 context.eventEmitter.subscribeOnMount({
  soundPressGeneral:()=>{void play('sfx_button');},soundPressBet:()=>{void play('sfx_spin');},soundBetMode:()=>{void play('sfx_buybonus_confirm',1,2);},
  soundCue:e=>{void play(e.cue,e.rate??1,e.priority??3);},soundReset:reset,
  soundOnce:e=>{void play(e.name);},soundLoop:e=>{void play(e.name,1,3,true);},
  soundMusic:e=>{void music(e.name.includes('free')||e.name.includes('feature'));},
  soundStop:e=>{for(const v of voices)if(v.cue===cueName(e.name))stop(v);},
  soundFade:e=>{for(const v of voices)if(v.cue===cueName(e.name)&&engine)v.gain.gain.setTargetAtTime(e.to,engine.currentTime,e.duration/4000);},
  soundTumbleHit:e=>{void play(`${CAT?'sfx_cluster':'sfx_win'}_${Math.min(6,Math.max(1,e.chain))}`);},
  soundFreeGameBell:()=>{void play(CAT?'sfx_ring_trigger':'sfx_mic_trigger',1,2);},
  soundBigWinBlast:e=>{void play(`sfx_bigwin_${e.tier??1}`,1,1);},
  soundTransitionBlast:()=>{void play('stinger_fg_intro',1,1);},soundEntryReveal:()=>{},
  soundReelTensionStart:()=>{void play(CAT?'sfx_ring_tease':'sfx_mic_tease',1,3,true);},
  soundReelTensionStop:()=>{for(const v of voices)if(v.cue.endsWith('_tease'))stop(v);},
  soundScatterCounterIncrease:()=>context.stateGame.scatterCounter++,soundScatterCounterClear:()=>context.stateGame.scatterCounter=0,
 });
 onDestroy(()=>{disposed=true;musicRequest++;generation++;for(const v of voices)stop(v,.01);void engine?.close();buffers.clear();});
</script>

from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
report=json.loads((ROOT/'design/source/mummy_audio/audio_report.json').read_text())
names=[x['name'] for x in report if not x['name'].startswith('bgm_')]
mapping='\n'.join(f"\t\t{x['name']}: 'mummy/{x['file']}'," for x in report if x['name'] in names)
header=(ROOT/'src/components/Sound.svelte').read_text(encoding='utf-8').split('<script lang="ts">')[0]
header=header.replace("'roar' | 'effort'","'roar' | 'effort' | 'wave' | 'cheer' | 'laugh' | 'disappoint'")
header=header.replace("| 'bandageSweep';","| 'bandageSweep'\n\t\t| 'scarabWait' | 'scarabWaitStop' | 'sunWait' | 'sunWaitStop' | 'sunScoreStop';")
body=r'''
<script lang="ts">
 import { onMount } from 'svelte';
 import { base } from '$app/paths';
 import { stateBet, stateSoundDerived } from 'state-shared';
 import { getContext } from '../game/context';
 const context=getContext();
 type CnSfxName = __TYPE__;
 const CN_SFX_FILES: Record<CnSfxName, string> = {
__MAP__
 };
 const spriteMap: Partial<Record<SoundEffectName,CnSfxName>> = {
  sfx_btn_general:'btn',sfx_btn_spin:'spin',
  sfx_reel_stop_1:'reel_stop_1',sfx_reel_stop_2:'reel_stop_2',sfx_reel_stop_3:'reel_stop_3',sfx_reel_stop_4:'reel_stop_4',sfx_reel_stop_5:'reel_stop_5',
  sfx_scatter_stop_1:'scatter_1',sfx_scatter_stop_2:'scatter_2',sfx_scatter_stop_3:'scatter_3',sfx_scatter_stop_4:'scatter_4',sfx_scatter_stop_5:'scatter_5',
  sfx_multiplier_landing:'cat_land',sfx_winlevel_small:'win_small',sfx_scatter_win:'win_small',sfx_scatter_win_v2:'win_medium',sfx_superfreespin:'win_medium',
  sfx_youwon_panel:'win_panel',sfx_winlevel_end:'win_cap',jng_intro_fs:'fg_intro',
  sfx_wild_explode:'coin_land',sfx_multiplier_update:'coin_reset',sfx_anticipation_start:'btn',sfx_symbols_landing:'coin_land',sfx_royals_landing:'reel_stop_1',
 };
 type Playing={src:AudioBufferSourceNode;gain:GainNode};
 let ctx:AudioContext|null=null,master:GainNode|null=null,sfxBus:GainNode|null=null,musicBus:GainNode|null=null;
 const buffers=new Map<string,Promise<AudioBuffer>>();
 const loops=new Map<CnSfxName,Playing>(),epochs=new Map<string,number>();
 const voices=new Set<Playing>();const scoped=new Set<Playing>();
 let alive=true,rollup=false,duck=$state(1),music:'base'|'freespin'|null=null,musicNode:Playing|null=null,musicEpoch=0;
 function engine(){
  if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.gain.value=.82;
   const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=2;compressor.attack.value=.012;compressor.release.value=.18;
   sfxBus=ctx.createGain();musicBus=ctx.createGain();sfxBus.connect(master);musicBus.connect(master);master.connect(compressor).connect(ctx.destination);
   sfxBus.gain.value=stateSoundDerived.volumeSoundEffect();musicBus.gain.value=stateSoundDerived.volumeMusic()*duck;
  }
  if(ctx.state==='suspended')void ctx.resume();return ctx;
 }
 async function buffer(file:string){const c=engine();if(!buffers.has(file))buffers.set(file,fetch(`${base}/assets/audio/${file}`).then(r=>{if(!r.ok)throw new Error(file);return r.arrayBuffer();}).then(b=>c.decodeAudioData(b)));return buffers.get(file)!;}
 function fade(node:Playing,seconds=.12){if(!ctx)return;const t=ctx.currentTime;node.gain.gain.cancelScheduledValues(t);node.gain.gain.setValueAtTime(Math.max(.0001,node.gain.gain.value),t);node.gain.gain.exponentialRampToValueAtTime(.0001,t+seconds);try{node.src.stop(t+seconds+.01);}catch{ /* already ended */ }}
 function make(b:AudioBuffer,bus:GainNode,gain:number,loop=false,rate=1){const c=engine(),src=c.createBufferSource(),g=c.createGain();src.buffer=b;src.loop=loop;src.playbackRate.value=rate;g.gain.value=gain;src.connect(g).connect(bus);const node={src,gain:g};voices.add(node);src.onended=()=>{voices.delete(node);scoped.delete(node);src.disconnect();g.disconnect();};src.start();return node;}
 const spinScoped=(n:string)=>/^(win_|coin_|scarab_mult|cat_laugh|hs_tally)/.test(n);
 async function playCnSfx(name:CnSfxName,gain=1,rate=1){const stamp=epochs.get('spin')??0;try{const b=await buffer(CN_SFX_FILES[name]);if(!alive||(spinScoped(name)&&stamp!==(epochs.get('spin')??0)))return;const n=make(b,sfxBus!,gain,false,rate);if(spinScoped(name))scoped.add(n);}catch(e){console.warn('Mummy sound unavailable',name,e);}}
 async function playCnLoop(name:CnSfxName,gain=1){if(loops.has(name))return;const stamp=(epochs.get(name)??0)+1;epochs.set(name,stamp);try{const b=await buffer(CN_SFX_FILES[name]);if(!alive||epochs.get(name)!==stamp||loops.has(name))return;const n=make(b,sfxBus!,gain,true);n.gain.gain.setValueAtTime(.0001,ctx!.currentTime);n.gain.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),ctx!.currentTime+.08);loops.set(name,n);}catch(e){console.warn('Mummy loop unavailable',name,e);}}
 function stopCnLoop(name:CnSfxName,seconds=.12){epochs.set(name,(epochs.get(name)??0)+1);const n=loops.get(name);if(n){loops.delete(name);fade(n,seconds);}}
 function endRollup(){if(!rollup)return;rollup=false;stopCnLoop('win_rollup_loop');void playCnSfx('win_rollup_end',.65);}
 function spin(){epochs.set('spin',(epochs.get('spin')??0)+1);for(const n of scoped)fade(n,.07);scoped.clear();endRollup();void playCnSfx('spin',.85);}
 async function playBgm(which:'base'|'freespin'){
  if(music===which)return;music=which;const stamp=++musicEpoch;
  try{const b=await buffer(`mummy/${which==='base'?'bgm_main':'bgm_freespin'}.ogg`);if(!alive||stamp!==musicEpoch)return;
   if(musicNode)fade(musicNode,.45);const n=make(b,musicBus!,1,true);n.gain.gain.setValueAtTime(.0001,ctx!.currentTime);n.gain.gain.linearRampToValueAtTime(1,ctx!.currentTime+.45);musicNode=n;
  }catch(e){console.warn('Mummy music unavailable',e);music=null;}
 }
 function stopBgm(){musicEpoch++;music=null;if(musicNode)fade(musicNode,.15);musicNode=null;}
 $effect(()=>{const vol=stateSoundDerived.volumeMusic()*duck;if(ctx&&musicBus)musicBus.gain.setTargetAtTime(vol,ctx.currentTime,.1);});
 $effect(()=>{const vol=stateSoundDerived.volumeSoundEffect();if(ctx&&sfxBus)sfxBus.gain.setTargetAtTime(vol,ctx.currentTime,.025);});
 let lastScarabTick=0,lastSunTick=0;
 const voiceMap:Record<MascotVoice,CnSfxName>={roar:'cat_cheer',effort:'cat_wave',wave:'cat_wave',cheer:'cat_cheer',laugh:'cat_laugh',disappoint:'cat_disappoint'};
 context.eventEmitter.subscribeOnMount({
  soundPressGeneral:()=>void playCnSfx('btn',.5),soundPressBet:spin,
  soundBetMode:({betModeKey})=>void playBgm(betModeKey==='HOLDANDSPIN'?'freespin':'base'),
  soundMusic:({name})=>{if(name==='bgm_main')void playBgm('base');else if(name==='bgm_freespin')void playBgm('freespin');},
  soundOnce:({name})=>{if(name==='sfx_btn_spin'){spin();return;}const n=spriteMap[name];if(n)void playCnSfx(n);},
  soundLoop:({name})=>{if(name==='sfx_bigwin_coinloop'&&!rollup){rollup=true;void playCnSfx('coin_shimmer',.4);void playCnLoop('win_rollup_loop',.55);}},
  soundStop:({name})=>{if(name==='sfx_bigwin_coinloop')endRollup();else if(name==='sfx_anticipation')stopCnLoop('reel_tension');else if(name==='bgm_main'||name==='bgm_freespin')stopBgm();},
  soundFade:({name})=>{if(name==='sfx_anticipation')stopCnLoop('reel_tension');},
  soundScatterCounterIncrease:()=>context.stateGame.scatterCounter++,soundScatterCounterClear:()=>context.stateGame.scatterCounter=0,
  soundFreeGameBell:()=>void playCnSfx('fg_trigger'),soundBigWinBlast:()=>void playCnSfx('bigwin_hit',.9),
  soundWinTier:({tier})=>{const names:Record<string,CnSfxName>={big:'win_big',superwin:'win_super',mega:'win_mega',epic:'win_epic',max:'win_max'};if(names[tier])void playCnSfx(names[tier],.8);},
  soundMascotVoice:({name})=>void playCnSfx(voiceMap[name],.65),
  soundReelTensionStart:()=>void playCnLoop('reel_tension',.48),soundReelTensionStop:()=>stopCnLoop('reel_tension'),
  soundMusicDuck:({on})=>{duck=on?.3:1;if(ctx&&musicBus)musicBus.gain.setTargetAtTime(stateSoundDerived.volumeMusic()*duck,ctx.currentTime,on?.1:.2);},
  soundWheel:({cue,level,n})=>{
   const now=performance.now();if(cue==='scarabTick'){if(now-lastScarabTick<25)return;lastScarabTick=now;}if(cue==='sunTick'){if(now-lastSunTick<25)return;lastSunTick=now;}
   switch(cue){
    case 'scarabWait':void playCnLoop('scarab_button_idle',.35);break;
    case 'scarabWaitStop':stopCnLoop('scarab_button_idle',.08);break;
    case 'sunWait':void playCnLoop('sun_wait_loop',.6);break;
    case 'sunWaitStop':stopCnLoop('sun_wait_loop',.15);break;
    case 'sunScore':void playCnLoop('sun_score_loop',.5);break;
    case 'sunScoreStop':stopCnLoop('sun_score_loop');break;
    case 'scarabRise':void playCnSfx('scarab_rise',.6);break;
    case 'scarabPress':void playCnSfx('scarab_press',.75);break;
    case 'scarabTick':void playCnSfx('scarab_tick',.27);break;
    case 'scarabStop':void playCnSfx('scarab_stop',.8);break;
    case 'scarabFly':void playCnSfx('scarab_fly',.5);break;
    case 'scarabSink':void playCnSfx('scarab_sink',.4);break;
    case 'scarabMult':void playCnSfx(`scarab_mult_${Math.min(3,Math.max(1,level??1))}` as CnSfxName,.8);break;
    case 'sunShow':void playCnSfx('sun_show',.85);void playCnSfx('voice_sun_start',.5);break;
    case 'sunCount':void playCnSfx('sun_count',.55,1+.0625*Math.max(0,5-(n??5)));break;
    case 'sunStart':void playCnSfx('sun_start',.75);break;
    case 'sunTick':void playCnSfx('sun_tick',.24);break;
    case 'sunStop':void playCnSfx('sun_stop',.85);break;
    case 'sunLevelUp':void playCnSfx('sun_levelup',.8,2**(Math.min(3,Math.max(1,(level??2)-1))*2/12));void playCnSfx(`voice_levelup_${Math.min(3,Math.max(1,(level??2)-1))}` as CnSfxName,.6);break;
    case 'sunWin':void playCnSfx(`sun_win_${Math.min(4,Math.max(1,level??1))}` as CnSfxName,.85);break;
    case 'bandageSweep':void playCnSfx('bandage_sweep',.85);break;
    case 'lineDraw':void playCnSfx('line_draw',.3);break;
   }
  },
 });
 onMount(()=>{
  alive=true;engine();const unlock=()=>{void ctx?.resume();};window.addEventListener('pointerdown',unlock,{once:true});
  for(const f of Object.values(CN_SFX_FILES))void buffer(f).catch(()=>{});
  void playBgm(stateBet.activeBetModeKey==='HOLDANDSPIN'?'freespin':'base');
  return()=>{alive=false;musicEpoch++;window.removeEventListener('pointerdown',unlock);for(const key of Object.keys(CN_SFX_FILES))epochs.set(key,(epochs.get(key)??0)+1);for(const n of voices){try{n.src.stop();}catch{}}void ctx?.close();ctx=null;};
 });
</script>
'''
body=body.replace('__TYPE__',' | '.join(repr(x) for x in names)).replace('__MAP__',mapping)
(ROOT/'src/components/Sound.svelte').write_text(header+body,encoding='utf-8')
print('Installed',len(names),'sample-based cues')

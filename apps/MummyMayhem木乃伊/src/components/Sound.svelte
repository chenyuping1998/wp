<script lang="ts" module>
	import type { MusicName, SoundEffectName, SoundName } from '../game/sound';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	// Distinct licensed cat recordings and paw foley; sources in mummy_audio/LICENSES.json.
	export type MascotVoice = 'roar' | 'effort' | 'wave' | 'cheer' | 'laugh' | 'disappoint' | 'land';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundWinTier'; tier: string }
		| { type: 'soundMascotVoice'; name: MascotVoice }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' }
		| { type: 'soundWheel'; cue: WheelCue; level?: number; n?: number }
		| { type: 'soundMusicDuck'; on: boolean }
		| { type: 'soundHold'; cue: 'land' | 'reset' | 'tally' };

	// Dedicated wheel cues and their loop lifecycles.
	export type WheelCue =
		| 'scarabRise'
		| 'scarabPress'
		| 'scarabTick'
		| 'scarabStop'
		| 'scarabFly'
		| 'scarabMult'
		| 'scarabSink'
		| 'sunShow'
		| 'sunCount'
		| 'sunStart'
		| 'sunTick'
		| 'sunStop'
		| 'sunLevelUp'
		| 'sunWin'
		| 'sunScore'
		| 'lineDraw'
		| 'bandageSweep'
		| 'scarabWait' | 'scarabWaitStop' | 'sunWait' | 'sunWaitStop' | 'sunScoreStop';
</script>


<script lang="ts">
 import { onMount } from 'svelte';
 import { base } from '$app/paths';
 import { stateBet, stateSoundDerived } from 'state-shared';
 import { getContext } from '../game/context';
 const context=getContext();
 type CnSfxName = 'btn' | 'spin' | 'reel_stop_1' | 'reel_stop_2' | 'reel_stop_3' | 'reel_stop_4' | 'reel_stop_5' | 'scatter_1' | 'scatter_2' | 'scatter_3' | 'scatter_4' | 'scatter_5' | 'win_small' | 'win_medium' | 'line_draw' | 'cat_land' | 'scarab_rise' | 'scarab_press' | 'scarab_tick' | 'scarab_stop' | 'scarab_fly' | 'scarab_sink' | 'sun_tick' | 'sun_count' | 'sun_stop' | 'coin_land' | 'bandage_pop' | 'scarab_mult_1' | 'scarab_mult_2' | 'scarab_mult_3' | 'sun_win_1' | 'sun_win_2' | 'sun_win_3' | 'sun_win_4' | 'bigwin_hit' | 'win_big' | 'win_super' | 'win_mega' | 'win_epic' | 'win_max' | 'win_panel' | 'win_cap' | 'fg_trigger' | 'fg_intro' | 'coin_reset' | 'hs_tally' | 'win_rollup_end' | 'scarab_button_idle' | 'reel_tension' | 'sun_wait_loop' | 'sun_score_loop' | 'win_rollup_loop' | 'cat_wave' | 'cat_laugh' | 'cat_cheer' | 'cat_disappoint' | 'voice_sun_start' | 'voice_levelup_1' | 'voice_levelup_2' | 'voice_levelup_3' | 'bandage_sweep' | 'tomb_rumble' | 'sun_show' | 'sun_start' | 'sun_levelup' | 'coin_shimmer';
 const CN_SFX_FILES: Record<CnSfxName, string> = {
		btn: 'mummy/btn.wav',
		spin: 'mummy/spin.wav',
		reel_stop_1: 'mummy/reel_stop_1.wav',
		reel_stop_2: 'mummy/reel_stop_2.wav',
		reel_stop_3: 'mummy/reel_stop_3.wav',
		reel_stop_4: 'mummy/reel_stop_4.wav',
		reel_stop_5: 'mummy/reel_stop_5.wav',
		scatter_1: 'mummy/scatter_1.wav',
		scatter_2: 'mummy/scatter_2.wav',
		scatter_3: 'mummy/scatter_3.wav',
		scatter_4: 'mummy/scatter_4.wav',
		scatter_5: 'mummy/scatter_5.wav',
		win_small: 'mummy/win_small.wav',
		win_medium: 'mummy/win_medium.ogg',
		line_draw: 'mummy/line_draw.wav',
		cat_land: 'mummy/cat_land.wav',
		scarab_rise: 'mummy/scarab_rise.wav',
		scarab_press: 'mummy/scarab_press.wav',
		scarab_tick: 'mummy/scarab_tick.wav',
		scarab_stop: 'mummy/scarab_stop.wav',
		scarab_fly: 'mummy/scarab_fly.wav',
		scarab_sink: 'mummy/scarab_sink.wav',
		sun_tick: 'mummy/sun_tick.wav',
		sun_count: 'mummy/sun_count.wav',
		sun_stop: 'mummy/sun_stop.wav',
		coin_land: 'mummy/coin_land.wav',
		bandage_pop: 'mummy/bandage_pop.wav',
		scarab_mult_1: 'mummy/scarab_mult_1.wav',
		scarab_mult_2: 'mummy/scarab_mult_2.wav',
		scarab_mult_3: 'mummy/scarab_mult_3.wav',
		sun_win_1: 'mummy/sun_win_1.ogg',
		sun_win_2: 'mummy/sun_win_2.ogg',
		sun_win_3: 'mummy/sun_win_3.ogg',
		sun_win_4: 'mummy/sun_win_4.ogg',
		bigwin_hit: 'mummy/bigwin_hit.ogg',
		win_big: 'mummy/win_big.ogg',
		win_super: 'mummy/win_super.ogg',
		win_mega: 'mummy/win_mega.ogg',
		win_epic: 'mummy/win_epic.ogg',
		win_max: 'mummy/win_max.ogg',
		win_panel: 'mummy/win_panel.ogg',
		win_cap: 'mummy/win_cap.ogg',
		fg_trigger: 'mummy/fg_trigger.ogg',
		fg_intro: 'mummy/fg_intro.ogg',
		coin_reset: 'mummy/coin_reset.wav',
		hs_tally: 'mummy/hs_tally.wav',
		win_rollup_end: 'mummy/win_rollup_end.wav',
		scarab_button_idle: 'mummy/scarab_button_idle.ogg',
		reel_tension: 'mummy/reel_tension.ogg',
		sun_wait_loop: 'mummy/sun_wait_loop.ogg',
		sun_score_loop: 'mummy/sun_score_loop.wav',
		win_rollup_loop: 'mummy/win_rollup_loop.ogg',
		cat_wave: 'mummy/cat_wave.wav',
		cat_laugh: 'mummy/cat_laugh.ogg',
		cat_cheer: 'mummy/cat_cheer.wav',
		cat_disappoint: 'mummy/cat_disappoint.wav',
		voice_sun_start: 'mummy/voice_sun_start.wav',
		voice_levelup_1: 'mummy/voice_levelup_1.wav',
		voice_levelup_2: 'mummy/voice_levelup_2.wav',
		voice_levelup_3: 'mummy/voice_levelup_3.ogg',
		bandage_sweep: 'mummy/bandage_sweep.wav',
		tomb_rumble: 'mummy/tomb_rumble.ogg',
		sun_show: 'mummy/sun_show.ogg',
		sun_start: 'mummy/sun_start.ogg',
		sun_levelup: 'mummy/sun_levelup.ogg',
		coin_shimmer: 'mummy/coin_shimmer.ogg',
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
 let alive=true,rollup=false,duck=$state(1),duckSeconds=$state(.1),music:'base'|'freespin'|null=null,musicNode:Playing|null=null,musicEpoch=0;
 function engine(){
  if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.gain.value=.82;
   const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=2;compressor.attack.value=.012;compressor.release.value=.18;
   sfxBus=ctx.createGain();musicBus=ctx.createGain();sfxBus.connect(master);musicBus.connect(master);master.connect(compressor).connect(ctx.destination);
   sfxBus.gain.value=stateSoundDerived.volumeSoundEffect();musicBus.gain.value=stateSoundDerived.volumeMusic()*duck;
  }
  if(ctx.state==='suspended')void ctx.resume();return ctx;
 }
 async function buffer(file:string){const c=engine();if(!buffers.has(file))buffers.set(file,fetch(`${base}/assets/audio/${file}`).then(r=>{if(!r.ok)throw new Error(file);return r.arrayBuffer();}).then(b=>c.decodeAudioData(b)).catch(error=>{buffers.delete(file);throw error;}));return buffers.get(file)!;}
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
 $effect(()=>{const vol=stateSoundDerived.volumeMusic()*duck;const seconds=duckSeconds;if(ctx&&musicBus)musicBus.gain.setTargetAtTime(vol,ctx.currentTime,seconds);});
 $effect(()=>{const vol=stateSoundDerived.volumeSoundEffect();if(ctx&&sfxBus)sfxBus.gain.setTargetAtTime(vol,ctx.currentTime,.025);});
 let lastScarabTick=0,lastSunTick=0;
 const voiceMap:Record<MascotVoice,CnSfxName>={roar:'cat_cheer',effort:'cat_wave',wave:'cat_wave',cheer:'cat_cheer',laugh:'cat_laugh',disappoint:'cat_disappoint',land:'cat_land'};
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
  soundHold:({cue})=>void playCnSfx(cue==='land'?'coin_land':cue==='reset'?'coin_reset':'hs_tally',.7),
  soundReelTensionStart:()=>void playCnLoop('reel_tension',.48),soundReelTensionStop:()=>stopCnLoop('reel_tension'),
  soundMusicDuck:({on})=>{duckSeconds=on?.1:.2;duck=on?.3:1;},
  soundWheel:({cue,level,n})=>{
   const now=performance.now();if(cue==='scarabTick'){if(now-lastScarabTick<25)return;lastScarabTick=now;}if(cue==='sunTick'){if(now-lastSunTick<25)return;lastSunTick=now;}
   switch(cue){
    case 'scarabWait':void playCnLoop('scarab_button_idle',.35);break;
    case 'scarabWaitStop':stopCnLoop('scarab_button_idle',.08);break;
    case 'sunWait':void playCnLoop('sun_wait_loop',.6);break;
    case 'sunWaitStop':stopCnLoop('sun_wait_loop',.15);break;
    case 'sunScore':void playCnLoop('sun_score_loop',.5);break;
    case 'sunScoreStop':stopCnLoop('sun_score_loop');break;
    case 'scarabRise':void playCnSfx('scarab_rise',.9);break;
    case 'scarabPress':void playCnSfx('scarab_press',.75);break;
    case 'scarabTick':void playCnSfx('scarab_tick',.5);break;
    case 'scarabStop':void playCnSfx('scarab_stop',1.15);break;
    case 'scarabFly':void playCnSfx('scarab_fly',.5);break;
    case 'scarabSink':void playCnSfx('scarab_sink',.4);break;
    case 'scarabMult':void playCnSfx(`scarab_mult_${Math.min(3,Math.max(1,level??1))}` as CnSfxName,1.2);break;
    case 'sunShow':void playCnSfx('sun_show',.95);void playCnSfx('voice_sun_start',.5);break;
    case 'sunCount':void playCnSfx('sun_count',.55,1+.0625*Math.max(0,5-(n??5)));break;
    case 'sunStart':void playCnSfx('sun_start',.75);break;
    case 'sunTick':void playCnSfx('sun_tick',.45);break;
    case 'sunStop':void playCnSfx('sun_stop',1.15);break;
    case 'sunLevelUp':void playCnSfx('sun_levelup',.8,2**(Math.min(3,Math.max(1,(level??2)-1))*2/12));void playCnSfx(`voice_levelup_${Math.min(3,Math.max(1,(level??2)-1))}` as CnSfxName,.6);break;
    case 'sunWin':void playCnSfx(`sun_win_${Math.min(4,Math.max(1,level??1))}` as CnSfxName,1.15);break;
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

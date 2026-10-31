<script lang="ts" module>
  import { base } from "$app/paths";
  import type { MusicName, SoundEffectName, SoundName } from "../game/sound";
  import { MEDUSA_AUDIO } from "../game/audioManifest";
  import { castingMix,orbSoundVoices } from "../game/castingSoundDesign";
  import {interfaceSoundDesign,interfacePressGain,type InterfaceCue} from '../game/interfaceSoundDesign';
  import {characterSoundDesign,resolveCharacterSound,type CharacterSoundMark} from '../game/characterSoundDesign';

  export type MedusaCue =
    | "gaze"
    | "gazeBeam"
    | "peek"
    | "orbFly"
    | "orbCharge"
    | "orbRelease"
    | "cast"
    | "scoreCollide"
    | "orbHit"
    | "orbCrack"
    | "totalUp"
    | "plateBeam"
    | "glassesOn"
    | "hmm"
    | "annoyed"
    | "gasp"
    | "laugh";

  export type EmitterEventSound =
    | {type:'soundInterface';cue:InterfaceCue}
    | {type:'soundCharacter';mark:CharacterSoundMark}
    | { type: "soundMusic"; name: MusicName }
    | { type: "soundOnce"; name: SoundEffectName; forcePlay?: boolean }
    | { type: "soundLoop"; name: SoundEffectName }
    | { type: "soundStop"; name: SoundName }
    | {
        type: "soundFade";
        name: SoundName;
        from: number;
        to: number;
        duration: number;
      }
    | { type: "soundMedusa"; cue: MedusaCue; value?: number;layers?:number;speed?:number;panFrom?:number;panTo?:number }
    | { type: "soundFreeGameBell" }
    | { type: "soundBigWinBlast"; tier?: 1 | 2 | 3 | 4 | 5 }
    | { type: "soundTumbleHit"; chain: number }
    | { type: "soundTransitionBlast" }
    | { type: "soundEntryReveal" }
    | { type: "soundReelTensionStart" }
    | { type: "soundReelTensionStop" }
    | { type: "soundScatterCounterIncrease" }
    | { type: "soundScatterCounterClear" };
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { stateSoundDerived } from "state-shared";
  import { getContext } from "../game/context";

  const context = getContext();
  type Bus = "music" | "ambience" | "effects";
  type Voice = {
    source: AudioBufferSourceNode;
    gain: GainNode;
    cue: string;
    bus: Bus;
    loop: boolean;
    panner?:StereoPannerNode;
  };
  let engine: AudioContext | null = null;
  let buses: Record<Bus, GainNode> | null = null;
  let disposed = false;
  let generation = 0;
  const buffers = new Map<string, Promise<AudioBuffer>>();
  const voices = new Set<Voice>();
  const pendingLoops = new Map<string, Bus>();
  let currentMusic = "";
  let currentAmbience = "";
  let musicRequest = 0;
  let activeTier = 1;
  let laughVariant = 0;
  let crackVariant = 0;
  const characterLastPlayed=new Map<CharacterSoundMark,number>();
  let interfaceLastAt=-Infinity;

  function getEngine() {
    if (disposed || typeof window === "undefined") return null;
    if (!engine) {
      engine = new AudioContext();
      buses = {
        music: engine.createGain(),
        ambience: engine.createGain(),
        effects: engine.createGain(),
      };
      // Short overlapping impacts can sum above any one file's measured peak.
      const limiter = engine.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 2;
      limiter.ratio.value = 16;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.09;
      limiter.connect(engine.destination);
      for (const bus of Object.values(buses)) bus.connect(limiter);
      updateVolume();
    }
    return engine;
  }

  function updateVolume() {
    if (!engine || !buses) return;
    // User volume/mute changes supersede any scheduled casting duck recovery.
    buses.music.gain.cancelScheduledValues(engine.currentTime);
    buses.music.gain.setTargetAtTime(
      stateSoundDerived.volumeMusic(),
      engine.currentTime,
      0.025,
    );
    buses.ambience.gain.setTargetAtTime(
      stateSoundDerived.volumeMusic() * 0.32,
      engine.currentTime,
      0.025,
    );
    buses.effects.gain.setTargetAtTime(
      stateSoundDerived.volumeSoundEffect(),
      engine.currentTime,
      0.025,
    );
  }

  function load(cue: string) {
    if (!MEDUSA_AUDIO[cue]) return null;
    const audioContext = getEngine();
    if (!audioContext) return null;
    if (!buffers.has(cue)) {
      buffers.set(
        cue,
        fetch(`${base}/assets/audio/medusa/${MEDUSA_AUDIO[cue]}`)
          .then((response) => {
            if (!response.ok)
              throw new Error(`Audio ${cue}: ${response.status}`);
            return response.arrayBuffer();
          })
          .then((data) => audioContext.decodeAudioData(data)),
      );
    }
    return buffers.get(cue)!;
  }

  function fadeVoice(voice: Voice, seconds = 0.15, to = 0) {
    if (!engine) return;
    const now = engine.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(to, now + seconds);
    if (to === 0) {
      voice.source.stop(now + seconds + 0.005);
      voices.delete(voice);
    }
  }

  function stopCue(cue: string, seconds = 0.15) {
    pendingLoops.delete(cue);
    for (const voice of [...voices])
      if (voice.cue === cue) fadeVoice(voice, seconds);
  }

  function resetTransient() {
    generation += 1;
    updateVolume();
    for (const [cue, bus] of pendingLoops)
      if (bus === "effects") pendingLoops.delete(cue);
    for (const voice of [...voices])
      if (voice.bus === "effects") fadeVoice(voice);
  }

  /** Independent buffer sources allow staggered orbs to overlap without restarting. */
  async function playCue(
    cue: string,
    volume = 1,
    rate = 1,
    loop = false,
    bus: Bus = "effects",
    fadeIn = 0,
    spatial?:{from:number;to:number;seconds:number},
  ) {
    const data = load(cue);
    if (!data) return false;
    if (
      loop &&
      (pendingLoops.has(cue) ||
        [...voices].some((voice) => voice.cue === cue && voice.loop))
    )
      return true;
    if (loop) pendingLoops.set(cue, bus);
    const startGeneration = generation;
    try {
      const buffer = await data;
      if (
        disposed ||
        !engine ||
        !buses ||
        (bus === "effects" && startGeneration !== generation)
      )
        return false;
      if (loop && !pendingLoops.has(cue)) return false;
      const source = engine.createBufferSource();
      const gain = engine.createGain();
      source.buffer = buffer;
      source.loop = loop;
      // Decoded PCM loops by sample, avoiding HTMLAudioElement loop gaps.
      source.loopStart = 0;
      source.loopEnd = buffer.duration;
      source.playbackRate.value = rate;
      gain.gain.setValueAtTime(fadeIn ? 0 : volume, engine.currentTime);
      if (fadeIn)
        gain.gain.linearRampToValueAtTime(volume, engine.currentTime + fadeIn);
      source.connect(gain);
      const panner=spatial&&engine.createStereoPanner?engine.createStereoPanner():undefined;
      if(panner&&spatial){gain.connect(panner);panner.connect(buses[bus]);panner.pan.setValueAtTime(spatial.from,engine.currentTime);panner.pan.linearRampToValueAtTime(spatial.to,engine.currentTime+spatial.seconds);}else gain.connect(buses[bus]);
      const voice: Voice = { source, gain, cue, bus, loop,panner };
      voices.add(voice);
      source.onended = () => {
        voices.delete(voice);
        source.disconnect();
        gain.disconnect();
        panner?.disconnect();
      };
      source.start();
      return true;
    } catch (error) {
      buffers.delete(cue);
      console.warn(`Medusa audio could not load ${cue}`, error);
      return false;
    } finally {
      pendingLoops.delete(cue);
    }
  }

  const MUSIC_CUES: Partial<Record<MusicName, string>> = {
    bgm_main: "bgm_base",
    bgm_freespin: "bgm_feature",
  };
  async function playMusic(name: MusicName) {
    const cue = MUSIC_CUES[name];
    if (!cue) return;
    const request = ++musicRequest;
    if (currentMusic === cue) return;
    // Decode first, then crossfade. The old bed continues while loading.
    try {
      await load(cue);
    } catch {
      buffers.delete(cue);
      return;
    }
    if (disposed || request !== musicRequest) return;
    for (const voice of [...voices])
      if (voice.bus === "music" || voice.bus === "ambience")
        fadeVoice(voice, 0.45);
    pendingLoops.delete(currentMusic);
    pendingLoops.delete(currentAmbience);
    currentMusic = cue;
    currentAmbience = cue === "bgm_feature" ? "amb_night" : "amb_plaza";
    void playCue(cue, 1, 1, true, "music", 0.45);
    void playCue(currentAmbience, 1, 1, true, "ambience", 0.45);
  }

  type Mapping = { cue: string; rate?: number; volume?: number };
  const SPRITE_TO_CUE: Record<SoundEffectName, Mapping> = {
    sfx_snake_yawn: { cue: "sfx_snake_yawn", volume: 0.5 },
    sfx_buybonus_hover: { cue: "sfx_buybonus_hover", volume: 0.45 },
    sfx_buybonus_confirm: { cue: "sfx_buybonus_confirm", volume: 0.7 },
    sfx_statues_crack: { cue: "sfx_statues_crack", volume: 0.6 },
    sfx_btn_general: { cue: "sfx_button", volume: interfacePressGain },
    sfx_btn_spin: { cue: "sfx_spin" },
    sfx_reel_stop_1: { cue: "sfx_reel_stop", rate: 0.92 },
    sfx_reel_stop_2: { cue: "sfx_reel_stop", rate: 1 },
    sfx_reel_stop_3: { cue: "sfx_reel_stop", rate: 1.09 },
    sfx_reel_stop_4: { cue: "sfx_reel_stop", rate: 1.19 },
    sfx_reel_stop_5: { cue: "sfx_reel_stop", rate: 1.3 },
    sfx_scatter_stop_1: { cue: "sfx_scatter_land", rate: 1 },
    sfx_scatter_stop_2: { cue: "sfx_scatter_land", rate: 1.06 },
    sfx_scatter_stop_3: { cue: "sfx_scatter_land", rate: 1.12 },
    sfx_scatter_stop_4: { cue: "sfx_scatter_land", rate: 1.19 },
    sfx_scatter_stop_5: { cue: "sfx_scatter_land", rate: 1.26 },
    sfx_scatter_win: { cue: "sfx_scatter_trigger" },
    sfx_scatter_win_v2: { cue: "sfx_scatter_trigger" },
    sfx_scatter_reveal: { cue: "sfx_gaze_charge" },
    sfx_wild_explode: { cue: "sfx_crumble", volume: 0.805 },
    jng_intro_fs: { cue: "stinger_fg_intro" },
    sfx_youwon_panel: { cue: "stinger_fg_outro" },
    sfx_superfreespin: { cue: "sfx_fg_plus5" },
    sfx_fs_respins: { cue: "sfx_fg_plus5" },
    sfx_anticipation: { cue: "sfx_scatter_tease", volume: 0.5 },
    sfx_anticipation_start: { cue: "sfx_scatter_tease", volume: 0.5 },
    sfx_bigwin_coinloop: { cue: "sfx_bigwin_1_loop", volume: 0.45 },
    sfx_multiplier_combine_a: { cue: "sfx_orb_fly" },
    sfx_multiplier_combine_b: { cue: "sfx_orb_fly" },
    sfx_multiplier_explosion_a: { cue: "sfx_orb_hit_s" },
    sfx_multiplier_explosion_b: { cue: "sfx_orb_hit_m" },
    sfx_multiplier_explosion_c: { cue: "sfx_orb_hit_l" },
    sfx_multiplier_landing: { cue: "sfx_orb_fly" },
    sfx_multiplier_reset: { cue: "sfx_orb_crack" },
    sfx_multiplier_up: { cue: "sfx_total_mult_up" },
    sfx_multiplier_update: { cue: "sfx_mult_count", volume: 0.78 },
    sfx_multiplier_win: { cue: "sfx_orb_hit_m" },
    sfx_royals_landing: { cue: "sfx_drop" },
    sfx_symbols_landing: { cue: "sfx_drop" },
    sfx_winlevel_end: { cue: "sfx_win_mark", volume: 0.5 },
    sfx_winlevel_nice: { cue: "sfx_win_mark" },
    sfx_winlevel_small: { cue: "sfx_win_mark" },
    sfx_winlevel_standard: { cue: "sfx_win_mark" },
    sfx_winlevel_substantial: { cue: "sfx_win_mark" },
    tumble_win_1: { cue: "sfx_petrify_1" },
    tumble_win_2: { cue: "sfx_petrify_2" },
    tumble_win_3: { cue: "sfx_petrify_3" },
    tumble_win_4: { cue: "sfx_petrify_4" },
  };

  function mappedCue(name: SoundEffectName): Mapping {
    return name === "sfx_bigwin_coinloop"
      ? { cue: `sfx_bigwin_${activeTier}_loop`, volume: 0.45 }
      : SPRITE_TO_CUE[name];
  }

  function duckCastingMusic(seconds:number,depth=.64){
    const ctx=getEngine();if(!ctx||!buses)return;
    const gain=buses.music.gain,now=ctx.currentTime,volume=stateSoundDerived.volumeMusic();
    gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);gain.linearRampToValueAtTime(volume*depth,now+.035);gain.setTargetAtTime(volume,now+seconds,.12);
  }

  function playMedusa(cue: MedusaCue, value = 0,speed=1,panFrom=0,panTo=0,layers=1) {
    switch (cue) {
      case "gaze":
        void playCue("sfx_gaze_charge",.8,speed);
        void playCue("sfx_snakes_hiss", 0.32,speed);
        break;
      case "gazeBeam":
        void playCue("sfx_gaze_beam",castingMix.gazeBeam,speed);
        break;
      case "peek":
        void playCue("sfx_glasses_slide",.9,speed);
        break;
      case "glassesOn":
        void playCue("sfx_glasses_on",.8,speed);
        break;
      case "orbCharge":
        for(const v of orbSoundVoices('charge',value))void playCue(v.cue,v.gain,v.rate);
        break;
      case "orbRelease":
        for(const v of orbSoundVoices('release',value))void playCue(v.cue,v.gain,v.rate);
        break;
      case "orbFly":
        for(const v of orbSoundVoices('fly',value,layers))void playCue(v.cue,v.gain,v.rate,false,"effects",0,{from:panFrom,to:panTo,seconds:.60});
        break;
      case "cast":
        // One clear nonverbal casting utterance for the whole volley.
        duckCastingMusic(.82);
        void playCue("vo_medusa_cast", castingMix.voice, castingMix.voiceRate);
        void playCue("sfx_snakes_hiss", castingMix.hiss, castingMix.hissRate);
        break;
      case "scoreCollide":
        duckCastingMusic(.24,.70);
        for(const v of orbSoundVoices('collision',value))void playCue(v.cue,v.gain,v.rate);
        break;
      case "orbHit":
        for(const v of orbSoundVoices('hit',value))void playCue(v.cue,v.gain,v.rate);
        break;
      case "orbCrack":
        void playCue(++crackVariant % 2 ? "sfx_orb_crack" : "sfx_orb_crack_2",.9775,speed);
        break;
      case "totalUp":
        void playCue("sfx_total_mult_up");
        break;
      case "plateBeam":
        void playCue("sfx_total_to_win",1.30);
        break;
      case "hmm":
        void playCue("vo_medusa_hmm", 0.65);
        break;
      case "annoyed":
        void playCue("vo_medusa_annoyed", 0.65);
        break;
      case "gasp":
        void playCue("vo_medusa_gasp", 0.65);
        break;
      case "laugh":
        void playCue(
          activeTier === 5
            ? "vo_medusa_cry_happy"
            : ++laughVariant % 2
              ? "vo_medusa_laugh"
              : "vo_medusa_laugh_2",
          0.7,
        );
        void playCue("sfx_snakes_laugh", 0.35);
        break;
    }
  }

  function playCharacter(mark:CharacterSoundMark){
    const now=performance.now(),last=characterLastPlayed.get(mark)??-Infinity;
    if(now-last<characterSoundDesign[mark].cooldownMs)return;
    characterLastPlayed.set(mark,now);
    if(mark==='motion_cast'){
      stopCue('vo_medusa_hmm',.025);stopCue('vo_medusa_annoyed',.025);
      duckCastingMusic(.82);
    }
    const variation=mark==='motion_laugh'?laughVariant++:0;
    for(const v of resolveCharacterSound(mark,variation))void playCue(v.cue,v.gain,v.rate);
  }

  $effect(() => {
    stateSoundDerived.volumeMusic();
    stateSoundDerived.volumeSoundEffect();
    updateVolume();
  });

  context.eventEmitter.subscribeOnMount({
    soundInterface:({cue})=>{
      const now=performance.now();if(now-interfaceLastAt<80)return;interfaceLastAt=now;
      for(const part of interfaceSoundDesign[cue])void playCue(part.cue,part.gain,part.rate);
    },
    soundCharacter:({mark})=>playCharacter(mark),
    soundBetMode: () => {
      void playMusic("bgm_main");
    },
    soundPressGeneral: () => {
      void playCue("sfx_button", interfacePressGain);
    },
    soundPressBet: () => {
      resetTransient();
      void playCue("sfx_spin");
    },
    soundScatterCounterIncrease: () => {
      context.stateGame.scatterCounter += 1;
    },
    soundScatterCounterClear: () => {
      resetTransient();
      context.stateGame.scatterCounter = 0;
      activeTier = 1;
    },
    soundMusic: ({ name }) => {
      void playMusic(name);
    },
    soundLoop: ({ name }) => {
      const mapped = mappedCue(name);
      void playCue(mapped.cue, mapped.volume ?? 1, 1, true);
    },
    soundOnce: ({ name }) => {
      const mapped = mappedCue(name);
      void playCue(mapped.cue, mapped.volume ?? 1, mapped.rate ?? 1);
    },
    soundMedusa: ({ cue, value,speed,panFrom,panTo,layers }) => playMedusa(cue, value,speed,panFrom,panTo,layers),
    soundFreeGameBell: () => {
      void playCue("sfx_scatter_trigger");
    },
    soundBigWinBlast: ({ tier }) => {
      activeTier = tier ?? 1;
      void playCue(`sfx_bigwin_${activeTier}`);
    },
    soundTransitionBlast: () => {
      void playCue("stinger_fg_intro");
    },
    soundEntryReveal: () => {
      void playCue("sfx_gaze_charge", 0.7);
    },
    soundTumbleHit: ({ chain }) => {
      void playCue(`sfx_petrify_${Math.max(1, Math.min(chain, 5))}`);
    },
    soundReelTensionStart: () => {
      void playCue("sfx_scatter_tease", 0.5, 1, true);
    },
    soundReelTensionStop: () => stopCue("sfx_scatter_tease"),
    soundStop: ({ name }) => {
      // Hold the bed until the next music request, allowing a real crossfade.
      if (name === "bgm_main" || name === "bgm_freespin") return;
      const mapped = SPRITE_TO_CUE[name as SoundEffectName];
      if (name === "sfx_bigwin_coinloop") {
        for (let i = 1; i <= 5; i += 1) stopCue(`sfx_bigwin_${i}_loop`);
      } else if (mapped) stopCue(mapped.cue);
    },
    soundFade: ({ name, duration, to }) => {
      const cue =
        MUSIC_CUES[name as MusicName] ??
        SPRITE_TO_CUE[name as SoundEffectName]?.cue;
      if (cue)
        for (const voice of [...voices])
          if (voice.cue === cue) fadeVoice(voice, duration / 1000, to);
    },
  });

  onMount(() => {
    const resume = () => {
      if (document.visibilityState === "visible")
        void getEngine()
          ?.resume()
          .catch(() => {});
    };
    const visibility = () => {
      if (document.hidden) void engine?.suspend();
      else resume();
    };
    window.addEventListener("pointerdown", resume, true);
    window.addEventListener("keydown", resume, true);
    document.addEventListener("visibilitychange", visibility);
    void playMusic("bgm_main");
    for (const cue of Object.keys(MEDUSA_AUDIO).filter(
      (name) => !name.startsWith("bgm_") && !name.startsWith("amb_"),
    ))
      void load(cue)?.catch(() => {});
    return () => {
      disposed = true;
      musicRequest += 1;
      window.removeEventListener("pointerdown", resume, true);
      window.removeEventListener("keydown", resume, true);
      document.removeEventListener("visibilitychange", visibility);
      for (const voice of voices) {
        voice.source.stop();
        voice.source.disconnect();
        voice.gain.disconnect();
      }
      voices.clear();
      buffers.clear();
      void engine?.close();
    };
  });
</script>

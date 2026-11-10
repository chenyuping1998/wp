<script lang="ts" module>
  import { base } from "$app/paths";
  import type { MusicName, SoundEffectName, SoundName } from "../game/sound";
  import { DRAGON_AUDIO, type DragonCue } from "../game/audioManifest";

  // Character / pearl beats. The names are the template's (MedusaThrow emits them); the sounds
  // are Dragon Tide's (new-games/sea-dragon/音效需求單.md, delivery-v1).
  export type MedusaCue =
    | "gaze"
    | "gazeBeam"
    | "peek"
    | "orbFly"
    | "totalFly"
    | "orbHit"
    | "pearlShow"
    | "pearlAdd"
    | "orbCrack"
    | "totalUp"
    | "plateBeam"
    | "glassesOn"
    | "hmm"
    | "annoyed"
    | "gasp"
    | "laugh";

  export type EmitterEventSound =
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
    | { type: "soundMedusa"; cue: MedusaCue; value?: number;speed?:number;panFrom?:number;panTo?:number }
    | { type: "soundCue"; cue: DragonCue; loop?: boolean; rate?: number }
    | { type: "soundCueStop"; cue: DragonCue }
    | { type: "soundVoice"; line: "fgIn" | "fgEnd" | "fgEndBig" }
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
  import { stateModal, stateSoundDerived } from "state-shared";
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
  // a big win ducks the music bed under its own celebration (audio README: start points)
  let ducked = false;
  const DUCK = 0.4;
  const MAKEUP = 2.5;

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
      // dev only: QA reads which cue played when, and can record the final mix
      if (import.meta.env.DEV) {
        const audioContext = engine;
        (globalThis as unknown as { __dragonAudio?: unknown }).__dragonAudio = {
          log: devLog,
          tap: () => {
            const destination = audioContext.createMediaStreamDestination();
            limiter.connect(destination);
            return destination.stream;
          },
        };
      }
      // The delivery's start levels leave the mix near -11 dBFS peak at the default volume
      // (75 %); a make-up stage brings it to about -3 dBFS and the limiter holds the overlaps.
      const makeup = engine.createGain();
      makeup.gain.value = MAKEUP;
      makeup.connect(limiter);
      for (const bus of Object.values(buses)) bus.connect(makeup);
      updateVolume();
    }
    return engine;
  }

  function updateVolume() {
    if (!engine || !buses) return;
    buses.music.gain.setTargetAtTime(
      stateSoundDerived.volumeMusic() * (ducked ? DUCK : 1),
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
    const file = (DRAGON_AUDIO as Record<string, string>)[cue];
    if (!file) return null;
    const audioContext = getEngine();
    if (!audioContext) return null;
    if (!buffers.has(cue)) {
      buffers.set(
        cue,
        fetch(`${base}/assets/audio/dragon/${file}`)
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

  const devLog: [number, string, number, number, boolean][] = [];
  function stopCue(cue: string, seconds = 0.15) {
    if (import.meta.env.DEV && [...voices].some((voice) => voice.cue === cue)) devLog.push([performance.now(), `stop ${cue}`, 0, 1, false]);
    pendingLoops.delete(cue);
    for (const voice of [...voices])
      if (voice.cue === cue) fadeVoice(voice, seconds);
  }

  function resetTransient() {
    generation += 1;
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
      if (import.meta.env.DEV) devLog.push([performance.now(), cue, volume, rate, loop]);
      return true;
    } catch (error) {
      buffers.delete(cue);
      console.warn(`Audio could not load ${cue}`, error);
      return false;
    } finally {
      pendingLoops.delete(cue);
    }
  }

  // Mix start points from the delivery (new-games/sea-dragon/audio/README.md): the files peak
  // near -3 to -1 dBFS and many fire together, so none plays at full scale.
  const LEVEL = { music: 0.45, ambience: 0.6, sfx: 0.21, bigStart: 0.3, bigLoop: 0.18, bigCount: 0.1, voice: 0.28 };
  // Voices (delivery-v1 vo_*, wordless): a line from each pool, never the same one twice running.
  const POOLS: Record<string, string[]> = {
    king: [1, 2, 3, 4, 5].map((n) => `vo_king_cast_${n}`),
    princess: [1, 2, 3, 4, 5].map((n) => `vo_princess_cast_${n}`),
    fgIn: [1, 2, 3].map((n) => `vo_fg_in_${n}`),
    fgEnd: [1, 2].map((n) => `vo_fg_end_${n}`),
    fgEndBig: [1, 2].map((n) => `vo_fg_end_big_${n}`),
  };
  const lastLine: Record<string, string> = {};
  const voice = (pool: string) => {
    const lines = POOLS[pool].filter((line) => line !== lastLine[pool]);
    const line = lines[Math.floor(Math.random() * lines.length)];
    lastLine[pool] = line;
    void playCue(line, LEVEL.voice);
  };
  type Bed = "main" | "free" | "wait";
  const BEDS: Record<Bed, { music: DragonCue; ambience?: DragonCue }> = {
    main: { music: "bgm_main", ambience: "amb_sea" },
    free: { music: "bgm_free", ambience: "amb_hall" },
    // the feature plaques (in and out) wait over their own 12 s loop, without ambience
    wait: { music: "bgm_fg_wait" },
  };
  const MUSIC_BED: Partial<Record<MusicName, Bed>> = { bgm_main: "main", bgm_freespin: "free" };
  async function playBed(bed: Bed) {
    const { music: bedMusic, ambience: bedAmbience } = BEDS[bed];
    const request = ++musicRequest;
    if (currentMusic === bedMusic) return;
    // Decode first, then crossfade. The old bed continues while loading.
    try {
      await load(bedMusic);
    } catch {
      buffers.delete(bedMusic);
      return;
    }
    if (disposed || request !== musicRequest) return;
    for (const voice of [...voices])
      if (voice.bus === "music" || voice.bus === "ambience")
        fadeVoice(voice, 0.45);
    pendingLoops.delete(currentMusic);
    pendingLoops.delete(currentAmbience);
    currentMusic = bedMusic;
    currentAmbience = bedAmbience ?? "";
    void playCue(bedMusic, LEVEL.music, 1, true, "music", 0.45);
    if (bedAmbience) void playCue(bedAmbience, LEVEL.ambience, 1, true, "ambience", 0.45);
  }
  const playMusic = (name: MusicName) => {
    const bed = MUSIC_BED[name];
    if (bed) void playBed(bed);
  };

  type Mapping = { cue: string; rate?: number; volume?: number };
  const SILENT: Mapping = { cue: "", volume: 0 };
  const sfx = (cue: DragonCue, rate = 1, volume = 1): Mapping => ({ cue, rate, volume });
  // this spin's link number, 1-5 (link 5 and on stay on 5; every reveal starts again at 1)
  const link = () => Math.max(1, Math.min(5, context.stateGame.tumbleChain || 1));
  const freegame = () => context.stateGame.gameType === "freegame";
  const SPRITE_TO_CUE: Record<SoundEffectName, Mapping> = {
    sfx_snake_yawn: SILENT,
    sfx_statues_crack: SILENT,
    sfx_buybonus_hover: sfx("sfx_buy_hover"),
    sfx_buybonus_confirm: sfx("sfx_buy_confirm"),
    sfx_btn_general: sfx("sfx_button"),
    sfx_btn_spin: sfx("sfx_spin_press"),
    // one drop on jade per reel, a step up each reel
    sfx_reel_stop_1: sfx("sfx_reel_stop", 0.92),
    sfx_reel_stop_2: sfx("sfx_reel_stop", 1),
    sfx_reel_stop_3: sfx("sfx_reel_stop", 1.09),
    sfx_reel_stop_4: sfx("sfx_reel_stop", 1.19),
    sfx_reel_stop_5: sfx("sfx_reel_stop", 1.3),
    // the gong, a step up for each gate already on the board
    sfx_scatter_stop_1: sfx("sfx_gate_land", 1),
    sfx_scatter_stop_2: sfx("sfx_gate_land", 1.06),
    sfx_scatter_stop_3: sfx("sfx_gate_land", 1.12),
    sfx_scatter_stop_4: sfx("sfx_gate_land", 1.19),
    sfx_scatter_stop_5: sfx("sfx_gate_land", 1.26),
    sfx_scatter_win: sfx("sfx_gate_win"),
    sfx_scatter_win_v2: sfx("sfx_gate_win"),
    sfx_scatter_reveal: SILENT,
    // the burst: resolved per link in mappedCue
    sfx_wild_explode: sfx("sfx_blast_1"),
    // the feature plaques: resolved in soundOnce (sting + waiting bed)
    jng_intro_fs: sfx("jng_fg_intro"),
    sfx_youwon_panel: sfx("jng_fg_outro"),
    sfx_superfreespin: sfx("sfx_fg_retrigger"),
    sfx_fs_respins: sfx("sfx_fg_retrigger"),
    sfx_anticipation: sfx("sfx_gate_tease"),
    sfx_anticipation_start: sfx("sfx_gate_tease"),
    // resolved per tier in mappedCue
    sfx_bigwin_coinloop: sfx("sfx_bigwin_loop_1"),
    sfx_multiplier_combine_a: sfx("sfx_pearl_fly"),
    sfx_multiplier_combine_b: sfx("sfx_pearl_fly"),
    sfx_multiplier_explosion_a: sfx("sfx_pearl_lit_s"),
    sfx_multiplier_explosion_b: sfx("sfx_pearl_lit_m"),
    sfx_multiplier_explosion_c: sfx("sfx_pearl_lit_l"),
    sfx_multiplier_landing: sfx("sfx_pearl_fly"),
    sfx_multiplier_reset: SILENT,
    sfx_multiplier_up: sfx("sfx_total_up"),
    // the sum turning into the paid amount: resolved per game in mappedCue
    sfx_multiplier_update: sfx("sfx_win_multiply"),
    sfx_multiplier_win: sfx("sfx_pearl_add"),
    // a column of the refill settling: a light drop (the refill itself is sfx_refill)
    sfx_royals_landing: sfx("sfx_reel_stop", 1, 0.6),
    sfx_symbols_landing: sfx("sfx_reel_stop", 1, 0.6),
    sfx_winlevel_end: sfx("sfx_bigwin_end"),
    // the win frame: resolved per link in mappedCue
    sfx_winlevel_nice: sfx("sfx_score_1"),
    sfx_winlevel_small: sfx("sfx_score_1"),
    sfx_winlevel_standard: sfx("sfx_score_1"),
    sfx_winlevel_substantial: sfx("sfx_score_1"),
    tumble_win_1: SILENT,
    tumble_win_2: SILENT,
    tumble_win_3: SILENT,
    tumble_win_4: SILENT,
  };

  function mappedCue(name: SoundEffectName): Mapping {
    if (name === "sfx_bigwin_coinloop") return { cue: `sfx_bigwin_loop_${activeTier}`, volume: LEVEL.bigLoop / LEVEL.sfx };
    if (name === "sfx_wild_explode") return { cue: `sfx_blast_${link()}` };
    if (name === "sfx_multiplier_update") return { cue: freegame() ? "sfx_win_multiply_fg" : "sfx_win_multiply" };
    if (name.startsWith("sfx_winlevel_") && name !== "sfx_winlevel_end")
      return { cue: freegame() ? `sfx_fgscore_${link()}` : `sfx_score_${link()}` };
    return SPRITE_TO_CUE[name];
  }
  const level = (mapping: Mapping) => LEVEL.sfx * (mapping.volume ?? 1);
  const play = (mapping: Mapping, loop = false, rate = mapping.rate ?? 1) => {
    if (mapping.cue) void playCue(mapping.cue, level(mapping), rate, loop);
  };

  let lastPearlShow = -Infinity;
  // the gates' pay (winInfo) and the trigger both ring the gate: once is enough
  let lastGateWin = -Infinity;
  const gateWin = () => {
    const now = performance.now();
    if (now - lastGateWin < 1500) return;
    lastGateWin = now;
    void playCue("sfx_gate_win", LEVEL.sfx);
  };

  function playMedusa(cue: MedusaCue, value = 0,speed=1,panFrom=0,panTo=0) {
    switch (cue) {
      case "gaze": {
        // the caster: the Dragon King in the base game, the Dragon Princess in free spins; a
        // top-tier (x250+) pearl on the board always gets the caster's big line
        const who = freegame() ? "princess" : "king";
        void playCue(`sfx_cast_${who}`, LEVEL.sfx, speed);
        if (value >= 250) void playCue(`vo_${who}_cast_top`, LEVEL.voice);
        else voice(who);
        break;
      }
      case "gazeBeam":
        void playCue("sfx_strike", LEVEL.sfx, speed);
        break;
      case "orbFly":
        void playCue("sfx_pearl_fly",LEVEL.sfx,1,false,"effects",0,{from:panFrom,to:panTo,seconds:.6});
        break;
      case "totalFly":
        void playCue("sfx_total_fly",LEVEL.sfx,1,false,"effects",0,{from:panFrom,to:panTo,seconds:1});
        break;
      case "orbHit":
        // the struck pearl lights up, bigger for bigger values
        void playCue(value >= 100 ? "sfx_pearl_lit_l" : value >= 15 ? "sfx_pearl_lit_m" : "sfx_pearl_lit_s", LEVEL.sfx, speed);
        break;
      case "pearlShow": {
        // a pearl lands with the board (a handful at once rings as a few, not a wall)
        const now = performance.now();
        if (now - lastPearlShow < 60) break;
        lastPearlShow = now;
        void playCue(value >= 250 ? "sfx_pearl_show_top" : "sfx_pearl_show", LEVEL.sfx, speed);
        break;
      }
      case "pearlAdd":
        // a settled pearl's value lands on the readout
        void playCue(value >= 250 ? "sfx_pearl_add_top" : "sfx_pearl_add", LEVEL.sfx, speed);
        break;
      case "totalUp":
        void playCue("sfx_total_up", LEVEL.sfx);
        break;
      // template beats with no Dragon Tide sound (no voices in delivery-v1; no losing-pearl crack)
      case "peek":
      case "glassesOn":
      case "orbCrack":
      case "plateBeam":
      case "hmm":
      case "annoyed":
      case "gasp":
      case "laugh":
        break;
    }
  }

  const BIG_LOOPS = [1, 2, 3, 4, 5].map((tier) => `sfx_bigwin_loop_${tier}`);
  const bigLoopOn = () => [...voices].some((voice) => BIG_LOOPS.includes(voice.cue) && voice.loop) || BIG_LOOPS.some((cue) => pendingLoops.has(cue));
  const duck = (on: boolean) => {
    if (ducked === on) return;
    ducked = on;
    updateVolume();
  };

  // info, settings and buy menus open and close with a light click
  let lastModal: unknown = undefined;
  $effect(() => {
    const modal = stateModal.modal;
    if (lastModal !== undefined && !!modal !== !!lastModal) void playCue(modal ? "sfx_menu_open" : "sfx_menu_close", LEVEL.sfx);
    lastModal = modal ?? null;
  });

  $effect(() => {
    stateSoundDerived.volumeMusic();
    stateSoundDerived.volumeSoundEffect();
    updateVolume();
  });

  context.eventEmitter.subscribeOnMount({
    soundBetMode: () => {
      void playMusic("bgm_main");
    },
    soundPressGeneral: () => {
      void playCue("sfx_button", LEVEL.sfx);
    },
    soundPressBet: () => {
      resetTransient();
      void playCue("sfx_spin_press", LEVEL.sfx);
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
      if (name === "sfx_bigwin_coinloop") {
        duck(true);
        if (bigLoopOn()) return;
      }
      play(mapped, true, 1);
    },
    soundOnce: ({ name }) => {
      if (name === "sfx_scatter_win" || name === "sfx_scatter_win_v2") return gateWin();
      play(mappedCue(name));
      // the feature plaques wait over their own bed; the Dragon King winds up under the first
      if (name === "jng_intro_fs") {
        void playBed("wait");
        void playCue("sfx_ready", LEVEL.sfx);
      }
      if (name === "sfx_youwon_panel") void playBed("wait");
    },
    soundCue: ({ cue, loop, rate }) => {
      const gain = cue === "sfx_bigwin_count" ? LEVEL.bigCount : cue === "sfx_bigwin_end" ? LEVEL.bigStart : LEVEL.sfx;
      void playCue(cue, gain, rate ?? 1, loop ?? false);
    },
    soundCueStop: ({ cue }) => stopCue(cue),
    soundMedusa: ({ cue, value,speed,panFrom,panTo }) => playMedusa(cue, value,speed,panFrom,panTo),
    soundFreeGameBell: () => gateWin(),
    soundVoice: ({ line }) => voice(line),
    soundBigWinBlast: ({ tier }) => {
      const next = tier ?? 1;
      duck(true);
      // climbing a tier swaps the celebration loop for the next one
      if (next !== activeTier && bigLoopOn()) {
        stopCue(`sfx_bigwin_loop_${activeTier}`, 0.25);
        activeTier = next;
        void playCue(`sfx_bigwin_loop_${activeTier}`, LEVEL.bigLoop, 1, true);
      }
      activeTier = next;
      void playCue(`sfx_bigwin_start_${activeTier}`, LEVEL.bigStart);
      void playCue(`vo_bigwin_${activeTier}`, LEVEL.voice);
    },
    soundTransitionBlast: () => {
      void playCue("sfx_portal", LEVEL.sfx);
    },
    soundEntryReveal: () => {
      void playCue("sfx_entry_reveal", LEVEL.sfx);
    },
    // the reference has no sound between the win frame and the burst
    soundTumbleHit: () => {},
    soundReelTensionStart: () => {
      void playCue("sfx_gate_tease", LEVEL.sfx, 1, true);
    },
    soundReelTensionStop: () => stopCue("sfx_gate_tease"),
    soundStop: ({ name }) => {
      // Hold the bed until the next music request, allowing a real crossfade.
      if (name === "bgm_main" || name === "bgm_freespin") return;
      // the sum-to-paid sound is a one-shot now: let it ring out
      if (name === "sfx_multiplier_update") return;
      if (name === "sfx_bigwin_coinloop") {
        for (const cue of BIG_LOOPS) stopCue(cue);
        stopCue("sfx_bigwin_count");
        duck(false);
        return;
      }
      const mapped = SPRITE_TO_CUE[name as SoundEffectName];
      if (name === "sfx_anticipation" || name === "sfx_anticipation_start") stopCue("sfx_gate_tease");
      else if (mapped?.cue) stopCue(mapped.cue);
    },
    soundFade: ({ name, duration, to }) => {
      const cue =
        (MUSIC_BED[name as MusicName] && BEDS[MUSIC_BED[name as MusicName]!].music) ??
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
    for (const cue of Object.keys(DRAGON_AUDIO).filter(
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

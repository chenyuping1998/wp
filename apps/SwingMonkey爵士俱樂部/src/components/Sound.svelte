<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';
	import type { JazzNote } from '../game/jazzBand';

	// What the mascot can say. One clip per animation.
	export type MascotVoice = 'roar' | 'effort';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundWinTier'; tier: string }
		| { type: 'soundLadderUp'; level: number }
		| { type: 'soundChefSlice' }
		| { type: 'soundChefChop' }
		| { type: 'soundStamp' }
		| { type: 'soundMonkeyExpand' }
		// the collection's own moments
		| { type: 'soundSackLand' }
		| { type: 'soundCollectGrab' }
		| { type: 'soundCoinIn'; index: number }
		| { type: 'soundCollectStamp' }
		| { type: 'soundShutterDown' }
		// the transition's curtain
		| { type: 'soundDoorSlide' }
		| { type: 'soundDoorClack' }
		| { type: 'soundDoorOpen' }
		| { type: 'soundMascotVoice'; name: MascotVoice }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' }
		// a new spin is starting: whatever the last spin's win and collection
		// left ringing fades out now (bookEventHandlerMap reveal)
		| { type: 'soundSpinCut' }
		// adaptive music (2026-11-06): the groove stem (the drums) swells while
		// something is happening — the reels turning, a tease, a win — and
		// settles at rest
		| { type: 'soundGroove'; reason: 'spin' | 'win' | 'plaque'; on: boolean }
		// one vibes note per reel as the win lights up across the board
		| { type: 'soundWinWake'; index: number }
		// the count-up bed under a rolling win amount, in phase with the band
		| { type: 'soundCountUp'; on: boolean; big?: boolean; done?: boolean }
		// an H1–H4 instrument plays its notes with the band (game/jazzBand.ts)
		| { type: 'soundJazzNotes'; notes: JazzNote[] };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { stateModal, stateSoundDerived } from 'state-shared';
	import { base } from '$app/paths';

	import { getContext } from '../game/context';
	import { setMusicClock, nextGridTime, barPhase, musicBpm, chordToneRate } from '../game/musicClock';

	const context = getContext();

	// ─── the club's sound set (2026-11-06, design/generate_swing_audio_v2.py) ───
	// One band in one key (F major): rimshots and woodblocks for the reels,
	// vibes and a muted trumpet for the wins, the horn section for the tiers.
	// Every sprite name is mapped below, so the template sprite (sounds.json) is
	// never the thing that sounds.
	type CnSfxName =
		| 'btn'
		| 'spin'
		| 'reel_stop'
		| 'scatter_1'
		| 'scatter_2'
		| 'scatter_3'
		| 'scatter_4'
		| 'scatter_5'
		| 'sack_land'
		| 'bandit_land'
		| 'collect_grab'
		| 'coin_in'
		| 'collect_stamp'
		| 'tumbler_up'
		| 'dial_tick'
		| 'band_pickup'
		| 'reel_tension'
		| 'reel_tension_fg'
		| 'fg_level_windup'
		| 'fg_level_impact'
		| 'fg_level_reveal'
		| 'ambient_scene'
		| 'alarm_bell'
		| 'alarm_trip'
		| 'sack_throw'
		| 'shutter_down'
		| 'door_slide'
		| 'door_clack'
		| 'door_open'
		| 'shutter_slam'
		| 'safe_open'
		| 'fs_intro'
		| 'win_small'
		| 'win_mid'
		| 'bill_counter'
		| 'cash_register'
		| 'bigwin_slam'
		| 'win_big'
		| 'win_super'
		| 'win_mega'
		| 'win_epic'
		| 'win_max'
		| 'win_cap'
		| 'voice_laugh'
		| 'voice_hup'
		| 'win_wake'
		| 'count_loop'
		| 'count_end'
		| 'inst_sax'
		| 'inst_bass'
		| 'inst_snare'
		| 'inst_banjo_maj6'
		| 'inst_banjo_dom7'
		| 'inst_banjo_min7';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		btn: 'swing/btn.wav',
		spin: 'swing/spin.wav',
		reel_stop: 'swing/reel_stop.wav',
		scatter_1: 'swing/scatter_1.wav',
		scatter_2: 'swing/scatter_2.wav',
		scatter_3: 'swing/scatter_3.wav',
		scatter_4: 'swing/scatter_4.wav',
		scatter_5: 'swing/scatter_5.wav',
		sack_land: 'swing/sack_land.wav',
		bandit_land: 'swing/bandit_land.wav',
		collect_grab: 'swing/collect_grab.wav',
		coin_in: 'swing/coin_in.wav',
		collect_stamp: 'swing/collect_stamp.wav',
		tumbler_up: 'swing/tumbler_up.wav',
		dial_tick: 'swing/dial_tick.wav',
		band_pickup: 'swing/band_pickup.wav',
		reel_tension: 'swing/reel_tension.wav',
		reel_tension_fg: 'swing/reel_tension_fg.wav',
		fg_level_windup: 'swing/fg_level_windup.wav',
		fg_level_impact: 'swing/fg_level_impact.wav',
		fg_level_reveal: 'swing/fg_level_reveal.wav',
		ambient_scene: 'swing/ambient_scene.wav',
		alarm_bell: 'swing/alarm_bell.wav',
		alarm_trip: 'swing/alarm_trip.wav',
		sack_throw: 'swing/sack_throw.wav',
		shutter_down: 'swing/shutter_down.wav',
		door_slide: 'swing/curtain_move.wav',
		door_clack: 'swing/curtain_cover.wav',
		door_open: 'swing/curtain_exit.wav',
		shutter_slam: 'swing/shutter_slam.wav',
		safe_open: 'swing/safe_open.wav',
		fs_intro: 'swing/fs_intro.wav',
		win_small: 'swing/win_small.wav',
		win_mid: 'swing/win_mid.wav',
		bill_counter: 'swing/bill_counter.wav',
		cash_register: 'swing/cash_register.wav',
		bigwin_slam: 'swing/bigwin_slam.wav',
		win_big: 'swing/win_big.wav',
		win_super: 'swing/win_super.wav',
		win_mega: 'swing/win_mega.wav',
		win_epic: 'swing/win_epic.wav',
		win_max: 'swing/win_max.wav',
		win_cap: 'swing/win_cap.wav',
		voice_laugh: 'swing/voice_laugh.wav',
		voice_hup: 'swing/voice_hup.wav',
		win_wake: 'swing/win_wake.wav',
		count_loop: 'swing/count_loop.wav',
		count_end: 'swing/count_end.wav',
		inst_sax: 'swing/inst_sax.wav',
		inst_bass: 'swing/inst_bass.wav',
		inst_snare: 'swing/inst_snare.wav',
		inst_banjo_maj6: 'swing/inst_banjo_maj6.wav',
		inst_banjo_dom7: 'swing/inst_banjo_dom7.wav',
		inst_banjo_min7: 'swing/inst_banjo_min7.wav',
	};

	// He is a character in the scene, not the interface, so he sits UNDER
	// everything the game says with a sound of its own.
	const MASCOT_VOICE_FILE: Record<MascotVoice, CnSfxName> = {
		roar: 'voice_laugh',
		effort: 'voice_hup',
	};
	const MASCOT_VOICE_GAIN: Record<MascotVoice, number> = {
		roar: 1,
		effort: 0.8,
	};

	// Sprite sound names re-routed to the club's set. The reel stops are not
	// here: they are pitched live, to the chord the band is on (soundOnce).
	const SPRITE_TO_CN: Record<
		SoundEffectName,
		{ name: CnSfxName; volume?: number; rate?: number } | null
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		sfx_reel_stop_1: { name: 'reel_stop' },
		sfx_reel_stop_2: { name: 'reel_stop' },
		sfx_reel_stop_3: { name: 'reel_stop' },
		sfx_reel_stop_4: { name: 'reel_stop' },
		sfx_reel_stop_5: { name: 'reel_stop' },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		// the bandleader's badge landing on the reels
		sfx_multiplier_landing: { name: 'bandit_land', volume: 0.8 },
		sfx_wild_explode: { name: 'bandit_land' },
		sfx_winlevel_small: { name: 'win_small' },
		sfx_winlevel_nice: { name: 'win_small' },
		sfx_winlevel_standard: { name: 'win_mid', volume: 0.8 },
		sfx_winlevel_substantial: { name: 'win_mid' },
		sfx_scatter_win: { name: 'win_mid' },
		// the scatter count that sets the trigger off
		sfx_scatter_win_v2: { name: 'alarm_trip' },
		// the transition opening: the record thrown
		sfx_superfreespin: { name: 'sack_throw', volume: 0.8 },
		sfx_youwon_panel: { name: 'cash_register', volume: 0.72 },
		sfx_winlevel_end: { name: 'win_cap' },
		jng_intro_fs: { name: 'fs_intro', volume: 0.7 },
		sfx_multiplier_update: { name: 'dial_tick' },
		sfx_anticipation_start: { name: 'band_pickup', volume: 0.6 },
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.5 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.5 },
		// template names this game never raises — mapped anyway so nothing can
		// fall through to the sprite
		sfx_multiplier_combine_a: { name: 'dial_tick' },
		sfx_multiplier_combine_b: { name: 'dial_tick' },
		sfx_multiplier_explosion_a: { name: 'collect_stamp' },
		sfx_multiplier_explosion_b: { name: 'collect_stamp' },
		sfx_multiplier_explosion_c: { name: 'collect_stamp' },
		sfx_multiplier_reset: { name: 'dial_tick', volume: 0.5 },
		sfx_multiplier_up: { name: 'tumbler_up' },
		sfx_multiplier_win: { name: 'win_mid' },
		sfx_fs_respins: { name: 'tumbler_up' },
		sfx_scatter_reveal: { name: 'dial_tick' },
		tumble_win_1: { name: 'win_small' },
		tumble_win_2: { name: 'win_small' },
		tumble_win_3: { name: 'win_mid' },
		tumble_win_4: { name: 'win_mid' },
		// handled as loops / not at all, below
		sfx_anticipation: null,
		sfx_bigwin_coinloop: null,
	};
	const REEL_STOP_INDEX: Partial<Record<SoundEffectName, number>> = {
		sfx_reel_stop_1: 0, sfx_reel_stop_2: 1, sfx_reel_stop_3: 2, sfx_reel_stop_4: 3, sfx_reel_stop_5: 4,
	};

	// ─── one-shots: Web Audio voices, with <audio> only as a fallback ───
	//
	// 2026-11-06 (ported from PuttMonkey). One-shots used to be one cached
	// HTMLAudioElement per FILE: the five reel stops share reel_stop.wav, so in
	// turbo each stop restarted the same element and cut the last one off, and an
	// element starts 20–100 ms late by a different amount every time, so nothing
	// landed where the picture did. Decoded AudioBuffers start on the audio
	// clock, sample-exact, overlap freely, and can be scheduled AHEAD — which is
	// what puts the instruments' notes on the band's beat.
	//
	// Cues are monophonic per name unless listed in POLY.
	const POLY = new Set<CnSfxName>([
		'reel_stop', 'coin_in', 'dial_tick', 'btn', 'sack_land', 'bandit_land',
		'scatter_1', 'scatter_2', 'scatter_3', 'scatter_4', 'scatter_5', 'win_wake', 'ambient_scene',
		'inst_sax', 'inst_bass', 'inst_snare', 'inst_banjo_maj6', 'inst_banjo_dom7', 'inst_banjo_min7',
	]);
	const MAX_VOICES_PER_CUE = 6;
	const VOICE_CUT_S = 0.025;

	type Voice = { name: CnSfxName; src: AudioBufferSourceNode; gain: GainNode; scale: number; ended: boolean };
	const voices = new Set<Voice>();
	const buffers: Partial<Record<CnSfxName, AudioBuffer>> = {};
	const decoding: Partial<Record<CnSfxName, Promise<AudioBuffer | undefined>>> = {};

	const sfxScales = new WeakMap<HTMLAudioElement, number>();
	const cnSfxAudio: Partial<Record<CnSfxName, HTMLAudioElement>> = {};

	function getCnSfx(name: CnSfxName) {
		let audio = cnSfxAudio[name];
		if (!audio) {
			audio = new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
			audio.preload = 'auto';
			cnSfxAudio[name] = audio;
		}
		return audio;
	}

	function loadBuffer(name: CnSfxName) {
		const ctx = getAudioCtx();
		if (!ctx) return Promise.resolve(undefined);
		if (buffers[name]) return Promise.resolve(buffers[name]);
		decoding[name] ??= fetch(`${base}/assets/audio/${CN_SFX_FILES[name]}`)
			.then((res) => res.arrayBuffer())
			.then((data) => ctx.decodeAudioData(data))
			.then((buffer) => (buffers[name] = buffer))
			.catch(() => {
				delete decoding[name];
				return undefined;
			});
		return decoding[name]!;
	}

	const stopVoice = (voice: Voice, fadeS = VOICE_CUT_S) => {
		if (voice.ended) return;
		voice.ended = true;
		voices.delete(voice);
		const ctx = audioCtx;
		if (!ctx) return;
		const now = ctx.currentTime;
		voice.gain.gain.cancelScheduledValues(now);
		voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
		voice.gain.gain.linearRampToValueAtTime(0, now + fadeS);
		try {
			voice.src.stop(now + fadeS + 0.01);
		} catch {
			/* already stopped */
		}
	};

	/** Start a decoded one-shot. Returns false when it has to fall back. */
	function playVoice(name: CnSfxName, volumeScale: number, rate: number, when?: number, poly = POLY.has(name)) {
		const ctx = audioCtx;
		const buffer = buffers[name];
		// Only on a RUNNING context: a voice started on a suspended one is queued,
		// and everything queued before the unlocking press would go off at once.
		if (!ctx || !buffer || ctx.state !== 'running') return false;
		const mine = [...voices].filter((v) => v.name === name);
		if (!poly) mine.forEach((v) => stopVoice(v));
		else if (mine.length >= MAX_VOICES_PER_CUE) stopVoice(mine[0]);
		const gain = ctx.createGain();
		gain.gain.value = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.playbackRate.value = rate;
		src.connect(gain).connect(ctx.destination);
		const voice: Voice = { name, src, gain, scale: volumeScale, ended: false };
		src.onended = () => {
			voice.ended = true;
			voices.delete(voice);
			gain.disconnect();
		};
		voices.add(voice);
		src.start(Math.max(ctx.currentTime, when ?? 0));
		return true;
	}

	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1) {
		if (document.hidden) return;
		if (playVoice(name, volumeScale, rate)) return;
		void loadBuffer(name);
		const audio = getCnSfx(name);
		sfxScales.set(audio, volumeScale);
		// a fade-out still running on this element must not swallow the new play
		cutGeneration.set(audio, (cutGeneration.get(audio) ?? 0) + 1);
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: one element per file, so a rate
		// left over from the previous caller would carry into the next play.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	// On the band's grid (musicClock): snapped to the next subdivision when that
	// is close enough not to be heard as late, otherwise now.
	function playCnSfxOnGrid(name: CnSfxName, volumeScale = 1, rate = 1, perBeat = 4, withinMs = 45) {
		if (document.hidden) return;
		if (playVoice(name, volumeScale, rate, nextGridTime(perBeat, withinMs) ?? undefined, true)) return;
		playCnSfxLayered(name, volumeScale, rate);
	}

	// Overlapping copies of one clip, whatever POLY says.
	function playCnSfxLayered(name: CnSfxName, volumeScale = 1, rate = 1) {
		if (document.hidden) return;
		if (playVoice(name, volumeScale, rate, undefined, true)) return;
		void loadBuffer(name);
		const audio = getCnSfx(name).cloneNode(true) as HTMLAudioElement;
		audio.loop = false;
		sfxScales.set(audio, volumeScale);
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		audio.playbackRate = rate;
		layeredLive.add(audio);
		audio.addEventListener('ended', () => layeredLive.delete(audio), { once: true });
		audio.play().catch(() => layeredLive.delete(audio));
	}

	// All live one-shots, Web Audio voices and fallback elements alike, follow
	// mute immediately (Engine guideline 107).
	$effect(() => {
		const vol = stateSoundDerived.volumeSoundEffect();
		for (const audio of [...Object.values(cnSfxAudio), ...layeredLive]) {
			if (audio && !audio.loop) audio.volume = Math.min(1, vol * (sfxScales.get(audio) ?? 1));
		}
		const ctx = audioCtx;
		for (const voice of voices) {
			if (!ctx) break;
			voice.gain.gain.cancelScheduledValues(ctx.currentTime);
			voice.gain.gain.setValueAtTime(Math.min(1, vol * voice.scale), ctx.currentTime);
		}
	});

	// ─── one spin's sounds end with that spin ───
	//
	// The reveal of each spin sends soundSpinCut, and everything a spin's result
	// can start — including notes the band scheduled ahead — fades out over
	// CUT_FADE_MS (user report 2026-10-10). The spin's own sounds (spin, reel
	// stops, scatters, the trigger, the curtain) are not on the list.
	const CUT_FADE_MS = 160;
	const SPIN_SCOPED: CnSfxName[] = [
		'collect_grab', 'coin_in', 'collect_stamp', 'bandit_land', 'sack_land', 'tumbler_up',
		'voice_laugh', 'voice_hup', 'bill_counter', 'cash_register', 'fs_intro',
		'win_small', 'win_mid', 'win_big', 'win_super', 'win_mega', 'win_epic', 'win_max', 'win_cap',
		'win_wake', 'count_end',
		'inst_sax', 'inst_bass', 'inst_snare', 'inst_banjo_maj6', 'inst_banjo_dom7', 'inst_banjo_min7',
	];
	const layeredLive = new Set<HTMLAudioElement>();
	const cutGeneration = new WeakMap<HTMLAudioElement, number>();
	const noteTimers = new Set<ReturnType<typeof setTimeout>>();
	function fadeOutCn(audio: HTMLAudioElement) {
		if (audio.paused || audio.ended) return;
		const generation = cutGeneration.get(audio) ?? 0;
		const from = audio.volume;
		const start = performance.now();
		const stop = () => {
			audio.pause();
			audio.currentTime = 0;
			layeredLive.delete(audio);
			audio.volume = from;
		};
		// a hidden tab runs no frames: stop at once rather than never
		if (typeof document !== 'undefined' && document.hidden) return stop();
		const step = () => {
			if ((cutGeneration.get(audio) ?? 0) !== generation) return; // replayed meanwhile
			const k = (performance.now() - start) / CUT_FADE_MS;
			if (k >= 1 || audio.paused) return stop();
			audio.volume = from * (1 - k);
			requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}
	function cutSpinSounds() {
		for (const name of SPIN_SCOPED) {
			const audio = cnSfxAudio[name];
			if (audio) fadeOutCn(audio);
		}
		for (const audio of layeredLive) fadeOutCn(audio);
		for (const voice of [...voices]) {
			if (SPIN_SCOPED.includes(voice.name)) stopVoice(voice, CUT_FADE_MS / 1000);
		}
		for (const timer of noteTimers) clearTimeout(timer);
		noteTimers.clear();
		stopCountUp(false);
	}

	// ─── looping sfx: Web Audio, not <audio loop> ───
	//
	// An HTMLAudioElement with loop = true is NOT gapless; an
	// AudioBufferSourceNode with loop = true loops inside the audio thread with
	// no seam. Gain is ramped, so loops fade in and out.
	//
	// `sync` loops (the tension roll, the count-up bed) are one bar of 128 bpm,
	// unpitched: they start IN PHASE with the band and at its tempo, so their
	// accents fall on its beats instead of wherever the event happened.
	const LOOP_FADE_IN = 0.12;
	const LOOP_FADE_OUT = 0.25;
	const LOOP_BPM = 128;

	let audioCtx: AudioContext | null = null;
	const loopNodes: Partial<Record<CnSfxName, { src: AudioBufferSourceNode; gain: GainNode; scale: number }>> = {};
	const loopGeneration: Partial<Record<CnSfxName, number>> = {};
	const loopElementScale: Partial<Record<CnSfxName, number>> = {};
	// which loops are WANTED right now: a stop arriving while the first play is
	// still decoding must win (jade-family bug: the tension looping forever)
	const loopWanted = new Set<CnSfxName>();

	const getAudioCtx = () => {
		if (typeof window === 'undefined') return null;
		if (!audioCtx) {
			const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return null;
			audioCtx = new Ctor({ latencyHint: 'interactive' });
		}
		// The context starts suspended until a gesture; the game always has one by
		// the time anything loops (the loading screen is dismissed by a press).
		if (audioCtx.state === 'suspended' && !document.hidden) audioCtx.resume().catch(() => {});
		return audioCtx;
	};

	async function playCnLoop(name: CnSfxName, volumeScale = 1, sync = false) {
		const ctx = getAudioCtx();
		if (!ctx) {
			const audio = getCnSfx(name);
			audio.loop = true;
			loopElementScale[name] = volumeScale;
			audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
			if (!audio.paused && !audio.ended) return;
			audio.currentTime = 0;
			audio.play().catch(() => {});
			return;
		}

		if (loopWanted.has(name)) return;
		loopWanted.add(name);
		if (loopNodes[name]) return; // already running — never restart it
		const generation = (loopGeneration[name] ?? 0) + 1;
		loopGeneration[name] = generation;

		const buffer = await loadBuffer(name);
		if (!buffer) {
			if (loopGeneration[name] === generation) loopWanted.delete(name);
			return;
		}
		if (loopNodes[name] || !loopWanted.has(name) || loopGeneration[name] !== generation) return;

		const target = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.0001, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), ctx.currentTime + LOOP_FADE_IN);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = true;
		let offset = 0;
		const phase = sync ? barPhase() : -1;
		if (phase >= 0) {
			src.playbackRate.value = musicBpm() / LOOP_BPM;
			offset = phase * buffer.duration;
		}
		src.connect(gain).connect(ctx.destination);
		src.start(ctx.currentTime, offset);
		loopNodes[name] = { src, gain, scale: volumeScale };
	}

	$effect(() => {
		const vol = stateSoundDerived.volumeSoundEffect();
		const ctx = audioCtx;
		for (const node of Object.values(loopNodes)) {
			if (!node || !ctx) continue;
			node.gain.gain.cancelScheduledValues(ctx.currentTime);
			node.gain.gain.setValueAtTime(Math.min(1, vol * node.scale), ctx.currentTime);
		}
		for (const [name, scale] of Object.entries(loopElementScale)) {
			const audio = cnSfxAudio[name as CnSfxName];
			if (audio?.loop) audio.volume = Math.min(1, vol * (scale ?? 1));
		}
	});

	function stopCnLoop(name: CnSfxName) {
		loopGeneration[name] = (loopGeneration[name] ?? 0) + 1;
		loopWanted.delete(name);
		const node = loopNodes[name];
		if (!node) return;
		delete loopNodes[name];
		const ctx = audioCtx;
		if (!ctx) {
			node.src.stop();
			return;
		}
		const end = ctx.currentTime + LOOP_FADE_OUT;
		node.gain.gain.cancelScheduledValues(ctx.currentTime);
		node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), ctx.currentTime);
		node.gain.gain.exponentialRampToValueAtTime(0.0001, end);
		node.src.stop(end);
	}

	function stopCnSfx(name: CnSfxName) {
		const audio = cnSfxAudio[name];
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
		for (const voice of [...voices]) if (voice.name === name) stopVoice(voice);
	}

	// ─── the count-up bed ───
	let countUpOn = false;
	function stopCountUp(done: boolean) {
		if (!countUpOn) return;
		countUpOn = false;
		stopCnLoop('count_loop');
		stopCnSfx('count_loop');
		if (done) playCnSfxOnGrid('count_end', 0.62, 1, 2, 70);
	}

	// ─── music: two stems on one clock ───
	//
	// 2026-11-06 (generate_swing_audio_v2.py): each loop is a BED (walking bass,
	// piano, the horns' tune) and a GROOVE (the drums; in the free game also the
	// horn backgrounds) of identical length, started on the same context instant
	// so they stay sample-locked. The groove's gain is the adaptive part: at rest
	// it sits low and the room hears the tune; when the reels spin, a tease runs
	// or a win plays the drummer comes in, and when the action stops he waits a
	// moment and settles back.
	const BGM_FILES = {
		base: { bed: 'swing/bgm_main.mp3', groove: 'swing/bgm_main_groove.mp3', bpm: 128, swing: 0.64 },
		freespin: { bed: 'swing/bgm_freespin.mp3', groove: 'swing/bgm_freespin_groove.mp3', bpm: 160, swing: 0.6 },
	} as const;
	type BgmType = keyof typeof BGM_FILES;
	const GROOVE_REST: Record<BgmType, number> = { base: 0.34, freespin: 0.6 };
	const GROOVE_UP_TAU = 0.05;
	const GROOVE_DOWN_TAU = 0.55;
	const GROOVE_HOLD_MS = 900;

	let bgmNodes: AudioBufferSourceNode[] = [];
	let bgmGain: GainNode | null = null;
	let grooveGain: GainNode | null = null;
	let bgmRequest = 0;
	let currentBgm: BgmType | null = null;
	const bgmBuffers: Partial<Record<string, AudioBuffer>> = {};
	const grooveReasons = new Set<string>();
	let grooveRelease: ReturnType<typeof setTimeout> | undefined;

	async function bgmBuffer(file: string, ctx: AudioContext) {
		if (bgmBuffers[file]) return bgmBuffers[file];
		const res = await fetch(`${base}/assets/audio/${file}`);
		if (!res.ok) throw new Error(`BGM HTTP ${res.status}`);
		const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
		bgmBuffers[file] = buffer;
		return buffer;
	}

	const grooveTarget = () =>
		currentBgm ? (grooveReasons.size ? 1 : GROOVE_REST[currentBgm]) : 0;

	function applyGroove(immediate = false) {
		const ctx = audioCtx;
		if (!ctx || !grooveGain) return;
		const target = grooveTarget();
		const now = ctx.currentTime;
		grooveGain.gain.cancelScheduledValues(now);
		if (immediate) grooveGain.gain.setValueAtTime(target, now);
		else {
			grooveGain.gain.setValueAtTime(grooveGain.gain.value, now);
			grooveGain.gain.setTargetAtTime(target, now, target > grooveGain.gain.value ? GROOVE_UP_TAU : GROOVE_DOWN_TAU);
		}
	}

	function setGroove(reason: string, on: boolean) {
		// a new spin owns the music: whatever the last round left raised (a win
		// presentation the player skipped) cannot keep the groove up past it
		if (on && reason === 'spin') grooveReasons.clear();
		if (on) {
			if (grooveRelease) clearTimeout(grooveRelease);
			grooveRelease = undefined;
			grooveReasons.add(reason);
			applyGroove();
			return;
		}
		grooveReasons.delete(reason);
		if (grooveReasons.size) return;
		if (grooveRelease) clearTimeout(grooveRelease);
		grooveRelease = setTimeout(() => {
			grooveRelease = undefined;
			applyGroove();
		}, GROOVE_HOLD_MS);
	}

	async function playBgm(type: BgmType) {
		const ctx = getAudioCtx();
		if (!ctx) return;
		if (currentBgm === type && bgmNodes.length) return;
		const request = ++bgmRequest;
		stopBgmNodes();
		currentBgm = type;
		const files = BGM_FILES[type];
		let bed: AudioBuffer, groove: AudioBuffer;
		try {
			[bed, groove] = await Promise.all([bgmBuffer(files.bed, ctx), bgmBuffer(files.groove, ctx)]);
		} catch {
			return;
		}
		if (request !== bgmRequest) return;
		const master = ctx.createGain();
		master.gain.value = stateSoundDerived.volumeMusic();
		master.connect(ctx.destination);
		const grooveMix = ctx.createGain();
		grooveMix.connect(master);
		// one instant for both, a little ahead so neither starts late
		const when = ctx.currentTime + 0.06;
		const sources = [bed, groove].map((buffer, i) => {
			const src = ctx.createBufferSource();
			src.buffer = buffer;
			src.loop = true;
			src.connect(i === 0 ? master : grooveMix);
			src.start(when);
			return src;
		});
		bgmNodes = sources;
		bgmGain = master;
		grooveGain = grooveMix;
		applyGroove(true);
		setMusicClock({ ctx, start: when, bpm: files.bpm, swing: files.swing });
	}

	function stopBgmNodes() {
		for (const node of bgmNodes) {
			try {
				node.stop();
			} catch {
				/* not started */
			}
			node.disconnect();
		}
		bgmNodes = [];
		if (bgmGain) bgmGain.disconnect();
		if (grooveGain) grooveGain.disconnect();
		bgmGain = null;
		grooveGain = null;
		setMusicClock(null);
	}

	function stopBgm() {
		bgmRequest++;
		stopBgmNodes();
		currentBgm = null;
	}

	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmGain) bgmGain.gain.value = vol;
	});

	// ─── the room between songs ───
	let ambientTimer: ReturnType<typeof setTimeout> | undefined;
	const ambientLive = new Set<HTMLAudioElement>();
	const scheduleAmbience = (first = false) => {
		ambientTimer = setTimeout(() => {
			if (currentBgm && bgmNodes.length && !document.hidden && !stateModal.modal &&
				!loopNodes.reel_tension && !loopNodes.reel_tension_fg && !grooveReasons.size &&
				stateSoundDerived.volumeMusic() > 0.02 &&
				stateSoundDerived.volumeSoundEffect() > 0.02) {
				// follows the MUSIC level too: it is the room, not the game
				const scale = 0.5 * stateSoundDerived.volumeMusic();
				if (!playVoice('ambient_scene', scale, 0.96 + Math.random() * 0.08)) {
					const audio = getCnSfx('ambient_scene').cloneNode(true) as HTMLAudioElement;
					audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * scale);
					audio.playbackRate = 0.96 + Math.random() * 0.08;
					ambientLive.add(audio);
					audio.addEventListener('ended', () => ambientLive.delete(audio), { once: true });
					audio.play().catch(() => ambientLive.delete(audio));
				}
			}
			scheduleAmbience();
		}, first ? 6000 + Math.random() * 2500 : 14000 + Math.random() * 8000);
	};
	$effect(() => {
		const volume = Math.min(1, stateSoundDerived.volumeMusic() * stateSoundDerived.volumeSoundEffect() * 0.5);
		for (const audio of ambientLive) audio.volume = volume;
	});

	// ─── the band's notes on the symbols (game/jazzBand.ts) ───
	function playJazzNotes(notes: JazzNote[]) {
		if (document.hidden) return;
		const ctx = audioCtx;
		for (const note of notes) {
			const name = note.name as CnSfxName;
			if (note.at !== null && ctx?.state === 'running' && buffers[name]) {
				playVoice(name, note.gain, note.rate, note.at, true);
				continue;
			}
			const timer = setTimeout(() => {
				noteTimers.delete(timer);
				playCnSfxLayered(name, note.gain, note.rate);
			}, note.delayMs);
			noteTimers.add(timer);
		}
	}

	context.eventEmitter.subscribeOnMount({
		// ui
		soundBetMode: async ({ betModeKey }) => {
			void betModeKey;
			playBgm('base');
		},
		// PRESSING BUY BONUS SETS OFF A BAND HIT; every other button clicks.
		//
		// The shared ButtonBuyBonus raises the same generic soundPressGeneral as
		// every other control. Its handler broadcasts this event and THEN opens the
		// buy menu, both synchronously, so the decision is deferred by one
		// microtask (still inside the same gesture) and by then stateModal says
		// which button it was.
		soundPressGeneral: () => {
			const before = stateModal.modal?.name;
			queueMicrotask(() => {
				// Two literal calls, not one with a ternary: design/check_audio.mjs
				// reads cue names straight out of playCnSfx(...).
				if (stateModal.modal?.name === 'buyBonus' && before !== 'buyBonus') {
					playCnSfx('safe_open', 0.8);
				} else {
					playCnSfx('btn', 0.7);
				}
			});
		},
		soundPressBet: () => {
			// the drummer comes in with the press, not ~0.6 s later when the reveal
			// arrives; the reveal's own 'spin' reason takes over
			setGroove('press', true);
			setTimeout(() => setGroove('press', false), 1500);
			playCnSfx('spin', 0.9);
		},
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') {
				playBgm('base');
			} else if (name === 'bgm_freespin') {
				playBgm('freespin');
			} else {
				// win-level music (bgm_winlevel_*) is deliberately not switched to:
				// the fanfares in soundWinTier sit over the running band instead
			}
		},
		soundLoop: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') {
				// a ONE-SHOT despite the event name: a piano tremolo into the count.
				// The count's own bed is soundCountUp.
				playCnSfx('bill_counter', 0.55);
			} else if (name === 'sfx_anticipation') {
				// covered by the drum roll (soundReelTensionStart)
			}
		},
		soundOnce: ({ name, forcePlay }) => {
			void forcePlay;
			const reel = REEL_STOP_INDEX[name];
			if (reel !== undefined) {
				// each reel lands on the next chord tone of the bar the band is in:
				// a spin settling plays a little line in the band's harmony
				playCnSfx('reel_stop', 0.95, chordToneRate(reel));
				return;
			}
			const mapped = SPRITE_TO_CN[name];
			if (mapped) playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
		},
		soundFreeGameBell: () => playCnSfxOnGrid('alarm_bell', 1, 1, 2, 60),
		soundBigWinBlast: () => playCnSfx('bigwin_slam'),
		soundChefSlice: () => playCnSfx('fg_level_windup', 0.78),
		soundChefChop: () => playCnSfx('fg_level_impact', 0.86),
		soundStamp: () => playCnSfx('collect_stamp', 0.74),
		soundLadderUp: ({ level }) =>
			playCnSfx('fg_level_reveal', Math.min(.88, .72 + .08 * (level - 1)), 1 + .04 * (level - 1)),
		soundSackLand: () => playCnSfx('sack_land', 0.55),
		soundCollectGrab: () => playCnSfx('collect_grab', 0.8),
		// each record into the collector a chord tone higher, so a long collect
		// plays an arpeggio up the band's chord instead of a pitch creeping up
		soundCoinIn: ({ index }) => playCnSfxLayered('coin_in', 0.62, chordToneRate(index)),
		soundCollectStamp: () => playCnSfx('collect_stamp', 0.9),
		soundSpinCut: () => cutSpinSounds(),
		soundGroove: ({ reason, on }) => setGroove(reason, on),
		// up the chord reel by reel, snapped to the sixteenth grid
		soundWinWake: ({ index }) => playCnSfxOnGrid('win_wake', 0.5, chordToneRate(index)),
		soundCountUp: ({ on, big, done }) => {
			if (on) {
				if (countUpOn) return;
				countUpOn = true;
				playCnLoop('count_loop', big ? 0.75 : 0.5, true);
			} else stopCountUp(!!done);
		},
		soundJazzNotes: ({ notes }) => playJazzNotes(notes),
		soundShutterDown: () => playCnSfx('shutter_down', 0.85),
		soundDoorSlide: () => playCnSfx('door_slide', 0.8),
		soundDoorClack: () => playCnSfx('door_clack', 1),
		soundDoorOpen: () => playCnSfx('door_open', 0.7),
		// FIVE TIERS, five fanfares, each on the beat: the horn section starts with
		// the band's next eighth when it is that close (Win.svelte climbs the
		// tiers one by one, each landing on a beat)
		soundWinTier: ({ tier }) => {
			if (tier === 'big') playCnSfxOnGrid('win_big', 0.8, 1, 2, 70);
			else if (tier === 'superwin') playCnSfxOnGrid('win_super', 0.8, 1, 2, 70);
			else if (tier === 'mega') playCnSfxOnGrid('win_mega', 0.82, 1, 2, 70);
			else if (tier === 'epic') playCnSfxOnGrid('win_epic', 0.85, 1, 2, 70);
			else if (tier === 'max') playCnSfxOnGrid('win_max', 0.88, 1, 2, 70);
		},
		soundMonkeyExpand: () => playCnSfx('bandit_land'),
		// Deliberately NOT forced through the turbo gate that silences ordinary
		// one-shots: these are tied to animations that play at their own length.
		soundMascotVoice: ({ name }) =>
			playCnSfx(MASCOT_VOICE_FILE[name], MASCOT_VOICE_GAIN[name]),
		soundReelTensionStart: () => {
			setGroove('tension', true);
			// the roll is one bar: started in phase and at the band's tempo
			if (context.stateGame.gameType === 'freegame') playCnLoop('reel_tension_fg', 0.62, true);
			else playCnLoop('reel_tension', 0.62, true);
		},
		// stopCnLoop, not stopCnSfx: the loops are Web Audio
		soundReelTensionStop: () => {
			setGroove('tension', false);
			stopCnLoop('reel_tension');
			stopCnLoop('reel_tension_fg');
			stopCnSfx('reel_tension');
			stopCnSfx('reel_tension_fg');
		},
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') {
				stopBgm();
			} else if (name === 'sfx_bigwin_coinloop') {
				stopCnLoop('bill_counter');
				stopCnSfx('bill_counter');
			} else if (name === 'sfx_anticipation') {
				stopCnLoop('reel_tension');
				stopCnLoop('reel_tension_fg');
				stopCnSfx('reel_tension');
				stopCnSfx('reel_tension_fg');
				sound.stop({ name });
			} else {
				sound.stop({ name });
			}
		},
		soundFade: async ({ name, duration, from, to }) => await sound.fade({ name, duration, from, to }), // prettier-ignore
	});

	onMount(() => {
		// Decode every one-shot up front so the first play is on time. (Elements
		// are only made for the fallback path, so nothing downloads twice.)
		if (getAudioCtx()) (Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach((name) => void loadBuffer(name));
		else (Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);

		const unlock = () => { getAudioCtx(); };
		const visibility = () => {
			if (document.hidden) {
				for (const audio of [...Object.values(cnSfxAudio), ...layeredLive, ...ambientLive]) audio?.pause();
				layeredLive.clear();
				ambientLive.clear();
				audioCtx?.suspend().catch(() => {});
			} else if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
		};
		document.addEventListener('pointerdown', unlock);
		document.addEventListener('keydown', unlock);
		document.addEventListener('visibilitychange', visibility);
		playBgm('base');
		scheduleAmbience(true);

		return () => {
			document.removeEventListener('pointerdown', unlock);
			document.removeEventListener('keydown', unlock);
			document.removeEventListener('visibilitychange', visibility);
			for (const audio of layeredLive) audio.pause();
			layeredLive.clear();
			if (ambientTimer) clearTimeout(ambientTimer);
			if (grooveRelease) clearTimeout(grooveRelease);
			for (const timer of noteTimers) clearTimeout(timer);
			noteTimers.clear();
			for (const voice of [...voices]) stopVoice(voice, 0);
			for (const audio of ambientLive) audio.pause();
			ambientLive.clear();
			stopBgm();
			for (const name of Object.keys(cnSfxAudio) as CnSfxName[]) {
				const audio = cnSfxAudio[name];
				if (audio) {
					audio.pause();
					audio.src = '';
					delete cnSfxAudio[name];
				}
			}
			for (const name of Object.keys(loopNodes) as CnSfxName[]) stopCnLoop(name);
			audioCtx?.close().catch(() => {});
			audioCtx = null;
		};
	});
</script>

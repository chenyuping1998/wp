<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	// What the mascot can say. One clip per animation — see
	// design/generate_voice.mjs, which synthesizes them.
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
		// the heist's own moments, which used to borrow multiplier sounds
		| { type: 'soundSackLand' }
		| { type: 'soundCollectGrab' }
		| { type: 'soundCollectionStart' }
		| { type: 'soundCollectionStop' }
		| { type: 'soundCollectionSink'; index: number }
		| { type: 'soundCoinIn'; index: number }
		| { type: 'soundCollectStamp' }
		| { type: 'soundShutterDown' }
		// the transition's sliding shop door (design/generate_door_audio.py)
		| { type: 'soundDoorSlide' }
		| { type: 'soundDoorClack' }
		| { type: 'soundGolfRoll' }
		| { type: 'soundGolfCup' }
		| { type: 'soundDoorOpen' }
		| { type: 'soundMascotVoice'; name: MascotVoice }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' }
		// a new spin is starting: whatever the last spin's win and collection
		// left ringing fades out now (bookEventHandlerMap reveal)
		| { type: 'soundSpinCut' }
		// adaptive music (2026-11-06): the groove stem swells while something is
		// happening — the reels turning, a tease, a win — and settles at rest
		| { type: 'soundGroove'; reason: 'spin' | 'win' | 'plaque'; on: boolean }
		// one note per reel as the win lights up across the board, on the grid
		| { type: 'soundWinWake'; index: number }
		// the count-up bed under a rolling win amount, in phase with the music
		| { type: 'soundCountUp'; on: boolean; big?: boolean; done?: boolean };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet, stateModal, stateSoundDerived } from 'state-shared';
	import { base } from '$app/paths';

	import { getContext } from '../game/context';
	import { setMusicClock, nextGridTime, barPhase, musicBpm } from '../game/musicClock';

	const context = getContext();

	// Original Monkey King set (MONKEYKING_音效需求單.md; sources in design/source/swing/audio).
	// Every sprite name is mapped below so the template sounds.json is not heard.
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
		| 'putt_roll_loop'
		| 'putt_tap'
		| 'putt_sink'
		| 'coin_in'
		| 'collect_stamp'
		| 'tumbler_up'
		| 'dial_tick'
		| 'reel_tension'
		| 'fg_level_windup'
		| 'fg_level_impact'
		| 'fg_level_reveal'
		| 'anticipation_pickup'
		| 'alarm_bell'
		| 'alarm_trip'
		| 'sack_throw'
		| 'shutter_down'
		| 'door_slide'
		| 'door_clack'
		| 'golf_roll'
		| 'golf_cup'
		| 'ambient_far'
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
		| 'count_end';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		btn: 'putt/btn.wav',
		spin: 'putt/spin.wav',
		reel_stop: 'putt/reel_stop.wav',
		scatter_1: 'putt/scatter_1.wav',
		scatter_2: 'putt/scatter_2.wav',
		scatter_3: 'putt/scatter_3.wav',
		scatter_4: 'putt/scatter_4.wav',
		scatter_5: 'putt/scatter_5.wav',
		sack_land: 'putt/sack_land.wav',
		bandit_land: 'putt/bandit_land.wav',
		collect_grab: 'putt/collect_grab.wav',
		putt_roll_loop: 'putt/putt_roll_loop.wav',
		putt_tap: 'putt/putt_tap.wav',
		putt_sink: 'putt/putt_sink.wav',
		coin_in: 'putt/coin_in.wav',
		collect_stamp: 'putt/collect_stamp.wav',
		tumbler_up: 'putt/tumbler_up.wav',
		dial_tick: 'putt/dial_tick.wav',
		reel_tension: 'putt/anticipation_theme.wav',
		fg_level_windup: 'putt/fg_level_windup.wav',
		fg_level_impact: 'putt/fg_level_impact.wav',
		fg_level_reveal: 'putt/fg_level_reveal.wav',
		anticipation_pickup: 'putt/anticipation_pickup.wav',
		alarm_bell: 'putt/alarm_bell.wav',
		alarm_trip: 'putt/alarm_trip.wav',
		sack_throw: 'putt/sack_throw.wav',
		shutter_down: 'putt/shutter_down.wav',
		door_slide: 'putt/door_slide.wav',
		door_clack: 'putt/door_clack.wav',
		golf_roll: 'putt/golf_roll.wav',
		golf_cup: 'putt/golf_cup.wav',
		ambient_far: 'putt/ambient_far.wav',
		door_open: 'putt/door_open.wav',
		shutter_slam: 'putt/shutter_slam.wav',
		safe_open: 'putt/safe_open.wav',
		fs_intro: 'putt/fs_intro.wav',
		win_small: 'putt/win_small.wav',
		win_mid: 'putt/win_mid.wav',
		bill_counter: 'putt/bill_counter.wav',
		cash_register: 'putt/cash_register.wav',
		bigwin_slam: 'putt/bigwin_slam.wav',
		win_big: 'putt/win_big.wav',
		win_super: 'putt/win_super.wav',
		win_mega: 'putt/win_mega.wav',
		win_epic: 'putt/win_epic.wav',
		win_max: 'putt/win_max.wav',
		win_cap: 'putt/win_cap.wav',
		voice_laugh: 'putt/voice_laugh.wav',
		voice_hup: 'putt/voice_hup.wav',
		win_wake: 'putt/win_wake.wav',
		count_loop: 'putt/count_loop.wav',
		count_end: 'putt/count_end.wav',
	};

	// He is a character in the scene, not the interface, so he sits UNDER
	// everything the game says with a sound of its own. Per clip, because they
	// were levelled against each other and not against the rest of the set: the
	// chirp plays on most paying spins and has to disappear into the mix, the
	// chest-beat roar is the loudest thing he ever does.
	// Louder than the first pass. These play UNDER a big-win blast, a coin
	// shimmer and the fast free-game bed, and at 0.6 the cheer was mixed low
	// enough to be arguable whether it was there at all — which is not a level,
	// it is an absence with a volume control on it.
	const MASCOT_VOICE_FILE: Record<MascotVoice, CnSfxName> = {
		roar: 'voice_laugh',
		effort: 'voice_hup',
	};
	const MASCOT_VOICE_GAIN: Record<MascotVoice, number> = {
		roar: 1,
		effort: 0.8,
	};

	// Sprite sound names re-routed to this game's set.
	//
	// `rate` sets playbackRate, which on a short percussive sample reads as pitch.
	// The five reel stops share one file and used to be indistinguishable — worse,
	// only _1 was ever played, so every reel landed on the identical click. They
	// now rise reel by reel, which is what gives a spin its sense of building
	// toward the last reel.
	const SPRITE_TO_CN: Record<
		SoundEffectName,
		{ name: CnSfxName; volume?: number; rate?: number } | null
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		// C D E G A: the stop is a knock tuned to C, so five reels play the
		// pentatonic scale up (2026-11-06; was 0.92..1.3, between the notes)
		sfx_reel_stop_1: { name: 'reel_stop', rate: 1 },
		sfx_reel_stop_2: { name: 'reel_stop', rate: 1.1225 },
		sfx_reel_stop_3: { name: 'reel_stop', rate: 1.2599 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.4983 },
		sfx_reel_stop_5: { name: 'reel_stop', rate: 1.6818 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		// a Chef landing on the reels
		sfx_multiplier_landing: { name: 'bandit_land', volume: 0.8 },
		sfx_wild_explode: { name: 'bandit_land' },
		sfx_winlevel_small: { name: 'win_small' },
		sfx_winlevel_nice: { name: 'win_small' },
		sfx_winlevel_standard: { name: 'win_mid', volume: 0.8 },
		sfx_winlevel_substantial: { name: 'win_mid' },
		sfx_scatter_win: { name: 'win_mid' },
		// the scatter count that sets the alarm off
		sfx_scatter_win_v2: { name: 'alarm_trip' },
		// the transition opening: the sack thrown at the shutter
		sfx_superfreespin: { name: 'sack_throw', volume: 0.8 },
		sfx_youwon_panel: { name: 'cash_register', volume: 0.72 },
		sfx_winlevel_end: { name: 'win_cap' },
		jng_intro_fs: { name: 'fs_intro', volume: 0.8 },
		sfx_multiplier_update: { name: 'dial_tick' },
		sfx_anticipation_start: { name: 'anticipation_pickup', volume: 0.58 },
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

	// ─── one-shots: Web Audio voices, with <audio> only as a fallback ───
	//
	// 2026-11-06. One-shots used to be one cached HTMLAudioElement per FILE. Two
	// things followed from that and both were heard as bad rhythm:
	//   - the five reel stops share reel_stop.wav, so every stop RESTARTED the
	//     same element: in turbo, where reels land 40–70 ms apart, the earlier
	//     stops were cut off and only the last one was heard;
	//   - an element starts 20–100 ms late (more on mobile Safari) and by a
	//     different amount each time, so nothing landed where the picture did.
	// Decoded AudioBuffers start on the audio clock, sample-exact, and any number
	// of them overlap. Every file is decoded once at mount; until its buffer is
	// ready (or with no Web Audio at all) the element path below still plays it.
	//
	// Cues are monophonic per name unless listed in POLY: a fanfare retriggered
	// cuts its previous self, a reel stop or a ball does not.
	const POLY = new Set<CnSfxName>([
		'reel_stop', 'putt_tap', 'putt_sink', 'coin_in', 'dial_tick', 'btn', 'sack_land', 'bandit_land',
		'scatter_1', 'scatter_2', 'scatter_3', 'scatter_4', 'scatter_5', 'win_wake', 'ambient_far',
	]);
	// at most this many copies of one cue sound at once; the oldest goes first
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

	// On the music's grid (musicClock): snapped to the next sixteenth when that is
	// close enough not to be heard as late, otherwise now.
	function playCnSfxOnGrid(name: CnSfxName, volumeScale = 1, rate = 1) {
		if (document.hidden) return;
		if (playVoice(name, volumeScale, rate, nextGridTime(4, 45) ?? undefined, true)) return;
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
	// Every one-shot here plays to its end, whatever happens next. After a Wild
	// collection the spin's tail — the collect chimes, the laugh, the abacus
	// count, a 2–6s win fanfare — kept ringing well into the NEXT spin (user
	// report, 2026-10-10: the collection's sound should belong to its own spin
	// and be gone once the reels turn again). The reveal of each spin sends
	// soundSpinCut, and everything a spin's result can start fades out over
	// CUT_FADE_MS. The spin's own sounds (spin, reel stops, scatters, the
	// trigger bell, the door) are not on the list.
	const CUT_FADE_MS = 160;
	const SPIN_SCOPED: CnSfxName[] = [
		'collect_grab', 'coin_in', 'collect_stamp', 'bandit_land', 'sack_land', 'tumbler_up',
		'voice_laugh', 'voice_hup', 'bill_counter', 'cash_register', 'fs_intro',
		'win_small', 'win_mid', 'win_big', 'win_super', 'win_mega', 'win_epic', 'win_max', 'win_cap',
		'win_wake', 'count_end', 'putt_sink', 'putt_tap',
	];
	const layeredLive = new Set<HTMLAudioElement>();
	const cutGeneration = new WeakMap<HTMLAudioElement, number>();
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
		stopCountUp(false);
	}

	// ─── looping sfx: Web Audio, not <audio loop> ───
	//
	// An HTMLAudioElement with loop = true is NOT gapless: the browser restarts
	// playback at the wrap and the silence either side is plainly audible. An
	// AudioBufferSourceNode with loop = true loops inside the audio thread and
	// has no seam at all. Gain is ramped, so loops fade in and out.
	//
	// `sync` loops (the tension roll, the count-up bed) are one bar of 120 bpm:
	// they are started IN PHASE with the running music and at its tempo, so their
	// accents fall on the music's beats instead of wherever the event happened.
	const LOOP_FADE_IN = 0.12;
	const LOOP_FADE_OUT = 0.25;
	const LOOP_BPM = 120;

	let audioCtx: AudioContext | null = null;
	const loopNodes: Partial<Record<CnSfxName, { src: AudioBufferSourceNode; gain: GainNode; scale: number }>> = {};
	const loopGeneration: Partial<Record<CnSfxName, number>> = {};
	// the element fallback's own scale, for the same reason
	const loopElementScale: Partial<Record<CnSfxName, number>> = {};
	// which loops are WANTED right now. The first play of a loop awaits its
	// fetch + decode; a stop arriving in that window found no node to stop, and
	// the node created after the decode then looped forever (the reel tension
	// under a quick anticipation, heard repeating after the free game).
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
		// No Web Audio (very old browser): fall back to the element, seam and all —
		// a slightly choppy loop beats silence.
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
		// Awaiting the decode above means a stop() could have arrived in the
		// meantime, and a second play() could have won the race.
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

	// A loop's gain was set once, when it started. Muting during a big win left
	// loops playing at the old level until the plaque closed — follow the
	// setting here, without a ramp: a mute should be a mute.
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
		if (done) playCnSfxOnGrid('count_end', 0.62);
	}

	// ─── music: two stems on one clock ───
	//
	// 2026-11-06 (generate_putt_audio_v2.py): each loop is a BED and a GROOVE stem
	// of identical length, started on the same context instant so they stay
	// sample-locked for as long as they loop. The groove's own gain is the
	// adaptive part: at rest it sits low (the bed carries the tune), while the
	// reels spin, a tease runs or a win plays it comes up to full, and when the
	// action stops it waits a moment and settles back — so the music breathes
	// with the game instead of running past it. Decode once, loop in the audio
	// thread; LAME's Xing data removes the MP3 encoder delay/padding.
	const BGM_FILES = {
		base: { bed: 'putt/bgm_main.mp3', groove: 'putt/bgm_main_groove.mp3', bpm: 120 },
		freespin: { bed: 'putt/bgm_freespin.mp3', groove: 'putt/bgm_freespin_groove.mp3', bpm: 140 },
	} as const;
	type BgmType = keyof typeof BGM_FILES;
	// groove level at rest / in action, per scene: the free game never drops as far
	const GROOVE_REST: Record<BgmType, number> = { base: 0.32, freespin: 0.62 };
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
		// held a moment: autoplay's next spin usually arrives before it lets go
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
		setMusicClock({ ctx, start: when, bpm: files.bpm });
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

	// Keep volume in sync with settings
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmGain) bgmGain.gain.value = vol;
	});

	let ambientTimer: ReturnType<typeof setTimeout> | undefined;
	let ambienceSuppressedUntil = 0;
	const ambientLive = new Set<HTMLAudioElement>();
	const scheduleAmbience = (first = false) => {
		ambientTimer = setTimeout(() => {
			// Other lanes can be heard while this lane is being played. The cue is
			// soft, but does not require a long idle stretch between spins.
			if (currentBgm && bgmNodes.length && !document.hidden &&
				!stateModal.modal &&
				performance.now() > ambienceSuppressedUntil &&
				stateSoundDerived.volumeMusic() > 0.02 &&
				stateSoundDerived.volumeSoundEffect() > 0.02) {
				// Separate from result-scoped sounds: starting a spin must not cut the
				// birds halfway through. Its gain follows the MUSIC level too.
				const scale = 0.34 * stateSoundDerived.volumeMusic();
				if (!playVoice('ambient_far', scale, 0.94 + Math.random() * 0.12)) {
					const audio = getCnSfx('ambient_far').cloneNode(true) as HTMLAudioElement;
					audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * scale);
					audio.playbackRate = 0.94 + Math.random() * 0.12;
					ambientLive.add(audio);
					audio.addEventListener('ended', () => ambientLive.delete(audio), { once: true });
					audio.play().catch(() => ambientLive.delete(audio));
				}
			}
			scheduleAmbience();
		}, first ? 4500 + Math.random() * 2500 : 12000 + Math.random() * 7000);
	};
	$effect(() => {
		const volume = Math.min(1, stateSoundDerived.volumeSoundEffect() *
			stateSoundDerived.volumeMusic() * 0.34);
		for (const audio of ambientLive) audio.volume = volume;
	});

	// Reel stops and balls walk C pentatonic (the sample is tuned to C), so a
	// spin landing reel by reel, or a collection sinking ball after ball, is a
	// little tune in the music's key rather than a pitch that just creeps up.
	const PENTA_RATE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24].map((st) => 2 ** (st / 12));
	const pentaRate = (i: number) => PENTA_RATE[Math.max(0, Math.min(PENTA_RATE.length - 1, i))];

	context.eventEmitter.subscribeOnMount({
		// ui
		soundBetMode: async ({ betModeKey }) => {
			void betModeKey;
			playBgm('base');
		},
		// PRESSING BUY BONUS SETS OFF A SMALL CHARGE; every other button clicks.
		//
		// The shared ButtonBuyBonus raises the same generic soundPressGeneral as
		// every other control, so the press itself carries nothing to tell them
		// apart — and per-game behaviour does not belong in wp/packages, where a
		// key would also affect every other game and has twice gone missing under
		// another session's edits.
		//
		// It is identifiable from here anyway: that button's handler broadcasts
		// this event and THEN opens the buy menu, both synchronously. So the
		// decision is deferred by one microtask — which runs after the whole click
		// handler, still inside the same task and the same user gesture, so audio
		// is not blocked — and by then stateModal says which button it was. Any
		// other press, including Buy Bonus while a bought mode is active (that
		// cancels, and opens nothing), falls through to the normal click.
		soundPressGeneral: () => {
			const before = stateModal.modal?.name;
			queueMicrotask(() => {
				// Two literal calls, not one with a ternary: design/check_audio.mjs
				// reads cue names straight out of playCnSfx(...) and a name hidden
				// inside an expression stops being checked - it counted one cue
				// fewer the moment this was written the short way.
				if (stateModal.modal?.name === 'buyBonus' && before !== 'buyBonus') {
					// 0.7 puts the press at 64% of the reel blast's punch (loudest
					// 50ms window, both at the volume they actually play): the brief
					// was 60-70%. Measured rather than judged by ear, because the
					// first version sounded weak for a reason a volume knob does not
					// fix - almost all of it was 48-138Hz body, 13dB down above
					// 300Hz, which is the part a laptop speaker reproduces. The
					// bolt and door carry it now; see design/generate_audio_heist.py.
					playCnSfx('safe_open', 0.8);
				} else {
					playCnSfx('btn', 0.7);
				}
			});
		},
		soundPressBet: () => {
			// the groove comes up with the press, not ~0.6 s later when the reveal
			// arrives (the pre-spin runs first); the reveal's own 'spin' takes over
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
				// the fanfares in soundWinTier sit over the running bed instead
			}
		},
		soundLoop: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') {
				// Deliberately a ONE-SHOT despite the event name, the same way
				// sfx_anticipation is deliberately a no-op here: this is where a logical
				// sound name is turned into what actually happens, and the caller should
				// not have to know which clips can bear repeating.
				//
				// coin_shimmer is a 2.4s chime with a clear attack. Looping it under a
				// win count-up — on a plaque that stays up until the player presses —
				// rang that chime over and over, which is what came back as "a bell
				// repeating while the score counts". Making the loop gapless (playCnLoop,
				// now Web Audio) fixed the seam but not the repetition, and repetition
				// was the complaint. One pass accents the start of the count-up and then
				// leaves it alone. A continuous bed needs a longer, flatter clip, not
				// this one on repeat.
				playCnSfx('bill_counter', 0.7);
			} else if (name === 'sfx_anticipation') {
				// covered by the theme-specific anticipation loop (soundReelTensionStart)
			}
		},
		soundOnce: ({ name, forcePlay }) => {
			void forcePlay;
			const mapped = SPRITE_TO_CN[name];
			if (mapped) playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
		},
		soundFreeGameBell: () => playCnSfx('alarm_bell'),
		soundBigWinBlast: () => playCnSfx('bigwin_slam'),
		// FIVE TIERS THAT USED TO SOUND IDENTICAL. Big and max both got the bed,
		// one blast and the coin shimmer. Each tier now adds its own fanfare, built
		// to escalate on length, voice count, register and percussion density
		// (design/generate_audio_heist.py). Literal calls per case, not a lookup:
		// design/check_audio.mjs reads cue names out of playCnSfx(...) and a name
		// held in a variable is not checked.
		// Louder on each rung, so the climb is heard as well as seen: 0.5 at the
		// first step up to 0.85 at the top.
		// the shutter hitting the floor and the free-spin count stamped onto the
		// plan: one rubber-stamp slam, reused (the file kept its gen-4 name)
		soundChefSlice: () => playCnSfx('fg_level_windup', 0.78),
		soundChefChop: () => playCnSfx('fg_level_impact', 0.86),
		soundStamp: () => playCnSfx('collect_stamp', 0.74),
		soundLadderUp: ({ level }) =>
			playCnSfx('fg_level_reveal', Math.min(.88, .72 + .08 * (level - 1)), 1 + .04 * (level - 1)),
		soundSackLand: () => playCnSfxLayered('putt_tap', 0.45),
		soundCollectGrab: () => playCnSfx('collect_grab', 0.45),
		soundCollectionStart: () => {
			ambienceSuppressedUntil = performance.now() + 4000;
			setGroove('collect', true);
			playCnLoop('putt_roll_loop', .3);
		},
		soundCollectionStop: () => {
			setGroove('collect', false);
			stopCnLoop('putt_roll_loop');
			stopCnSfx('putt_roll_loop');
		},
		soundCollectionSink: ({ index }) => playCnSfxLayered('putt_sink', .5, 1 + Math.min(index, 12)*.012),
		// each prize a step up C pentatonic, so a long collect plays a run up the
		// scale in the music's key instead of a pitch that creeps up off it
		soundCoinIn: ({ index }) => playCnSfxLayered('coin_in', 0.62, pentaRate(index)),
		soundCollectStamp: () => playCnSfx('collect_stamp', 0.9),
		soundSpinCut: () => cutSpinSounds(),
		soundGroove: ({ reason, on }) => setGroove(reason, on),
		// up the pentatonic scale reel by reel, snapped to the sixteenth grid
		soundWinWake: ({ index }) => playCnSfxOnGrid('win_wake', 0.58, pentaRate(index)),
		soundCountUp: ({ on, big, done }) => {
			if (on) {
				if (countUpOn) return;
				countUpOn = true;
				playCnLoop('count_loop', big ? 0.75 : 0.5, true);
			} else stopCountUp(!!done);
		},
		soundShutterDown: () => playCnSfx('shutter_down', 0.85),
		soundDoorSlide: () => playCnSfx('door_slide', 0.8),
		soundDoorClack: () => playCnSfx('door_clack', 1),
		soundGolfRoll: () => {
			ambienceSuppressedUntil = performance.now() + 3000;
			playCnSfx('golf_roll', 0.72);
		},
		soundGolfCup: () => playCnSfx('golf_cup', 0.85),
		soundDoorOpen: () => playCnSfx('door_open', 0.7),
		soundWinTier: ({ tier }) => {
			if (tier === 'big') playCnSfx('win_big', 0.8);
			else if (tier === 'superwin') playCnSfx('win_super', 0.8);
			else if (tier === 'mega') playCnSfx('win_mega', 0.82);
			else if (tier === 'epic') playCnSfx('win_epic', 0.85);
			else if (tier === 'max') playCnSfx('win_max', 0.88);
		},
		soundMonkeyExpand: () => playCnSfx('bandit_land'),
		// Deliberately NOT forced through the turbo gate that silences ordinary
		// one-shots: these are tied to animations that play at their own length
		// whatever the spin speed, so a dropped one is a character opening his
		// mouth in silence.
		soundMascotVoice: ({ name }) =>
			playCnSfx(MASCOT_VOICE_FILE[name], MASCOT_VOICE_GAIN[name]),
		soundReelTensionStart: () => {
			setGroove('tension', true);
			playCnSfx('anticipation_pickup', 0.58);
			// the roll is one bar: started in phase and at the music's tempo
			playCnLoop('reel_tension', 0.62, true);
		},
		// stopCnLoop, not stopCnSfx: playCnLoop moved this to Web Audio, and the
		// element-based stopper would leave the buffer source looping forever.
		soundReelTensionStop: () => {
			setGroove('tension', false);
			stopCnLoop('reel_tension');
			stopCnSfx('reel_tension');
		},
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') {
				stopBgm();
			} else if (name === 'sfx_bigwin_coinloop') {
				// both, because the fallback path above may have used the element
				stopCnLoop('bill_counter');
				stopCnSfx('bill_counter');
			} else if (name === 'sfx_anticipation') {
				stopCnLoop('reel_tension');
				stopCnSfx('reel_tension');
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
			// Web Audio loops outlive the DOM unless they are stopped explicitly.
			for (const name of Object.keys(loopNodes) as CnSfxName[]) stopCnLoop(name);
			audioCtx?.close().catch(() => {});
			audioCtx = null;
		};
	});
</script>

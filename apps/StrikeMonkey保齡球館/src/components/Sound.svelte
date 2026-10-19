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
		| { type: 'soundCoinIn'; index: number }
		// the pin collection (BanditCollect): a whoosh as each pin leaves, a tuned
		// wooden clack as it lands — `step` climbs a pentatonic scale — and the
		// strike crash under the last pin of a big haul
		| { type: 'soundPinWhoosh' }
		| { type: 'soundPinClack'; step: number }
		| { type: 'soundPinStrike' }
		| { type: 'soundCollectStamp' }
		| { type: 'soundShutterDown' }
		// the transition's sliding shop door (design/generate_door_audio.py)
		| { type: 'soundDoorSlide' }
		| { type: 'soundDoorClack' }
		| { type: 'soundBowlingRoll' }
		| { type: 'soundBowlingPins' }
		| { type: 'soundDoorOpen' }
		| { type: 'soundMascotVoice'; name: MascotVoice }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' }
		// a new spin is starting: whatever the last spin's win and collection
		// left ringing fades out now (bookEventHandlerMap reveal)
		| { type: 'soundSpinCut' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet, stateModal, stateSoundDerived } from 'state-shared';
	import { base } from '$app/paths';

	import { getContext } from '../game/context';

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
		| 'coin_in'
		| 'pin_clack'
		| 'pin_whoosh'
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
		| 'bowling_roll'
		| 'bowling_pins'
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
		| 'voice_hup';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		btn: 'strike/btn.wav',
		spin: 'strike/spin.wav',
		reel_stop: 'strike/reel_stop.wav',
		scatter_1: 'strike/scatter_1.wav',
		scatter_2: 'strike/scatter_2.wav',
		scatter_3: 'strike/scatter_3.wav',
		scatter_4: 'strike/scatter_4.wav',
		scatter_5: 'strike/scatter_5.wav',
		sack_land: 'strike/sack_land.wav',
		bandit_land: 'strike/bandit_land.wav',
		collect_grab: 'strike/collect_grab.wav',
		coin_in: 'strike/coin_in.wav',
		// design/generate_pin_collect_audio.py
		pin_clack: 'strike/pin_clack.wav',
		pin_whoosh: 'strike/pin_whoosh.wav',
		collect_stamp: 'strike/collect_stamp.wav',
		tumbler_up: 'strike/tumbler_up.wav',
		dial_tick: 'strike/dial_tick.wav',
		reel_tension: 'strike/anticipation_theme.wav',
		fg_level_windup: 'strike/fg_level_windup.wav',
		fg_level_impact: 'strike/fg_level_impact.wav',
		fg_level_reveal: 'strike/fg_level_reveal.wav',
		anticipation_pickup: 'strike/anticipation_pickup.wav',
		alarm_bell: 'strike/alarm_bell.wav',
		alarm_trip: 'strike/alarm_trip.wav',
		sack_throw: 'strike/sack_throw.wav',
		shutter_down: 'strike/shutter_down.wav',
		door_slide: 'strike/door_slide.wav',
		door_clack: 'strike/door_clack.wav',
		bowling_roll: 'strike/bowling_roll.wav',
		bowling_pins: 'strike/bowling_pins.wav',
		door_open: 'strike/door_open.wav',
		shutter_slam: 'strike/shutter_slam.wav',
		safe_open: 'strike/safe_open.wav',
		fs_intro: 'strike/fs_intro.wav',
		win_small: 'strike/win_small.wav',
		win_mid: 'strike/win_mid.wav',
		bill_counter: 'strike/bill_counter.wav',
		cash_register: 'strike/cash_register.wav',
		bigwin_slam: 'strike/bigwin_slam.wav',
		win_big: 'strike/win_big.wav',
		win_super: 'strike/win_super.wav',
		win_mega: 'strike/win_mega.wav',
		win_epic: 'strike/win_epic.wav',
		win_max: 'strike/win_max.wav',
		win_cap: 'strike/win_cap.wav',
		voice_laugh: 'strike/voice_laugh.wav',
		voice_hup: 'strike/voice_hup.wav',
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
		sfx_reel_stop_1: { name: 'reel_stop', rate: 0.92 },
		sfx_reel_stop_2: { name: 'reel_stop', rate: 1.0 },
		sfx_reel_stop_3: { name: 'reel_stop', rate: 1.09 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.19 },
		sfx_reel_stop_5: { name: 'reel_stop', rate: 1.3 },
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
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.6 },
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

	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfx(name);
		// a fade-out still running on this element must not swallow the new play
		cutGeneration.set(audio, (cutGeneration.get(audio) ?? 0) + 1);
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: getCnSfx caches one element per
		// file, so a rate left over from the previous caller would carry into every
		// later play of the same sample. reel_stop is shared with symbol/royal
		// landings, which would otherwise inherit the fifth reel's pitch.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	// Overlapping copies of one clip: the sacks in a collect arrive faster than
	// coin_in finishes, and the single cached element would cut each one off.
	function playCnSfxLayered(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfx(name).cloneNode(true) as HTMLAudioElement;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		audio.playbackRate = rate;
		layeredLive.add(audio);
		audio.addEventListener('ended', () => layeredLive.delete(audio), { once: true });
		audio.play().catch(() => {});
	}

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
		'collect_grab', 'coin_in', 'pin_clack', 'pin_whoosh', 'collect_stamp', 'bandit_land', 'sack_land', 'tumbler_up',
		'voice_laugh', 'voice_hup', 'bill_counter', 'cash_register', 'fs_intro',
		'win_small', 'win_mid', 'win_big', 'win_super', 'win_mega', 'win_epic', 'win_max', 'win_cap',
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
		layeredLive.clear();
	}

	// ─── looping sfx: Web Audio, not <audio loop> ───
	//
	// An HTMLAudioElement with loop = true is NOT gapless. The browser tears down
	// and restarts playback at the wrap, and the silence either side of that is
	// plainly audible — on coin_shimmer, a 2.4s clip with a recognisable attack,
	// it lands as the clip visibly stopping and starting again roughly every two
	// seconds. On the hold-and-spin result plaque, which stays up until the player
	// presses, that repeats for as long as they look at it.
	//
	// Guarding against re-triggering (the previous attempt) removed one cause of
	// choppiness — winLevelSoundsPlay fires up to three times in a hold-and-spin round
	// and each call was resetting currentTime — but not this one, because this one
	// happens without anyone asking. An AudioBufferSourceNode with loop = true
	// loops inside the audio thread and has no seam at all.
	//
	// Gain is ramped rather than switched, so the loop also fades in and out
	// instead of appearing and vanishing.
	const LOOP_FADE_IN = 0.12;
	const LOOP_FADE_OUT = 0.25;

	let audioCtx: AudioContext | null = null;
	const loopBuffers: Partial<Record<CnSfxName, AudioBuffer>> = {};
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
			audioCtx = new Ctor();
		}
		// The context starts suspended until a gesture; the game always has one by
		// the time anything loops (the loading screen is dismissed by a press).
		if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
		return audioCtx;
	};

	async function playCnLoop(name: CnSfxName, volumeScale = 1) {
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

		loopWanted.add(name);
		if (loopNodes[name]) return; // already running — never restart it
		const generation = (loopGeneration[name] ?? 0) + 1;
		loopGeneration[name] = generation;

		let buffer = loopBuffers[name];
		if (!buffer) {
			try {
				const res = await fetch(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
				buffer = await ctx.decodeAudioData(await res.arrayBuffer());
				loopBuffers[name] = buffer;
			} catch {
				return;
			}
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
		src.connect(gain).connect(ctx.destination);
		src.start();
		loopNodes[name] = { src, gain, scale: volumeScale };
	}

	// A loop's gain was set once, when it started. Muting (or turning effects
	// down) during a big win left coin_shimmer and friends playing at the old
	// level until the plaque closed — Engine guideline 107 wants every sound to
	// follow the setting immediately. Follow it here, without a ramp: a mute
	// should be a mute.
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
	}

	// Decode once and loop in the audio thread. LAME's Xing delay/padding data
	// removes MP3 encoder silence; AudioBufferSourceNode avoids element restarts.
	let bgmNode: AudioBufferSourceNode | null = null;
	let bgmGain: GainNode | null = null;
	let bgmRequest = 0;
	let currentBgm: 'base' | 'freespin' | null = null;
	let ambientTimer: ReturnType<typeof setTimeout> | undefined;
	let ambienceSuppressedUntil = 0;
	const ambientLive = new Set<HTMLAudioElement>();
	const scheduleLaneAmbience = (first = false) => {
		ambientTimer = setTimeout(() => {
			// Other lanes can be heard while this lane is being played. The cue is
			// soft, but does not require a long idle stretch between spins.
			if (currentBgm && bgmNode && !document.hidden &&
				!stateModal.modal &&
				performance.now() > ambienceSuppressedUntil &&
				stateSoundDerived.volumeMusic() > 0.02 &&
				stateSoundDerived.volumeSoundEffect() > 0.02) {
				// Keep this separate from result-scoped layered sounds: starting a
				// spin must not cut a distant 0.92s pinfall halfway through.
				const audio = getCnSfx('bowling_pins').cloneNode(true) as HTMLAudioElement;
				audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() *
					0.34 * stateSoundDerived.volumeMusic());
				audio.playbackRate = 0.94 + Math.random() * 0.12;
				ambientLive.add(audio);
				audio.addEventListener('ended', () => ambientLive.delete(audio), { once: true });
				audio.play().catch(() => ambientLive.delete(audio));
			}
			scheduleLaneAmbience();
		}, first ? 4500 + Math.random() * 2500 : 12000 + Math.random() * 7000);
	};
	$effect(() => {
		const volume = Math.min(1, stateSoundDerived.volumeSoundEffect() *
			stateSoundDerived.volumeMusic() * 0.34);
		for (const audio of ambientLive) audio.volume = volume;
	});
	const BGM_FILES = {
		base: 'strike/bgm_main.mp3',
		freespin: 'strike/bgm_freespin.mp3',
	} as const;
	const bgmBuffers: Partial<Record<'base' | 'freespin', AudioBuffer>> = {};

	async function playBgm(type: 'base' | 'freespin') {
		const ctx = getAudioCtx();
		if (!ctx) return;
		if (currentBgm === type && bgmNode) return;
		const request = ++bgmRequest;
		if (bgmNode) { bgmNode.stop(); bgmNode.disconnect(); bgmNode = null; }
		if (bgmGain) { bgmGain.disconnect(); bgmGain = null; }
		currentBgm = type;
		let buffer = bgmBuffers[type];
		if (!buffer) {
			try {
				const res = await fetch(`${base}/assets/audio/${BGM_FILES[type]}`);
				if (!res.ok) throw new Error(`BGM HTTP ${res.status}`);
				buffer = await ctx.decodeAudioData(await res.arrayBuffer());
				bgmBuffers[type] = buffer;
			} catch { return; }
		}
		if (request !== bgmRequest) return;
		const gain = ctx.createGain();
		gain.gain.value = stateSoundDerived.volumeMusic();
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = true;
		src.connect(gain).connect(ctx.destination);
		src.start();
		bgmGain = gain;
		bgmNode = src;
	}

	function stopBgm() {
		bgmRequest++;
		if (bgmNode) { bgmNode.stop(); bgmNode.disconnect(); bgmNode = null; }
		if (bgmGain) { bgmGain.disconnect(); bgmGain = null; }
		currentBgm = null;
	}

	// Keep volume in sync with settings
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmGain) bgmGain.gain.value = vol;
	});

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
		soundPressBet: () => playCnSfx('spin', 0.9),
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
		soundSackLand: () => playCnSfx('sack_land', 0.55),
		soundCollectGrab: () => playCnSfx('collect_grab', 0.8),
		// each sack into the bag a little higher than the last, so a long
		// collect climbs instead of repeating
		soundCoinIn: ({ index }) => playCnSfxLayered('coin_in', 0.7, Math.min(1.6, 1 + 0.07 * index)),
		// each pin a note higher up C major pentatonic, so a haul plays as a run
		// rather than one knock repeated; past two octaves it holds the top note
		soundPinClack: ({ step }) => {
			const semis = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
			playCnSfxLayered('pin_clack', 0.78, 2 ** (semis[Math.min(step, semis.length - 1)] / 12));
		},
		soundPinWhoosh: () => playCnSfxLayered('pin_whoosh', 0.32, 0.94 + Math.random() * 0.14),
		soundPinStrike: () => playCnSfxLayered('bowling_pins', 0.62),
		soundCollectStamp: () => playCnSfx('collect_stamp', 0.9),
		soundSpinCut: () => cutSpinSounds(),
		soundShutterDown: () => playCnSfx('shutter_down', 0.85),
		soundDoorSlide: () => playCnSfx('door_slide', 0.8),
		soundDoorClack: () => playCnSfx('door_clack', 1),
		soundBowlingRoll: () => {
			ambienceSuppressedUntil = performance.now() + 3000;
			playCnSfx('bowling_roll', 0.72);
		},
		soundBowlingPins: () => playCnSfx('bowling_pins', 0.85),
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
			playCnSfx('anticipation_pickup', 0.58);
			playCnLoop('reel_tension', 0.66);
		},
		// stopCnLoop, not stopCnSfx: playCnLoop moved this to Web Audio, and the
		// element-based stopper would leave the buffer source looping forever.
		soundReelTensionStop: () => {
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
		// Fetch the one-shot sfx up front so the first play is in sync
		// (an Audio element created lazily would stall on its first fetch).
		(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);

		playBgm('base');
		scheduleLaneAmbience(true);

		return () => {
			if (ambientTimer) clearTimeout(ambientTimer);
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
